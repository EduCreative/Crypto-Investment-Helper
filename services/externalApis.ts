import type { FearAndGreed } from '../types.ts';

const FEAR_AND_GREED_API_URL = 'https://cors.eu.org/https://api.alternative.me/fng/?limit=1';
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

interface FearAndGreedApiResponse {
    name: string;
    data: {
        value: string;
        value_classification: string;
        timestamp: string;
        time_until_update?: string;
    }[];
    metadata: {
        error: string | null;
    };
}

export const getFearAndGreedIndex = async (): Promise<FearAndGreed> => {
    const cacheKey = 'fear-and-greed-index';
    return fetchWithCache(cacheKey, async () => {
        try {
            const response = await fetch(FEAR_AND_GREED_API_URL);
            if (!response.ok) {
                throw new Error(`Alternative.me API request failed with status ${response.status}`);
            }
            const apiResponse: FearAndGreedApiResponse = await response.json();
            
            if (apiResponse.metadata.error) {
                 throw new Error(`Fear & Greed API error: ${apiResponse.metadata.error}`);
            }

            if (apiResponse && apiResponse.data && apiResponse.data.length > 0) {
                const rawData = apiResponse.data[0];
                return {
                    value: parseInt(rawData.value, 10),
                    value_classification: rawData.value_classification,
                };
            }
            throw new Error('Invalid data format from Fear & Greed API');

        } catch (error) {
            console.error("Error fetching Fear & Greed Index:", error);
            throw error;
        }
    });
}