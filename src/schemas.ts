import z from "zod"

const driverSchema = z.enum(["pg", "mysql"])
const tableSchema = z.string()

export const dbAuth = z.object({
    url: z.string().optional(),
}).or(z.object({
    host: z.string().optional(),
    port: z.string().optional(),
    database: z.string().optional(),
    user: z.string().optional(),
    password: z.string().optional(),
}))

export const upCommandSchema = z.object({
    driver: driverSchema,
    table: tableSchema,
    url: z.string().optional(),
    host: z.string().optional(),
    port: z.string().optional(),
    database: z.string().optional(),
    user: z.string().optional(),
    password: z.string().optional(),
})