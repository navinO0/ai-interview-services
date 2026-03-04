import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await knex.schema.createTable('users', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('email').unique().notNullable();
        table.string('password_hash').notNullable();
        table.string('name').notNullable();
        table.integer('experience_years').defaultTo(0);
        table.timestamps(true, true);
    });

    await knex.schema.createTable('resumes', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
        table.text('raw_text').notNullable();
        table.jsonb('parsed_skills');
        table.timestamps(true, true);
    });

    await knex.schema.createTable('interviews', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
        table.integer('total_score').defaultTo(0);
        table.integer('readiness_score').defaultTo(0);
        table.timestamps(true, true);
    });

    await knex.schema.createTable('questions', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.string('topic').notNullable();
        table.string('difficulty').notNullable();
        table.text('question_text').notNullable();
        table.timestamps(true, true);
    });

    await knex.schema.createTable('answers', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('interview_id').references('id').inTable('interviews').onDelete('CASCADE');
        table.uuid('question_id').references('id').inTable('questions').onDelete('CASCADE');
        table.text('answer_text').notNullable();
        table.integer('score');
        table.string('weakness_tag');
        table.text('feedback');
        table.timestamps(true, true);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('answers');
    await knex.schema.dropTableIfExists('questions');
    await knex.schema.dropTableIfExists('interviews');
    await knex.schema.dropTableIfExists('resumes');
    await knex.schema.dropTableIfExists('users');
}
