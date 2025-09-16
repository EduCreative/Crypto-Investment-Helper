import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

// The TradingView object is loaded from a script tag in index.html
declare const TradingView: any;

interface TradingViewWidgetProps {
  coinSymbol: string;
}

export const TradingViewWidget: React.FC<TradingViewWidgetProps> = React.memo(({ coinSymbol }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  
  // Use a stable ID for the container element
  const containerId = 'tradingview_widget_container';

  useEffect(() => {
    if (!containerRef.current || typeof TradingView === 'undefined' || !coinSymbol) {
      return;
    }

    // Clear any previous widget from the container
    containerRef.current.innerHTML = '';

    const widgetOptions = {
      autosize: true,
      symbol: `${coinSymbol.toUpperCase()}USD`,
      interval: 'D',
      timezone: 'Etc/UTC',
      theme: theme,
      style: '1',
      locale: 'en',
      enable_publishing: false,
      withdateranges: true,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      studies: [
        "MovingAverage@tv-basicstudies", // Simple Moving Average (SMA)
        "MAExp@tv-basicstudies",        // Exponential Moving Average (EMA)
        "RSI@tv-basicstudies",          // Relative Strength Index
        "MACD@tv-basicstudies"          // Moving Average Convergence Divergence
      ],
      container_id: containerId,
      // Custom colors to match the app's theme
      backgroundColor: theme === 'dark' ? '#1e1e1e' : '#f9fafb', // dark:bg-gray-800 or bg-gray-50
      gridColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
    };

    new TradingView.widget(widgetOptions);
  }, [coinSymbol, theme]); // Re-render widget when theme changes

  return (
    <div id={containerId} ref={containerRef} className="relative" style={{ height: '450px' }} />
  );
});