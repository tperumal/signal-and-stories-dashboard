export default async function handler(req, res) {
  const NEWS_API_KEY = process.env.NEWS_API_KEY;
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!NEWS_API_KEY || !ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API keys not configured' });
  }

  try {
    // Fetch housing news
    const newsUrl = `https://newsapi.org/v2/everything?q=housing+market+OR+mortgage+rates+OR+home+sales&language=en&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_API_KEY}`;
    const newsResponse = await fetch(newsUrl);
    const newsData = await newsResponse.json();

    if (newsData.status !== 'ok') {
      throw new Error(newsData.message || 'News API error');
    }

    const headlines = newsData.articles.slice(0, 8).map(a => ({
      title: a.title,
      source: a.source.name,
      url: a.url,
      publishedAt: a.publishedAt
    }));

    // Get current indicator data (call our own API)
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const indicators = ['MSPUS', 'EXHOSLUSM495S', 'MORTGAGE30US', 'MSACSR', 'HSN1F', 'HOUST'];
    const indicatorData = {};

    for (const id of indicators) {
      try {
        const fredResponse = await fetch(`${baseUrl}/api/fred?series_id=${id}&observation_start=2024-01-01`);
        const data = await fredResponse.json();
        if (data.observations && data.observations.length > 0) {
          const obs = data.observations.filter(o => o.value !== '.');
          const latest = obs[obs.length - 1];
          const previous = obs[obs.length - 2];
          indicatorData[id] = {
            latest: latest?.value,
            previous: previous?.value,
            date: latest?.date
          };
        }
      } catch (e) {
        // Skip failed indicators
      }
    }

    // Build prompt for Claude
    const prompt = `You are a housing market analyst. Based on the following data and recent headlines, write a brief 2-3 sentence summary of the current US housing market. Be direct and insightful - focus on what matters most to someone trying to understand the market right now.

CURRENT DATA:
- Median Home Price: $${parseInt(indicatorData.MSPUS?.latest || 0).toLocaleString()} (as of ${indicatorData.MSPUS?.date || 'N/A'})
- Existing Home Sales: ${(parseInt(indicatorData.EXHOSLUSM495S?.latest || 0) / 1000000).toFixed(2)} million annual rate
- 30-Year Mortgage Rate: ${parseFloat(indicatorData.MORTGAGE30US?.latest || 0).toFixed(2)}%
- Housing Inventory: ${parseFloat(indicatorData.MSACSR?.latest || 0).toFixed(1)} months supply
- New Home Sales: ${parseInt(indicatorData.HSN1F?.latest || 0)}K annual rate
- Housing Starts: ${parseInt(indicatorData.HOUST?.latest || 0)}K annual rate

RECENT HEADLINES:
${headlines.map(h => `- ${h.title} (${h.source})`).join('\n')}

Write a concise market summary (2-3 sentences). Don't use phrases like "based on the data" - just state your analysis directly.`;

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
