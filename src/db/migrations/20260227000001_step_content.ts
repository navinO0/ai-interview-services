import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    // Add content column to workspace_steps for caching generated markdown content
    await knex.schema.alterTable('workspace_steps', (table) => {
        table.text('content').nullable();
    });

    // Add learner_level column to interviews for per-session learner level tracking
    await knex.schema.alterTable('interviews', (table) => {
        table.string('learner_level').defaultTo('Professional');
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('interviews', (table) => {
        table.dropColumn('learner_level');
    });
    await knex.schema.alterTable('workspace_steps', (table) => {
        table.dropColumn('content');
    });
}
