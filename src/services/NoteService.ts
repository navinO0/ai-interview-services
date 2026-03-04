import db from '../config/db';

class NoteService {
    async listNotes(userId: string) {
        return db('notes').where({ user_id: userId }).orderBy('updated_at', 'desc').select('*');
    }

    async getNote(id: string, userId: string) {
        return db('notes').where({ id, user_id: userId }).first();
    }

    async createNote(userId: string, data: { title?: string; content?: string; workspace_id?: string }) {
        const [note] = await db('notes').insert({
            user_id: userId,
            title: data.title || 'Untitled Note',
            content: data.content || '',
            workspace_id: data.workspace_id || null,
        }).returning('*');
        return note;
    }

    async updateNote(id: string, userId: string, data: { title?: string; content?: string }) {
        const [note] = await db('notes').where({ id, user_id: userId }).update({
            ...data,
            updated_at: db.fn.now(),
        }).returning('*');
        return note;
    }

    async deleteNote(id: string, userId: string) {
        return db('notes').where({ id, user_id: userId }).delete();
    }
}

export default new NoteService();
