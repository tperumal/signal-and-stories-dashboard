export interface Indicator {
  id: string;
  name: string;
  format: FormatType;
  frequency: string;
  subtitle: string;
  tooltip: string;
}

export type FormatType =
  | "currency"
  | "percent"
  | "millions"
  | "unitsToMillions"
  | "months"
  | "thousands";

export const housingIndicators: Indicator[] = [
  {
    id: "MSPUS",
    name: "Median Home Price",
    format: "currency",
    frequency: "Quarterly",
    subtitle: "Half of homes sell above, half below",
    tooltip:
      "The median sales price of houses sold in the US. Unlike average price, median isn't skewed by luxury homes — it shows what a typical buyer actually pays.",
  },
  {
    id: "EXHOSLUSM495S",
    name: "Existing Home Sales",
    format: "unitsToMillions",
    frequency: "Monthly",
    subtitle: "Previously owned homes sold",
    tooltip:
      "Annual rate of existing (not new) home sales. This is the bulk of the market — about 85% of all home sales. Rising sales = more market activity.",
  },
  {
    id: "MORTGAGE30US",
    name: "30-Year Mortgage Rate",
    format: "percent",
    frequency: "Weekly",
    subtitle: "Average rate for new loans",
    tooltip:
      "The average interest rate for a 30-year fixed mortgage. This directly affects monthly payments and buying power. A 1% rate increase can reduce buying power by ~10%.",
  },
  {
    id: "MSACSR",
    name: "Housing Inventory",
    format: "months",
    frequency: "Monthly",
    subtitle: "Months to sell all current homes",
    tooltip:
      "How many months it would take to sell all homes on the market at the current sales pace. Under 4 months = seller's market, over 6 months = buyer's market.",
  },
  {
    id: "HSN1F",
    name: "New Home Sales",
    format: "thousands",
    frequency: "Monthly",
    subtitle: "Newly built homes sold",
    tooltip:
      "Annual rate of new single-family home sales. A leading indicator of housing demand and construction activity. New homes are about 15% of the market.",
  },
  {
    id: "HOUST",
    name: "Housing Starts",
    format: "thousands",
    frequency: "Monthly",
    subtitle: "New construction begun",
    tooltip:
      "Annual rate of new housing units where construction has started. A leading economic indicator — builders start construction when they're confident about future demand.",
  },
];

export const laborIndicators: Indicator[] = [
  {
    id: "UNRATE",
    name: "Unemployment Rate",
    format: "percent",
    frequency: "Monthly",
    subtitle: "Share of labor force without jobs",
    tooltip:
      "The percentage of the labor force that is unemployed and actively seeking work. A key measure of labor market health. Below 4% is generally considered full employment.",
  },
  {
    id: "PAYEMS",
    name: "Nonfarm Payrolls",
    format: "thousands",
    frequency: "Monthly",
    subtitle: "Total jobs in the economy",
    tooltip:
      "Total number of paid workers in the US excluding farm workers, government employees, private household employees, and nonprofit organization employees. The most-watched monthly jobs number.",
  },
  {
    id: "ICSA",
    name: "Initial Jobless Claims",
    format: "thousands",
    frequency: "Weekly",
    subtitle: "New unemployment filings",
    tooltip:
      "Number of people filing for unemployment benefits for the first time. A leading indicator of labor market conditions. Below 250K is historically healthy.",
  },
  {
    id: "JTSJOL",
    name: "Job Openings (JOLTS)",
    format: "unitsToMillions",
    frequency: "Monthly",
    subtitle: "Available positions nationwide",
    tooltip:
      "Total number of job openings from the Job Openings and Labor Turnover Survey. High openings relative to unemployed workers indicates a tight labor market.",
  },
  {
    id: "CES0500000003",
    name: "Avg. Hourly Earnings",
    format: "currency",
    frequency: "Monthly",
    subtitle: "Average pay per hour worked",
    tooltip:
      "Average hourly earnings of all employees on private nonfarm payrolls. A key measure of wage growth and inflationary pressure.",
  },
  {
    id: "CIVPART",
    name: "Labor Force Participation",
    format: "percent",
    frequency: "Monthly",
    subtitle: "Working-age adults in labor force",
    tooltip:
      "The percentage of the civilian noninstitutional population that is either employed or actively looking for work. Pre-pandemic was around 63.3%.",
  },
];
