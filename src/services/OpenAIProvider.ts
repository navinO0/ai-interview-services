import OpenAI from 'openai';
import { Readable } from 'stream';
import { AIProvider } from './AIProvider';
import config from '../config/env';

class OpenAIProvider implements AIProvider {
    private client: OpenAI;
    private model: string;

    constructor(apiKey?: string, modelName?: string) {
        this.client = new OpenAI({
            apiKey: apiKey || config.openai.apiKey,
        });
        this.model = modelName || config.openai.model;
    }

    async generate(prompt: string, systemPrompt: string = 'You are an expert technical interviewer.', jsonMode: boolean = false): Promise<any> {
        try {
            if (config.logging.logAiPrompts) {
                console.log('\n--- AI PROMPT (OpenAI) ---');
                console.log('System:', systemPrompt);
                console.log('User:', prompt);
                console.log('--------------------------\n');
            }

            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                response_format: jsonMode ? { type: 'json_object' } : undefined,
            });

            const content = response.choices[0].message.content;

            if (jsonMode && content) {
                return JSON.parse(content);
            }

            return content;
        } catch (error: any) {
            console.error('OpenAI Error:', error.message);
            throw new Error('Failed to communicate with OpenAI');
        }
    }

    async generateStream(prompt: string, systemPrompt: string = 'You are an expert technical interviewer.'): Promise<{ data: Readable }> {
        try {
            const stream = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                stream: true,
            });

            const readable = new Readable({
                read() { }
            });

            (async () => {
                try {
                    for await (const chunk of stream) {
                        const content = chunk.choices[0]?.delta?.content || '';
                        if (content) {
                            // Emit in Ollama-compatible format
                            const data = JSON.stringify({ response: content, done: false });
                            readable.push(data + '\n');
                        }
                    }
                    readable.push(JSON.stringify({ response: '', done: true }) + '\n');
                    readable.push(null);
                } catch (err) {
                    readable.destroy(err as Error);
                }
            })();

            return { data: readable };
        } catch (error: any) {
            console.error('OpenAI Stream Error:', error.message);
            throw new Error('Failed to start OpenAI stream');
        }
    }
}

export default OpenAIProvider;
