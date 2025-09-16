import React from 'react';
import type { TrendPrediction } from '../types.js';

interface TrendPredictionCardProps {
  prediction: TrendPrediction | null;
  loading: boolean;
  error: string | null;
}

const TrendIcon: React.FC<{ trend: 'Bullish' | 'Bearish' | 'Neutral' }> = ({ trend }) => {
    if (trend === 'Bullish') {
        return <i className="fas fa-arrow-trend-up text-success text-3xl"></i>;
    }
    if (trend === 'Bearish') {
        return <i className="fas fa-arrow-trend-down text-danger text-3xl"></i>;
    }
    return <i className="fas fa-minus text-gray-500 dark:text-gray-400 text-3xl"></i>;
};

const ConfidenceBar: React.FC<{ confidence: number }> = ({ confidence }) => {
    const getColor = (value: number) => {
        if (value > 75) return 'bg-success';
        if (value > 50) return 'bg-yellow-400';
        return 'bg-danger';
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-1 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Confidence</span>
                <span className="font-semibold">{confidence}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                <div 
                    className={`${getColor(confidence)} h-2.5 rounded-full transition-all duration-500`} 
                    style={{ width: `${confidence}%` }}
                ></div>
            </div>
        </div>
    );
};


export const TrendPredictionCard: React.FC<TrendPredictionCardProps> = ({ prediction, loading, error }) => {
    
    if (loading) {
        return (
            <div className="text-center p-4">
                <i className="fas fa-spinner fa-spin text-primary text-xl"></i>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Analyzing trend...</p>
            </div>
        );
    }

    if (error || !prediction) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border border-danger/50 text-danger p-4 rounded-lg flex items-center space-x-3">
                <i className="fas fa-exclamation-triangle text-xl"></i>
                <div>
                    <h4 className="font-semibold">Prediction Failed</h4>
                    <p className="text-sm">{error || "Could not generate prediction data."}</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="p-4 rounded-lg">
            <div className="flex items-center space-x-4 mb-4">
                <TrendIcon trend={prediction.trend} />
                <div>
                    <p className="text-2xl font-bold">Likely {prediction.trend}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Short-term (7-day) forecast</p>
                </div>
            </div>
            <ConfidenceBar confidence={prediction.confidence} />
            <p className="text-gray-600 dark:text-gray-300 mt-4 text-sm italic bg-gray-200 dark:bg-gray-700/50 p-3 rounded-md">
                <i className="fas fa-quote-left mr-2 opacity-50"></i>
                {prediction.analysis}
            </p>
        </div>
    );
};