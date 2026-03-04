import ai from './aiProviderFactory';
import { TOPIC_SYSTEM_PROMPT, getTopicExplanationPrompt } from '../prompts/topic';

export interface TopicExplanation {
    title: string;
    explanation: string;
    codeExamples: string;
    keyPoints: string[];
    commonInterviewQuestions: string[];
    useCases: string[];
    commonMistakes: string[];
    bestPractices: string[];
    resources: string[];
}

class TopicService {
    async explainTopic(topic: string): Promise<TopicExplanation> {
        console.log(`Generating v2 explanation for topic: ${topic}`);

        const prompt = getTopicExplanationPrompt(topic);
        const systemPrompt = TOPIC_SYSTEM_PROMPT;

        try {
            const result = await ai.generate(prompt, systemPrompt, true);

            // Basic validation/fallback
            return {
                title: result.title || topic,
                explanation: result.explanation || "No explanation generated.",
                codeExamples: result.codeExamples || "",
                keyPoints: result.keyPoints || [],
                commonInterviewQuestions: result.commonInterviewQuestions || [],
                useCases: result.useCases || [],
                commonMistakes: result.commonMistakes || [],
                bestPractices: result.bestPractices || [],
                resources: result.resources || []
            };
        } catch (error) {
            console.error('Topic Explanation Error:', error);
            throw new Error(`Failed to explain topic: ${topic}`);
        }
    }
}

export default new TopicService();
