export const CONTENT_SYSTEM_PROMPT = (structure: any) => `You are an expert technical interviewer. Return JSON only based on this structure: ${JSON.stringify(structure)}. Strict JSON format enforcement.`;

export const getSuggestionsPrompt = (topic: string) => `Suggest latest high-quality blogs, diagrams/images, and notes for the topic: ${topic}.`;
