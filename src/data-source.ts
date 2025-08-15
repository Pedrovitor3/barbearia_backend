import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as path from 'path';

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'bigode',
    password: '66c2v_5O2TSZ',
    database: 'bigode',
    synchronize: false,
    logging: false,
    entities: [path.join(__dirname, '/entity/**/*.ts')],
    migrations: ['src/migrations/**/*.ts'],
    subscribers: [],
});
