export interface FredObservation {
  date: string;
  value: string;
}

export async function fetchFredSeries(
  seriesId: string,
  apiKey: string,
  observationStart?: string,
  units?: string
): Promise<FredObservation[]> {
  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: apiKey,
    file_type: "json",
    sort_order: "asc",
  });

  if (observationStart) {
    params.append("observation_start", observationStart);
  }

  if (units) {
    params.append("units", units);
  }

  const url = `https://api.stlouisfed.org/fred/series/observations?${params}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`FRED API error: ${response.status}`);
  }

  const data = await response.json();
  return (data.observations || []).filter(
    (obs: FredObservation) => obs.value !== "."
  );
}

export interface IndicatorSummaryData {
  latest: string | undefined;
  previous: string | undefined;
  date: string | undefined;
}

export async function fetchIndicatorSummaries(
  indicators: { id: string; name: string; apiUnits?: string }[],
  apiKey: string,
  observationStart: string
): Promise<Record<string, IndicatorSummaryData>> {
  const indicatorData: Record<string, IndicatorSummaryData> = {};

  const results = await Promise.allSettled(
    indicators.map(async (ind) => {
      const obs = await fetchFredSeries(ind.id, apiKey, observationStart, ind.apiUnits);
      return { ind, obs };
    })
  );

  for (const result of results) {
    if (result.status === "rejected") continue;
    const { ind, obs } = result.value;
    if (obs.length > 0) {
      const latest = obs[obs.length - 1];
      const previous = obs[obs.length - 2];
      indicatorData[ind.id] = {
        latest: latest?.value,
        previous: previous?.value,
        date: latest?.date,
      };
    }
  }

  return indicatorData;
}
