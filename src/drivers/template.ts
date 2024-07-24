import { Config } from "./driver"
import { ConnectDriver, Driver } from "./driver"

export const connectDriver: ConnectDriver = async (options: Config) => {
    return {
        disconnect: async () => {

        },
        createDatabase: async (databaseName: string) => {

        },
        createTable: async (tableName: string) => {

        },
        getMigrations: async (tableName: string) => {
            return []
        },
        applyMigration: async (tableName: string, migrationName: string, sql: string) => {

        },
        undoMigration: async (tableName: string, migrationName: string, sql: string) => {

        },
    } satisfies Driver
}