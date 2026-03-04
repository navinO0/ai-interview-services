import ai from './aiProviderFactory';
import { CONTENT_SYSTEM_PROMPT, getSuggestionsPrompt } from '../prompts/content';

class ContentService {
    async getSuggestions(topic: string) {
        const structure = {
            topic: "",
            blogs: [{ title: "", url: "", summary: "" }],
            images: [{ title: "", image_url: "", description: "" }],
            notes: []
        };

        const prompt = getSuggestionsPrompt(topic);
        const systemPrompt = CONTENT_SYSTEM_PROMPT(structure);

        return ai.generate(prompt, systemPrompt, true);
    }
}

export default new ContentService();
