# sql-migrator-cli
A quick and simple command-line interface (CLI) tool for managing database migrations, supporting different database systems. This CLI tool also allows you to generate, apply, and revert database migrations while providing a command to create a new database if needed.

## Usage
```
Usage: sql-migrator-cli [options] [command]

Options:
  -V, --version                   output the version number
  -e, --env <path>                environment path (default: ".env")
  -c, --config <path>             config path (default: "migrations.json")
  -h, --help                      display help for command

Commands:
  config                          show all config values being used
  gen [options] <migration-name>  generate migration files
  db [options]                    sets up a database connection
  help [command]                  display help for command
```

```
Usage: sql-migrator-cli db [options] [command]

sets up a database connection

Options:
  -d, --driver <name>      database driver (default: config file)
  -url <value>             database connection url (default: config file)
  -host <name>             database host (default: config file)
  -p, --port <value>       database port (default: config file)
  -db, --database <name>   database name (default: config file)
  -u, --user <name>        the user for the database (default: config file)
  -pw, --password <value>  the password for the database user (default: config file)
  -h, --help               display help for command (default: config file)

Commands:
  create [name]            create a database with migration table
  create:table [name]      create a table for migrations
  up [options] [table]     apply all migrations
  down [options] [table]   undo migrations
  check [options] [table]  check status of migrations
  help [command]           display help for command
```

## Example
Install sql-migrator-cli globally:
```shell
npm i -g sql-migrator-cli
```

Use the appropriate flags or simply add a config file (default is "migrations.json", you can change this with the -c or --config flag). You can also pass environment variables to the json file!
```json
{
  "driver": "pg",
  "database": "my_database",
  "host": "localhost",
  "password": { "env": "DB_PASSWORD" },
  "port": 5432,
  "user": "user",
  "table": "migrations",
  "migrationsDir": "./migrations"
}
```

Generate migration files, then write your SQL:
```shell
sql-migrator gen my-first-migration
```

Create a database with migrations table:
```shell
sql-migrator db create
```

Run migrations:
```shell
sql-migrator db up
```

No config json file, no problem:
```shell
sql-migrator db -d pg -db my_database --host localhost -p 5432 -pw supersecret -u postgres up migrations_table -f ./migration-files
```