import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw('CREATE EXTENSION IF NOT EXISTS vector');

    await knex.schema.createTable('document_chunks', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('document_id').notNullable();
        table.text('content').notNullable();
        table.specificType('embedding', 'vector(1536)'); // Using 1536 for OpenAI embeddings, can be adjusted for Gemini/Ollama
        table.jsonb('metadata').defaultTo('{}');
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });

    await knex.raw('CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)');
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('document_chunks');
    await knex.raw('DROP EXTENSION IF EXISTS vector');
}

