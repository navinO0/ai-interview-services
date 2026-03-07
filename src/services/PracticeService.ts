import db from '../config/db';
import ai from './aiProviderFactory';

export interface GeneratedChallenge {
    topic: string;
    difficulty: string;
    question_text: string;
    category: string;
    challenge_type: 'MCQ' | 'DEBUGGING';
    options?: string[];
    correct_option?: string;
    explanation?: string;
    code_snippet?: string;
}

class PracticeService {
    async generateChallenges(topic: string, type: 'MCQ' | 'CODING', difficulty: string, count: number = 5, learnerLevel: string = 'Professional', userId?: string) {
        console.log(`Generating ${count} ${type} challenges for ${topic} (${difficulty})...`);

        // Fetch historic questions to exclude
        let excludeList: string[] = [];
        if (userId) {
            const dbHistory = await db('mcq_attempts')
                .join('questions', 'mcq_attempts.question_id', 'questions.id')
                .where({ 'mcq_attempts.user_id': userId, 'questions.category': topic })
                .select('questions.question_text');
            excludeList = dbHistory.map(h => h.question_text);
        }

        const excludePrompt = excludeList.length > 0
            ? `\nSTRICTLY EXCLUDE these previous questions: ${JSON.stringify(excludeList.slice(-20))}`
            : '';

        const prompt = type === 'MCQ'
            ? `Generate exactly ${count} Multiple Choice Questions for the topic: "${topic}".
               Difficulty: ${difficulty}
               Learner Level: ${learnerLevel} – adapt vocabulary and depth accordingly.
               Format: Respond ONLY with a raw JSON array of objects. 
               Each object must use these exact keys: {"topic", "difficulty", "question_text", "options", "correct_option", "explanation"}.
               "options" must be an array of 4 strings. "correct_option" must be one of the strings in the "options" array.
               "explanation" must be a 2-3 sentence explanation of why the correct answer is right.
               ${excludePrompt}
               JSON only, no markdown, no wrapping keys.`
            : `Generate exactly ${count} algorithmic Data Structures and Algorithms (DSA) coding challenges for the topic: "${topic}".
               Difficulty: ${difficulty} (LeetCode style).
               Learner Level: ${learnerLevel}.
               
               INSTRUCTIONS:
               1. "question_text" MUST be formatted in Markdown.
               2. Include a clear problem description, constraints, and edge cases.
               3. You MUST provide exactly TWO (2) concrete examples.
               4. Each example MUST be clearly labeled as "Example 1:" and "Example 2:".
               5. Each example MUST specify "Input:" and "Output:" followed by a brief explanation if needed.
               6. "code_snippet" MUST be the initial function signature template.
               7. "explanation" should describe the optimal approach time/space complexity.

               Format: Respond ONLY with a raw JSON array of objects.
               Each object must use these exact keys: {"topic", "difficulty", "question_text", "code_snippet", "explanation"}.
               JSON only, no markdown wrapping, no text before or after the JSON.`;

        const systemPrompt = `You are a strict JSON generator for technical practice questions. 
        You MUST return a raw JSON array. 
        DO NOT include markdown code blocks. 
        DO NOT wrap the array in an object or key.`;

        try {
            let result = await ai.generate(prompt, systemPrompt, true, userId);
            console.log(`[AI Result] Generated ${type} result:`, JSON.stringify(result).substring(0, 500) + '...');

            if (result && !Array.isArray(result) && typeof result === 'object') {
                const keys = Object.keys(result);
                if (keys.length === 1 && Array.isArray(result[keys[0]])) {
                    result = result[keys[0]];
                }
            }

            const challenges = Array.isArray(result) ? result : [result];

            const questionsToInsert = challenges
                .filter(c => c && (c.question_text || c.question))
                .map((c: any) => ({
                    topic: c.topic || topic,
                    difficulty: c.difficulty || difficulty,
                    question_text: (c.question_text || c.question || '').includes('```')
                        ? (c.question_text || c.question)
                        : (type === 'CODING' && c.code_snippet
                            ? `${c.question_text || c.question}\n\n\`\`\`\n${c.code_snippet}\n\`\`\``
                            : (c.question_text || c.question)),
                    category: topic,
                    challenge_type: type,
                    options: type === 'MCQ' ? JSON.stringify(c.options || []) : null,
                    correct_option: type === 'MCQ' ? (c.correct_option || c.answer) : null,
                    explanation: c.explanation || null,
                    code_snippet: type === 'CODING' ? (c.code_snippet || '') : null
                }));

            if (questionsToInsert.length === 0) {
                throw new Error('AI failed to generate valid challenge structure');
            }

            const inserted = await db('questions').insert(questionsToInsert).returning('*');

            return inserted.map(q => ({
                ...q,
                options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : null
            }));
        } catch (error: any) {
            console.error('Practice Generation Error:', error);
            console.error('Error Details:', {
                message: error.message,
                stack: error.stack,
                topic,
                type,
                difficulty,
                userId
            });
            throw new Error(`Failed to generate practice challenges: ${error.message}`);
        }
    }

    async getOrGenerateChallenges(category: string, type: string, difficulty: string, count: number = 5, learnerLevel: string = 'Professional', userId?: string) {
        let challenges = await db('questions')
            .where({ category, challenge_type: type })
            .select('*');

        if (challenges.length < count) {
            const more = await db('questions')
                .where('category', 'ilike', `%${category}%`)
                .where({ challenge_type: type })
                .select('*');

            const ids = new Set(challenges.map(c => c.id));
            more.forEach(m => {
                if (!ids.has(m.id)) challenges.push(m);
            });
        }

        if (challenges.length < count) {
            const generated = await this.generateChallenges(category, type as any, difficulty, count - challenges.length, learnerLevel, userId);
            challenges = [...challenges, ...generated];
        }

        return challenges
            .filter(q => q && (type === 'MCQ' ? (q.options && (Array.isArray(q.options) || (typeof q.options === 'string' && q.options.length > 2))) : true))
            .map(q => ({
                ...q,
                options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : null
            }));
    }

    async persistMcqAttempt(userId: string, questionId: string, selectedOption: string) {
        const question = await db('questions').where({ id: questionId }).first();
        if (!question) throw new Error('Question not found');

        const isCorrect = question.correct_option === selectedOption;

        // If explanation is missing, generate it
        let explanation = question.explanation;
        if (!explanation) {
            const genExplanation = await ai.generate(
                `Explain why "${question.correct_option}" is the correct answer to this question:\n"${question.question_text}"\nOptions: ${question.options}\nProvide a clear 2-3 sentence explanation.`,
                'You are an expert educator. Be concise and clear.',
                false,
                userId
            );
            explanation = typeof genExplanation === 'string' ? genExplanation : JSON.stringify(genExplanation);
            // Cache it on the question
            await db('questions').where({ id: questionId }).update({ explanation });
        }

        const [attempt] = await db('mcq_attempts').insert({
            user_id: userId,
            question_id: questionId,
            selected_option: selectedOption,
            is_correct: isCorrect,
            explanation,
        }).returning('*');

        return {
            attempt,
            isCorrect,
            correctOption: question.correct_option,
            explanation,
        };
    }

    async getMcqHistory(userId: string) {
        return db('mcq_attempts')
            .where({ 'mcq_attempts.user_id': userId })
            .leftJoin('questions', 'mcq_attempts.question_id', 'questions.id')
            .select(
                'mcq_attempts.*',
                'questions.question_text',
                'questions.topic',
                'questions.difficulty',
                'questions.options',
                'questions.correct_option',
            )
            .orderBy('mcq_attempts.created_at', 'desc')
            .limit(50);
    }

    async getDsaHistory(userId: string) {
        return db('dsa_attempts')
            .where({ 'dsa_attempts.user_id': userId })
            .leftJoin('questions', 'dsa_attempts.question_id', 'questions.id')
            .select(
                'dsa_attempts.*',
                'questions.question_text',
                'questions.topic',
                'questions.difficulty',
                'questions.code_snippet',
            )
            .orderBy('dsa_attempts.created_at', 'desc')
            .limit(50);
    }

    async generateSingleAdaptiveMCQ(topic: string, difficulty: string, learnerLevel: string = 'Professional', userId: string, sessionHistory: { question: string, is_correct: boolean, selected_option?: string }[] = []) {
        console.log(`[PracticeService v2] Generating adaptive MCQ for ${topic} (${difficulty}). Session history height: ${sessionHistory.length}.`);

        // Fetch ALL historic questions for this user and topic from DB
        const dbHistory = await db('mcq_attempts')
            .join('questions', 'mcq_attempts.question_id', 'questions.id')
            .where({ 'mcq_attempts.user_id': userId, 'questions.category': topic })
            .select('questions.question_text');

        const historicTexts = dbHistory.map(h => h.question_text);
        const combinedHistory = [...new Set([...historicTexts, ...sessionHistory.map(s => s.question)])];

        const historyContext = combinedHistory.length > 0
            ? `Previously asked questions (STRICTLY EXCLUDE THESE):
               ${combinedHistory.slice(-20).map((q, i) => `${i + 1}. "${q}"`).join('\n')}`
            : 'This is the first time the user is practicing this specific topic.';

        const performanceContext = sessionHistory.length > 0
            ? `Performance in current session:
               ${sessionHistory.map((h, i) => `Question ${i + 1}: ${h.is_correct ? 'CORRECT' : 'INCORRECT'} (Reason: ${h.selected_option || 'None'})`).join('\n')}`
            : '';

        const prompt = `Generate exactly ONE Multiple Choice Question for the topic: "${topic}".
               Current Difficulty Target: ${difficulty}
               Learner Level: ${learnerLevel}
               
               CONTEXT:
               ${historyContext}
               ${performanceContext}

               IMPORTANT RULES (STRICT ENFORCEMENT):
               1. DO NOT repeat any of the previous questions listed above. This is CRITICAL.
               2. DO NOT treat this as a tutorial, lesson, or conversational interaction. No "Hello", "Now that...", or "For our next...".
               3. DO NOT ASK "WHAT IS THE NEXT STEP" or "WHAT WOULD YOU DO NEXT". This is a major failure.
               4. Every question must be a PURE TECHNICAL ASSESSMENT of the topic: "${topic}". 
               5. Questions MUST be standalone. Imagine the user seeing this question in total isolation.
               6. NO sequencing phrases. NO conversational filler. NO "lesson student" tone.
               7. If the user struggled (INCORRECT) previously, provide a concept-validation question for "${topic}".

               Format: Respond ONLY with a raw JSON object. 
               Object must use these exact keys: {"topic", "difficulty", "question_text", "options", "correct_option", "explanation"}.
               "options" must be an array of 4 strings. "correct_option" must be one of the strings in the "options" array.
               JSON only, no markdown.`;

        const systemPrompt = `You are a strict JSON generator for technical practice questions. 
        You MUST return a raw JSON object. 
        DO NOT include markdown code blocks.`;

        try {
            const result = await ai.generate(prompt, systemPrompt, true, userId);

            let q = result;

            // Handle wrapper objects
            if (q && !q.question_text && !q.question) {
                const possibleObj = Object.values(q).find(v => v && typeof v === 'object' && ((v as any).question_text || (v as any).question));
                if (possibleObj) q = possibleObj as any;
            }

            const questionText = q?.question_text || q?.question;

            const questionToInsert = {
                topic: (q?.topic || topic.split(' on ').pop()?.replace('.', '') || topic).substring(0, 255),
                difficulty: q?.difficulty || difficulty,
                question_text: (questionText && typeof questionText === 'string' && questionText.trim()) ? questionText : `Technical assessment of ${topic}`,
                category: topic,
                challenge_type: 'MCQ' as const,
                options: JSON.stringify(q?.options && Array.isArray(q.options) && q.options.length > 0 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D']),
                correct_option: (q?.correct_option || q?.answer || 'Option A').toString(),
                explanation: (q?.explanation && typeof q.explanation === 'string') ? q.explanation : `Concept validation for ${topic}.`,
            };

            console.log('[PracticeService] Inserting question keys:', Object.keys(questionToInsert));
            const [inserted] = await db('questions').insert(questionToInsert).returning('*');

            return {
                ...inserted,
                options: inserted.options ? (typeof inserted.options === 'string' ? JSON.parse(inserted.options) : inserted.options) : null
            };
        } catch (error: any) {
            console.error('Adaptive MCQ Generation Error:', error);
            throw new Error('Failed to generate adaptive MCQ');
        }
    }

    async verifyCodingSolution(questionId: string, solution: string, language: string, userId?: string) {
        const question = await db('questions').where({ id: questionId }).first();
        if (!question) throw new Error('Question not found');

        const prompt = `
            Act as an expert compiler and tech interviewer evaluating a Data Structures & Algorithms solution.
            Problem Statement:
            ${question.question_text}
            
            User's Code Solution (${language}):
            ${solution}
            
            Evaluate this code for:
            1. Correctness (does it solve the problem and handle edge cases?)
            2. Efficiency (Big O time and space complexity).
            
            Return ONLY a JSON object with: 
            { "isCorrect": boolean, "feedback": string }
            "feedback" should be 2-3 sentences max. If correct, praise the efficiency. If incorrect, point out the failing logic or edge case without giving away the exact code answer.
        `;

        const result = await ai.generate(prompt, 'You are an elite code reviewer evaluating competitive programming solutions. Return strict JSON only.', true, userId);
        const feedbackResult = {
            isCorrect: !!result.isCorrect,
            feedback: result.feedback || (result.isCorrect ? 'All test cases passed optimally!' : 'Solution failed on edge cases.')
        };

        if (userId) {
            await db('dsa_attempts').insert({
                user_id: userId,
                question_id: questionId,
                language: language,
                code: solution,
                is_correct: feedbackResult.isCorrect,
                feedback: feedbackResult.feedback
            });
        }

        return feedbackResult;
    }
}

export default new PracticeService();
