import type { Knex } from 'knex'
import dotenv from 'dotenv'
import path from 'path'

// Load env directly to avoid complex imports during migration
dotenv.config()

const DB_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/interview_coach'

const config: { [key: string]: Knex.Config } = {
    development: {
        client: 'postgresql',
        connection: DB_URL,
        debug: process.env.LOG_DB_QUERIES === 'true',
        migrations: {
            directory: '../db/migrations',
            tableName: 'knex_migrations',
            extension: 'ts'
        },
        seeds: {
            directory: '../db/seeds',
            extension: 'ts'
        }
    },
    production: {
        client: 'postgresql',
        connection: DB_URL,
        debug: process.env.LOG_DB_QUERIES === 'true',
        migrations: {
            directory: '../db/migrations',
            tableName: 'knex_migrations',
            extension: 'ts'
        }
    }
};

export default config;
