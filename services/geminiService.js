import { GoogleGenAI, Type } from "@google/genai";
import type { Coin, PortfolioState, Recommendation, TrendPrediction, PortfolioAnalysis } from '../types.js';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("Gemini API key not found. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const getDailySummary = async (): Promise<string> => {
    if (!API_KEY) return "AI analysis is currently unavailable. Please configure your API key.";
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Provide a brief, one-sentence summary of the current cryptocurrency market sentiment for a beginner investor. Example: "The market is currently neutral, with strong interest in Bitcoin following recent news."'
        });
        return response.text;
    } catch (error) {
        console.error("Error fetching daily summary:", error);
        return "Could not generate AI summary at this time.";
    }
};

export const getPortfolioAnalysis = async (portfolio: PortfolioState): Promise<PortfolioAnalysis> => {
    const mockAnalysis: PortfolioAnalysis = {
        overallAssessment: "Your portfolio is ready for analysis. Click 'Get Insight' to start.",
        riskScore: 0,
        riskAnalysis: "No risks identified yet. Add assets to see a detailed breakdown.",
        diversification: "Consider adding a variety of assets to build a robust portfolio.",
        rebalancingOpportunities: "Once you have multiple assets, we can suggest rebalancing opportunities.",
        positiveNote: "Starting your investment journey is a great first step!"
    };

    if (!API_KEY) {
        console.warn("Gemini API key not found. Returning mock portfolio analysis.");
        return { ...mockAnalysis, overallAssessment: "AI analysis is currently unavailable." };
    }

    const holdingsArray = Object.values(portfolio.holdings);
    if (holdingsArray.length === 0) {
        return {
            overallAssessment: "Your portfolio is empty. Buy some crypto to get AI insights!",
            riskScore: 0,
            riskAnalysis: "N/A",
            diversification: "N/A",
            rebalancingOpportunities: "N/A",
            positiveNote: "Add your first asset to begin your investment journey!"
        };
    }

    const holdingsString = holdingsArray.map(h => `${h.amount.toFixed(4)} ${h.coin.symbol.toUpperCase()}`).join(', ');
    const usdtBalance = portfolio.usdtBalance.toFixed(2);

    const promptText = `
    Act as a friendly and insightful crypto portfolio analyst for a beginner investor.
    Analyze the following crypto portfolio and provide a detailed, actionable analysis.

    Portfolio Holdings: ${holdingsString}
    Cash Balance (USDT): $${usdtBalance}

    Your analysis must be structured and concise. Focus on being educational and helpful, not just giving direct financial advice.

    Provide your output in JSON format with the following structure:
    - "overallAssessment": A brief, one-sentence summary of the portfolio's current state.
    - "riskScore": A numerical risk score from 1 (very low risk) to 10 (very high risk).
    - "riskAnalysis": Identify the primary risks. Go beyond just concentration. Mention volatility risk if holding many altcoins, or lack of growth potential if holding only stablecoins.
    - "diversification": Provide a specific suggestion for diversification into a different sector (e.g., DeFi, Gaming, Infrastructure) and give one or two coin examples.
    - "rebalancingOpportunities": Suggest a concrete rebalancing action. For example: "Consider selling 0.1 BTC (approx. $XXXX) and using the proceeds to buy 1 ETH to improve your Layer-1 diversification." Be specific about an action.
    - "positiveNote": Find something positive to say about the portfolio. For example, "Holding a blue-chip asset like Bitcoin is a great foundation."
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: promptText,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        overallAssessment: { type: Type.STRING },
                        riskScore: { type: Type.INTEGER },
                        riskAnalysis: { type: Type.STRING },
                        diversification: { type: Type.STRING },
                        rebalancingOpportunities: { type: Type.STRING },
                        positiveNote: { type: Type.STRING }
                    },
                    required: ["overallAssessment", "riskScore", "riskAnalysis", "diversification", "rebalancingOpportunities", "positiveNote"]
                }
            }
        });

        const jsonStr = response.text.trim();
        const analysis: PortfolioAnalysis = JSON.parse(jsonStr);
        return analysis;

    } catch (error) {
        console.error("Error fetching portfolio analysis:", error);
        return {
            overallAssessment: "Could not generate AI portfolio analysis due to an error.",
            riskScore: 0,
            riskAnalysis: "N/A",
            diversification: "N/A",
            rebalancingOpportunities: "N/A",
            positiveNote: "N/A"
        };
    }
};

export const getTrendPrediction = async (coinName: string, historicalData: number[][]): Promise<TrendPrediction> => {
    if (!API_KEY) {
        return {
            trend: 'Neutral',
            confidence: 60,
            analysis: 'AI analysis is unavailable. This is a mock prediction.'
        };
    }

    const simplifiedData = historicalData
        .slice(-30) // Use last 30 days for brevity
        .map(d => ({ date: new Date(d[0]).toLocaleDateString(), price: d[1].toFixed(2) }));
    
    const promptText = `
    Act as a financial analyst specializing in cryptocurrency time-series analysis.
    You are given the last 30 days of price data for ${coinName}.
    
    Data: ${JSON.stringify(simplifiedData)}

    Based on this data, perform a simplified trend analysis. Predict the short-term price trend for the next 7 days.

    Provide your output in JSON format with the following structure:
    - "trend": a string, either "Bullish", "Bearish", or "Neutral".
    - "confidence": an integer between 0 and 100, representing your confidence in this prediction.
    - "analysis": a brief, one-sentence explanation for your prediction based on the data provided.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: promptText,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        trend: { type: Type.STRING, enum: ["Bullish", "Bearish", "Neutral"] },
                        confidence: { type: Type.INTEGER },
                        analysis: { type: Type.STRING }
                    },
                    required: ["trend", "confidence", "analysis"]
                }
            }
        });
        
        const jsonStr = response.text.trim();
        const prediction = JSON.parse(jsonStr);
        return prediction;

    } catch (error) {
        console.error(`Error fetching trend prediction for ${coinName}:`, error);
        throw error; // Re-throw the error to be caught by the calling component.
    }
};

const mockRecommendations: Recommendation[] = [
    { coinId: 'bitcoin', coinName: 'Bitcoin', score: 82, recommendation: 'Strong Buy', reasoning: 'Strong fundamentals and increasing institutional adoption (mock data).', scoreBreakdown: { trend: 30, sentiment: 20, fundamentals: 18, technology: 9, mood: 5 } },
    { coinId: 'ethereum', coinName: 'Ethereum', score: 65, recommendation: 'Hold', reasoning: 'Solid ecosystem but facing competition and scalability challenges (mock data).', scoreBreakdown: { trend: 22, sentiment: 15, fundamentals: 15, technology: 9, mood: 4 } },
    { coinId: 'tether', coinName: 'Tether', score: 55, recommendation: 'Hold', reasoning: 'Stablecoin, holds value but not for growth (mock data).', scoreBreakdown: { trend: 18, sentiment: 12, fundamentals: 12, technology: 8, mood: 5 } },
];

export const getAIRecommendations = async (coins: Coin[], fearAndGreedValue: number): Promise<Recommendation[]> => {
    if (!API_KEY || coins.length === 0) {
        console.warn("Gemini API key not found or no coins provided. Using mock recommendations.");
        return mockRecommendations;
    }

    const topCoinsForAnalysis = coins.slice(0, 10);
    const coinInfoForPrompt = topCoinsForAnalysis.map(c => ({ name: c.name, id: c.id }));
    const coinNames = topCoinsForAnalysis.map(c => c.name).join(', ');

    const promptText = `
    Act as a sophisticated crypto investment analyst for beginners. Your task is to provide a comprehensive recommendation for the following cryptocurrencies: ${coinNames}.

    Here are the coins and their API IDs: ${JSON.stringify(coinInfoForPrompt)}.

    The final recommendation score (0-100) must be a weighted average of five key factors:
    1.  **Market Trend (35% weight):** Analyze recent price action and short-term trend.
    2.  **Fundamentals (20% weight):** Evaluate the project's core purpose, team, and tokenomics.
    3.  **Sentiment Analysis (20% weight):** Analyze current news headlines and community chatter.
    4.  **Technology & Innovation (15% weight):** Assess the underlying technology, scalability, unique features, and developer activity. Is it innovative?
    5.  **Market Mood (10% weight):** Consider the current overall market fear or greed.

    The current Fear & Greed Index value is ${fearAndGreedValue} (where 0 is Extreme Fear and 100 is Extreme Greed). Use this as the input for the "Market Mood" factor.

    For each coin (${coinNames}), provide:
    - A "coinId" using the exact API ID from the list provided (e.g., "bitcoin").
    - A "coinName".
    - A final weighted score (0-100).
    - A breakdown of the score, showing points for each factor (trend, fundamentals, sentiment, technology, mood). The sum of the breakdown must equal the final score.
    - A simple recommendation ('Strong Buy', 'Buy', 'Hold', 'Risky', 'Sell').
    - A one-sentence reasoning summarizing your analysis.
    
    Return the result in JSON format as an array of objects.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: promptText,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            coinId: { type: Type.STRING },
                            coinName: { type: Type.STRING },
                            score: { type: Type.INTEGER },
                            recommendation: { type: Type.STRING },
                            reasoning: { type: Type.STRING },
                            scoreBreakdown: {
                                type: Type.OBJECT,
                                properties: {
                                    trend: { type: Type.INTEGER, description: 'Score for Market Trend (out of 35)' },
                                    sentiment: { type: Type.INTEGER, description: 'Score for Sentiment Analysis (out of 20)' },
                                    fundamentals: { type: Type.INTEGER, description: 'Score for Fundamentals (out of 20)' },
                                    technology: { type: Type.INTEGER, description: 'Score for Technology & Innovation (out of 15)' },
                                    mood: { type: Type.INTEGER, description: 'Score for Market Mood (out of 10)' },
                                },
                                required: ["trend", "sentiment", "fundamentals", "technology", "mood"],
                            },
                        },
                        required: ["coinId", "coinName", "score", "recommendation", "reasoning", "scoreBreakdown"],
                    },
                },
            },
        });

        const jsonStr = response.text.trim();
        const recommendations: Recommendation[] = JSON.parse(jsonStr);
        
        const validCoinIds = new Set(topCoinsForAnalysis.map(c => c.id));
        const filteredRecs = recommendations.filter(rec => validCoinIds.has(rec.coinId));
        
        return filteredRecs.length > 0 ? filteredRecs : mockRecommendations;

    } catch (error) {
        console.error("Error fetching AI recommendations:", error);
        return mockRecommendations;
    }
};


export const getAIComparison = async (coins: Coin[]): Promise<string> => {
    if (!API_KEY) return "AI analysis is currently unavailable.";
    if (coins.length < 2) return "Please select at least two coins for comparison.";

    const coinNames = coins.map(c => c.name).join(', ');

    const promptText = `
    Act as a crypto analyst for beginners.
    Provide a concise, one-paragraph comparison of the following cryptocurrencies: ${coinNames}.
    Focus on their primary use case, fundamentals, and recent developer activity.
    Highlight one key strength for each coin.
    For example: "While Bitcoin serves as a digital store of value with the strongest security, Ethereum offers a robust platform for decentralized applications with high developer activity. Solana competes with higher transaction speeds but has faced network stability challenges."
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: promptText
        });
        return response.text;
    } catch (error) {
        console.error("Error fetching AI comparison:", error);
        return "Could not generate AI comparison at this time.";
    }
};