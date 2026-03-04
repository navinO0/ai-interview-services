import { type Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('interviews', (table) => {
        table.text('job_description').nullable();
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('interviews', (table) => {
        table.dropColumn('job_description');
    });
}
