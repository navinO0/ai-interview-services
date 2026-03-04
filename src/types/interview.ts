export interface EvaluationResult {
    score: number;
    weakness_tag: 'strong' | 'weak-depth' | 'conceptual-gap' | 'critical';
    feedback: string;
}

export interface QuestionData {
    topic: string;
    difficulty: string;
    question_text: string;
}
