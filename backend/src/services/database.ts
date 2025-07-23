import { PrismaClient } from '../../../src/generated/prisma';

// Global Prisma client instance
let prisma: PrismaClient;

export function getDatabaseClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

// Graceful shutdown handler
export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
  }
} 