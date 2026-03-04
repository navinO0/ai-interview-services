import Anthropic from '@anthropic-ai/sdk';
import { Readable } from 'stream';
import { AIProvider } from './AIProvider';
import config from '../config/env';

class ClaudeProvider implements AIProvider {
    private client: Anthropic;
    private model: string;

    constructor(apiKey?: string, modelName?: string) {
        this.client = new Anthropic({
            apiKey: apiKey || config.claude.apiKey,
        });
        this.model = modelName || config.claude.model;
    }

    async generate(prompt: string, systemPrompt: string = 'You are an expert technical interviewer.', jsonMode: boolean = false): Promise<any> {
        try {
            const systemContent = jsonMode
                ? `${systemPrompt}\n\nIMPORTANT: You MUST respond with valid JSON only. No markdown, no explanations, just the JSON object.`
                : systemPrompt;

            if (config.logging.logAiPrompts) {
                console.log('\n--- AI PROMPT (Claude) ---');
                console.log('System:', systemContent);
                console.log('User:', prompt);
                console.log('--------------------------\n');
            }

            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: 4096,
                system: systemContent,
                messages: [
                    { role: 'user', content: prompt }
                ],
            });

            const text = response.content
                .filter((block): block is Anthropic.TextBlock => block.type === 'text')
                .map(block => block.text)
                .join('');

            if (jsonMode) {
                // Try to extract JSON from the response
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
                return JSON.parse(text);
            }

            return text;
        } catch (error: any) {
            console.error('Claude Error:', error.message);
            throw new Error('Failed to communicate with Claude AI');
        }
    }

    async generateStream(prompt: string, systemPrompt: string = 'You are an expert technical interviewer.'): Promise<{ data: Readable }> {
        try {
            const stream = await this.client.messages.stream({
                model: this.model,
                max_tokens: 4096,
                system: systemPrompt,
                messages: [
                    { role: 'user', content: prompt }
                ],
            });

            // Convert Anthropic's stream to a Readable that emits Ollama-compatible JSON chunks
            const readable = new Readable({
                read() { }
            });

            (async () => {
                try {
                    for await (const event of stream) {
                        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                            // Emit in Ollama-compatible format so downstream SSE handlers work unchanged
                            const chunk = JSON.stringify({ response: event.delta.text, done: false });
                            readable.push(chunk + '\n');
                        }
                    }
                    // Signal completion
                    readable.push(JSON.stringify({ response: '', done: true }) + '\n');
                    readable.push(null);
                } catch (err) {
                    readable.destroy(err as Error);
                }
            })();

            return { data: readable };
        } catch (error: any) {
            console.error('Claude Stream Error:', error.message);
            throw new Error('Failed to start Claude AI stream');
        }
    }
}

export default ClaudeProvider;
