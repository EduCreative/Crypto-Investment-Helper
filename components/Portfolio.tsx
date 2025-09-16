import React, { useState, useMemo } from 'react';
import { usePortfolio } from '../context/PortfolioContext.tsx';
import { useDApp } from '../context/DAppContext.tsx';
import { getPortfolioAnalysis } from '../services/geminiService.ts';
import type { Page, Coin, Transaction, PortfolioAnalysis, LimitOrder } from '../types.ts';
import { TradeModal } from './TradeModal.tsx';
import { BuyAssetModal } from './BuyAssetModal.tsx';
import { PortfolioChart } from './PortfolioChart.tsx';

const PortfolioHeader: React.FC<{ portfolioValue: number; totalPNL: number; pnlPercentage: number }> = ({ portfolioValue, totalPNL, pnlPercentage }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-center">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Portfolio Value</h3>
            <p className="text-2xl font-bold">${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-center">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Profit/Loss</h3>
            <p className={`text-2xl font-bold ${totalPNL >= 0 ? 'text-success' : 'text-danger'}`}>
                {totalPNL >= 0 ? '+' : '-'}${Math.abs(totalPNL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
        </div>
        <div className="relative group cursor-help">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-center">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">P/L Percentage</h3>
                <p className={`text-2xl font-bold ${pnlPercentage >= 0 ? 'text-success' : 'text-danger'}`}>
                    {pnlPercentage.toFixed(2)}%
                </p>
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-gray-700 dark:bg-gray-900 text-white text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                Total P/L: {totalPNL >= 0 ? '+' : '-'}${Math.abs(totalPNL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-700 dark:border-t-gray-900"></div>
            </div>
        </div>
    </div>
);

const HoldingsTable: React.FC<{ holdings: any[], onTrade: (coin: Coin, type: 'buy' | 'sell') => void, onBuyNewAsset: () => void }> = ({ holdings, onTrade, onBuyNewAsset }) => (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4">My Holdings</h2>
        <table className="w-full text-left">
            <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                    <th className="p-2">Asset</th>
                    <th className="p-2">Amount</th>
                    <th className="p-2">Avg. Buy Price</th>
                    <th className="p-2">Bought Value</th>
                    <th className="p-2">Current Value</th>
                    <th className="p-2">P/L</th>
                    <th className="p-2 text-center">Actions</th>
                </tr>
            </thead>
            <tbody>
                {holdings.length > 0 ? holdings.map(({ coin, amount, avgBuyPrice, boughtValue, currentValue, pnl }) => (
                    <tr key={coin.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-200 dark:hover:bg-gray-700">
                        <td className="p-2 flex items-center">
                            <img src={coin.image} alt={coin.name} className="w-6 h-6 mr-2" />
                            {coin.name} <span className="text-gray-500 dark:text-gray-400 ml-1">{coin.symbol.toUpperCase()}</span>
                        </td>
                        <td className="p-2">{amount.toFixed(6)}</td>
                        <td className="p-2">${avgBuyPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                        <td className="p-2">${boughtValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="p-2">${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className={`p-2 font-semibold ${pnl >= 0 ? 'text-success' : 'text-danger'}`}>${pnl.toFixed(2)}</td>
                        <td className="p-2 text-center space-x-2">
                           <button onClick={() => onTrade(coin, 'buy')} className="bg-success text-white px-3 py-1 rounded-md text-sm hover:bg-green-500">Buy</button>
                           <button onClick={() => onTrade(coin, 'sell')} className="bg-danger text-white px-3 py-1 rounded-md text-sm hover:bg-red-500">Sell</button>
                        </td>
                    </tr>
                )) : (
                     <tr>
                        <td colSpan={7} className="text-center p-8">
                            <p className="text-gray-500 dark:text-gray-500 mb-4">Your portfolio is empty. Make your first trade to get started!</p>
                            <button onClick={onBuyNewAsset} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-500 transition-colors">
                                <i className="fas fa-plus mr-2"></i>Buy New Asset
                            </button>
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
);

const LimitOrdersTable: React.FC<{ orders: LimitOrder[], onCancel: (orderId: string) => void }> = ({ orders, onCancel }) => {
    const openOrders = useMemo(() => orders.filter(o => o.status === 'open'), [orders]);

    return (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto mt-6">
            <h2 className="text-xl font-semibold mb-4">Open Limit Orders</h2>
            {openOrders.length > 0 ? (
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                            <th className="p-2">Asset</th>
                            <th className="p-2">Type</th>
                            <th className="p-2">Amount</th>
                            <th className="p-2">Limit Price</th>
                            <th className="p-2">Date Placed</th>
                            <th className="p-2 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {openOrders.map(order => (
                            <tr key={order.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm">
                                <td className="p-2 flex items-center">
                                    <img src={order.coin.image} alt={order.coin.name} className="w-6 h-6 mr-2" />
                                    {order.coin.name}
                                </td>
                                <td className={`p-2 font-semibold ${order.type === 'buy' ? 'text-success' : 'text-danger'}`}>{order.type.toUpperCase()}</td>
                                <td className="p-2">{order.amount.toFixed(6)}</td>
                                <td className="p-2">${order.limitPrice.toLocaleString()}</td>
                                <td className="p-2 text-gray-500 dark:text-gray-400">{new Date(order.createdAt).toLocaleString()}</td>
                                <td className="p-2 text-center">
                                    <button onClick={() => onCancel(order.id)} className="bg-gray-500 text-white px-3 py-1 rounded-md text-xs hover:bg-gray-600">Cancel</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div className="text-center p-6 text-gray-500 dark:text-gray-500">
                    You have no open limit orders.
                </div>
            )}
        </div>
    );
};

const AIInsight: React.FC = () => {
    const { portfolio } = usePortfolio();
    const [insight, setInsight] = useState<PortfolioAnalysis | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGetInsight = async () => {
        setLoading(true);
        setInsight(null);
        const result = await getPortfolioAnalysis(portfolio);
        setInsight(result);
        setLoading(false);
    };

    const InsightItem: React.FC<{ icon: string, title: string, content: string, colorClass: string }> = ({ icon, title, content, colorClass }) => (
        <div className="flex items-start space-x-4">
            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
                <i className={`fas ${icon} text-white text-xl`}></i>
            </div>
            <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">{title}</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{content}</p>
            </div>
        </div>
    );
    
    return (
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg mt-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-primary">
                    <i className="fas fa-brain mr-2"></i>AI Portfolio Insight
                </h2>
                <button onClick={handleGetInsight} disabled={loading} className="bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-500 disabled:bg-gray-600 flex items-center">
                    <i className={`fas fa-sync mr-2 ${loading ? 'animate-spin' : ''}`}></i>
                    {loading ? 'Analyzing...' : 'Get Insight'}
                </button>
            </div>
             {loading && (
                <div className="text-center p-4">
                    <i className="fas fa-spinner fa-spin text-2xl text-primary"></i>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">The AI is analyzing your portfolio...</p>
                </div>
            )}
            {insight && (
                <div className="space-y-6">
                    <div className="bg-gray-200 dark:bg-gray-700/50 p-4 rounded-lg">
                        <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Overall Assessment</h3>
                        <p className="text-gray-700 dark:text-gray-300 italic">"{insight.overallAssessment}"</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InsightItem
                            icon="fa-shield-alt"
                            title={`Risk Analysis (Score: ${insight.riskScore}/10)`}
                            content={insight.riskAnalysis}
                            colorClass="bg-danger/80"
                        />
                        <InsightItem
                            icon="fa-cubes"
                            title="Diversification Suggestion"
                            content={insight.diversification}
                            colorClass="bg-secondary/80"
                        />
                        <InsightItem
                            icon="fa-balance-scale"
                            title="Rebalancing Opportunities"
                            content={insight.rebalancingOpportunities}
                            colorClass="bg-yellow-500/80"
                        />
                         <InsightItem
                            icon="fa-check-circle"
                            title="Positive Note"
                            content={insight.positiveNote}
                            colorClass="bg-success/80"
                        />
                    </div>
                </div>
            )}
            {!loading && !insight && (
                 <div className="text-center text-gray-500 dark:text-gray-500 p-4">
                    <p>Click "Get Insight" for a detailed AI-powered analysis of your portfolio.</p>
                </div>
            )}
        </div>
    );
};

const TransactionHistoryTable: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
    const [sortConfig, setSortConfig] = useState<{ key: 'type' | 'pnl' | 'date'; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

    const sortedTransactions = useMemo(() => {
        const sortableItems = [...transactions];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                let comparison = 0;
                if (sortConfig.key === 'date') {
                    comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
                } else if (sortConfig.key === 'pnl') {
                    const isASell = a.type === 'sell';
                    const isBSell = b.type === 'sell';
                    if (isASell && !isBSell) return -1;
                    if (!isASell && isBSell) return 1;
                    if (!isASell && !isBSell) return 0;
                    comparison = (a.pnl ?? 0) - (b.pnl ?? 0);
                } else { // type
                    comparison = a.type.localeCompare(b.type);
                }
                return sortConfig.direction === 'asc' ? comparison : -comparison;
            });
        }
        return sortableItems;
    }, [transactions, sortConfig]);

    const handleSort = (key: 'type' | 'pnl' | 'date') => {
        setSortConfig(prevConfig => ({
            key,
            direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const getSortIcon = (key: 'type' | 'pnl' | 'date') => {
        if (sortConfig.key !== key) {
            return <i className="fas fa-sort text-gray-400/50 ml-2"></i>;
        }
        return sortConfig.direction === 'asc'
            ? <i className="fas fa-sort-up text-primary ml-2"></i>
            : <i className="fas fa-sort-down text-primary ml-2"></i>;
    };
    
    const totalRealizedPnl = useMemo(() => {
        return transactions.reduce((acc, tx) => acc + (tx.pnl ?? 0), 0);
    }, [transactions]);

    const SortableHeader: React.FC<{ sortKey: 'type' | 'pnl' | 'date', children: React.ReactNode }> = ({ sortKey, children }) => (
        <th className="p-2">
            <button onClick={() => handleSort(sortKey)} className="flex items-center hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                {children}
                {getSortIcon(sortKey)}
            </button>
        </th>
    );

    return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mt-6 overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
        {transactions.length > 0 ? (
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm">
                        <SortableHeader sortKey="type">Type</SortableHeader>
                        <th className="p-2">Asset</th>
                        <th className="p-2">Price</th>
                        <th className="p-2">Amount</th>
                        <th className="p-2">Buy Value</th>
                        <th className="p-2">Sell Value</th>
                        <th className="p-2">Difference</th>
                        <SortableHeader sortKey="pnl">P/L</SortableHeader>
                        <SortableHeader sortKey="date">Date</SortableHeader>
                    </tr>
                </thead>
                <tbody>
                    {sortedTransactions.map((tx) => {
                        const isBuy = tx.type === 'buy';
                        const pnl = tx.pnl ?? 0;
                        const isPnlPositive = pnl >= 0;
                        const buyValue = isBuy ? tx.total : tx.total - pnl;
                        
                        return (
                            <tr key={tx.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm">
                                <td className="p-2">
                                    <span className={`font-bold ${isBuy ? 'text-success' : 'text-danger'}`}>
                                        {tx.type.toUpperCase()}
                                    </span>
                                </td>
                                <td className="p-2 flex items-center">
                                    <img src={tx.coin.image} alt={tx.coin.name} className="w-5 h-5 mr-2" />
                                    {tx.coin.name}
                                </td>
                                <td className="p-2">${tx.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="p-2">{tx.amount.toFixed(6)} {tx.coin.symbol.toUpperCase()}</td>
                                {isBuy ? (
                                    <>
                                        <td className="p-2">${tx.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="p-2 text-center text-gray-500">-</td>
                                        <td className="p-2 text-center text-gray-500">-</td>
                                        <td className="p-2 text-center text-gray-500">-</td>
                                    </>
                                ) : (
                                    <>
                                        <td className="p-2">${buyValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="p-2">${tx.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className={`p-2 font-semibold ${isPnlPositive ? 'text-success' : 'text-danger'}`}>
                                            ${pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className={`p-2 font-semibold ${isPnlPositive ? 'text-success' : 'text-danger'}`}>
                                            ${pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                    </>
                                )}
                                <td className="p-2 text-gray-500 dark:text-gray-400">{new Date(tx.date).toLocaleString()}</td>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot>
                    <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-bold">
                        <td colSpan={7} className="p-2 text-right text-base">Total Realized P/L</td>
                        <td colSpan={2} className={`p-2 text-base ${totalRealizedPnl >= 0 ? 'text-success' : 'text-danger'}`}>
                            ${totalRealizedPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                    </tr>
                </tfoot>
            </table>
        ) : (
            <div className="text-center p-8">
                <p className="text-gray-500">You have no transaction history yet.</p>
            </div>
        )}
    </div>
    );
};


export const Portfolio: React.FC<{ setActivePage: (page: Page) => void }> = ({ setActivePage }) => {
    const { portfolio, cancelLimitOrder } = usePortfolio();
    const { coins, loading: coinsLoading } = useDApp();
    const [isTradeModalOpen, setTradeModalOpen] = useState(false);
    const [isBuyModalOpen, setBuyModalOpen] = useState(false);
    const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
    const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');

    const handleTradeClick = (coin: Coin, type: 'buy' | 'sell') => {
        setSelectedCoin(coin);
        setTradeType(type);
        setTradeModalOpen(true);
    };

    const handleBuyNewAsset = () => {
        setBuyModalOpen(true);
    };

    const portfolioData = useMemo(() => {
        if (coinsLoading) return { holdings: [], portfolioValue: portfolio.usdtBalance, totalPNL: 0, pnlPercentage: 0 };

        const holdingsArray = Object.values(portfolio.holdings);
        let totalHoldingsValue = 0;

        const detailedHoldings = holdingsArray.map(holding => {
            const currentCoinData = coins.find(c => c.id === holding.coin.id);
            const currentPrice = currentCoinData ? currentCoinData.current_price : holding.avgBuyPrice;
            const currentValue = holding.amount * currentPrice;
            const boughtValue = holding.amount * holding.avgBuyPrice;
            const pnl = currentValue - boughtValue;
            totalHoldingsValue += currentValue;
            return { ...holding, currentValue, pnl, boughtValue };
        });

        const portfolioValue = portfolio.usdtBalance + totalHoldingsValue;
        const totalPNL = portfolioValue - portfolio.initialBalance;
        const pnlPercentage = portfolio.initialBalance > 0 ? (totalPNL / portfolio.initialBalance) * 100 : 0;

        return { holdings: detailedHoldings, portfolioValue, totalPNL, pnlPercentage };

    }, [portfolio, coins, coinsLoading]);

    if (coinsLoading && !portfolioData.holdings.length) {
        return <div className="text-center p-10"><i className="fas fa-spinner fa-spin text-4xl text-primary"></i><p className="mt-4">Loading portfolio data...</p></div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Portfolio</h1>
            <PortfolioHeader {...portfolioData} />
            
            <PortfolioChart transactions={portfolio.transactions} initialBalance={portfolio.initialBalance} />

            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Assets</h2>
                <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                    <span className="text-gray-500 dark:text-gray-400 mr-2">Cash Balance:</span>
                    <span className="font-bold text-lg">${portfolio.usdtBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
            </div>
            <HoldingsTable holdings={portfolioData.holdings} onTrade={handleTradeClick} onBuyNewAsset={handleBuyNewAsset} />
            <LimitOrdersTable orders={portfolio.limitOrders} onCancel={cancelLimitOrder} />
            <AIInsight />
            <TransactionHistoryTable transactions={portfolio.transactions} />
            {isTradeModalOpen && selectedCoin && (
                <TradeModal
                    coin={selectedCoin}
                    tradeType={tradeType}
                    onClose={() => setTradeModalOpen(false)}
                />
            )}
            {isBuyModalOpen && (
                <BuyAssetModal onClose={() => setBuyModalOpen(false)} />
            )}
        </div>
    );
};