import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getAIRecommendations } from '../services/geminiService.ts';
import { getFearAndGreedIndex } from '../services/externalApis.ts';
import type { Recommendation, ScoreBreakdown } from '../types.ts';
import { useDApp } from '../context/DAppContext.tsx';

const ScoreBreakdownDisplay: React.FC<{ breakdown: ScoreBreakdown }> = ({ breakdown }) => (
    <div className="w-full mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Score Breakdown</h4>
        <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-400">
            <li className="flex justify-between items-center">
                <span><i className="fas fa-chart-line mr-2 text-blue-400"></i>Market Trend (35%)</span>
                <strong className="font-mono text-gray-800 dark:text-gray-200">{breakdown.trend}/35</strong>
            </li>
            <li className="flex justify-between items-center">
                <span><i className="fas fa-comments mr-2 text-purple-400"></i>Sentiment (20%)</span>
                <strong className="font-mono text-gray-800 dark:text-gray-200">{breakdown.sentiment}/20</strong>
            </li>
            <li className="flex justify-between items-center">
                <span><i className="fas fa-microchip mr-2 text-green-400"></i>Fundamentals (20%)</span>
                <strong className="font-mono text-gray-800 dark:text-gray-200">{breakdown.fundamentals}/20</strong>
            </li>
            <li className="flex justify-between items-center">
                <span><i className="fas fa-laptop-code mr-2 text-indigo-400"></i>Technology &amp; Innovation (15%)</span>
                <strong className="font-mono text-gray-800 dark:text-gray-200">{breakdown.technology}/15</strong>
            </li>
            <li className="flex justify-between items-center">
                <span><i className="fas fa-tachometer-alt mr-2 text-yellow-400"></i>Market Mood (10%)</span>
                <strong className="font-mono text-gray-800 dark:text-gray-200">{breakdown.mood}/10</strong>
            </li>
        </ul>
    </div>
);


const RecommendationCard: React.FC<{ recommendation: Recommendation }> = ({ recommendation }) => {
    const { coins } = useDApp();
    const coinData = coins.find(c => c.id === recommendation.coinId);

    const getScoreColor = (score: number) => {
        if (score > 75) return 'text-success';
        if (score > 50) return 'text-yellow-400';
        return 'text-danger';
    };

    const getRecommendationColor = (rec: string) => {
        if (rec.includes('Buy')) return 'bg-success';
        if (rec.includes('Hold')) return 'bg-yellow-500';
        return 'bg-danger';
    }

    return (
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                {coinData && <img src={coinData.image} alt={coinData.name} className="w-16 h-16"/>}
                <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-bold">{recommendation.coinName}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{recommendation.reasoning}</p>
                </div>
                <div className="flex items-center space-x-6">
                    <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Score</p>
                        <p className={`text-5xl font-bold ${getScoreColor(recommendation.score)}`}>
                            {recommendation.score}
                        </p>
                    </div>
                    <div className={`${getRecommendationColor(recommendation.recommendation)} text-white font-bold py-2 px-4 rounded-md text-center`}>
                        {recommendation.recommendation}
                    </div>
                </div>
            </div>
            {recommendation.scoreBreakdown && <ScoreBreakdownDisplay breakdown={recommendation.scoreBreakdown} />}
        </div>
    );
};

export const Recommendations: React.FC = () => {
    const { coins } = useDApp();
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const hasFetchedOnMount = useRef(false);

    const fetchRecommendations = useCallback(async (isManualRefresh = false) => {
        if (coins.length === 0) {
            if (!isManualRefresh) return;
            setError("Market data is still loading. Please wait a moment and try again.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const fearAndGreed = await getFearAndGreedIndex();
            const result = await getAIRecommendations(coins, fearAndGreed.value);
            setRecommendations(result);
        } catch (err) {
             console.error("Failed to fetch recommendations:", err);
             setError("Could not generate AI recommendations. Displaying cached data. Please try again later.");
             const result = await getAIRecommendations(coins, 50);
             setRecommendations(result);
        } finally {
            setLoading(false);
        }
    }, [coins]);

    useEffect(() => {
        if (coins.length > 0 && !hasFetchedOnMount.current) {
            fetchRecommendations(false);
            hasFetchedOnMount.current = true;
        }
    }, [coins, fetchRecommendations]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Recommendations</h1>
                <button 
                    onClick={() => fetchRecommendations(true)} 
                    disabled={loading}
                    className="bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-500 disabled:bg-gray-600 flex items-center"
                >
                    <i className={`fas fa-sync mr-2 ${loading ? 'animate-spin' : ''}`}></i>
                    {loading ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
                These recommendations are generated by AI for the top 10 coins by market cap based on a weighted analysis of market data. This is not financial advice.
            </p>
             {error && <div className="bg-red-100 border border-danger text-red-700 dark:bg-red-900 dark:text-red-200 px-4 py-3 rounded-md">{error}</div>}
            
            {loading && recommendations.length === 0 ? (
                <div className="text-center p-10">
                    <i className="fas fa-spinner fa-spin text-4xl text-primary"></i>
                    <p className="mt-4">{coins.length === 0 ? 'Loading market data...' : 'Analyzing market data and generating AI recommendations...'}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {recommendations.map(rec => (
                        <RecommendationCard key={rec.coinId} recommendation={rec} />
                    ))}
                </div>
            )}
        </div>
    );
};