export default async function handler(req, res) {
  const { series_id, observation_start } = req.query;

  if (!series_id) {
    return res.status(400).json({ error: 'series_id is required' });
  }

  const API_KEY = process.env.FRED_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: 'FRED API key not configured', hasKey: !!API_KEY });
  }

  const params = new URLSearchParams({
    series_id,
    api_key: API_KEY,
    file_type: 'json',
    sort_order: 'asc'
  });

  if (observation_start) {
    params.append('observation_start', observation_start);
  }

  const url = `https://api.stlouisfed.org/fred/series/observations?${params}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: 'FRED API error', status: response.status, details: text });
    }

    const data = await response.json();

    // Cache for 1 hour
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
