import type { NewsArticle } from '../types.js';

const API_KEY = process.env.CRYPTO_PANIC_API_KEY;
const API_URL = 'https://cors.eu.org/https://cryptopanic.com/api/v1/posts/';

const mapApiResponseToNewsArticle = (results: any[]): NewsArticle[] => {
    return results.map((article: any) => {
        const bullishVotes = article.votes.bullish || 0;
        const bearishVotes = article.votes.bearish || 0;
        let sentiment: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';
        if (bullishVotes > bearishVotes * 1.1) {
            sentiment = 'Bullish';
        } else if (bearishVotes > bullishVotes * 1.1) {
            sentiment = 'Bearish';
        }

        return {
            id: article.id.toString(),
            title: article.title,
            source: article.source.title,
            url: article.url,
            sentiment: sentiment,
        };
    });
};

const fallbackNews: NewsArticle[] = [
    { id: '1', title: 'Bitcoin ETF inflows reach new high as institutional interest surges.', source: 'CryptoPanic', url: '#', sentiment: 'Bullish' },
    { id: '2', title: 'Ethereum\'s next upgrade "Pectra" targets scalability improvements.', source: 'CoinDesk', url: '#', sentiment: 'Bullish' },
    { id: '3', title: 'Regulatory uncertainty continues to cast a shadow over the crypto market.', source: 'Decrypt', url: '#', sentiment: 'Bearish' },
    { id: '4', title: 'Solana DeFi ecosystem sees rapid growth, but faces network stability questions.', source: 'The Block', url: '#', sentiment: 'Neutral' },
];

export const getLatestNews = async (): Promise<NewsArticle[]> => {
  if (!API_KEY) {
    console.warn("CryptoPanic API key not found. Using cached news data for dashboard.");
    return fallbackNews;
  }

  try {
    const response = await fetch(`${API_URL}?auth_token=${API_KEY}&public=true`);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();
    return mapApiResponseToNewsArticle(data.results.slice(0, 4));
  } catch (error) {
    console.error("Error fetching latest news from CryptoPanic:", error);
    return fallbackNews;
  }
};