import { ConnectDriver, Driver } from "./driver";
import { Client } from "pg"
import { Config } from "./driver"

export const connectDriver: ConnectDriver = async (options: Config) => {
    const client = new Client(options.url ?? {
        user: options.user,
        password: options.password,
        database: options.database,
        host: options.host,
        port: options.port
    })

    await client.connect()

    return {
        disconnect: () => {
            return client.end()
        },
        createDatabase: async (databaseName: string) => {
            await client.query(`CREATE DATABASE ${databaseName}`)
        },
        createTable: async (tableName: string) => {
            const createTableQuery = `
            CREATE TABLE IF NOT EXISTS ${tableName} (
                name varchar(255) NOT NULL PRIMARY KEY
            )`
            await client.query(createTableQuery)
        },
        getMigrations: async (tableName: string, reverse: boolean = false) => {
            if (!reverse)
                return (await client.query(`SELECT * FROM ${tableName} ORDER BY name`)).rows.map(r => r.name)
            else
                return (await client.query(`SELECT * FROM ${tableName} ORDER BY name DESC`)).rows.map(r => r.name)
        },
        applyMigration: async (tableName: string, migrationName: string, sql: string) => {
            try {
                await client.query("BEGIN")
                await client.query(`INSERT INTO ${tableName} (name) VALUES ($1)`, [migrationName])
                await client.query(sql);
                await client.query("COMMIT")
            } catch (err) {
                await client.query("ROLLBACK")
                throw err
            }
        },
        undoMigration: async (tableName: string, migrationName: string, sql: string) => {
            try {
                await client.query("BEGIN")
                await client.query(`DELETE FROM ${tableName} WHERE name = $1`, [migrationName])
                await client.query(sql);
                await client.query("COMMIT")
            } catch (err) {
                await client.query("ROLLBACK")
                throw err
            }
        },
    } satisfies Driver
}