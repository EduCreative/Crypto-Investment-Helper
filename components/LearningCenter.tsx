import React, { useState } from 'react';

const AccordionItem: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => {
    const [isOpen, setIsOpen] = useState(false);

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
                className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-screen' : 'max-h-0'}`}
                style={{ transitionProperty: 'max-height, padding' }}
            >
                <div className={`p-5 pt-0 text-gray-600 dark:text-gray-300 space-y-3 leading-relaxed ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export const LearningCenter: React.FC = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Learning Center</h1>
            
            <p className="text-gray-600 dark:text-gray-400">Expand your knowledge with these key topics in cryptocurrency investing.</p>

            <div>
                <AccordionItem title="Crypto Basics" icon="fa-cubes">
                    <p><strong>Cryptocurrency:</strong> A digital or virtual currency that uses cryptography for security. Unlike traditional currencies issued by governments (fiat currencies), cryptocurrencies are typically decentralized.</p>
                    <p><strong>Blockchain:</strong> A distributed database that is shared among the nodes of a computer network. It's the technology that enables the existence of cryptocurrency by maintaining a secure and decentralized record of transactions.</p>
                    <p><strong>Wallet:</strong> A digital wallet used to store, send, and receive cryptocurrencies. Wallets can be software-based (desktop, mobile, web) or hardware-based (physical devices).</p>
                </AccordionItem>

                <AccordionItem title="Understanding Order Types" icon="fa-exchange-alt">
                    <p><strong>Market Order:</strong> This is the simplest type of trade. It's an order to buy or sell an asset immediately at the best available current price. It guarantees execution but not the price.</p>
                    <p><strong>Limit Order:</strong> An order to buy or sell an asset at a specific price or better. A buy limit order will only execute at the limit price or lower, and a sell limit order will only execute at the limit price or higher. This gives you control over the price but does not guarantee the order will be filled.</p>
                </AccordionItem>

                <AccordionItem title="Common Trading Strategies" icon="fa-chart-line">
                    <p><strong>HODL (Hold On for Dear Life):</strong> A long-term strategy where investors buy a cryptocurrency and hold it for a long period, regardless of market fluctuations, with the belief that the price will increase over time.</p>
                    <p><strong>Day Trading:</strong> A short-term strategy involving multiple trades within a single day to profit from small price movements. It's high-risk and requires significant time and knowledge.</p>
                    <p><strong>Dollar-Cost Averaging (DCA):</strong> An investment strategy where you invest a fixed amount of money at regular intervals, regardless of the asset's price. This can help reduce the impact of volatility.</p>
                </AccordionItem>
                
                <AccordionItem title="Risks of Investing" icon="fa-exclamation-triangle">
                    <p><strong>Volatility:</strong> Cryptocurrency prices can be extremely volatile, with large price swings in short periods. You could lose a significant portion of your investment quickly.</p>
                    <p><strong>Regulatory Risk:</strong> The legal and regulatory landscape for cryptocurrencies is still evolving. New regulations could impact the value and legality of certain assets.</p>
                    <p><strong>Security Risk:</strong> Exchanges can be hacked, and assets can be stolen. It's crucial to use strong security practices, such as two-factor authentication and secure wallets.</p>
                </AccordionItem>
            </div>

            <div className="bg-red-50 dark:bg-red-900/50 border-l-4 border-danger text-red-800 dark:text-red-100 p-4 rounded-r-lg" role="alert">
                <p className="font-bold"><i className="fas fa-gavel mr-2"></i>Disclaimer</p>
                <p>This application is for educational and entertainment purposes only. The information provided, including AI-generated content, does not constitute financial advice. Always do your own research (DYOR) and consult with a qualified financial advisor before making any investment decisions.</p>
            </div>
        </div>
    );
};