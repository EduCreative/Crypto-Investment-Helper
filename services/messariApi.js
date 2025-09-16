import type { FundamentalData } from '../types.js';

const API_URL = 'https://cors.eu.org/https://data.messari.io/api/v2/assets/';

// Helper to safely extract and join text
const getText = (data: any, fallback: string = "Information not available."): string => {
    return typeof data === 'string' && data.trim() !== '' ? data.trim() : fallback;
};

const formatTeam = (contributors: any): string => {
    if (!contributors) return "Team information not available.";

    const individuals = contributors.individuals?.map((p: any) => `${p.first_name} ${p.last_name}`.trim()).join(', ');
    const organizations = contributors.organizations?.map((o: any) => o.name).join(', ');

    if (individuals && organizations) return `Key individuals include ${individuals}. Key organizations include ${organizations}.`;
    if (individuals) return `Key individuals include ${individuals}.`;
    if (organizations) return `Key organizations include ${organizations}.`;
    return "Public team information not available.";
};

export const getFundamentalData = async (coinSymbol: string): Promise<FundamentalData> => {
  try {
    const response = await fetch(`${API_URL}${coinSymbol.toLowerCase()}/profile`);
    if (!response.ok) {
        throw new Error(`Messari API request failed with status ${response.status}`);
    }
    const json = await response.json();
    
    if (json.status.error_code || !json.data) {
        throw new Error(json.status.error_message || "Invalid data format from Messari API");
    }

    const profile = json.data?.profile;

    return {
      background: getText(profile?.general?.overview?.project_details),
      tokenomics: getText(profile?.token_details?.usage?.token_usage_details, "Tokenomics details not available."),
      team: formatTeam(profile?.general?.contributors)
    };
  } catch (error) {
    console.error(`Error fetching fundamentals for ${coinSymbol} from Messari:`, error);
    // Re-throw the error to be handled by the UI component
    throw error;
  }
};