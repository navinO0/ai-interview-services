import axios from 'axios';
import config from '../config/env';

export interface SearchResult {
    title: string;
    url: string;
    content: string;
    score?: number;
}

export interface SearchOptions {
    searchDepth?: 'basic' | 'advanced';
    includeAnswer?: boolean;
    maxResults?: number;
}

class SearchService {
    private readonly apiKey: string;
    private readonly apiUrl = 'https://api.tavily.com/search';

    constructor() {
        this.apiKey = config.search.tavilyApiKey;
    }

    /**
     * Performs a web search using Tavily API.
     * Falls back to mock data if API key is missing.
     */
    async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
        if (!config.search.enabled) {
            console.log('ℹ️ SearchService: Web search is disabled. Using mock results.');
            return this.getMockResults(query);
        }

        if (!this.apiKey) {
            console.warn('⚠️ SearchService: TAVILY_API_KEY is missing. Using mock results.');
            return this.getMockResults(query);
        }

        try {
            const response = await axios.post(this.apiUrl, {
                api_key: this.apiKey,
                query,
                search_depth: options.searchDepth || 'basic',
                include_answer: options.includeAnswer || false,
                max_results: options.maxResults || 5,
            });

            return response.data.results.map((res: any) => ({
                title: res.title,
                url: res.url,
                content: res.content,
                score: res.score,
            }));
        } catch (error: any) {
            console.error('❌ SearchService Error:', error.response?.data || error.message);
            // Fallback to mock on error during development
            if (config.env === 'development') {
                return this.getMockResults(query);
            }
            throw new Error('Failed to perform web search');
        }
    }

    /**
     * Performs a search and returns a concise text summary.
     */
    async getSearchSummary(query: string): Promise<string> {
        const results = await this.search(query, { maxResults: 3 });
        if (results.length === 0) return 'No relevant information found.';

        return results.map(r => `Source: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`).join('\n\n');
    }

    private getMockResults(query: string): SearchResult[] {
        return [
            {
                title: `Hiring Trends for ${query} in 2026`,
                url: 'https://example.com/hiring-trends',
                content: `In 2026, the demand for skillsets related to "${query}" has increased by 15% due to the rise of AI-integrated systems.`,
                score: 0.95
            },
            {
                title: `${query} Salary Report 2026`,
                url: 'https://example.com/salary-report',
                content: `Average salaries for professionals with "${query}" expertise range from $120k to $180k depending on experience.`,
                score: 0.92
            },
            {
                title: `Latest Updates in ${query}`,
                url: 'https://example.com/latest-updates',
                content: `Recent breakthroughs in "${query}" include the release of version 5.0 which improves performance and security.`,
                score: 0.88
            }
        ];
    }
}

export default new SearchService();
