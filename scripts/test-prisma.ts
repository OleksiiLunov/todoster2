import { prisma } from "../src/lib/prisma";

async function main() {
  const lists = await prisma.todoList.findMany({ take: 1 });
  console.log("Prisma runtime OK:", lists.length);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });