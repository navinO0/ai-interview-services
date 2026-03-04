import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('user_ai_settings', (table) => {
        table.text('api_key').nullable();
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('user_ai_settings', (table) => {
        table.dropColumn('api_key');
    });
}
