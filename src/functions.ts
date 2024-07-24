import { Driver } from "./drivers/driver"
import fs from "fs"

export const getUntrackedMigrations = async (driver: Driver, table: string, migrationsDir: string) => {
    const trackedMigrations = await driver.getMigrations(table, false)
    const localMigrations = fs.readdirSync(migrationsDir)
        .filter(name => name.includes('up', name.lastIndexOf('-'))) // filter out down migrations
        .map(name => name.slice(0, name.lastIndexOf('-'))) // remove "-up.sql" postfix
        .sort()

    const untrackedMigrations = []
    for (const localMigration of localMigrations)
        if (!trackedMigrations.includes(localMigration))
            untrackedMigrations.push(localMigration)
    
    return untrackedMigrations
}

export const plural = (len:number) => len === 1 ? '' : 's'