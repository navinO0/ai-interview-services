import db from '../config/db';
import ai from './aiProviderFactory';

export interface ResumeParsed {
    skills: string[];
    experience_years: number;
    strengths: string[];
    missing_topics: string[];
    suggestions: string[];
    interview_questions: string[];
}

class ResumeService {
    async uploadAndParse(userId: string, rawText: string, jobDescription?: string): Promise<any> {
        const prompt = `
      Analyze this resume text and provide a comprehensive evaluation for a software engineering role.
      ${jobDescription ? `Compare it specifically against this Job Description: ${jobDescription}` : ''}
      
      Resume Text: ${rawText}

      Evaluate based on:
      1. ATS Compatibility (0-100)
      2. Section-wise scoring (Summary, Skills, Experience, Projects, Education)
      3. Keyword matching ${jobDescription ? '(against JD)' : '(against industry standards)'}
      4. Skill gap analysis (Technical and Soft skills)
      5. Grammar and formatting review
      6. Impact measurement (Quantified achievements)
      7. Recruiter view (Red flags, 10-second impression)
      
      CRITICAL: Use a standardized scoring rubric. An ATS score of 80 must represent a high-tier professional resume with quantified impact. Be consistent across similar resumes.
    `;

        const systemPrompt = `You are a world-class technical recruiter and ATS specialist. Return JSON only.
        Structure:
        {
          "ats_score": number,
          "section_scores": { "summary": number, "skills": number, "experience": number, "projects": number, "education": number },
          "skills": string[],
          "experience_years": number,
          "strengths": string[],
          "missing_topics": string[],
          "suggestions": string[],
          "interview_questions": string[],
          "grammar_formatting": { "score": number, "issues": string[] },
          "impact_measurement": { "score": number, "feedback": string[] },
          "recruiter_view": { "impression": string, "red_flags": string[], "strong_points": string[] },
          "job_match": { "score": number, "missing_keywords": string[] },
          "section_improvements": {
            "summary": "Specific suggestion",
            "skills": "Specific suggestion",
            "experience": "Specific suggestion",
            "projects": "Specific suggestion",
            "education": "Specific suggestion"
          }
        }
        Strict JSON format.`;

        const parsed = await ai.generate(prompt, systemPrompt, true);

        const [resume] = await db('resumes').insert({
            user_id: userId,
            raw_text: rawText,
            parsed_skills: parsed
        }).returning('*');

        // Update user experience years if found
        if (parsed.experience_years) {
            await db('users').where({ id: userId }).update({ experience_years: parsed.experience_years });
        }

        return { ...resume, parsed };
    }

    async getLatestResume(userId: string) {
        return db('resumes').where({ user_id: userId }).orderBy('created_at', 'desc').first();
    }
}

export default new ResumeService();
