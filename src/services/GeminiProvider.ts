import { GoogleGenerativeAI } from '@google/generative-ai';
import { Readable } from 'stream';
import { AIProvider } from './AIProvider';
import config from '../config/env';

class GeminiProvider implements AIProvider {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(apiKey?: string, modelName?: string) {
        this.genAI = new GoogleGenerativeAI(apiKey || config.gemini.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: modelName || config.gemini.model });
    }

    async generate(prompt: string, systemPrompt: string = 'You are an expert technical interviewer.', jsonMode: boolean = false): Promise<any> {
        try {
            if (config.logging.logAiPrompts) {
                console.log('\n--- AI PROMPT (Gemini) ---');
                console.log('System:', systemPrompt);
                console.log('User:', prompt);
                console.log('--------------------------\n');
            }

            const combinedPrompt = `${systemPrompt}\n\nUser Question: ${prompt}${jsonMode ? '\n\nIMPORTANT: Respond with valid JSON only.' : ''}`;

            const result = await this.model.generateContent(combinedPrompt);
            const response = await result.response;
            const text = response.text();

            if (jsonMode) {
                // Gemini sometimes wraps JSON in markdown blocks
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
                return JSON.parse(text);
            }

            return text;
        } catch (error: any) {
            console.error('Gemini Error:', error.message);
            throw new Error('Failed to communicate with Gemini');
        }
    }

    async generateStream(prompt: string, systemPrompt: string = 'You are an expert technical interviewer.'): Promise<{ data: Readable }> {
        try {
            const combinedPrompt = `${systemPrompt}\n\nUser Question: ${prompt}`;
            const result = await this.model.generateContentStream(combinedPrompt);

            const readable = new Readable({
                read() { }
            });

            (async () => {
                try {
                    for await (const chunk of result.stream) {
                        const chunkText = chunk.text();
                        if (chunkText) {
                            const data = JSON.stringify({ response: chunkText, done: false });
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
            console.error('Gemini Stream Error:', error.message);
            throw new Error('Failed to start Gemini stream');
        }
    }
}

export default GeminiProvider;
