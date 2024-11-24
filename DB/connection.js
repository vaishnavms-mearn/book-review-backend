const { PrismaClient } = require('@prisma/client');

// Create a new PrismaClient instance
const prisma = new PrismaClient();

// Export the Prisma client for use across the application
module.exports = prisma;