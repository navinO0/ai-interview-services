import ai from './aiProviderFactory';
import { TOPIC_SYSTEM_PROMPT, getTopicExplanationPrompt } from '../prompts/topic';

export interface Chapter {
    title: string;
    content: string;
}

export interface TopicExplanation {
    title: string;
    chapters: Chapter[];
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
            let chapters = result.chapters;
            if (!chapters || !Array.isArray(chapters) || chapters.length === 0) {
                // Fallback if AI didn't follow the chapter structure
                chapters = [{
                    title: "Overview",
                    content: result.explanation || result.content || "No detailed content generated."
                }];
                // if it returned codeExamples separately, append them to the first chapter
                if (result.codeExamples) {
                    chapters[0].content += `\n\n### Code Examples\n\n${result.codeExamples}`;
                }
            }

            return {
                title: result.title || topic,
                chapters: chapters,
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
