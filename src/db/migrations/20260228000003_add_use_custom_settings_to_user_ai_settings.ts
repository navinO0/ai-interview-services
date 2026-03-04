import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.table('user_ai_settings', (table) => {
        table.boolean('use_custom_settings').defaultTo(false);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.table('user_ai_settings', (table) => {
        table.dropColumn('use_custom_settings');
    });
}
