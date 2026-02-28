export interface Ticker {
  symbol: string;
  name: string;
}

export interface StockGroup {
  name: string;
  tickers: Ticker[];
}

export const housingStockGroups: StockGroup[] = [
  {
    name: "Homebuilders",
    tickers: [
      { symbol: "DHI", name: "D.R. Horton" },
      { symbol: "LEN", name: "Lennar" },
      { symbol: "PHM", name: "PulteGroup" },
    ],
  },
  {
    name: "Mortgage & Lending",
    tickers: [
      { symbol: "RKT", name: "Rocket Companies" },
      { symbol: "UWMC", name: "UWM Holdings" },
    ],
  },
  {
    name: "REITs & ETFs",
    tickers: [
      { symbol: "INVH", name: "Invitation Homes" },
      { symbol: "VNQ", name: "Vanguard Real Estate ETF" },
      { symbol: "ITB", name: "iShares Home Construction ETF" },
    ],
  },
];
