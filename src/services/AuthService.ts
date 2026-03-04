import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from '../config/db';
import config from '../config/env';

const JWT_SECRET = config.jwt.secret;

export interface User {
    id: string;
    email: string;
    name: string;
    experience_years?: number;
}

class AuthService {
    async register(email: string, password: string, name: string): Promise<{ user: User, token: string }> {
        const password_hash = await bcrypt.hash(password, 10);
        const [user] = await db('users').insert({
            email,
            password_hash,
            name
        }).returning(['id', 'email', 'name']);

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

        return { user, token };
    }

    async login(email: string, password: string): Promise<{ user: User, token: string }> {
        const user = await db('users').where({ email }).first();
        if (!user) throw new Error('Invalid credentials');

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) throw new Error('Invalid credentials');

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        return {
            user: { id: user.id, email: user.email, name: user.name },
            token
        };
    }

    async getUserById(id: string): Promise<User | undefined> {
        return db('users').where({ id }).first(['id', 'email', 'name', 'experience_years']);
    }
}

export default new AuthService();
