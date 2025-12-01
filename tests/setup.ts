import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

beforeAll(async () => {
  console.log("🧪 Iniciando testes...");
  // Setup global
});

afterAll(async () => {
  await prisma.$disconnect();
  console.log("✅ Testes concluídos");
});

afterEach(() => {
  jest.clearAllMocks();
});

export { prisma };
