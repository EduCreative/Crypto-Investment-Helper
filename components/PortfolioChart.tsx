import React, { useEffect, useRef, useState, useMemo } from 'react';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import { format } from 'date-fns';
import { subDays } from 'date-fns/subDays';
import { subYears } from 'date-fns/subYears';
import type { Transaction } from '../types.ts';
import { getCoinMarketChart } from '../services/coingeckoApi.ts';
import { useTheme } from '../context/ThemeContext.tsx';

interface PortfolioChartProps {
  transactions: Transaction[];
  initialBalance: number;
}

type TimeRange = '7D' | '30D' | '90D' | '1Y' | 'ALL';

const timeRangeToDays: { [key in TimeRange]: number | 'max' } = {
    '7D': 7,
    '30D': 30,
    '90D': 90,
    '1Y': 365,
    'ALL': 'max'
};

export const PortfolioChart: React.FC<PortfolioChartProps> = ({ transactions, initialBalance }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<Chart | null>(null);
    const { theme } = useTheme();

    const [chartData, setChartData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState<TimeRange>('90D');
    
    const sortedTxs = useMemo(() => {
        return [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [transactions]);

    useEffect(() => {
        const generateChartData = async () => {
            if (sortedTxs.length === 0) {
                setLoading(false);
                setChartData(null);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const coinIds = [...new Set(sortedTxs.map(tx => tx.coin.id))];
                const days = timeRangeToDays[timeRange];

                // Fetch historical prices sequentially to avoid CoinGecko's rate limiting.
                const priceResults = [];
                for (const id of coinIds) {
                    try {
                        const result = await getCoinMarketChart(id, days);
                        priceResults.push(result);
                    } catch (e) {
                        console.error(`Could not fetch market data for ${id}, skipping for chart.`, e);
                        // Push empty data on error to prevent the chart from breaking completely.
                        priceResults.push({ prices: [], total_volumes: [] });
                    }
                    // A small delay between requests to stay within API rate limits.
                    await new Promise(resolve => setTimeout(resolve, 350));
                }
                
                const priceMap: { [coinId: string]: { [dateStr: string]: number } } = {};
                coinIds.forEach((id, index) => {
                    priceMap[id] = {};
                    priceResults[index]?.prices.forEach(([timestamp, price]) => {
                        const dateStr = format(new Date(timestamp), 'yyyy-MM-dd');
                        priceMap[id][dateStr] = price;
                    });
                });
                
                const endDate = new Date();
                endDate.setUTCHours(0, 0, 0, 0);

                let startDate: Date;
                if (days === 'max') {
                    startDate = new Date(sortedTxs[0].date);
                } else if (days === 365) {
                    startDate = subYears(endDate, 1);
                } else {
                    startDate = subDays(endDate, days - 1);
                }
                startDate.setUTCHours(0, 0, 0, 0);

                const portfolioHistory: { date: number; value: number }[] = [];
                const transactionPoints: { x: number; y: number; type: 'buy' | 'sell' }[] = [];
                
                let currentHoldings: { [coinId: string]: number } = {};
                let currentUsdtBalance = initialBalance;
                
                // Pre-calculate holdings up to the start date
                const relevantTxsBeforeStart = sortedTxs.filter(tx => new Date(tx.date) < startDate);
                for (const tx of relevantTxsBeforeStart) {
                     if (tx.type === 'buy') {
                        currentUsdtBalance -= tx.total;
                        currentHoldings[tx.coin.id] = (currentHoldings[tx.coin.id] || 0) + tx.amount;
                    } else {
                        currentUsdtBalance += tx.total;
                        currentHoldings[tx.coin.id] = (currentHoldings[tx.coin.id] || 0) - tx.amount;
                    }
                }

                let txIndex = relevantTxsBeforeStart.length;

                for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                    const currentDate = new Date(d);
                    const currentDateStr = format(currentDate, 'yyyy-MM-dd');
                    const nextDay = new Date(currentDate);
                    nextDay.setDate(nextDay.getDate() + 1);

                    while (txIndex < sortedTxs.length && new Date(sortedTxs[txIndex].date) < nextDay) {
                        const tx = sortedTxs[txIndex];
                        if (tx.type === 'buy') {
                            currentUsdtBalance -= tx.total;
                            currentHoldings[tx.coin.id] = (currentHoldings[tx.coin.id] || 0) + tx.amount;
                        } else {
                            currentUsdtBalance += tx.total;
                            currentHoldings[tx.coin.id] = (currentHoldings[tx.coin.id] || 0) - tx.amount;
                        }
                        transactionPoints.push({ x: new Date(tx.date).getTime(), y: 0, type: tx.type }); // y will be set later
                        txIndex++;
                    }

                    let holdingsValue = 0;
                    for (const coinId in currentHoldings) {
                        const amount = currentHoldings[coinId];
                        if (amount > 1e-9) {
                            let priceForDay = priceMap[coinId]?.[currentDateStr];
                            if (!priceForDay) {
                                for (let i = 1; i <= 7; i++) {
                                    const lookbackDate = subDays(currentDate, i);
                                    const lookbackDateStr = format(lookbackDate, 'yyyy-MM-dd');
                                    if (priceMap[coinId]?.[lookbackDateStr]) {
                                        priceForDay = priceMap[coinId][lookbackDateStr];
                                        break;
                                    }
                                }
                            }
                            if (priceForDay) {
                                holdingsValue += amount * priceForDay;
                            }
                        }
                    }

                    const totalValue = holdingsValue + currentUsdtBalance;
                    portfolioHistory.push({ date: currentDate.getTime(), value: totalValue });
                }
                
                // Set the y-value for transaction points based on portfolio value on that day
                const valueMap = new Map(portfolioHistory.map(p => [format(new Date(p.date), 'yyyy-MM-dd'), p.value]));
                transactionPoints.forEach(p => {
                    const dateStr = format(new Date(p.x), 'yyyy-MM-dd');
                    p.y = valueMap.get(dateStr) || 0;
                });

                setChartData({
                    labels: portfolioHistory.map(p => p.date),
                    datasets: [
                        {
                            label: 'Portfolio Value',
                            data: portfolioHistory.map(p => p.value),
                            type: 'line',
                        },
                        {
                            label: 'Initial Investment',
                            data: portfolioHistory.map(() => initialBalance),
                            type: 'line',
                        },
                        {
                           label: 'Transactions',
                           data: transactionPoints,
                           type: 'scatter',
                        }
                    ]
                });

            } catch (e) {
                console.error("Failed to generate portfolio chart data:", e);
                setError("Could not load chart data due to an external API error. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        generateChartData();
    }, [sortedTxs, initialBalance, timeRange]);

    useEffect(() => {
        if (!canvasRef.current || !chartData) {
            if (chartInstanceRef.current) chartInstanceRef.current.destroy();
            return;
        }
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        
        const isDark = theme === 'dark';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
        const textColor = isDark ? '#e5e7eb' : '#4b5563';
        const primaryColor = '#3b82f6';
        const successColor = '#22c55e';
        const dangerColor = '#ef4444';

        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
        gradient.addColorStop(1, isDark ? 'rgba(59, 130, 246, 0.01)' : 'rgba(59, 130, 246, 0)');
        
        chartInstanceRef.current = new Chart(ctx, {
            data: {
                labels: chartData.labels,
                datasets: [
                    {
                        ...chartData.datasets[0], // Portfolio Value
                        fill: true,
                        borderColor: primaryColor,
                        backgroundColor: gradient,
                        pointRadius: 0,
                        tension: 0.3,
                        borderWidth: 2,
                    },
                    {
                        ...chartData.datasets[1], // Initial Investment
                        borderColor: isDark ? '#6b7280' : '#9ca3af',
                        borderDash: [5, 5],
                        pointRadius: 0,
                        borderWidth: 1,
                    },
                    {
                        ...chartData.datasets[2], // Transactions
                        pointBackgroundColor: (context: any) => context.raw.type === 'buy' ? successColor : dangerColor,
                        pointBorderColor: (context: any) => context.raw.type === 'buy' ? successColor : dangerColor,
                        pointRadius: 5,
                        pointHoverRadius: 8,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'time',
                        time: { unit: 'day', tooltipFormat: 'MMM d, yyyy' },
                        ticks: { color: textColor, maxRotation: 0, autoSkip: true, autoSkipPadding: 20 },
                        grid: { display: false },
                    },
                    y: {
                        ticks: {
                            color: textColor,
                            callback: (value) => `$${Number(value).toLocaleString()}`,
                        },
                        grid: { color: gridColor },
                        border: {
                          display: false
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: isDark ? '#1e1e1e' : '#fff',
                        titleColor: textColor,
                        bodyColor: textColor,
                        borderColor: gridColor,
                        borderWidth: 1,
                        callbacks: {
                            label: (context) => {
                                if (context.dataset.label === 'Portfolio Value') {
                                    return ` Value: $${context.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                }
                                return null;
                            },
                        },
                    },
                },
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
            }
        });

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
        };
    }, [chartData, theme, initialBalance]);

    const TimeRangeButton: React.FC<{ range: TimeRange }> = ({ range }) => (
        <button
            onClick={() => setTimeRange(range)}
            className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${timeRange === range ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
        >
            {range}
        </button>
    );

    return (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-3">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Portfolio History</h2>
                <div className="flex items-center space-x-2 p-1 bg-gray-200 dark:bg-gray-900/50 rounded-lg">
                    {(['7D', '30D', '90D', '1Y', 'ALL'] as TimeRange[]).map(r => <TimeRangeButton key={r} range={r} />)}
                </div>
            </div>
            <div className="relative h-72">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 dark:bg-gray-800/50 z-10">
                        <i className="fas fa-spinner fa-spin text-2xl text-primary"></i>
                        <p className="ml-3 text-gray-500 dark:text-gray-400">Building portfolio history chart...</p>
                    </div>
                )}
                {error && <div className="absolute inset-0 flex items-center justify-center text-danger text-center p-4">{error}</div>}
                {!loading && !error && (transactions.length === 0 || !chartData) && (
                    <div className="absolute inset-0 flex items-center justify-center text-center">
                        <div className="text-gray-500 dark:text-gray-500">
                            <i className="fas fa-chart-line text-4xl mb-3"></i>
                            <p>Your portfolio chart will appear here once you make your first transaction.</p>
                        </div>
                    </div>
                )}
                <canvas ref={canvasRef}></canvas>
            </div>
        </div>
    );
};