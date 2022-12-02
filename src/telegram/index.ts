import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Message } from "typegram";
import { PrismaClient } from "@prisma/client";
import input from "input";

const prisma = new PrismaClient();

const apiId: number = parseInt(process.env.TELEGRAM_API_ID || "") as number;
const apiHash: string = process.env.TELEGRAM_API_HASH as string;

const createTelegramClient = (sessionKey: string) => {
  // when `sessionKey` is empty, automatically asks for user input
  const stringSession = new StringSession(sessionKey);

  //   console.log("stringSession: ", stringSession, apiId, apiHash);
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  return client;
};

const connectTelegramClient = async (
  sessionKey: string,
  client: undefined | TelegramClient = undefined
): Promise<TelegramClient> => {
  if (!client) {
    client = createTelegramClient(sessionKey);
  }
  await client.start({
    phoneNumber: async () => await input.text("Please enter your number: "),
    password: async () => await input.text("Please enter your password: "),
    phoneCode: async () =>
      await input.text("Please enter the code you received: "),
    onError: (err) => console.log(err),
  });

  console.debug("Connected to GramJS Telegram client.");

  if (!sessionKey) {
    // Save this string to ./config/.env.test to auto login later
    console.log(`Saved login: ${client.session.save()}`);
  }

  return client;
};

const getLastMessage = async (client: TelegramClient, chatId: number) => {
  const msgs = await client.getMessages(chatId, { limit: 1 });
  const lastMessage: string = msgs[0].message;

  return lastMessage;
};

const upsertUser = async (message: Message) => {
  if (!message.from) {
    console.error("message should have `from` property");
    return;
  }
  const telegramUserId: number | undefined = message.from.id;
  if (!telegramUserId) {
    console.error("cannot extract telegramUserId");
    return;
  }

  console.log("telegramUserId: ", telegramUserId);

  const user = {
    userName: "" + message.from.username,
    firstName: message.from.first_name,
    lastName: message.from.last_name,
    languageCode: message.from.language_code,
    isBot: message.from.is_bot,
    isPremium: message.from.is_premium,
    telegramId: telegramUserId,
  };

  await prisma.user.upsert({
    create: user,
    update: {
      userName: message.from.username,
      firstName: message.from.first_name,
      lastName: message.from.last_name,
    },
    where: { telegramId: telegramUserId },
  });

  console.log(`upserted user: ${telegramUserId}`);
};

const pushMessage = async (
  telegramUserId: number,
  message: Message
): Promise<undefined> => {
  // const telegramUserId: string = "" + message.from?.id;
  // const msgText: string = message.text;
  const msgText: string = "todo: make text";
  const user = await prisma.user.findFirst({
    where: { telegramId: telegramUserId },
  });

  if (!user) {
    console.error(`cannot find user ${telegramUserId}`);
    return;
  }

  await prisma.message.create({ data: { userId: user.id, text: msgText } });
  console.debug(`pushed message: ${msgText}`);
};

const getUserSettings = async (telegramUserId: number) => {
  const userSettings = await prisma.userSettings.findFirst({
    where: { user: { telegramId: telegramUserId } },
  });
  return userSettings;
};

const updateUserSettings = async (telegramUserId: number, settings: object) => {
  // TODO: rewrite this is into a single query, use `connect`?
  const user = await prisma.user.findUnique({
    where: { telegramId: telegramUserId },
  });

  if (!user) {
    console.error(`cannot find user ${telegramUserId}`);
    return;
  }

  const userSettings = { userId: user.id, ...settings };

  await prisma.userSettings.upsert({
    create: userSettings,
    update: settings,
    where: { userId: user.id },
  });

  // const res = await prisma.user.update({
  //   data: { userSettings: settings },
  //   where: { telegramId: telegramUserId },
  // });

  // console.debug(`updated userSettings: ${JSON.stringify(res)}`);
  console.debug(`updated userSettings: ${JSON.stringify(userSettings)}`);
};

export {
  createTelegramClient,
  connectTelegramClient,
  getLastMessage,
  upsertUser,
  pushMessage,
  getUserSettings,
  updateUserSettings,
};
