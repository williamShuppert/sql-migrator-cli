export const getDriver = async (driver: string, options: Config): Promise<Driver> => {
    const { connectDriver }: { connectDriver: ConnectDriver } = await import(`./${driver}.ts`)
    return connectDriver(options)
}

export type ConnectDriver = (options: any) => Promise<Driver>

export interface Driver {
    disconnect: () => Promise<void>
    createDatabase: (databaseName: string) => Promise<void>
    createTable: (tableName: string) => Promise<void>
    getMigrations: (tableName: string, reverse: boolean) => Promise<string[]>
    applyMigration: (tableName: string, migrationName: string, sql: string) => Promise<void>
    undoMigration: (tableName: string, migrationName: string, sql: string) => Promise<void>
}

export interface Config {
    driver: string
    table: string
    database: string
    migrationsDir: string
    host: string
    password: string
    port: string
    user: string
    url: string
}