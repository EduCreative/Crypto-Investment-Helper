import React, { useState, useEffect } from 'react';
import type { Coin, Page, NewsArticle, TrendPrediction, FundamentalData, CoinDetails } from '../types.js';
import { getCoinNews } from '../services/cryptoPanicApi.js';
import { getCoinMarketChart, getCoinDetails } from '../services/coingeckoApi.js';
import { getTrendPrediction } from '../services/geminiService.js';
import { getFundamentalData } from '../services/messariApi.js';
import { useFavorites } from '../context/FavoritesContext.js';
import { NewsCard } from './NewsCard.js';
import { TradingViewWidget } from './TradingViewWidget.js';
import { TrendPredictionCard } from './TrendPredictionCard.js';
import { FundamentalsCard } from './FundamentalsCard.js';
import { CreateAlertModal } from './CreateAlertModal.js';

interface CoinResearchProps {
  coin: Coin;
  setActivePage: (page: Page) => void;
}

const StatCard: React.FC<{ label: string; value: string | number; }> = ({ label, value }) => (
    <div className="bg-gray-200 dark:bg-gray-700/60 p-3 rounded-lg text-center">
        <h4 className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</h4>
        <p className="text-lg font-semibold">{value}</p>
    </div>
);

const AccordionItem: React.FC<{ title: string; icon: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, icon, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md mb-3 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-5 text-left font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-expanded={isOpen}
            >
                <span className="flex items-center">
                    <i className={`fas ${icon} text-primary w-6 mr-4 text-xl`}></i>
                    <span className="text-lg">{title}</span>
                </span>
                <i className={`fas fa-chevron-down transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>
            <div
                className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[2000px]' : 'max-h-0'}`}
                style={{ transitionProperty: 'max-height' }}
            >
                <div className={`p-5 pt-0 text-gray-600 dark:text-gray-300 space-y-4 leading-relaxed`}>
                    {children}
                </div>
            </div>
        </div>
    );
};

const StatDisplay: React.FC<{ icon: string; label: string; value: string | number; }> = ({ icon, label, value }) => (
    <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-lg">
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
            <i className={`${icon} w-4 mr-2`}></i>
            <span>{label}</span>
        </div>
        <p className="text-lg font-bold text-gray-900 dark:text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
    </div>
);

const LinkButton: React.FC<{ icon: string; url?: string; text: string }> = ({ icon, url, text }) => {
    if (!url) return null;
    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            <i className={`${icon} w-5 mr-3 text-primary`}></i>
            <span className="text-sm font-medium">{text}</span>
            <i className="fas fa-external-link-alt text-xs text-gray-400 dark:text-gray-500 ml-auto"></i>
        </a>
    );
};

const ErrorDisplay: React.FC<{ title: string; message: string }> = ({ title, message }) => (
    <div className="bg-red-50 dark:bg-red-900/20 border border-danger/50 text-danger p-4 rounded-lg flex items-center space-x-3 my-4">
        <i className="fas fa-exclamation-triangle text-xl"></i>
        <div>
            <h4 className="font-semibold">{title}</h4>
            <p className="text-sm">{message}</p>
        </div>
    </div>
);

export const CoinResearch: React.FC<CoinResearchProps> = ({ coin, setActivePage }) => {
    const { isFavorite, addFavorite, removeFavorite } = useFavorites();
    const [isAnimating, setIsAnimating] = useState(false);
    
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loadingNews, setLoadingNews] = useState(true);
    const [newsError, setNewsError] = useState<string | null>(null);

    const [trendPrediction, setTrendPrediction] = useState<TrendPrediction | null>(null);
    const [predictionLoading, setPredictionLoading] = useState(true);
    const [predictionError, setPredictionError] = useState<string | null>(null);
    
    const [fundamentals, setFundamentals] = useState<FundamentalData | null>(null);
    const [loadingFundamentals, setLoadingFundamentals] = useState(true);
    const [fundamentalsError, setFundamentalsError] = useState<string | null>(null);

    const [coinDetails, setCoinDetails] = useState<CoinDetails | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(true);
    const [detailsError, setDetailsError] = useState<string | null>(null);

    const [isAlertModalOpen, setAlertModalOpen] = useState(false);

    const isFav = isFavorite(coin.id);

    const handleFavoriteToggle = () => {
        if (isAnimating) return;
        if (!isFav) {
            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 400);
        }
        if (isFav) removeFavorite(coin.id);
        else addFavorite(coin.id);
    };
    
    useEffect(() => {
        const fetchAllCoinData = async () => {
            setLoadingNews(true);
            setPredictionLoading(true);
            setLoadingFundamentals(true);
            setLoadingDetails(true);
            setNewsError(null);
            setPredictionError(null);
            setFundamentalsError(null);
            setDetailsError(null);

            // Fetch News
            getCoinNews(coin.symbol).then(setNews).catch(err => {
                console.error(`Failed to fetch news for ${coin.name}:`, err);
                setNewsError("Could not load news articles.");
            }).finally(() => setLoadingNews(false));

            // Fetch Trend Prediction
            getCoinMarketChart(coin.id).then(marketData => {
                if (marketData && marketData.prices.length > 0) {
                    return getTrendPrediction(coin.name, marketData.prices);
                }
                throw new Error("No historical data available for trend prediction.");
            }).then(setTrendPrediction).catch(err => {
                console.error(`Failed to fetch prediction for ${coin.name}:`, err);
                setPredictionError(`Could not generate AI prediction.`);
            }).finally(() => setPredictionLoading(false));

            // Fetch Fundamentals
            getFundamentalData(coin.symbol).then(setFundamentals).catch(err => {
                console.error(`Failed to fetch fundamentals for ${coin.name}:`, err);
                setFundamentalsError("Could not load fundamental data.");
            }).finally(() => setLoadingFundamentals(false));

            // Fetch Coin Details
            getCoinDetails(coin.id).then(setCoinDetails).catch(err => {
                console.error(`Failed to fetch details for ${coin.name}:`, err);
                setDetailsError("Could not load additional coin details.");
            }).finally(() => setLoadingDetails(false));
        };
        
        fetchAllCoinData();
    }, [coin]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center space-x-4 mb-2">
                        <img src={coin.image} alt={coin.name} className="w-12 h-12" />
                        <div className="flex items-center gap-3">
                             <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{coin.name}</h1>
                                <p className="text-lg text-gray-500 dark:text-gray-400">{coin.symbol.toUpperCase()}</p>
                            </div>
                            <div className="flex items-center">
                                <button
                                    onClick={handleFavoriteToggle}
                                    className={`text-2xl p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${isFav ? 'text-yellow-400' : 'text-gray-400 dark:text-gray-500'}`}
                                    aria-label={isFav ? `Remove ${coin.name} from favorites` : `Add ${coin.name} to favorites`}
                                >
                                    <i className={`${isFav ? 'fas' : 'far'} fa-star ${isAnimating ? 'animate-favorite-pop' : ''}`}></i>
                                </button>
                                <button
                                    onClick={() => setAlertModalOpen(true)}
                                    className="text-2xl p-2 rounded-full text-gray-400 dark:text-gray-500 hover:text-primary hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    aria-label={`Set a price alert for ${coin.name}`}
                                >
                                    <i className="fas fa-bell"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <button onClick={() => setActivePage('Dashboard')} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                    <i className="fas fa-arrow-left mr-2"></i>Back
                </button>
            </div>

            <div className="space-y-3">
                <AccordionItem title="Overview & Chart" icon="fa-chart-bar" defaultOpen={true}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
                        <StatCard label="Price" value={`$${coin.current_price.toLocaleString()}`} />
                        <StatCard label="24h Change" value={`${coin.price_change_percentage_24h.toFixed(2)}%`} />
                        <StatCard label="Market Cap" value={`$${(coin.market_cap / 1_000_000_000).toFixed(2)}B`} />
                        <StatCard label="Volume" value={`$${(coin.total_volume / 1_000_000).toFixed(2)}M`} />
                        <StatCard label="All-Time High" value={`$${coin.ath.toLocaleString()}`} />
                        <StatCard label="From ATH" value={`${coin.ath_change_percentage.toFixed(2)}%`} />
                    </div>
                    {loadingDetails ? <p>Loading description...</p> : detailsError ? <ErrorDisplay title="Could not load details" message={detailsError} /> : (
                        <div 
                            className="text-sm text-gray-600 dark:text-gray-400 my-4 prose prose-sm dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: coinDetails?.description?.split('. ')[0] + '.' || 'No description available.' }}>
                        </div>
                    )}
                    <div className="h-[450px]">
                        <TradingViewWidget coinSymbol={coin.symbol} />
                    </div>
                </AccordionItem>

                <AccordionItem title="AI Trend Prediction" icon="fa-brain">
                    <TrendPredictionCard prediction={trendPrediction} loading={predictionLoading} error={predictionError} />
                </AccordionItem>
                
                <AccordionItem title="Fundamental Analysis" icon="fa-book-reader">
                    <FundamentalsCard
                        data={fundamentals}
                        loading={loadingFundamentals}
                        error={fundamentalsError}
                    />
                </AccordionItem>

                <AccordionItem title="Community & Developer Activity" icon="fa-satellite-dish">
                    {loadingDetails ? <p>Loading details...</p> : detailsError ? <ErrorDisplay title="Could not load community data" message={detailsError} /> : !coinDetails ? <p>No data available.</p> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-3 flex items-center"><i className="fas fa-users mr-2 text-secondary"></i>Community</h3>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <StatDisplay icon="fab fa-twitter" label="Twitter Followers" value={coinDetails.communityStats.twitterFollowers} />
                                    <StatDisplay icon="fab fa-reddit-alien" label="Reddit Subscribers" value={coinDetails.communityStats.redditSubscribers} />
                                </div>
                                <div className="space-y-2">
                                    <LinkButton icon="fas fa-home" url={coinDetails.links.homepage} text="Homepage" />
                                    <LinkButton icon="fas fa-cube" url={coinDetails.links.explorer} text="Explorer" />
                                    <LinkButton icon="fab fa-twitter" url={coinDetails.links.twitter} text="Twitter" />
                                    <LinkButton icon="fab fa-reddit-alien" url={coinDetails.links.reddit} text="Reddit" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-3 flex items-center"><i className="fas fa-code-branch mr-2 text-secondary"></i>Developer Activity</h3>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <StatDisplay icon="fas fa-star" label="GitHub Stars" value={coinDetails.devStats.stars} />
                                    <StatDisplay icon="fas fa-code-branch" label="Forks" value={coinDetails.devStats.forks} />
                                    <StatDisplay icon="fas fa-users" label="Subscribers" value={coinDetails.devStats.subscribers} />
                                    <StatDisplay icon="fas fa-history" label="Commits (4w)" value={coinDetails.devStats.commits4w} />
                                </div>
                                <div className="space-y-2">
                                     <LinkButton icon="fab fa-github" url={coinDetails.links.github} text="Main Repository" />
                                </div>
                            </div>
                        </div>
                    )}
                </AccordionItem>

                <AccordionItem title="Latest News" icon="fa-newspaper">
                    {loadingNews ? <p>Loading news...</p> : newsError ? <ErrorDisplay title="Could not load news" message={newsError} /> : (
                        <div className="space-y-4">
                            {news.length > 0 ? (
                                news.map(article => <NewsCard key={article.id} article={article} />)
                            ) : (
                                <p className="text-gray-500">No recent news found for {coin.name}.</p>
                            )}
                        </div>
                    )}
                </AccordionItem>
            </div>

            {isAlertModalOpen && (
                <CreateAlertModal
                    defaultCoinId={coin.id}
                    onClose={() => setAlertModalOpen(false)}
                />
            )}
        </div>
    );
};