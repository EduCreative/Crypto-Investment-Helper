import type { Coin, CoinDetails } from '../types';

const COINGECKO_API_URL = 'https://cors.eu.org/https://api.coingecko.com/api/v3';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: any; expiry: number }>();

/**
 * A generic caching utility for fetch requests.
 * @param key A unique key to identify the cached resource.
 * @param fetcher A function that returns a promise which resolves to the data to be cached.
 * @returns The cached or freshly fetched data.
 */
async function fetchWithCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const cachedItem = cache.get(key);

  if (cachedItem && now < cachedItem.expiry) {
    return Promise.resolve(cachedItem.data as T);
  }

  try {
    const data = await fetcher();
    cache.set(key, { data, expiry: now + CACHE_TTL });
    return data;
  } catch (error) {
    // If the fetch fails but we have stale data in the cache, return it to improve resilience.
    if (cachedItem) {
        console.warn(`Returning stale data for key "${key}" due to fetch error.`, error);
        return Promise.resolve(cachedItem.data as T);
    }
    // If there's no cached data at all, the error must be thrown.
    throw error;
  }
}

/**
 * Creates a detailed error message from a fetch response.
 * @param response The fetch Response object.
 * @returns An Error object with a descriptive message.
 */
const createApiError = async (response: Response): Promise<Error> => {
    let errorMessage = `API request failed with status ${response.status} (${response.statusText}).`;
    
    // Add user-friendly explanations for common errors
    if (response.status === 401) {
        errorMessage = "CoinGecko API request failed: 401 Unauthorized. The request could not be authenticated.";
    } else if (response.status === 429) {
        errorMessage = "CoinGecko API request failed: 429 Too Many Requests. Please wait a moment before trying again.";
    } else if (response.status === 404) {
        errorMessage = `CoinGecko API request failed: 404 Not Found. The requested resource could not be found.`;
    }
    
    return new Error(errorMessage);
};


export const getTopCoins = async (count = 10): Promise<Coin[]> => {
  const cacheKey = `top-coins-${count}`;
  return fetchWithCache(cacheKey, async () => {
    try {
      const response = await fetch(
        `${COINGECKO_API_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${count}&page=1&sparkline=false`
      );
      if (!response.ok) {
        throw await createApiError(response);
      }
      const data: Coin[] = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching top coins from CoinGecko:", error);
      throw error;
    }
  });
};

export const getCoinsByIds = async (ids: string[]): Promise<Coin[]> => {
  if (ids.length === 0) return [];
  // Sort IDs to ensure the cache key is consistent regardless of order
  const cacheKey = `coins-by-ids-${ids.sort().join(',')}`;
  return fetchWithCache(cacheKey, async () => {
    try {
      const response = await fetch(
        `${COINGECKO_API_URL}/coins/markets?vs_currency=usd&ids=${ids.join(',')}&order=market_cap_desc&sparkline=false`
      );
      if (!response.ok) {
        throw await createApiError(response);
      }
      const data: Coin[] = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching coins by IDs from CoinGecko:", error);
      throw error;
    }
  });
};

// FIX: Allow `days` parameter to be a string (e.g., 'max') to support fetching full historical data.
export const getCoinMarketChart = async (coinId: string, days: number | string = 90): Promise<{ prices: number[][]; total_volumes: number[][] }> => {
  const cacheKey = `market-chart-${coinId}-${days}`;
  return fetchWithCache(cacheKey, async () => {
    try {
      const response = await fetch(
        `${COINGECKO_API_URL}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=daily`
      );
      if (!response.ok) {
        throw await createApiError(response);
      }
      const data = await response.json();
      // The API returns more, but we only need prices and volumes for the chart
      return {
        prices: data.prices,
        total_volumes: data.total_volumes
      };
    } catch (error) {
      console.error(`Error fetching market chart for ${coinId}:`, error);
      throw error;
    }
  });
};

export const getCoinDetails = async (coinId: string): Promise<CoinDetails | null> => {
  const cacheKey = `coin-details-${coinId}`;
  return fetchWithCache(cacheKey, async () => {
    try {
      const response = await fetch(
        `${COINGECKO_API_URL}/coins/${coinId}?localization=false&tickers=false&market_data=false&sparkline=false`
      );
      if (!response.ok) {
        if (response.status === 404) return null; // Handle coin not found gracefully
        throw await createApiError(response);
      }
      const data = await response.json();
      
      // Map the raw API response to our cleaner CoinDetails type
      return {
        description: data.description?.en || "No description available.",
        links: {
          homepage: data.links?.homepage?.[0] || undefined,
          explorer: data.links?.blockchain_site?.[0] || undefined,
          twitter: data.links?.twitter_screen_name ? `https://twitter.com/${data.links.twitter_screen_name}` : undefined,
          reddit: data.links?.subreddit_url || undefined,
          github: data.links?.repos_url?.github?.[0] || undefined,
        },
        devStats: {
          forks: data.developer_data?.forks || 0,
          stars: data.developer_data?.stars || 0,
          subscribers: data.developer_data?.subscribers || 0,
          commits4w: data.developer_data?.commit_count_4_weeks || 0,
        },
        communityStats: {
          twitterFollowers: data.community_data?.twitter_followers || 0,
          redditSubscribers: data.community_data?.reddit_subscribers || 0,
        }
      };
    } catch (error) {
      console.error(`Error fetching coin details for ${coinId} from CoinGecko:`, error);
      throw error;
    }
  });
};