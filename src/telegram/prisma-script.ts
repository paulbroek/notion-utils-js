import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

(async () => {
  await prisma.user.deleteMany({});
  //   await prisma.userSettings.deleteMany({});
  //   await prisma.message.deleteMany({});
})();
