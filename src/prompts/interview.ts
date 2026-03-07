export const INTERVIEW_SYSTEM_PROMPT = `Expert technical interviewer. Return JSON only: {
    "topic": "topic",
    "difficulty": "difficulty",
    "question_text": "detailed scenario-based question"
}. No markdown. Evaluate depth via "how/why" questions.`;

export const EVALUATION_SYSTEM_PROMPT = `Expert interviewer. Return JSON only: {
    "score": 0, 1, 2, or 3 (integer only), 
    "weakness_tag": "string", 
    "feedback": "concise explanation"
}. No markdown.`;

export const SUGGESTED_ANSWER_SYSTEM_PROMPT = `You are an expert technical educator. 
Provide a clear, well-structured ideal answer. 
CRITICAL: Use Mermaid.js diagrams (flowcharts, sequence diagrams, or class diagrams) to visualize complex architectures, logic flows, or data structures where appropriate. 
Wrap Mermaid code in triple backticks with 'mermaid' language identifier.`;

export const getFirstQuestionPrompt = (role: string, level: string, topic: string, difficulty: string, skills: string[], jd?: string, excludeList: string[] = []) => `
Generate the FIRST interview question for a ${role} at ${level} level.
Topic: ${topic}
Difficulty: ${difficulty}
Resume Skills: ${skills.join(', ')}
${jd ? `Target Job Description: ${jd}` : ''}

${excludeList.length > 0 ? `STRICTLY EXCLUDE these previous questions: ${JSON.stringify(excludeList.slice(-10))}` : ''}

INSTRUCTIONS:
1. Contextualize the question with a real-world scenario or specific technical environment.
2. Focus on "how" or "why" to evaluate the candidate's depth of understanding.
3. Adapt vocabulary and depth to a ${level}-level learner.
4. Return JSON only with {topic, difficulty, question_text}.`;

export const getNextQuestionPrompt = (role: string, level: string, topic: string, difficulty: string, jd?: string, historyText: string = '', fullExcludeList: string[] = []) => `
Generate the NEXT interview question for a ${role} at ${level} level.
Interview Configuration: Topic: ${topic}, Target Difficulty: ${difficulty}.
${jd ? `Target Job Description: ${jd}` : ''}

PREVIOUS QUESTIONS AND PERFORMANCE IN THIS SESSION:
${historyText}

STRICTLY EXCLUDE ALL THESE HISTORIC QUESTIONS:
${JSON.stringify(fullExcludeList.slice(-20))}

CRITICAL: Avoid repeating the same sub-topic. Ensure broad coverage.
ADAPT: If user is doing well, increase difficulty. If struggling, revisit fundamentals.

STRICT RULES:
1. Every question MUST be a standalone technical interview question about ${topic}.
2. Contextualize the question with a real-world scenario or specific technical environment.
3. Focus on "how" or "why" to evaluated the candidate's depth of understanding.
4. DO NOT ask conversational questions, sequential questions, or include sequencing phrases.

Return JSON only with {topic, difficulty, question_text}.`;

export const getEvaluationPrompt = (questionText: string, answerText: string, level: string) => `
Question: ${questionText}
Candidate Answer: ${answerText}
Learner Level: ${level}
Evaluate strictly but adapt feedback tone to a ${level}-level learner.
`;

export const getSuggestedAnswerPrompt = (questionText: string, topic: string, level: string) => `
Provide a model/ideal answer for this interview question at ${level} level:
Question: ${questionText}
Topic: ${topic}
INSTRUCTIONS:
1. Keep it clear, structured, and appropriate for a ${level}-level learner.
2. If the explanation involves a process, architecture, or complex flow, include a Mermaid.js diagram to visualize it.
Return a plain text ideal answer with embedded markdown and mermaid blocks.`;

export const WORKSPACE_SUGGESTION_PROMPT = (topic: string, weakTopics: string[], score: number) => `
Based on a technical interview for "${topic}" where the candidate scored ${score}%.
The candidate showed weaknesses or gaps in these areas: ${weakTopics.join(', ')}.

Generate a highly specific learning roadmap suggestion in JSON format:
{
    "title": "A compelling title for the roadmap",
    "goal": "A detailed 1-2 sentence goal focusing on bridging the identified gaps",
    "category": "Broad category (e.g., Backend, Frontend, DevOps)",
    "difficulty": "Suggested starting difficulty (Beginner, Medium, Hard, or Expert)"
}
Return JSON only.`;
