import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    // Enable uuid-ossp extension if not already enabled
    await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await knex.schema.createTable('tech_jokes', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.text('content').notNullable();
        table.timestamps(true, true);
    });

    await knex.schema.createTable('office_politics_tips', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.text('content').notNullable();
        table.string('category').nullable();
        table.timestamps(true, true);
    });

    await knex.schema.createTable('dev_excellence_tips', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.text('content').notNullable();
        table.enum('type', ['DO', 'AVOID']).notNullable();
        table.timestamps(true, true);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('dev_excellence_tips');
    await knex.schema.dropTableIfExists('office_politics_tips');
    await knex.schema.dropTableIfExists('tech_jokes');
}
