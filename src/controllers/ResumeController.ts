import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/auth';
import ResumeService from '../services/ResumeService';
const { PDFParse } = require('pdf-parse');

export const uploadResume = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Resume PDF file is required' });
        }

        const dataBuffer = req.file.buffer;
        const parser = new PDFParse({ data: dataBuffer });
        const pdfData = await parser.getText();
        const rawText = pdfData.text;
        await parser.destroy();

        const { jobDescription } = req.body;
        const result = await ResumeService.uploadAndParse(req.user!.id, rawText, jobDescription);
        res.status(201).json(result);
    } catch (err: any) {
        console.error('[ResumeController] Upload Error:', err);
        res.status(500).json({ error: err.message, stack: err.stack });
    }
};

export const getLatestResume = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const resume = await ResumeService.getLatestResume(req.user!.id);
        res.json(resume);
    } catch (err: any) {
        res.status(404).json({ error: 'Resume not found' });
    }
};
