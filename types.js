export type Page = 'Dashboard' | 'Portfolio' | 'Recommendations' | 'Learning Center' | 'Coin Research' | 'Compare' | 'Alerts';

export interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  ath: number;
  ath_change_percentage: number;
}

export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  url: string;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
}

export interface FearAndGreed {
  value: number;
  value_classification: string;
}

export interface Holding {
  coin: Coin;
  amount: number;
  avgBuyPrice: number;
}

export interface Transaction {
  id: string;
  type: 'buy' | 'sell';
  coin: Coin;
  amount: number;
  price: number;
  date: string;
  total: number;
  pnl?: number; // Realized profit or loss for sell transactions
}

export interface LimitOrder {
  id:string;
  type: 'buy' | 'sell';
  coin: Coin;
  amount: number;
  limitPrice: number;
  status: 'open' | 'filled' | 'cancelled';
  createdAt: string;
}

export interface PortfolioState {
  usdtBalance: number;
  holdings: { [coinId: string]: Holding };
  transactions: Transaction[];
  initialBalance: number;
  limitOrders: LimitOrder[];
}

export interface PortfolioContextType {
  portfolio: PortfolioState;
  buyCoin: (coin: Coin, amount: number, price: number, isSilent?: boolean) => boolean;
  sellCoin: (coin: Coin, amount: number, price: number, isSilent?: boolean) => boolean;
  placeLimitOrder: (type: 'buy' | 'sell', coin: Coin, amount: number, limitPrice: number, isSilent?: boolean) => boolean;
  cancelLimitOrder: (orderId: string) => void;
  updateLimitOrderStatus: (orderId: string, status: 'filled' | 'cancelled') => void;
}

export interface ScoreBreakdown {
    trend: number;
    sentiment: number;
    fundamentals: number;
    technology: number;
    mood: number;
}

export interface Recommendation {
    coinId: string;
    coinName: string;
    score: number;
    recommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Risky' | 'Sell';
    reasoning: string;
    scoreBreakdown: ScoreBreakdown;
}

export interface TrendPrediction {
  trend: 'Bullish' | 'Bearish' | 'Neutral';
  confidence: number;
  analysis: string;
}

export interface FundamentalData {
  background: string;
  tokenomics: string;

  team: string;
}

export interface PortfolioAnalysis {
  overallAssessment: string;
  riskScore: number;
  riskAnalysis: string;
  diversification: string;
  rebalancingOpportunities: string;
  positiveNote: string;
}

export interface PriceAlert {
  id: string;
  coinId: string;
  targetPrice: number;
  condition: 'above' | 'below';
  status: 'active' | 'triggered';
  createdAt: string;
}

export interface Notification {
    id: string;
    message: string;
    type: 'alert' | 'info' | 'error';
    timestamp: string;
}

export interface CoinDetails {
  description: string;
  links: {
    homepage?: string;
    explorer?: string;
    twitter?: string;
    reddit?: string;
    github?: string;
  };
  devStats: {
    forks: number;
    stars: number;
    subscribers: number;
    commits4w: number;
  };
  communityStats: {
    twitterFollowers: number;
    redditSubscribers: number;
  };
}