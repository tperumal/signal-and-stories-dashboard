export default async function handler(req, res) {
  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: 'symbol is required' });
  }

  const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: 'Alpha Vantage API key not configured' });
  }

  const params = new URLSearchParams({
    function: 'TIME_SERIES_DAILY',
    symbol,
    outputsize: 'compact',
    apikey: API_KEY
  });

  const url = `https://www.alphavantage.co/query?${params}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Alpha Vantage API error', status: response.status });
    }

    const data = await response.json();

    // Alpha Vantage returns an error note for rate limits or invalid keys
    if (data['Note'] || data['Information']) {
      return res.status(429).json({ error: data['Note'] || data['Information'] });
    }

    if (data['Error Message']) {
      return res.status(400).json({ error: data['Error Message'] });
    }

    const timeSeries = data['Time Series (Daily)'];
    if (!timeSeries) {
      return res.status(500).json({ error: 'Unexpected response format' });
    }

    const dates = Object.keys(timeSeries).sort();
    const latest = dates[dates.length - 1];
    const previous = dates[dates.length - 2];

    const latestClose = parseFloat(timeSeries[latest]['4. close']);
    const previousClose = previous ? parseFloat(timeSeries[previous]['4. close']) : latestClose;
    const change = latestClose - previousClose;
    const changePercent = (change / previousClose) * 100;

    // Last 30 trading days for sparkline
    const last30 = dates.slice(-30);
    const history = last30.map(date => ({
      date,
      close: parseFloat(timeSeries[date]['4. close'])
    }));

    // Cache for 15 minutes at the edge
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate');
    return res.status(200).json({
      symbol: symbol.toUpperCase(),
      price: latestClose,
      change,
      changePercent,
      history
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
