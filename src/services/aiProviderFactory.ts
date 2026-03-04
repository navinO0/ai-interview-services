import { AIProvider } from './AIProvider';
import OllamaProvider from './OllamaService';
import OllamaCLIProvider from './OllamaCLIProvider';
import ClaudeProvider from './ClaudeProvider';
import OpenAIProvider from './OpenAIProvider';
import GeminiProvider from './GeminiProvider';
import config from '../config/env';

class AIProviderFactory {
    private provider: AIProvider | null = null;

    private getProviderInstance(type: string, apiKey?: string, modelName?: string): AIProvider {
        switch (type) {
            case 'openai': return new OpenAIProvider(apiKey, modelName);
            case 'gemini': return new GeminiProvider(apiKey, modelName);
            case 'claude': return new ClaudeProvider(apiKey, modelName);
            case 'ollama-cli': return new OllamaCLIProvider();
            case 'ollama':
            default: return new OllamaProvider(modelName);
        }
    }

    async getProvider(userId?: string): Promise<AIProvider> {
        let providerType = config.ai.provider;
        let apiKey: string | undefined = undefined;
        let modelName: string | undefined = undefined;

        if (userId) {
            const settings = await require('../config/db').default('user_ai_settings').where({ user_id: userId }).first();
            if (settings && settings.use_custom_settings) {
                providerType = settings.provider;
                apiKey = settings.api_key;
                modelName = settings.model_name;
            }
        }

        return this.getProviderInstance(providerType, apiKey, modelName);
    }

    // Proxy methods to use directly
    async generate(prompt: string, systemPrompt?: string, jsonMode?: boolean, userId?: string) {
        const provider = await this.getProvider(userId);
        return provider.generate(prompt, systemPrompt, jsonMode);
    }

    async generateStream(prompt: string, systemPrompt?: string, userId?: string) {
        const provider = await this.getProvider(userId);
        return provider.generateStream(prompt, systemPrompt);
    }
}

export default new AIProviderFactory();
