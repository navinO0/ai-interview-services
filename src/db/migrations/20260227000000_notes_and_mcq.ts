import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    // Add learner_level to users
    await knex.schema.alterTable('users', (table) => {
        table.string('learner_level').defaultTo('Professional');
    });

    // Add suggested_answer to answers
    await knex.schema.alterTable('answers', (table) => {
        table.text('suggested_answer').nullable();
    });

    // Add explanation to questions (for MCQs)
    await knex.schema.alterTable('questions', (table) => {
        table.text('explanation').nullable();
    });

    // Notes table
    await knex.schema.createTable('notes', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
        table.uuid('workspace_id').references('id').inTable('workspaces').onDelete('SET NULL').nullable();
        table.string('title').notNullable().defaultTo('Untitled Note');
        table.text('content').defaultTo('');
        table.timestamps(true, true);
    });

    // MCQ attempts table
    await knex.schema.createTable('mcq_attempts', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
        table.uuid('question_id').references('id').inTable('questions').onDelete('CASCADE').notNullable();
        table.string('selected_option').notNullable();
        table.boolean('is_correct').notNullable().defaultTo(false);
        table.text('explanation').nullable();
        table.timestamps(true, true);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('mcq_attempts');
    await knex.schema.dropTableIfExists('notes');

    await knex.schema.alterTable('questions', (table) => {
        table.dropColumn('explanation');
    });

    await knex.schema.alterTable('answers', (table) => {
        table.dropColumn('suggested_answer');
    });

    await knex.schema.alterTable('users', (table) => {
        table.dropColumn('learner_level');
    });
}
