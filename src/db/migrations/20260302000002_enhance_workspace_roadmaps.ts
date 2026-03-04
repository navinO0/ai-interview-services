import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('workspaces', (table) => {
        table.integer('target_days').defaultTo(10);
    });

    await knex.schema.alterTable('workspace_steps', (table) => {
        table.integer('day_number').nullable();
        table.jsonb('tasks').nullable(); // Array of tasks for that day: { type: 'theory' | 'mcq' | 'coding', title: string, content: string, status: 'pending' | 'completed' }
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('workspace_steps', (table) => {
        table.dropColumn('tasks');
        table.dropColumn('day_number');
    });

    await knex.schema.alterTable('workspaces', (table) => {
        table.dropColumn('target_days');
    });
}
