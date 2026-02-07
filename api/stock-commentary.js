export default async function handler(req, res) {
  const FRED_API_KEY = process.env.FRED_API_KEY;
  const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!FRED_API_KEY || !ALPHA_VANTAGE_API_KEY || !ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API keys not configured' });
  }

  try {
    // Fetch FRED indicator data
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

    // Fetch stock data for 3 representative tickers
    const tickers = [
      { symbol: 'ITB', name: 'iShares Home Construction ETF' },
      { symbol: 'VNQ', name: 'Vanguard Real Estate ETF' },
      { symbol: 'RKT', name: 'Rocket Companies' }
    ];

    const stockData = {};

    for (const ticker of tickers) {
      try {
        const params = new URLSearchParams({
          function: 'TIME_SERIES_DAILY',
          symbol: ticker.symbol,
          outputsize: 'compact',
          apikey: ALPHA_VANTAGE_API_KEY
        });
        const avResponse = await fetch(`https://www.alphavantage.co/query?${params}`);
        const avData = await avResponse.json();

        if (avData['Note'] || avData['Information']) continue;

        const timeSeries = avData['Time Series (Daily)'];
        if (!timeSeries) continue;

        const dates = Object.keys(timeSeries).sort();
        const latest = dates[dates.length - 1];
        const previous = dates[dates.length - 2];
        const weekAgo = dates[Math.max(dates.length - 6, 0)];

        const latestClose = parseFloat(timeSeries[latest]['4. close']);
        const previousClose = previous ? parseFloat(timeSeries[previous]['4. close']) : latestClose;
        const weekAgoClose = parseFloat(timeSeries[weekAgo]['4. close']);

        stockData[ticker.symbol] = {
          name: ticker.name,
          price: latestClose,
          dailyChange: ((latestClose - previousClose) / previousClose * 100).toFixed(2),
          weeklyChange: ((latestClose - weekAgoClose) / weekAgoClose * 100).toFixed(2)
        };
      } catch (e) {
        // Skip failed tickers
      }
    }

    // Format FRED data
    const medianPrice = parseInt(indicatorData.MSPUS?.latest || 0);
    const existingSales = parseInt(indicatorData.EXHOSLUSM495S?.latest || 0) / 1000000;
    const mortgageRate = parseFloat(indicatorData.MORTGAGE30US?.latest || 0);
    const inventory = parseFloat(indicatorData.MSACSR?.latest || 0);
    const newSales = parseInt(indicatorData.HSN1F?.latest || 0);
    const housingStarts = parseInt(indicatorData.HOUST?.latest || 0);

    // Format stock data for prompt
    const stockSummary = Object.entries(stockData).map(([sym, d]) =>
      `- ${sym} (${d.name}): $${d.price.toFixed(2)}, daily ${d.dailyChange}%, weekly ${d.weeklyChange}%`
    ).join('\n');

    const prompt = `You are a sharp housing market analyst. Write 2-3 sentences analyzing how current housing fundamentals are affecting housing-related stocks.

HOUSING DATA:
- Median Home Price: $${medianPrice.toLocaleString()}
- Existing Home Sales: ${existingSales.toFixed(2)} million/year
- 30-Year Mortgage Rate: ${mortgageRate.toFixed(2)}%
- Housing Inventory: ${inventory.toFixed(1)} months supply
- New Home Sales: ${newSales}K/year
- Housing Starts: ${housingStarts}K/year

STOCK DATA:
${stockSummary || '- Stock data unavailable'}

SECTOR CONTEXT:
- ITB tracks homebuilders (D.R. Horton, Lennar, PulteGroup, etc.)
- VNQ tracks REITs (Invitation Homes, etc.)
- RKT represents mortgage lenders (Rocket Companies, UWM Holdings)

Write a punchy commentary that:
1. Connects specific housing data points to stock performance
2. Explains WHY housing fundamentals are bullish or bearish for each sector
3. Uses actual numbers from both datasets

No hedging, no "may" or "could" - be direct.`;

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

    const commentary = claudeData.content?.[0]?.text || 'Unable to generate commentary';

    // Cache for 30 minutes
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');

    return res.status(200).json({
      commentary,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
