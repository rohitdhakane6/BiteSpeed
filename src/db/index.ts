
import { PrismaClient } from '@prisma/client';

declare global {
  // Prevent multiple instances in development (Next.js-style)
  // For pure Node.js, this line is optional
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient();

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;
