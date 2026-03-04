import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('workspaces', (table) => {
        table.string('learner_level').defaultTo('Professional');
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('workspaces', (table) => {
        table.dropColumn('learner_level');
    });
}
