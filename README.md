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