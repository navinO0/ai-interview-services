import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('dsa_attempts', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
        table.uuid('question_id').references('id').inTable('questions').onDelete('CASCADE');
        table.string('language').notNullable();
        table.text('code').notNullable();
        table.boolean('is_correct').notNullable();
        table.text('feedback').notNullable();
        table.timestamps(true, true);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('dsa_attempts');
}
