import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    // 1. Update workspaces to include status and generation metadata
    await knex.schema.alterTable('workspaces', (table) => {
        table.enum('status', ['queued', 'processing', 'completed', 'failed']).defaultTo('completed'); // Default to completed for existing ones
        table.integer('generation_progress').defaultTo(100);
        table.text('error_log').nullable();
    });

    // 2. Create cached_roadmaps table for reuse and future semantic search
    await knex.schema.createTable('cached_roadmaps', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('topic_fingerprint').unique().notNullable(); // Hash of topic + difficulty + level
        table.string('title').notNullable();
        table.text('goal').notNullable();
        table.string('category').notNullable();
        table.string('difficulty').notNullable();
        table.string('learner_level').notNullable();
        table.jsonb('steps_structure').notNullable(); // Compressed steps JSON
        table.timestamps(true, true);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('cached_roadmaps');

    await knex.schema.alterTable('workspaces', (table) => {
        table.dropColumn('error_log');
        table.dropColumn('generation_progress');
        table.dropColumn('status');
    });
}
