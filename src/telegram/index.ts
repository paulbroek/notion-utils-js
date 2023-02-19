import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Message } from "typegram";
import { PrismaClient } from "@prisma/client";
import { Context, Telegraf } from "telegraf";
import input from "input";

import { addSummaryToTable, bookExistsInTable } from "../";
import scrapeBookRetry from "../scrape";
import { bookScrapeItem } from "../models/bookScrapeItem";
import axios from "axios";
// import { DataCollection } from "../enums";
import { DataCollection, UserCollection } from "@prisma/client";
import { COLLECTIONS } from "../types";

const apiId: number = parseInt(process.env.TELEGRAM_API_ID || "") as number;
const apiHash: string = process.env.TELEGRAM_API_HASH as string;
const API_HOST: string = process.env.API_HOST as string;
const API_PORT: string = process.env.API_PORT as string;

console.error("process.env.TELEGRAM_API_HASH: ", apiHash);
console.error("process.env.DATABASE_URL: ", process.env.DATABASE_URL);

const prisma = new PrismaClient();

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

// TODO: turn into decorator that checks condition
const getAndWarnDatabaseId = async (ctx): Promise<null | string> => {
  // const userSettings = await getUserSettings(ctx.from.id);
  const userSettings = await getUserCollection(
    ctx.from.id,
    DataCollection.GOODREADS
  );
  if (userSettings == null || !userSettings?.databaseId) {
    ctx.reply(
      "please set a databaseId first using\n /set_database_id YOUR_DATABASE_ID"
    );
    return null;
  }

  return userSettings.databaseId;
};

function getKeyFromUrl(url: string) {
  const match = Object.entries(COLLECTIONS).find(([key, collection]) => {
    const pfx = collection.PFX;
    return pfx.some((p) => url.startsWith(p));
  });
  return match ? match[0] : null;
}

// TODO: will be a generic method that posts url of any type, picking the right endpoint to call
const postUrlAndReply = async (urlOrId: string): Promise<string> => {
  let msg: string;
  const validPfxs = Object.values(COLLECTIONS).flatMap(
    (collection) => collection.PFX
  );
  const collectionKey = getKeyFromUrl(urlOrId);
  if (collectionKey === null) {
    msg = `please pass valid URL, one of: \n\n${validPfxs.join("\n")}`;
    return msg;
  }
  // TODO: make bookExists generic, check if table exists first
  // if (await bookExistsInTable({ goodreadsUrl, databaseId })) {
  //   ctx.reply("Book already exists in summary database");
  //   return;
  // }

  const collectionName: string = COLLECTIONS[collectionKey].NAME;
  console.log(`it is from collection ${collectionName}`);

  // const endpoint: string = "scrape/goodreads";
  const endpoint: string = COLLECTIONS[collectionKey].ENDPOINT;
  const url: string = `http://${API_HOST}:${API_PORT}/${endpoint}/?url=${urlOrId}`;
  console.debug(`url: ${url}`);
  try {
    const response = await axios.post(url);
    console.log("response: " + JSON.stringify(response.data));
    // console.log(response.data.url);
    // console.log(response.data.explanation);
    if (response.data.success) {
      msg = "success";
    }
    return response.data.message;
  } catch (error) {
    // TODO: do not output to user, but to issue list
    msg = "internal error calling api: " + error.response.body;
    console.log(msg);
    console.log("error.message: " + error.message);
    // console.log("error: " + error);
    return msg;
  }
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

// Depreciated, use getUserCollection
// const getUserSettings = async (telegramUserId: number) => {
//   console.log("telegramUserId: ", telegramUserId);
//   const userSettings = await prisma.userSettings.findFirst({
//     where: { user: { telegramId: telegramUserId } },
//   });
//   return userSettings;
// };

const getUserCollection = async (
  telegramUserId: number,
  collection: DataCollection
): Promise<UserCollection | null> => {
  const userCollection = await prisma.userCollection.findFirst({
    where: {
      userSettings: { user: { telegramId: telegramUserId } },
      collection,
    },
  });
  return userCollection;
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
  getUserCollection,
  // getUserSettings,
  updateUserSettings,
  getAndWarnDatabaseId,
  // scrapeAndReply,
  postUrlAndReply,
};
