export const TOPIC_SYSTEM_PROMPT = "You are a senior technical educator. Highly professional, technical, and accurate. Return JSON ONLY.";

export const getTopicExplanationPrompt = (topic: string) => `
Explain the technical topic: "${topic}" for a software engineering interview.
Provide a deep-dive including:
1. Concept explanation
2. Code examples (Markdown)
3. Key technical points
4. Common interview questions
5. Real-world use cases
6. Common mistakes to avoid
7. Industry best practices

Return ONLY a raw JSON object with this structure:
{
    "title": "Topic Name",
    "explanation": "Markdown text with color-coded highlights using text formatting (Bold, Italic, Code)",
    "codeExamples": "Vibrant Markdown code blocks with comments",
    "keyPoints": ["..."],
    "commonInterviewQuestions": ["..."],
    "useCases": ["Detailed usecase 1", "Detailed usecase 2"],
    "bestPractices": ["Market standard practice 1", "Practice 2"],
    "resources": ["Search Term 1", "..."]
}
`;
