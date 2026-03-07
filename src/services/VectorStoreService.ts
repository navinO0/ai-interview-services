import db from '../config/db';
import ai from './aiProviderFactory';
import pino from 'pino';

const logger = pino();

class VectorStoreService {
    async addDocument(documentId: string, content: string, metadata: any = {}) {
        try {
            const embedding = await ai.embed(content);
            await db('document_chunks').insert({
                document_id: documentId,
                content,
                embedding: JSON.stringify(embedding), // pgvector handles array-like strings or raw arrays depending on driver
                metadata: JSON.stringify(metadata)
            });
            logger.info({ documentId }, 'Document chunk added to vector store');
        } catch (error) {
            logger.error({ error, documentId }, 'Failed to add document to vector store');
            throw error;
        }
    }

    async search(query: string, limit: number = 5) {
        try {
            const queryEmbedding = await ai.embed(query);
            const queryEmbeddingStr = `[${queryEmbedding.join(',')}]`;

            const results = await db.raw(`
                SELECT content, metadata, (embedding <=> ?::vector) as distance
                FROM document_chunks
                ORDER BY distance ASC
                LIMIT ?
            `, [queryEmbeddingStr, limit]);

            return results.rows;
        } catch (error) {
            logger.error({ error, query }, 'FAILED to search in vector store');
            return [];
        }
    }
}

export default new VectorStoreService();
