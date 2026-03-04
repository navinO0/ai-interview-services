import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth';
import NoteService from '../services/NoteService';

export const listNotes = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const notes = await NoteService.listNotes(req.user!.id);
        res.json(notes);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getNote = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const note = await NoteService.getNote(req.params.id, req.user!.id);
        if (!note) return res.status(404).json({ error: 'Note not found' });
        res.json(note);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const createNote = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const note = await NoteService.createNote(req.user!.id, req.body);
        res.status(201).json(note);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const updateNote = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const note = await NoteService.updateNote(req.params.id, req.user!.id, req.body);
        if (!note) return res.status(404).json({ error: 'Note not found' });
        res.json(note);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteNote = async (req: AuthenticatedRequest, res: Response) => {
    try {
        await NoteService.deleteNote(req.params.id, req.user!.id);
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};
