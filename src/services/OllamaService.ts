import { Readable } from 'stream';
import { AIProvider } from './AIProvider';
import config from '../config/env';

class OllamaProvider implements AIProvider {
    private client: any = null;
    private modelName: string;

    constructor(modelName: string = config.ollama.model) {
        this.modelName = modelName;
    }

    private async getClient() {
        if (!this.client) {
            const { Ollama } = await import('ollama');
            this.client = new Ollama({ host: config.ollama.url });
        }
        return this.client;
    }

    async generate(prompt: string, systemPrompt: string = 'You are an expert technical interviewer.', jsonMode: boolean = false): Promise<any> {
        try {
            const client = await this.getClient();

            if (config.logging.logAiPrompts) {
                console.log('\n--- AI PROMPT (Ollama) ---');
                console.log('System:', systemPrompt);
                console.log('User:', prompt);
                console.log('--------------------------\n');
            }

            const response = await client.generate({
                model: this.modelName,
                prompt: prompt,
                system: systemPrompt,
                stream: false,
                ...(jsonMode ? { format: 'json' } : {}),
            });

            if (jsonMode) {
                return JSON.parse(response.response);
            }
            return response.response;
        } catch (error: any) {
            console.error('Ollama Error:', error);
            if (error.status_code === 404 || error.message?.includes('not found')) {
                throw new Error(`OLLAMA_MODEL_NOT_FOUND:${this.modelName}`);
            }
            throw new Error('Failed to communicate with AI model');
        }
    }

    async generateStream(prompt: string, systemPrompt: string = 'You are an expert technical interviewer.'): Promise<{ data: Readable }> {
        try {
            const client = await this.getClient();
            const stream = await client.generate({
                model: this.modelName,
                prompt: prompt,
                system: systemPrompt,
                stream: true,
            });

            // Convert the async iterable from the SDK into a Readable stream
            const readable = new Readable({
                read() { }
            });

            (async () => {
                try {
                    for await (const chunk of stream) {
                        // Emit in the same JSON format downstream SSE handlers expect
                        const data = JSON.stringify({
                            response: chunk.response,
                            done: chunk.done
                        });
                        readable.push(data + '\n');
                    }
                    readable.push(null);
                } catch (err) {
                    readable.destroy(err as Error);
                }
            })();

            return { data: readable };
        } catch (error: any) {
            console.error('Ollama Stream Error:', error);
            if (error.status_code === 404 || error.message?.includes('not found')) {
                throw new Error(`OLLAMA_MODEL_NOT_FOUND:${this.modelName}`);
            }
            throw new Error('Failed to start AI stream');
        }
    }

    // --- Ollama-specific methods (used by healthCheck only) ---

    async listModels(): Promise<string[]> {
        try {
            const client = await this.getClient();
            const response = await client.list();
            return response.models.map((m: any) => m.name);
        } catch (error) {
            console.error('Ollama ListModels Error:', error);
            return [];
        }
    }

    async pullModel(modelName: string) {
        try {
            const client = await this.getClient();
            const stream = await client.pull({
                model: modelName,
                stream: true,
            });

            // Convert to a format healthCheck expects (object with .data readable)
            const readable = new Readable({
                read() { }
            });

            (async () => {
                try {
                    for await (const progress of stream) {
                        readable.push(JSON.stringify(progress) + '\n');
                    }
                    readable.push(null);
                } catch (err) {
                    readable.destroy(err as Error);
                }
            })();

            return { data: readable };
        } catch (error) {
            console.error('Ollama PullModel Error:', error);
            throw new Error(`Failed to pull model ${modelName}`);
        }
    }
}

export default OllamaProvider;
