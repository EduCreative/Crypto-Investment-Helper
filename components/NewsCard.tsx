import React from 'react';
import type { NewsArticle } from '../types.ts';

interface NewsCardProps {
  article: NewsArticle;
}

export const NewsCard: React.FC<NewsCardProps> = ({ article }) => {
  const sentimentColor =
    article.sentiment === 'Bullish' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
    article.sentiment === 'Bearish' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
    'bg-gray-200 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400';

  return (
    <a href={article.url} target="_blank" rel="noopener noreferrer" className="block p-3 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium text-gray-800 dark:text-gray-200">{article.title}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{article.source}</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${sentimentColor}`}>
          {article.sentiment}
        </span>
      </div>
    </a>
  );
};