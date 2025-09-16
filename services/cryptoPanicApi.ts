import type { NewsArticle } from '../types';

const API_KEY = process.env.CRYPTO_PANIC_API_KEY;
const API_URL = 'https://cors.eu.org/https://cryptopanic.com/api/v1/posts/';

// Helper to map API response to our NewsArticle type
const mapApiResponseToNewsArticle = (results: any[]): NewsArticle[] => {
    return results.map((article: any) => {
        const bullishVotes = article.votes.bullish || 0;
        const bearishVotes = article.votes.bearish || 0;
        let sentiment: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';
        if (bullishVotes > bearishVotes * 1.1) { // Require 10% more bullish votes
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

// Fallback mock data
const mockNewsData: { [key: string]: NewsArticle[] } = {
  btc: [
    { id: 'btc1', title: 'Bitcoin Hits New All-Time High Amidst Strong ETF Inflows', source: 'CryptoPanic', url: '#', sentiment: 'Bullish' },
    { id: 'btc2', title: 'Analysts Debate Bitcoin\'s Next Move as Halving Approaches', source: 'CoinDesk', url: '#', sentiment: 'Neutral' },
  ],
  eth: [
    { id: 'eth1', title: 'Ethereum "Pectra" Upgrade Details Revealed, Focus on User Experience', source: 'Decrypt', url: '#', sentiment: 'Bullish' },
    { id: 'eth2', title: 'Gas Fees on Ethereum Spike Following Popular NFT Mint', source: 'CoinTelegraph', url: '#', sentiment: 'Bearish' },
  ],
  sol: [
    { id: 'sol1', title: 'Solana Network Restarts After Another Period of Degraded Performance', source: 'The Block', url: '#', sentiment: 'Bearish' },
    { id: 'sol2', title: 'Solana\'s Firedancer Client Shows Promising Results in Testnet Phase', source: 'Solana News', url: '#', sentiment: 'Bullish' },
  ],
  default: [
    { id: 'gen1', title: 'Crypto Market Cap Reaches $2.5 Trillion as Altcoins Rally', source: 'CryptoPanic', url: '#', sentiment: 'Bullish' },
    { id: 'gen2', title: 'SEC Delays Decision on a New Batch of Crypto ETFs', source: 'Reuters', url: '#', sentiment: 'Bearish' },
  ],
};


export const getCoinNews = async (coinSymbol: string): Promise<NewsArticle[]> => {
  if (!API_KEY) {
    console.warn("CryptoPanic API key not found. Using mock news data.");
    const key = coinSymbol.toLowerCase();
    return mockNewsData[key] || mockNewsData.default;
  }
  
  try {
    const response = await fetch(`${API_URL}?auth_token=${API_KEY}&currencies=${coinSymbol.toUpperCase()}&public=true`);
    if (!response.ok) {
        throw new Error(`CryptoPanic API request failed with status ${response.status}`);
    }
    const data = await response.json();
    return mapApiResponseToNewsArticle(data.results);
  } catch (error) {
    console.error(`Error fetching news for ${coinSymbol} from CryptoPanic:`, error);
    // Fallback on API error
    const key = coinSymbol.toLowerCase();
    return mockNewsData[key] || mockNewsData.default;
  }
};