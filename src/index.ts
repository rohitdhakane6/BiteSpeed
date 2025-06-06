import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.create({
    data: {
      name: "Alice",
      email: "alice@gmail.com",
    },
  });
  console.log("Created user:", users);
}

main();
