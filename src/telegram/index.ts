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

const apiId: number = parseInt(process.env.TELEGRAM_API_ID || "") as number;
const apiHash: string = process.env.TELEGRAM_API_HASH as string;
const API_HOST: string = process.env.API_HOST as string;
const API_PORT: string = process.env.API_PORT as string;
// TODO: support multiple prefixes (youtube?)
const GOODREADS_PFX: string = "https://www.goodreads.com/book/show/";
const YOUTUBE_PFX: string = "https://www.goodreads.com/book/show/";
const PODCHASER_PFX: string =
  "https://www.podchaser.com/podcasts/the-hockey-pdocast-7381/episodes/from-the-archives-with-rikard-159851742";

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
  const userSettings = await getUserSettings(ctx.from.id);
  if (userSettings == null || !userSettings?.databaseId) {
    ctx.reply(
      "please set a databaseId first using\n /set_database_id YOUR_DATABASE_ID"
    );
    return null;
  }

  return userSettings.databaseId;
};
const scrapeAndReply = async (ctx: Context, msg: string) => {
  // check if databaseId is set
  const databaseId = await getAndWarnDatabaseId(ctx);
  if (databaseId == null) {
    return;
  }

  // check if msg is valid URL or ask user
  if (!msg.startsWith(GOODREADS_PFX)) {
    ctx.reply("please pass valid goodreads book URL");
    return;
  }
  // throw away any url encoded queries
  const goodreadsUrl: string = msg.split("?")[0];

  if (await bookExistsInTable({ goodreadsUrl, databaseId })) {
    ctx.reply("Book already exists in summary database");
    return;
  }

  // user feedback, send message when starting scrape process, delete it when finished / error
  const { message_id } = await ctx.reply("scraping..");

  const scrapeRes: null | bookScrapeItem = await scrapeBookRetry(goodreadsUrl);
  // ctx.reply(`res: ${JSON.stringify(res)}`);
  await ctx.deleteMessage(message_id);

  // create notion page, ask user first
  if (scrapeRes) {
    const addResult = await addSummaryToTable(scrapeRes, databaseId);

    if (!addResult) {
      ctx.reply("could not add result to Notion");
      // TODO: retry automatically?
    } else {
      // console.log("addResult: ", JSON.stringify(addResult));
      // FIXME: very ugly method, but notion API does not allow to see properties of response directly
      // See: https://github.com/makenotion/notion-sdk-js/issues/247

      // const recreatedObject = JSON.parse(JSON.stringify(addResult));
      // console.log("addResult.reparsed: ", recreatedObject.url);
      // ctx.reply(`Done! Visit the summary at: \n${recreatedObject.url}`);
      ctx.reply(`Done! Visit the summary at: \n${addResult["url"]}`);
    }
  } else {
    ctx.reply("Could not scrape Goodreads page");
  }
};

// const validUrl = (url: string) => {
//   switch (url) {
//     case (url.startsWith("")): {
//       //statements;
//       break;
//     }
//     case constant_expression2: {
//       //statements;
//       break;
//     }
//     default: {
//       //statements;
//       break;
//     }
//   }
// };

// TODO: will be a generic method that posts url of any type, picking the right endpoint to call
const postUrlAndReply = async (urlOrId: string): Promise<string> => {
  const endpoint: string = "scrape/goodreads";
  const url: string = `http://${API_HOST}:${API_PORT}/${endpoint}/?url=${urlOrId}`;
  console.debug(`url: ${url}`);
  let msg: string;
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

const getUserSettings = async (telegramUserId: number) => {
  console.log("telegramUserId: ", telegramUserId);
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
  getAndWarnDatabaseId,
  scrapeAndReply,
  postUrlAndReply,
};
