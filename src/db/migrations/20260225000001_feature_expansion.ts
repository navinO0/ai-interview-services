import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    // Modify questions table
    await knex.schema.alterTable('questions', (table) => {
        table.string('category').defaultTo('backend');
        table.string('challenge_type').defaultTo('interview'); // MCQ, CODING, DEBUGGING, interview
        table.jsonb('test_cases').nullable();
        table.jsonb('options').nullable(); // For MCQs
        table.string('correct_option').nullable();
    });

    // Create learning_paths table
    await knex.schema.createTable('learning_paths', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('title').notNullable();
        table.text('description');
        table.string('category').notNullable();
        table.string('level').defaultTo('beginner');
        table.jsonb('steps').notNullable(); // { title: string, content: string, questions: uuid[] }
        table.timestamps(true, true);
    });

    // Create user_progress table
    await knex.schema.createTable('user_progress', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
        table.uuid('path_id').references('id').inTable('learning_paths').onDelete('CASCADE');
        table.jsonb('completed_steps').defaultTo('[]');
        table.integer('score').defaultTo(0);
        table.timestamps(true, true);
    });

    // Create messages table for AI Chat
    await knex.schema.createTable('chat_messages', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
        table.string('role').notNullable(); // user, assistant
        table.text('content').notNullable();
        table.timestamps(true, true);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('chat_messages');
    await knex.schema.dropTableIfExists('user_progress');
    await knex.schema.dropTableIfExists('learning_paths');
    await knex.schema.alterTable('questions', (table) => {
        table.dropColumn('category');
        table.dropColumn('challenge_type');
        table.dropColumn('test_cases');
        table.dropColumn('options');
        table.dropColumn('correct_option');
    });
}
