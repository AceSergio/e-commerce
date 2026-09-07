if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./prisma/dev.db';
}

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Configure SQLite for high concurrency (Write-Ahead Logging & 5-second busy timeout)
prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;').catch(() => {});
prisma.$queryRawUnsafe('PRAGMA busy_timeout = 5000;').catch(() => {});

module.exports = prisma;

