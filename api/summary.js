export default async function handler(req, res) {
  const NEWS_API_KEY = process.env.NEWS_API_KEY;
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  const FRED_API_KEY = process.env.FRED_API_KEY;

  if (!NEWS_API_KEY || !ANTHROPIC_API_KEY || !FRED_API_KEY) {
    return res.status(500).json({ error: 'API keys not configured' });
  }

  try {
    // Fetch housing news with better search terms
    const newsUrl = `https://newsapi.org/v2/everything?q="housing market" OR "home prices" OR "mortgage rates" OR "home sales" OR "real estate market"&language=en&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_API_KEY}`;
    const newsResponse = await fetch(newsUrl);
    const newsData = await newsResponse.json();

    if (newsData.status !== 'ok') {
      throw new Error(newsData.message || 'News API error');
    }

    // Filter out irrelevant headlines
    const relevantArticles = newsData.articles.filter(a => {
      const title = a.title.toLowerCase();
      return title.includes('home') || title.includes('hous') || title.includes('mortgage') ||
             title.includes('real estate') || title.includes('property') || title.includes('rent');
    });

    const headlines = relevantArticles.slice(0, 6).map(a => ({
      title: a.title,
      source: a.source.name,
      url: a.url,
      publishedAt: a.publishedAt
    }));

    // Fetch FRED data directly
    const indicators = [
      { id: 'MSPUS', name: 'Median Home Price' },
      { id: 'EXHOSLUSM495S', name: 'Existing Home Sales' },
      { id: 'MORTGAGE30US', name: '30-Year Mortgage Rate' },
      { id: 'MSACSR', name: 'Housing Inventory' },
      { id: 'HSN1F', name: 'New Home Sales' },
      { id: 'HOUST', name: 'Housing Starts' }
    ];

    const indicatorData = {};

    const fredResults = await Promise.allSettled(indicators.map(async (ind) => {
      const fredUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=${ind.id}&api_key=${FRED_API_KEY}&file_type=json&observation_start=2024-01-01&sort_order=asc`;
      const fredResponse = await fetch(fredUrl);
      const data = await fredResponse.json();
      return { ind, data };
    }));

    for (const result of fredResults) {
      if (result.status === 'rejected') continue;
      const { ind, data } = result.value;
      if (data.observations && data.observations.length > 0) {
        const obs = data.observations.filter(o => o.value !== '.');
        const latest = obs[obs.length - 1];
        const previous = obs[obs.length - 2];
        indicatorData[ind.id] = {
          latest: latest?.value,
          previous: previous?.value,
          date: latest?.date
        };
      }
    }

    // Format data for prompt
    const medianPrice = parseInt(indicatorData.MSPUS?.latest || 0);
    const existingSales = parseInt(indicatorData.EXHOSLUSM495S?.latest || 0) / 1000000;
    const mortgageRate = parseFloat(indicatorData.MORTGAGE30US?.latest || 0);
    const inventory = parseFloat(indicatorData.MSACSR?.latest || 0);
    const newSales = parseInt(indicatorData.HSN1F?.latest || 0);
    const housingStarts = parseInt(indicatorData.HOUST?.latest || 0);

    // Build prompt for Claude
    const prompt = `You are a sharp housing market analyst who cuts through noise. Write a 2-3 sentence market summary using the specific numbers below.

DATA:
- Median Home Price: $${medianPrice.toLocaleString()}
- Existing Home Sales: ${existingSales.toFixed(2)} million/year
- 30-Year Mortgage Rate: ${mortgageRate.toFixed(2)}%
- Housing Inventory: ${inventory.toFixed(1)} months supply
- New Home Sales: ${newSales}K/year
- Housing Starts: ${housingStarts}K/year

CONTEXT:
- Under 4 months inventory = seller's market, over 6 = buyer's market
- Historical average mortgage rate is ~7%
- Pre-pandemic existing sales were ~5.5 million/year

HEADLINES:
${headlines.length > 0 ? headlines.map(h => `- ${h.title}`).join('\n') : '- None available'}

Write a punchy summary that:
1. Uses specific numbers (e.g., "$419K median price" not "high prices")
2. Compares to historical norms (e.g., "rates at 6.1% are below the 7% average")
3. States the bottom line for buyers/sellers in plain terms

No hedging, no "may" or "could" - be direct.`;

    // Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    const claudeData = await claudeResponse.json();

    if (claudeData.error) {
      throw new Error(claudeData.error.message || 'Claude API error');
    }

    const summary = claudeData.content?.[0]?.text || 'Unable to generate summary';

    // Cache for 30 minutes
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');

    return res.status(200).json({
      summary,
      headlines,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
