export const INTERVIEW_SYSTEM_PROMPT = `You are an expert technical interviewer. 
Return JSON only based on this structure: {
    "topic": "topic",
    "difficulty": "difficulty",
    "question_text": "detailed question text with context"
}. 
Strict JSON format enforcement. 
Ensure questions are scenario-based, provide sufficient context, and evaluate technical depth, not just definitions.`;

export const EVALUATION_SYSTEM_PROMPT = `You are an expert interviewer. Return JSON only based on this structure: {
    "score": 3, 
    "weakness_tag": "strong", 
    "feedback": "explanation"
}. Strict JSON format enforcement.`;

export const SUGGESTED_ANSWER_SYSTEM_PROMPT = 'You are an expert educator. Provide a clear, well-structured ideal answer.';

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
Keep it clear, structured, and appropriate for a ${level}-level learner.
Return a plain text ideal answer (not JSON).`;
