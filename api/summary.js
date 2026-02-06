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

    for (const ind of indicators) {
      try {
        const fredUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=${ind.id}&api_key=${FRED_API_KEY}&file_type=json&observation_start=2024-01-01&sort_order=asc`;
        const fredResponse = await fetch(fredUrl);
        const data = await fredResponse.json();

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
      } catch (e) {
        // Skip failed indicators
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
    const prompt = `You are a housing market analyst. Based on the following data and recent headlines, write a brief 2-3 sentence summary of the current US housing market. Be direct and insightful - focus on what matters most to someone trying to understand the market right now.

CURRENT DATA:
- Median Home Price: $${medianPrice.toLocaleString()} (as of ${indicatorData.MSPUS?.date || 'N/A'})
- Existing Home Sales: ${existingSales.toFixed(2)} million annual rate (as of ${indicatorData.EXHOSLUSM495S?.date || 'N/A'})
- 30-Year Mortgage Rate: ${mortgageRate.toFixed(2)}% (as of ${indicatorData.MORTGAGE30US?.date || 'N/A'})
- Housing Inventory: ${inventory.toFixed(1)} months supply (as of ${indicatorData.MSACSR?.date || 'N/A'})
- New Home Sales: ${newSales}K annual rate (as of ${indicatorData.HSN1F?.date || 'N/A'})
- Housing Starts: ${housingStarts}K annual rate (as of ${indicatorData.HOUST?.date || 'N/A'})

RECENT HEADLINES:
${headlines.length > 0 ? headlines.map(h => `- ${h.title} (${h.source})`).join('\n') : '- No recent housing headlines available'}

Write a concise market summary (2-3 sentences). Don't use phrases like "based on the data" - just state your analysis directly. Focus on the key trends and what they mean for buyers and sellers.`;

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
