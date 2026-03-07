import { Readable } from 'stream';

/**
 * Common interface for all AI providers (Ollama, Claude, etc.)
 */
export interface AIProvider {
    /**
     * Generate a complete response (non-streaming).
     * When jsonMode is true, the provider should return parsed JSON.
     */
    generate(prompt: string, systemPrompt?: string, jsonMode?: boolean): Promise<any>;

    /**
     * Generate a streaming response.
     * Returns an object with a `data` property that is a Readable stream.
     */
    generateStream(prompt: string, systemPrompt?: string): Promise<{ data: Readable }>;

    /**
     * Generate embeddings for a given text.
     */
    embed(text: string): Promise<number[]>;
}

export type AIProviderType = 'ollama' | 'claude' | 'ollama-cli';

export interface Config {
    ai: {
        provider: AIProviderType;
    };
}

export const defaultConfig: Config = {
    ai: {
        provider: (process.env.AI_PROVIDER || 'ollama') as AIProviderType,
    },
};
