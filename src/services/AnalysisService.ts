import { Transaction, Asset } from "../store/useFinanceStore";

export interface CategoryStat {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface TrendDataPoint {
  date: string;
  netWorth: number;
  burnRate: number;
}

const CATEGORY_COLORS: { [key: string]: string } = {
  "식비": "#FF6B6B",
  "교통": "#4D96FF",
  "쇼핑": "#FFD93D",
  "주거": "#6BCB77",
  "생활": "#A062D8",
  "의료": "#1DD1A1",
  "교육": "#FF9F40",
  "자산취득": "#45826E",
  "수수료": "#8E8E93",
  "기타": "#C9CBCF",
};

const DEFAULT_COLOR = "#C9CBCF";
const DYNAMIC_PALETTE = [
  "#FF9F40", "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", 
  "#9966FF", "#C9CBCF", "#FF5733", "#33FF57", "#3357FF"
];

const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % DYNAMIC_PALETTE.length;
  return DYNAMIC_PALETTE[index];
};

export const AnalysisService = {
  getCategoryStats: (transactions: Transaction[], period: 'weekly' | 'monthly' | 'yearly'): CategoryStat[] => {
    const today = new Date();
    const startDate = new Date();

    if (period === 'weekly') startDate.setDate(today.getDate() - 7);
    else if (period === 'monthly') startDate.setMonth(today.getMonth() - 1);
    else if (period === 'yearly') startDate.setFullYear(today.getFullYear() - 1);

    const startDateStr = startDate.toISOString().split('T')[0];

    const expenses = transactions.filter(tx => 
      tx.type === 'expense' && tx.date >= startDateStr
    );

    const statsMap: { [key: string]: number } = {};
    let totalAmount = 0;

    expenses.forEach(tx => {
      const cat = tx.category || "기타";
      statsMap[cat] = (statsMap[cat] || 0) + tx.amount;
      totalAmount += tx.amount;
    });

    const stats: CategoryStat[] = Object.keys(statsMap).map(cat => ({
      category: cat,
      amount: statsMap[cat],
      percentage: totalAmount > 0 ? (statsMap[cat] / totalAmount) * 100 : 0,
      color: CATEGORY_COLORS[cat] || stringToColor(cat)
    }));

    return stats.sort((a, b) => b.amount - a.amount);
  },

  getTrendData: (transactions: Transaction[], assets: Asset[]): { 
    labels: string[], 
    netWorthPoints: number[], 
    burnRatePoints: number[],
    categoryBreakdown: { [category: string]: number }[]
  } => {
    // Last 6 months trend
    const months = [];
    const netWorthPoints = [];
    const burnRatePoints = [];
    const categoryBreakdown: { [category: string]: number }[] = [];
    
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthLabel = `${d.getMonth() + 1}월`;
      months.push(monthLabel);
      
      const monthStr = d.toISOString().substring(0, 7); // YYYY-MM
      
      // Calculate monthly expenses per category
      const monthTxs = transactions.filter(tx => 
        tx.type === 'expense' && tx.date.startsWith(monthStr)
      );

      const monthTotal = monthTxs.reduce((sum, tx) => sum + tx.amount, 0);
      burnRatePoints.push(monthTotal);

      const catMap: { [cat: string]: number } = {};
      monthTxs.forEach(tx => {
        const cat = tx.category || "기타";
        catMap[cat] = (catMap[cat] || 0) + tx.amount;
      });
      categoryBreakdown.push(catMap);
      
      // Simplified net worth simulation
      const randomVariance = (Math.random() - 0.5) * 500000;
      const baseNetWorth = assets.reduce((sum, a) => sum + (a.type === 'asset' ? a.amount : -a.amount), 0);
      netWorthPoints.push(Math.max(0, baseNetWorth - (i * 100000) + randomVariance));
    }

    return {
      labels: months,
      netWorthPoints,
      burnRatePoints,
      categoryBreakdown
    };
  },
  getCategoryColor: (category: string): string => {
    return CATEGORY_COLORS[category] || stringToColor(category);
  }
};
