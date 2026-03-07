import { spawn } from 'child_process';
import { Readable } from 'stream';
import { AIProvider } from './AIProvider';
import config from '../config/env';

class OllamaCLIProvider implements AIProvider {
    async generate(prompt: string, systemPrompt: string = '', jsonMode: boolean = false): Promise<any> {
        return new Promise((resolve, reject) => {
            // Using 'ollama run' with the --format json if available, or just parsing
            // Note: system prompt is hard to pass via CLI without a custom Modelfile, 
            // so we prepend it to the prompt for CLI access.
            const fullPrompt = systemPrompt ? `${systemPrompt}\n\nUser: ${prompt}` : prompt;
            const args = ['run', config.ollama.model, fullPrompt];

            if (jsonMode) {
                args.push('--format', 'json');
            }

            const child = spawn('ollama', args);
            let output = '';
            let error = '';

            child.stdout.on('data', (data) => {
                output += data.toString();
            });

            child.stderr.on('data', (data) => {
                error += data.toString();
            });

            child.on('close', (code) => {
                if (code !== 0) {
                    console.error('Ollama CLI Error:', error);
                    return reject(new Error(`Ollama CLI failed with code ${code}`));
                }

                if (jsonMode) {
                    try {
                        resolve(JSON.parse(output.trim()));
                    } catch (e) {
                        // Fallback: search for first { and last }
                        const start = output.indexOf('{');
                        const end = output.lastIndexOf('}');
                        if (start !== -1 && end !== -1) {
                            try {
                                resolve(JSON.parse(output.substring(start, end + 1)));
                            } catch (e2) {
                                resolve(output.trim());
                            }
                        } else {
                            resolve(output.trim());
                        }
                    }
                } else {
                    resolve(output.trim());
                }
            });

            child.on('error', reject);
        });
    }

    async generateStream(prompt: string, systemPrompt: string = ''): Promise<{ data: Readable }> {
        const fullPrompt = systemPrompt ? `${systemPrompt}\n\nUser: ${prompt}` : prompt;
        const args = ['run', config.ollama.model, fullPrompt];

        const child = spawn('ollama', args);
        const readable = new Readable({
            read() { }
        });

        child.stdout.on('data', (data) => {
            // The CLI outputs text directly. To maintain compatibility with the 
            // SSE handlers, we wrap it in the expected JSON format.
            const chunk = data.toString();
            const payload = JSON.stringify({
                response: chunk,
                done: false
            });
            readable.push(payload + '\n');
        });

        child.on('close', () => {
            const finalPayload = JSON.stringify({
                response: '',
                done: true
            });
            readable.push(finalPayload + '\n');
            readable.push(null);
        });

        child.on('error', (err) => {
            readable.destroy(err);
        });

        return { data: readable };
    }

    async embed(text: string): Promise<number[]> {
        return new Promise((resolve, reject) => {
            const child = spawn('ollama', ['embeddings', '--model', config.ollama.model, '--prompt', text]);
            let output = '';
            let error = '';

            child.stdout.on('data', (data) => {
                output += data.toString();
            });

            child.stderr.on('data', (data) => {
                error += data.toString();
            });

            child.on('close', (code) => {
                if (code !== 0) {
                    return reject(new Error(`Ollama CLI embeddings failed: ${error}`));
                }
                try {
                    resolve(JSON.parse(output.trim()));
                } catch (e) {
                    reject(new Error('Failed to parse CLI embeddings output'));
                }
            });
        });
    }
}

export default OllamaCLIProvider;
