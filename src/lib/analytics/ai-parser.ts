export interface AIQueryResult {
  metric?: 'revenue' | 'refunds' | 'orders' | 'cancellations' | 'users' | 'mediators' | 'brands' | 'stocks';
  period?: '7d' | '30d' | 'all-time' | string;
  view?: 'overview' | 'financials' | 'risk_indicator' | 'leaderboard' | 'detail' | 'inventory';
  filterValue?: string;
  comparison?: 'greater' | 'less' | 'top' | 'none';
  comparisonValue?: number;
  summary: string;
  insights: string[];
}

export function parseAIQuery(query: string): AIQueryResult {
  const normalized = query.toLowerCase().trim();
  const result: AIQueryResult = { 
    summary: "", 
    insights: [],
    metric: 'orders',
    period: '30d',
    view: 'overview'
  };

  // 1. Detect Primary Metric
  if (normalized.includes('revenue') || normalized.includes('money') || normalized.includes('income') || normalized.includes('profit')) {
    result.metric = 'revenue';
    result.view = 'financials';
  } else if (normalized.includes('refund')) {
    result.metric = 'refunds';
    result.view = 'financials';
  } else if (normalized.includes('stock') || normalized.includes('inventory') || normalized.includes('slots') || normalized.includes('left')) {
    result.metric = 'stocks';
    result.view = 'inventory';
  } else if (normalized.includes('cancel') || normalized.includes('rejected')) {
    result.metric = 'cancellations';
    result.view = 'overview';
  } else if (normalized.includes('user') || normalized.includes('buyer')) {
    result.metric = 'users';
    result.view = 'risk_indicator';
  } else if (normalized.includes('mediator') || normalized.includes('specialist') || normalized.includes('leaderboard')) {
    result.metric = 'mediators';
    result.view = 'leaderboard';
  } else if (normalized.includes('brand') || normalized.includes('product')) {
    result.metric = 'brands';
    result.view = 'overview';
  }

  // 2. Detect Comparison Logic
  if (normalized.includes('above') || normalized.includes('more than') || normalized.includes('greater than') || normalized.includes('>')) {
    result.comparison = 'greater';
    const match = normalized.match(/(\d+)/);
    if (match) result.comparisonValue = parseInt(match[1]);
  } else if (normalized.includes('below') || normalized.includes('less than') || normalized.includes('<')) {
    result.comparison = 'less';
    const match = normalized.match(/(\d+)/);
    if (match) result.comparisonValue = parseInt(match[1]);
  } else if (normalized.includes('top') || normalized.includes('best') || normalized.includes('highest')) {
    result.comparison = 'top';
    const match = normalized.match(/(\d+)/);
    result.comparisonValue = match ? parseInt(match[1]) : 5;
  }

  // 3. Detect Period
  if (normalized.includes('7 days') || normalized.includes('last week') || normalized.includes('week')) {
    result.period = '7d';
  } else if (normalized.includes('30 days') || normalized.includes('last month') || normalized.includes('month')) {
    result.period = '30d';
  } else if (normalized.includes('all time') || normalized.includes('always') || normalized.includes('total')) {
    result.period = 'all-time';
  }

  // 4. Detect Specific Entities (Brands)
  const commonBrands = ['apple', 'samsung', 'amazon', 'flipkart', 'nike', 'adidas', 'boat', 'noise'];
  for (const brand of commonBrands) {
    if (normalized.includes(brand)) {
      result.filterValue = brand;
      break;
    }
  }

  // 5. Generate Advanced Summary & Insights
  if (result.metric === 'stocks') {
    if (result.filterValue) {
      result.summary = `Detailed Stock Analysis for ${result.filterValue.toUpperCase()}.`;
      result.insights.push(`Retrieving current remaining slots and completion rates for ${result.filterValue}.`);
    } else {
      result.summary = "Global Inventory and Stock Status Report.";
      result.insights.push("Analyzing slot availability across all active brands.");
    }
    result.insights.push("High completion rates indicate strong demand for these products.");
  } else if (result.comparison === 'top') {
    result.summary = `Analyzing Top ${result.comparisonValue} performance for ${result.metric}.`;
    result.insights.push(`Filtering by highest ${result.metric} volume.`);
  } else if (result.filterValue) {
    result.summary = `Deep-dive analysis for ${result.filterValue.toUpperCase()} ${result.metric}.`;
    result.insights.push(`Filtering all database records associated with ${result.filterValue}.`);
  } else {
    result.summary = `Aggregating ${result.metric} data for the platform.`;
    result.insights.push(`Data shows general trends for the ${result.period} period.`);
  }

  return result;
}
