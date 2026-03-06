const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('PostgreSQL connected via Prisma');
  } catch (error) {
    console.error('PostgreSQL connection error:', error.message);
    process.exit(1);
  }
};

module.exports = { prisma, connectDB };

