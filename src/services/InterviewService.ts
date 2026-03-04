import db from '../config/db';
import ai from './aiProviderFactory';
import { Difficulty, LearnerLevel } from '../enums/common';
import { EvaluationResult, QuestionData } from '../types/interview';
import {
    INTERVIEW_SYSTEM_PROMPT,
    EVALUATION_SYSTEM_PROMPT,
    SUGGESTED_ANSWER_SYSTEM_PROMPT,
    getFirstQuestionPrompt,
    getNextQuestionPrompt,
    getEvaluationPrompt,
    getSuggestedAnswerPrompt
} from '../prompts/interview';

class InterviewService {
    async startInterview(userId: string, config: { topic: string; difficulty: Difficulty; numQuestions: number; role?: string; learner_level?: LearnerLevel; jd?: string }) {
        const resume = await db('resumes').where({ user_id: userId }).orderBy('created_at', 'desc').first();
        const skills = resume?.parsed_skills?.skills || ['System Design', 'Data Structures', 'API Design'];
        const level = config.learner_level || LearnerLevel.PROFESSIONAL;

        if (!config.numQuestions || config.numQuestions <= 0) {
            throw new Error('Question count must be a positive number greater than 0');
        }

        // Fetch historic interview questions for this user and topic
        const dbHistory = await db('answers')
            .join('interviews', 'answers.interview_id', 'interviews.id')
            .join('questions', 'answers.question_id', 'questions.id')
            .where({ 'interviews.user_id': userId, 'interviews.topic': config.topic })
            .select('questions.question_text');

        const excludeList = dbHistory.map(h => h.question_text);

        const prompt = getFirstQuestionPrompt(
            config.role || 'Learner',
            level,
            config.topic,
            config.difficulty || Difficulty.MEDIUM,
            skills,
            config.jd,
            excludeList
        );

        const questionData: QuestionData = await ai.generate(prompt, INTERVIEW_SYSTEM_PROMPT, true, userId);

        const [interview] = await db('interviews').insert({
            user_id: userId,
            topic: config.topic,
            difficulty: config.difficulty || Difficulty.MEDIUM,
            num_questions: config.numQuestions,
            status: 'active',
            role: config.role || 'Learner',
            learner_level: level,
            job_description: config.jd || null,
        }).returning('*');

        const [question] = await db('questions').insert({
            topic: questionData.topic || config.topic,
            difficulty: questionData.difficulty || config.difficulty || Difficulty.MEDIUM,
            question_text: questionData.question_text || 'Explain your experience with technical concepts.',
        }).returning('*');

        return { interview, firstQuestion: question };
    }

    async verifyDebuggingSolution(questionId: string, solution: string, userId?: string) {
        // Implementation for debugging solution verification would go here
    }

    async answerQuestion(interviewId: string, questionId: string, answerText: string) {
        const interview = await db('interviews').where({ id: interviewId }).first();
        const userId = interview.user_id;
        const question = await db('questions').where({ id: questionId }).first();
        const level = interview.learner_level || LearnerLevel.PROFESSIONAL;

        // 1. Evaluate current answer
        const evalPrompt = getEvaluationPrompt(question.question_text, answerText, level);
        const evaluation: EvaluationResult = await ai.generate(evalPrompt, EVALUATION_SYSTEM_PROMPT, true, userId);

        // 2. Generate suggested answer
        const suggestedPrompt = getSuggestedAnswerPrompt(question.question_text, interview.topic, level);
        const suggestedAnswer = await ai.generate(suggestedPrompt, SUGGESTED_ANSWER_SYSTEM_PROMPT, false, userId);

        const [answer] = await db('answers').insert({
            interview_id: interviewId,
            question_id: questionId,
            answer_text: answerText,
            score: evaluation.score || 0,
            weakness_tag: evaluation.weakness_tag || 'critical',
            feedback: evaluation.feedback || 'System error during evaluation.',
            suggested_answer: typeof suggestedAnswer === 'string' ? suggestedAnswer : JSON.stringify(suggestedAnswer),
        }).returning('*');

        // 3. Check if we need more questions
        const answeredCount = await db('answers').where({ interview_id: interviewId }).count('id as count').first();
        const count = parseInt(answeredCount?.count as string || '0');

        let nextQuestion = null;
        if (count < interview.num_questions) {
            const history = await db('answers')
                .join('questions', 'answers.question_id', 'questions.id')
                .where({ interview_id: interviewId })
                .select('questions.question_text', 'answers.answer_text', 'answers.score', 'answers.weakness_tag');

            const historyText = history.map(h => `Q: ${h.question_text}\nA: ${h.answer_text}\nResult: ${h.weakness_tag} (Score ${h.score})`).join('\n---\n');

            // Fetch ALL historic questions for this user and topic across all interviews
            const globalHistory = await db('answers')
                .join('interviews', 'answers.interview_id', 'interviews.id')
                .join('questions', 'answers.question_id', 'questions.id')
                .where({ 'interviews.user_id': userId, 'interviews.topic': interview.topic })
                .select('questions.question_text');

            const fullExcludeList = [...new Set([...globalHistory.map(h => h.question_text), ...history.map(h => h.question_text)])];

            const nextPrompt = getNextQuestionPrompt(
                interview.role || 'Learner',
                level,
                interview.topic,
                interview.difficulty || Difficulty.MEDIUM,
                interview.job_description,
                historyText,
                fullExcludeList
            );

            const nextData: QuestionData = await ai.generate(nextPrompt, INTERVIEW_SYSTEM_PROMPT, true, userId);

            const [savedNext] = await db('questions').insert({
                topic: nextData.topic || interview.topic,
                difficulty: nextData.difficulty || interview.difficulty || Difficulty.MEDIUM,
                question_text: nextData.question_text || `Analyze the core implementation of ${interview.topic}.`,
            }).returning('*');

            nextQuestion = savedNext;
        } else {
            await db('interviews').where({ id: interviewId }).update({ status: 'completed' });
        }

        return { evaluation: answer, nextQuestion };
    }

    async getReport(interviewId: string) {
        const interview = await db('interviews').where({ id: interviewId }).first();
        const answers = await db('answers')
            .where({ interview_id: interviewId })
            .leftJoin('questions', 'answers.question_id', 'questions.id')
            .select(
                'answers.*',
                'questions.question_text',
                'questions.topic as question_topic',
                'questions.difficulty as question_difficulty'
            );

        const totalScore = answers.reduce((acc, curr) => acc + (curr.score || 0), 0);
        const maxPossible = (interview.num_questions || answers.length) * 3;
        const avgScore = maxPossible > 0 ? (totalScore / maxPossible) * 100 : 0;

        await db('interviews').where({ id: interviewId }).update({
            total_score: totalScore,
            readiness_score: Math.round(avgScore)
        });

        const weakTopics = answers
            .filter(a => (a.score || 0) < 2)
            .map(a => a.weakness_tag);

        const workspaceSuggestion = {
            title: `${interview.topic} Preparation Roadmap`,
            goal: `Master ${weakTopics.slice(0, 2).join(', ')} and improve overall depth in ${interview.topic}.`,
            category: interview.topic || 'General',
            difficulty: interview.difficulty || Difficulty.EXPERT
        };

        return {
            interview_id: interviewId,
            total_score: totalScore,
            readiness_score: Math.round(avgScore),
            answers,
            analytics: {
                weak_topics: [...new Set(weakTopics)],
                total_questions: answers.length,
                config: { topic: interview.topic, difficulty: interview.difficulty }
            },
            workspaceSuggestion
        };
    }

    async listSessions(userId: string) {
        return db('interviews')
            .where({ user_id: userId })
            .orderBy('created_at', 'desc')
            .select('id', 'topic', 'difficulty', 'status', 'total_score', 'readiness_score', 'num_questions', 'role', 'created_at');
    }
}

export default new InterviewService();
