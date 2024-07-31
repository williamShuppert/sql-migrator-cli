#!/usr/bin/env node

import dotenv from 'dotenv'
import { program } from 'commander'
import { getDriver } from './drivers/driver'
import fs from 'fs'
import path from 'path'
import { Driver } from './drivers/driver'
import { getUntrackedMigrations, plural } from './functions'
import * as pack from '../package.json'


// Save driver state between subprograms
let driver: Driver | undefined


// Configure specified .env file
let i = process.argv.indexOf('-e')
if (i === -1) i = process.argv.indexOf('--env')
dotenv.config({ path: i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : '.env' })


// Read config file
i = process.argv.indexOf('-c')
if (i === -1) i = process.argv.indexOf('--config')
let configPath = i !== -1 && process.argv[i + 1] ? process.argv[i + 1]! : "migrations.json"
const config = fs.existsSync(path.join(process.cwd(), configPath))
    ? JSON.parse(fs.readFileSync(path.join(process.cwd(), configPath), "utf8"))
    : {}


// Populate the config json file with environment variables and defaults
const configDefaults: {[id: string]: any} = {
    driver: undefined,
    database: undefined,
    host: undefined,
    password: undefined,
    port: undefined,
    user: undefined,
    url: undefined,
    table: 'migrations',
    migrationsDir: './migrations'
}

for (let key in configDefaults) {
    if (config[key]?.env)
        config[key] = process.env[config[key].env]
    if (config[key] === undefined)
        config[key] = configDefaults[key]
}


program
    .name("sql-migrator-cli")
    .description("")
    .version(pack.version)
    .option("-e, --env <path>", "environment path", ".env")
    .option("-c, --config <path>", "config path", "migrations.json")

program
    .command("config")
    .description("show all config values being used")
    .action(() => {
        console.log(config)
    })

program
    .command("gen")
    .description("generate migration files")
    .argument("<migration-name>", "name of migration")
    .option("-o, --out <path>", "output path for generated migration files", config.migrationsDir)
    .action((args, opts) => {
        if (!fs.existsSync(opts.out))
            program.error(`error: -o, --out "${opts.out}" could not be found`)

        // Generate migration name based on date: YYYYMMDDHHMMSS-migration_name-<up|down>.sql
        const now = new Date();
        const pad = (num: number) => num.toString().padStart(2, '0')

        const year = now.getFullYear()
        const month = pad(now.getMonth() + 1)
        const day = pad(now.getDate())
        const hours = pad(now.getHours())
        const minutes = pad(now.getMinutes())
        const seconds = pad(now.getSeconds())
        const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`        

        fs.writeFileSync(path.join(opts.out, `${timestamp}-${args}-up.sql`), `-- ${args}-up`)
        fs.writeFileSync(path.join(opts.out, `${timestamp}-${args}-down.sql`), `-- ${args}-down`)
    })

const db = program.command("db")
    .description("sets up a database connection")
    .option("-d, --driver <name>", "database driver", config.driver)
    .option("--url <value>", "database connection url", config.url)
    .option("--host <name>", "database host", config.host)
    .option("-p, --port <value>", "database port", config.port)
    .option("-db, --database <name>", "database name", config.database)
    .option("-u, --user <name>", "the user for the database", config.user)
    .option("-pw, --password <value>", "the password for the database user", config.password)
    .hook('preAction', async (cmd, action) => {
        const opts = {...cmd.opts()}

        if (!['pg'].includes(opts.driver))
            program.error(`error: -d, --driver "${opts.driver}" is invalid`)

        // remove database name from options if the second command is to create a database
        if (action.name() === "create")
            delete opts.database

        driver = await getDriver(opts.driver, opts as any)
    })
    .hook('postAction', async () => {
        await driver?.disconnect()
    })

db.command("create")
    .argument("[name]", "table name", 'migrations')
    .description("create a database with migration table")
    .action(async (database, _, actionCmd) => {
        if (!driver) return
        const opts = actionCmd.parent.opts()
        await driver.createDatabase(opts.database)
        await driver.disconnect()
        driver = await getDriver(opts.driver, opts) // create new client using new database
        await driver.createTable(opts.table)
    })

db.command("create:table")
    .argument("[name]", "table name", 'migrations')
    .description("create a table for migrations")
    .action(async (arg) => {
        if (!driver) return
        await driver.createTable(arg)
        console.log(`created table "${arg}"`)
    })

db.command("up")
    .description("apply all migrations")
    .argument("[table]", "name of migrations table", config.table)
    .option("-f, --files <path>", "path to migration files", config.migrationsDir)
    .action(async (table, options) => {
        if (!driver) return
        const { files } = options

        if (!fs.existsSync(files))
            program.error(`error: -f, --files "${files}" could not be found`)

        const untrackedMigrations = await getUntrackedMigrations(driver, table, files)
        if (untrackedMigrations.length === 0) {
            console.log('all migrations are already applied')
            return
        }

        let i = 0
        try {
            for (const migration of untrackedMigrations) {
                const sql = fs.readFileSync(path.join(files, migration + "-up.sql"), "utf-8")
                await driver.applyMigration(table, migration, sql)
                i += 1
            }
            console.log(`${i} migration${plural(untrackedMigrations.length)} applied successfully`)
        } catch (err) {
            console.log(`${i} migration${plural(i)} completed (of ${untrackedMigrations.length} total)`)
            console.log(` - failed migration: "${untrackedMigrations[i]}-up.sql"\n`)
            console.error(err)
        }
    })

db.command("down")
    .description("undo migrations")
    .argument("[table]", "name of migrations table", config.table)
    .option("-f, --files <path>", "path to migration files", config.migrationsDir)
    .option("--count <value>", "how many migrations to undo", "1")
    .action(async (table, options) => {
        if (!driver) return
        let { files, count } = options
        
        if (!fs.existsSync(files))
            program.error(`error: -f, --files "${files}" could not be found`)

        // Determine number of migrations to revert, default to 1
        count = isNaN(parseInt(count)) ? 1 : parseInt(count)

        // Go through migrations saved on database and attempt to undo
        const migrations = await driver.getMigrations(table, true)
        let i = 0
        try {
            while (i < migrations.length && i < count) {
                const sql = fs.readFileSync(path.join(files, migrations[i] + "-down.sql"), "utf-8")
                await driver.undoMigration(table, migrations[i]!, sql)
                i += 1
            }
            console.log(`${i} migration${plural(i)} undone`)
        } catch (err) {
            console.log(`${i} migration${plural(i)} undone (of ${migrations.length} total)`)
            console.log(` - failed migration: "${migrations[i]}-down.sql"\n`)
            console.error(err)
        }

    })

db.command("check")
    .description("check status of migrations")
    .argument("[table]", "name of migrations table", config.table)
    .option("-f, --files <path>", "path to migration files", config.migrationsDir)
    .action(async (table, options, cmd) => {
        if (!driver) return
        const { database } = cmd.parent.opts()
        const { files } = options

        if (!fs.existsSync(files))
            program.error(`error: -f, --files "${files}" could not be found`)

        console.log(`database: "${database}"`)
        console.log(`migration table: "${table}"`)

        const untrackedMigrations = await getUntrackedMigrations(driver, table, files)
        if (untrackedMigrations.length === 0) {
            console.log('all migrations are already applied')
            return
        }

        const c = untrackedMigrations.length
        console.log(`${c} untracked migration${plural(c)}:`)

        untrackedMigrations.forEach((v, i) => console.log(` ${i + 1}. ${v}-up.sql`))
    })

program.parseAsync()
    .finally(() => driver?.disconnect())