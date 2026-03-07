export const TOPIC_SYSTEM_PROMPT = "You are a senior technical educator. Highly professional, technical, and accurate. Return JSON ONLY.";

export const getTopicExplanationPrompt = (topic: string) => `
Explain the technical topic: "${topic}" for a software engineering interview.
Transform this into a comprehensive, multi-page "Digital Book" experience.

Provide a deep-dive including:
1. Core concepts and exhaustive explanations.
2. Code examples (Markdown) with vibrant comments.
3. Architecture, Flow, or State diagrams using Mermaid.js syntax (e.g., \`\`\`mermaid graph TD ... \`\`\`).
4. Common interview questions.
5. Real-world use cases.
6. Common mistakes and industry best practices.

IMPORTANT AUTHORING RULES:
- Break the content down into 3 to 5 highly detailed "chapters".
- If another technical topic is mentioned that the user should know, create an internal link using the custom protocol: \`[Topic Name](topic://TopicName)\`. Do not link to external websites.
- Ensure the content is EXHAUSTIVE, treating each chapter like a dedicated textbook page.

Return ONLY a raw JSON object with this structure (no markdown fences around the JSON):
{
    "title": "Topic Name",
    "chapters": [
        {
            "title": "Chapter 1: The Foundations",
            "content": "Exhaustive markdown text here... include \`\`\`mermaid\`\`\` blocks and \`[Other Topic](topic://OtherTopic)\` links..."
        },
        {
            "title": "Chapter 2: ...",
            "content": "..."
        }
    ],
    "keyPoints": ["..."],
    "commonInterviewQuestions": ["..."],
    "useCases": ["Detailed usecase 1", "Detailed usecase 2"],
    "bestPractices": ["Market standard practice 1", "Practice 2"],
    "resources": ["Search Term 1", "..."]
}
`;
