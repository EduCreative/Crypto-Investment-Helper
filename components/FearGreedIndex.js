

import React from 'react';

interface FearGreedIndexProps {
  value: number;
  classification: string;
}

export const FearGreedIndex: React.FC<FearGreedIndexProps> = ({ value, classification }) => {
  const rotation = (value / 100) * 180 - 90;

  const getColor = (val: number) => {
    if (val <= 25) return '#ef4444'; // Red for Extreme Fear
    if (val <= 45) return '#f97316'; // Orange for Fear
    if (val <= 55) return '#eab308'; // Yellow for Neutral
    if (val <= 75) return '#84cc16'; // Light Green for Greed
    return '#22c55e'; // Green for Extreme Greed
  };
  
  const color = getColor(value);

  return (
    <div className="flex flex-col items-center p-4">
      <div className="relative w-48 h-24 overflow-hidden mb-2">
        <div className="absolute top-0 left-0 w-full h-full border-t-8 border-l-8 border-r-8 border-gray-300 dark:border-gray-600 rounded-t-full" style={{borderTopLeftRadius: '100px', borderTopRightRadius: '100px'}}></div>
        <div 
          className="absolute top-0 left-0 w-full h-full border-t-8 border-l-8 border-r-8 rounded-t-full" 
          style={{
            borderColor: color, 
            clipPath: `polygon(0% 0%, 100% 0%, 100% ${value}%, 0% ${value}%)`,
            borderTopLeftRadius: '100px', 
            borderTopRightRadius: '100px',
            transform: 'rotate(180deg)',
          }}
        ></div>
        <div className="absolute bottom-0 left-1/2 w-2 h-20 bg-gray-600 dark:bg-gray-200 rounded-t-full origin-bottom transform -translate-x-1/2" style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}></div>
        <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-gray-600 dark:bg-gray-200 rounded-full transform -translate-x-1/2 translate-y-1/2"></div>
      </div>
      <p className="text-4xl font-bold" style={{ color }}>{value}</p>
      <p className="text-lg font-semibold" style={{ color }}>{classification}</p>
      <div className="w-full flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1 px-2">
        <span>Fear</span>
        <span>Neutral</span>
        <span>Greed</span>
      </div>
    </div>
  );
};