import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('interviews', (table) => {
        table.string('topic').nullable();
        table.string('difficulty').nullable();
        table.integer('num_questions').defaultTo(5);
        table.string('status').defaultTo('active'); // active, completed
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('interviews', (table) => {
        table.dropColumn('topic');
        table.dropColumn('difficulty');
        table.dropColumn('num_questions');
        table.dropColumn('status');
    });
}

