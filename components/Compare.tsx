import React, { useState, useMemo, useEffect } from 'react';
import { useDApp } from '../context/DAppContext.tsx';
import { getAIComparison } from '../services/geminiService.ts';
import type { Coin } from '../types.ts';

interface CoinSelectorCardProps {
    coin: Coin;
    isSelected: boolean;
    onSelect: (coinId: string) => void;
    isDisabled: boolean;
}

const CoinSelectorCard: React.FC<CoinSelectorCardProps> = ({ coin, isSelected, onSelect, isDisabled }) => (
    <button
        onClick={() => onSelect(coin.id)}
        disabled={isDisabled && !isSelected}
        className={`flex flex-col items-center justify-center text-center p-3 bg-white dark:bg-gray-700 rounded-lg transition-all duration-200 border-2 ${isSelected ? 'border-primary bg-gray-100 dark:bg-gray-600' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-600'} ${isDisabled && !isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
        <img src={coin.image} alt={coin.name} className="w-8 h-8 mb-2" />
        <span className="text-sm font-semibold">{coin.name}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{coin.symbol.toUpperCase()}</span>
    </button>
);

const AIComparison: React.FC<{ coins: Coin[] }> = ({ coins }) => {
    const [comparison, setComparison] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchComparison = async () => {
            setLoading(true);
            const result = await getAIComparison(coins);
            setComparison(result);
            setLoading(false);
        };

        if (coins.length >= 2) {
            fetchComparison();
        }
    }, [coins]);

    return (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-lg mt-6">
            <h3 className="text-xl font-semibold text-primary mb-2">
                <i className="fas fa-brain mr-2"></i>AI-Powered Comparison
            </h3>
            {loading ? (
                <p className="text-gray-600 dark:text-gray-300">Generating AI analysis...</p>
            ) : (
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{comparison}</p>
            )}
        </div>
    );
};

export const Compare: React.FC<{ onCoinSelect: (coin: Coin) => void }> = ({ onCoinSelect }) => {
    const { coins } = useDApp();
    const [selectedCoinIds, setSelectedCoinIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    const MAX_SELECTION = 3;

    const handleSelectCoin = (coinId: string) => {
        setSelectedCoinIds(prev => {
            if (prev.includes(coinId)) {
                return prev.filter(id => id !== coinId);
            }
            if (prev.length < MAX_SELECTION) {
                return [...prev, coinId];
            }
            return prev;
        });
    };
    
    const selectedCoins = useMemo(() => {
        const coinMap = new Map(coins.map(c => [c.id, c]));
        return selectedCoinIds.map(id => coinMap.get(id)).filter((c): c is Coin => c !== undefined);
    }, [selectedCoinIds, coins]);

    const filteredCoinsForSelection = useMemo(() => {
        if (!searchTerm) {
            return coins;
        }
        return coins.filter(coin => 
            coin.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [coins, searchTerm]);

    const isSelectionDisabled = selectedCoinIds.length >= MAX_SELECTION;

    const renderComparisonTable = () => (
        <div className="mt-6 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                        <th className="p-3">Metric</th>
                        {selectedCoins.map(coin => (
                            <th key={coin.id} className="p-3 text-center">
                                <div className="flex flex-col items-center">
                                    <img src={coin.image} alt={coin.name} className="w-8 h-8 mb-1"/>
                                    {coin.name}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                        <td className="p-3 font-semibold">Price</td>
                        {selectedCoins.map(c => <td key={c.id} className="p-3 text-center font-mono">${c.current_price.toLocaleString()}</td>)}
                    </tr>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                        <td className="p-3 font-semibold">24h Change</td>
                        {selectedCoins.map(c => (
                            <td key={c.id} className={`p-3 text-center font-mono ${c.price_change_percentage_24h >= 0 ? 'text-success' : 'text-danger'}`}>
                                {c.price_change_percentage_24h.toFixed(2)}%
                            </td>
                        ))}
                    </tr>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                        <td className="p-3 font-semibold">Market Cap</td>
                        {selectedCoins.map(c => <td key={c.id} className="p-3 text-center font-mono">${c.market_cap.toLocaleString()}</td>)}
                    </tr>
                    <tr className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                        <td className="p-3 font-semibold">24h Volume</td>
                        {selectedCoins.map(c => <td key={c.id} className="p-3 text-center font-mono">${c.total_volume.toLocaleString()}</td>)}
                    </tr>
                     <tr className="bg-gray-200/50 dark:bg-gray-700/50">
                        <td className="p-3 font-semibold"></td>
                        {selectedCoins.map(c => (
                            <td key={c.id} className="p-3 text-center">
                                <button
                                    onClick={() => onCoinSelect(c)}
                                    className="bg-secondary text-white text-sm font-bold py-1 px-3 rounded-md hover:bg-purple-500 transition-colors"
                                >
                                    View Details
                                </button>
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>
        </div>
    );


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Coin Comparison</h1>
                {selectedCoinIds.length > 0 && (
                    <button
                        onClick={() => setSelectedCoinIds([])}
                        className="bg-danger text-white px-4 py-2 rounded-md hover:bg-red-500"
                    >
                        Clear Selection
                    </button>
                )}
            </div>
            
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-3 gap-3">
                    <h2 className="text-xl font-semibold">Select up to {MAX_SELECTION} coins to compare</h2>
                    <div className="relative w-full sm:w-auto sm:max-w-xs">
                        <input 
                            type="text"
                            placeholder="Search to add coins..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 pl-8 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <i className="fas fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    </div>
                </div>
                {filteredCoinsForSelection.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                        {filteredCoinsForSelection.map(coin => (
                            <CoinSelectorCard 
                                key={coin.id}
                                coin={coin}
                                isSelected={selectedCoinIds.includes(coin.id)}
                                onSelect={handleSelectCoin}
                                isDisabled={isSelectionDisabled}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                        <p>No coins found for "{searchTerm}".</p>
                    </div>
                )}
            </div>

            {selectedCoins.length >= 2 ? (
                <>
                    {renderComparisonTable()}
                    <AIComparison coins={selectedCoins} />
                </>
            ) : (
                <div className="text-center py-10 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <i className="fas fa-info-circle text-3xl text-gray-400 dark:text-gray-500 mb-3"></i>
                    <p className="text-gray-500 dark:text-gray-400">Please select at least two coins to start the comparison.</p>
                </div>
            )}
        </div>
    );
};