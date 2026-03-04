import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('user_ai_settings', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').unique();
        table.string('provider').notNullable().defaultTo('ollama');
        table.string('model_name').notNullable().defaultTo('llama3');
        table.boolean('setup_completed').defaultTo(false);
        table.timestamps(true, true);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('user_ai_settings');
}
