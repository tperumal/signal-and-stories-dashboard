export interface Indicator {
  id: string;
  name: string;
  format: FormatType;
  frequency: string;
  subtitle: string;
  tooltip: string;
  apiUnits?: string;
}

export type FormatType =
  | "currency"
  | "percent"
  | "millions"
  | "unitsToMillions"
  | "months"
  | "thousands"
  | "index"
  | "billions";

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

export const inflationIndicators: Indicator[] = [
  {
    id: "CPIAUCSL",
    name: "CPI Inflation Rate",
    format: "percent",
    frequency: "Monthly",
    subtitle: "Year-over-year consumer price change",
    tooltip:
      "The Consumer Price Index measures the average change in prices paid by urban consumers for a basket of goods and services. The most widely cited inflation measure.",
    apiUnits: "pc1",
  },
  {
    id: "PCEPILFE",
    name: "Core PCE Inflation",
    format: "percent",
    frequency: "Monthly",
    subtitle: "The Fed's preferred inflation gauge",
    tooltip:
      "Personal Consumption Expenditures excluding food and energy. The Federal Reserve targets 2% core PCE inflation. Excludes volatile items to show underlying trend.",
    apiUnits: "pc1",
  },
  {
    id: "PPIFIS",
    name: "Producer Price Index",
    format: "percent",
    frequency: "Monthly",
    subtitle: "Year-over-year producer price change",
    tooltip:
      "Measures the average change in selling prices received by domestic producers. A leading indicator of consumer inflation — rising producer costs often pass through to consumers.",
    apiUnits: "pc1",
  },
  {
    id: "T10YIE",
    name: "10-Yr Breakeven Inflation",
    format: "percent",
    frequency: "Daily",
    subtitle: "Market's inflation expectation",
    tooltip:
      "The difference between 10-year Treasury yields and 10-year TIPS yields. Represents what bond markets expect average inflation to be over the next decade.",
  },
  {
    id: "GASREGW",
    name: "Regular Gas Price",
    format: "currency",
    frequency: "Weekly",
    subtitle: "National average per gallon",
    tooltip:
      "The U.S. average retail price of regular unleaded gasoline. A highly visible inflation indicator that directly affects consumer sentiment and spending.",
  },
  {
    id: "CPIUFDSL",
    name: "Food CPI",
    format: "percent",
    frequency: "Monthly",
    subtitle: "Year-over-year food price change",
    tooltip:
      "The Consumer Price Index for food at home. Food prices are among the most visible inflation measures for everyday consumers and a key driver of sentiment.",
    apiUnits: "pc1",
  },
];

export const gdpIndicators: Indicator[] = [
  {
    id: "A191RL1Q225SBEA",
    name: "Real GDP Growth",
    format: "percent",
    frequency: "Quarterly",
    subtitle: "Annualized quarterly growth rate",
    tooltip:
      "The annualized rate of change in real gross domestic product. The broadest measure of economic activity. Two consecutive negative quarters is a common recession signal.",
  },
  {
    id: "INDPRO",
    name: "Industrial Production",
    format: "percent",
    frequency: "Monthly",
    subtitle: "Year-over-year factory output change",
    tooltip:
      "Measures the real output of manufacturing, mining, and utilities. A key gauge of the industrial sector's health and a coincident economic indicator.",
    apiUnits: "pc1",
  },
  {
    id: "DGORDER",
    name: "Durable Goods Orders",
    format: "billions",
    frequency: "Monthly",
    subtitle: "New orders for long-lasting goods",
    tooltip:
      "New orders placed with domestic manufacturers for goods expected to last 3+ years (appliances, cars, machinery). A leading indicator of manufacturing activity and business investment.",
  },
  {
    id: "NAPM",
    name: "ISM Manufacturing PMI",
    format: "index",
    frequency: "Monthly",
    subtitle: "Above 50 = expansion",
    tooltip:
      "The Institute for Supply Management's Purchasing Managers Index. Above 50 signals manufacturing expansion, below 50 signals contraction. One of the most watched leading indicators.",
  },
  {
    id: "PERMIT",
    name: "Building Permits",
    format: "thousands",
    frequency: "Monthly",
    subtitle: "Authorized new housing units",
    tooltip:
      "The number of new privately-owned housing units authorized by building permits. A leading indicator of future construction activity and economic confidence.",
  },
  {
    id: "T10Y2Y",
    name: "Yield Curve Spread",
    format: "percent",
    frequency: "Daily",
    subtitle: "10-year minus 2-year Treasury",
    tooltip:
      "The difference between 10-year and 2-year Treasury yields. When negative (inverted), it has preceded every US recession since 1970. A key recession warning signal.",
  },
];

export const consumerIndicators: Indicator[] = [
  {
    id: "RSAFS",
    name: "Retail Sales",
    format: "millions",
    frequency: "Monthly",
    subtitle: "Total monthly retail spending",
    tooltip:
      "Total receipts at retail and food service stores. Consumer spending drives about 70% of US GDP, making this a critical measure of economic health.",
  },
  {
    id: "UMCSENT",
    name: "Consumer Sentiment",
    format: "index",
    frequency: "Monthly",
    subtitle: "University of Michigan survey",
    tooltip:
      "The University of Michigan Consumer Sentiment Index measures consumer confidence about the economy. Higher values indicate greater optimism. Baseline of 100 is from 1966.",
  },
  {
    id: "DPCERAM1M225NBEA",
    name: "Real Consumer Spending",
    format: "percent",
    frequency: "Monthly",
    subtitle: "Inflation-adjusted spending growth",
    tooltip:
      "Real personal consumption expenditures growth. Shows actual consumer spending power after accounting for inflation — the most direct measure of consumer demand.",
  },
  {
    id: "REVOLSL",
    name: "Revolving Credit",
    format: "millions",
    frequency: "Monthly",
    subtitle: "Credit card and other revolving debt",
    tooltip:
      "Total revolving consumer credit outstanding (mainly credit cards). Rising levels can signal consumer confidence or financial stress depending on the economic context.",
  },
  {
    id: "PSAVERT",
    name: "Personal Saving Rate",
    format: "percent",
    frequency: "Monthly",
    subtitle: "Share of income saved",
    tooltip:
      "Personal saving as a percentage of disposable personal income. The pre-pandemic average was about 7%. Low rates may signal consumer stress or confidence depending on context.",
  },
  {
    id: "TOTALSA",
    name: "Auto Sales",
    format: "millions",
    frequency: "Monthly",
    subtitle: "Total vehicle sales annualized",
    tooltip:
      "Total light vehicle sales at a seasonally adjusted annual rate. One of the largest consumer purchases — a strong indicator of consumer willingness to make big-ticket commitments.",
  },
];
