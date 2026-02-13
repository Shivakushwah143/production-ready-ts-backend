import dotenv from "dotenv";
import express from "express";
import { PrismaClient } from "@prisma/client";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
dotenv.config();
const app = express();
const PORT = Number(process.env.PORT) || 4000;
app.use(express.json());
const { Pool } = pg;
const DATABASE_URL = process.env.DATABASE_URL;
console.log(DATABASE_URL);
if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined in environment variables");
}
const pool = new Pool({
    connectionString: DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
    adapter,
    log: ["query", "error", "warn"],
});
app.get("/health", async (_req, res) => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        return res.status(200).json({
            status: "ok",
            environment: process.env.NODE_ENV,
        });
    }
    catch (error) {
        return res.status(500).json({
            status: "error",
            message: "Database not reachable",
        });
    }
});
/**
 * Create User
 */
app.post("/users", async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: "Name is required" });
        }
        const user = await prisma.user.create({
            data: { name },
        });
        return res.status(201).json(user);
    }
    catch (error) {
        return res.status(500).json({ message: "Failed to create user" });
    }
});
/**
 * Create Todo
 */
app.post("/todos", async (req, res) => {
    try {
        const { title, userId } = req.body;
        if (!title || !userId) {
            return res.status(400).json({ message: "Title and userId are required" });
        }
        const todo = await prisma.todo.create({
            data: {
                title,
                userId,
            },
        });
        return res.status(201).json(todo);
    }
    catch (error) {
        return res.status(500).json({ message: "Failed to create todo" });
    }
});
/**
 * Get Users with Todos
 */
app.get("/users", async (_req, res) => {
    try {
        const users = await prisma.user.findMany({
            include: {
                todos: true,
            },
        });
        return res.status(200).json(users);
    }
    catch (error) {
        return res.status(500).json({ message: "Failed to fetch users" });
    }
});
/**
 * Graceful shutdown
 */
process.on("SIGTERM", async () => {
    await prisma.$disconnect();
    process.exit(0);
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map