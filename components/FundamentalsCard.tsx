import React, { useState } from 'react';
import type { FundamentalData } from '../types';

interface FundamentalsCardProps {
  data: FundamentalData | null;
  loading: boolean;
  error: string | null;
}

const AccordionItem: React.FC<{ title: string; children: React.ReactNode; icon: string }> = ({ title, children, icon }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
            <h2>
                <button
                    type="button"
                    className="flex justify-between items-center w-full p-4 font-medium text-left text-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-expanded={isOpen}
                >
                    <div className="flex items-center">
                        <i className={`fas ${icon} w-5 mr-3 text-primary`}></i>
                        <span>{title}</span>
                    </div>
                    <i className={`fas fa-chevron-down w-3 h-3 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
                </button>
            </h2>
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-screen' : 'max-h-0 overflow-hidden'}`}>
                <div className="p-4 pt-0 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    <p>{children}</p>
                </div>
            </div>
        </div>
    );
};

export const FundamentalsCard: React.FC<FundamentalsCardProps> = ({ data, loading, error }) => {
    if (loading) {
        return (
            <div className="text-center p-4">
                <i className="fas fa-spinner fa-spin text-primary text-xl"></i>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading fundamentals...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border border-danger/50 text-danger p-4 rounded-lg flex items-center space-x-3">
                <i className="fas fa-exclamation-triangle text-xl"></i>
                <div>
                    <h4 className="font-semibold">Analysis Failed</h4>
                    <p className="text-sm">{error || 'Could not load fundamental data.'}</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
             <AccordionItem title="Project Background" icon="fa-info-circle">
                {data.background}
            </AccordionItem>
            <AccordionItem title="Tokenomics" icon="fa-coins">
                {data.tokenomics}
            </AccordionItem>
             <AccordionItem title="Team & Development" icon="fa-users">
                {data.team}
            </AccordionItem>
        </div>
    );
};