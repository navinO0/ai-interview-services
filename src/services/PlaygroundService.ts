import ai from './aiProviderFactory';

class PlaygroundService {
    async analyzeCode(code: string, language: string, userId: string) {
        const prompt = `Analyze and "execute" (simulate) the following ${language} code for training purposes.
        
        CODE:
        ${code}
        
        TASK:
        1. Simulate the output (what would be printed to console).
        2. Identify any logical bugs or edge cases.
        3. Provide 2-3 specific technical improvements or "pro-tips" for this code.
        
        Format: Respond ONLY with a raw JSON object with these keys: 
        {"output", "analysis", "suggestions"}
        "output" should be a string of the simulated console output.
        "analysis" should be a 1-2 sentence summary of code health.
        "suggestions" should be an array of strings.`;

        const systemPrompt = "You are a senior compiler and code reviewer. You simulate code execution and provide elite feedback. Return JSON only.";

        const result = await ai.generate(prompt, systemPrompt, true, userId);
        try {
            return JSON.parse(result);
        } catch (e) {
            console.error('Failed to parse playground AI response:', result);
            return {
                output: "Execution simulated. No output captured.",
                analysis: "Analysis failed, but the code was processed.",
                suggestions: ["Check for syntax errors.", "Ensure all variables are initialized."]
            };
        }
    }

    async getSuggestions(code: string, language: string) {
        const prompt = `Provide 3 smart code completions or "next steps" for this ${language} snippet:
        
        CODE:
        ${code}
        
        Suggestions should be concise and technically accurate.
        Return JSON array of strings only: ["sug1", "sug2", "sug3"]`;

        const result = await ai.generate(prompt, "You are a coding assistant. Return JSON array of strings only.");
        try {
            return JSON.parse(result);
        } catch (e) {
            return ["Add error handling.", "Refactor into smaller functions.", "Add documentation."];
        }
    }
}

export default new PlaygroundService();
