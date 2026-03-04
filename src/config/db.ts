import knex from 'knex';
import type { Knex } from 'knex';
import knexConfig from './knexfile';
import config from './env';

const environment = config.env;
const db: Knex = knex(knexConfig[environment]);

export default db;
