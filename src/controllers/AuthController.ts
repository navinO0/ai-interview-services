import { Request, Response } from 'express';
import AuthService from '../services/AuthService';

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;
        const result = await AuthService.register(email, password, name);
        res.status(201).json(result);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const result = await AuthService.login(email, password);
        res.json(result);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};

export const getMe = async (req: Request, res: Response) => {
    try {
        const user = await AuthService.getUserById((req as any).user.id);
        res.json(user);
    } catch (err: any) {
        res.status(404).json({ error: 'User not found' });
    }
};
