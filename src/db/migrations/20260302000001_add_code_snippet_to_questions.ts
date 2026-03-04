import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('questions', (table) => {
        // Only add if they don't exist (though in a clean migration they shouldn't)
        // Knex alterTable doesn't have a built-in 'ifNotExists' for columns easily in all dialects
        // but we can check or just assume based on our research.
        table.text('code_snippet').nullable();
        // Explanation might already exist from a previous migration, let's double check 20260227000000
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('questions', (table) => {
        table.dropColumn('code_snippet');
    });
}
