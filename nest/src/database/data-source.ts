import 'dotenv/config';

import { DataSource } from 'typeorm';

import { Task } from '../tasks/entities/task.entity';

export default new DataSource({
    type: 'postgres',

    host: process.env.DB_HOST,

    port: Number(process.env.DB_PORT),

    username: process.env.DB_USERNAME,

    password: process.env.DB_PASSWORD,

    database: process.env.DB_DATABASE,

    entities: [Task],

    migrations: ['src/database/migrations/*.ts'],
});