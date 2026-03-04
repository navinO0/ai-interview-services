import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('workspaces', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
        table.string('title').notNullable();
        table.text('goal').notNullable();
        table.string('category').notNullable();
        table.string('difficulty').notNullable();
        table.integer('progress').defaultTo(0);
        table.string('color').notNullable();
        table.text('notes').defaultTo('');
        table.timestamp('last_accessed_at').defaultTo(knex.fn.now());
        table.timestamps(true, true);
    });

    await knex.schema.createTable('workspace_steps', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('workspace_id').references('id').inTable('workspaces').onDelete('CASCADE').notNullable();
        table.string('title').notNullable();
        table.text('description');
        table.boolean('completed').defaultTo(false);
        table.integer('estimated_days').defaultTo(1);
        table.integer('order_index').notNullable();
        table.timestamps(true, true);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('workspace_steps');
    await knex.schema.dropTableIfExists('workspaces');
}

