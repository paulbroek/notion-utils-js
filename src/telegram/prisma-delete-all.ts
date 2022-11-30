import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // order determines order of table deletion
  // const tables = ["message", "userSettings", "user"];
  const tables = ["userSettings"];

  for (const [ix, table] of tables.entries()) {
    const res = await prisma[table].deleteMany({});
    console.log(`\nStep ${ix}. ndeleted ${table}: ${res.count}`);
  }
}

main()
  .catch((e) => {
    console.error(e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
