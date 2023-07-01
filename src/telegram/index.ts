import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Message } from "typegram";
import { PrismaClient } from "@prisma/client";
import input from "input";

import axios from "axios";
import {
  DataCollection,
  UserCollection,
  User as PrismaUser,
} from "@prisma/client";
import { COLLECTIONS } from "../types";

const apiId: number = parseInt(process.env.TELEGRAM_API_ID || "") as number;
const apiHash: string = process.env.TELEGRAM_API_HASH as string;
const API_HOST: string = process.env.API_HOST as string;
const API_PORT: string = process.env.API_PORT as string;

console.error("process.env.TELEGRAM_API_HASH: ", apiHash);
console.error("process.env.DATABASE_URL: ", process.env.DATABASE_URL);

interface User extends PrismaUser {
  collections: UserCollection[];
}

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

const getKeyFromUrl = (url: string): null | string => {
  const match = Object.entries(COLLECTIONS).find(([key, collection]) => {
    const pfx = collection.PFX;
    return pfx.some((p) => url.startsWith(p));
  });
  return match ? match[0] : null;
};

// TODO: will be a generic method that posts url of any type, picking the right endpoint to call
const postUrlAndReply = async (
  urlOrId: string,
  user: PrismaUser
): Promise<string> => {
  let msg: string;
  const validPfxs = Object.values(COLLECTIONS).flatMap(
    (collection) => collection.PFX
  );
  const collectionKey: string | null = getKeyFromUrl(urlOrId);
  if (collectionKey === null) {
    msg = `please pass valid URL, one of: \n\n${validPfxs.join("\n")}`;
    return msg;
  }
  // TODO: make bookExists generic, check if table exists first
  // if (await bookExistsInTable({ urlOrId, databaseId })) {
  //   ctx.reply("Book already exists in summary database");
  //   return;
  // }

  const collectionName: string = COLLECTIONS[collectionKey].NAME;
  console.log(`it is from collection ${collectionName}`);

  // collection should be set for user
  const userCollectionRes: null | UserCollection = await getUserCollection(
    Number(user.telegramId),
    collectionKey.toUpperCase() as DataCollection
  );
  // console.log(`userCollectionRes: ${JSON.stringify(userCollectionRes)}`);
  if (!userCollectionRes?.databaseId) {
    msg = `please add databaseId for ${collectionKey} \nby calling /set_database_id ${collectionKey} your_notion_database_id`;
    return msg;
  }

  // TODO: retrieve telegramChatId
  const params = {
    url: urlOrId,
    telegramChatId: "-877077753",
    telegramUserId: `${user.telegramId}`,
    notionDatabaseId: userCollectionRes.databaseId,
  };
  msg = await postAddRow(params, collectionKey);
  return msg;
};

const postAddRow = async (
  params: {
    url: string;
    telegramChatId: string;
    telegramUserId: string;
    notionDatabaseId: string;
  },
  collectionKey: string
): Promise<string> => {
  let msg: string;
  console.debug(`params: ${JSON.stringify(params)}`);
  const endpoint: string = COLLECTIONS[collectionKey].ENDPOINT;
  const url: string = `http://${API_HOST}:${API_PORT}/${endpoint}`;
  console.debug(`url: ${url}`);

  // post add_row request to API
  try {
    const response = await axios.post(url, {}, { params });
    console.log("response: " + JSON.stringify(response.data));
    if (response.data.success) {
      msg = "success";
    }
    return response.data.message;
  } catch (error) {
    // TODO: do not output to user, but to issue list
    msg = "internal error calling api: " + error.response.body;
    console.log(msg);
    console.log("error.message: " + error.message);
    return msg;
  }
};

const getLastMessage = async (client: TelegramClient, chatId: number) => {
  const msgs = await client.getMessages(chatId, { limit: 1 });
  const lastMessage: string = msgs[0].message;

  return lastMessage;
};

const upsertUser = async (message: Message): Promise<PrismaUser | null> => {
  if (!message.from) {
    console.error("message should have `from` property");
    return null;
  }
  const telegramUserId: number | undefined = message.from.id;
  if (!telegramUserId) {
    console.error("cannot extract telegramUserId");
    return null;
  }

  console.log("telegramUserId: ", telegramUserId);

  const user = {
    userName: "" + message.from.username,
    firstName: message.from.first_name,
    lastName: message.from.last_name,
    languageCode: message.from.language_code,
    isBot: message.from.is_bot,
    isPremium: message.from.is_premium,
    telegramId: `${telegramUserId}`,
  };

  console.log(`upserting user: ${telegramUserId}`);

  return await prisma.user.upsert({
    create: user,
    update: {
      userName: message.from.username,
      firstName: message.from.first_name,
      lastName: message.from.last_name,
    },
    where: { telegramId: `${telegramUserId}` },
  });
};

const pushMessage = async (
  telegramUserId: number,
  message: Message
): Promise<undefined> => {
  // const telegramUserId: string = "" + message.from?.id;
  // const msgText: string = message.text;
  const msgText: string = "todo: make text";
  const user = await prisma.user.findFirst({
    where: { telegramId: `${telegramUserId}` },
  });

  if (!user) {
    console.error(`cannot find user ${telegramUserId}`);
    return;
  }

  await prisma.message.create({ data: { userId: user.id, text: msgText } });
  console.debug(`pushed message: ${msgText}`);
};

const getUserCollection = async (
  telegramUserId: number,
  collection: DataCollection
): Promise<UserCollection | null> => {
  const userCollection = await prisma.userCollection.findFirst({
    where: {
      user: { telegramId: `${telegramUserId}` },
      collection,
    },
  });
  return userCollection;
};

const getUserCollections = async (
  telegramUserId: number
): Promise<UserCollection[] | null> => {
  const collections = await prisma.userCollection.findMany({
    where: {
      user: { telegramId: `${telegramUserId}` },
    },
  });
  return collections;
};

async function getUser(telegramUserId: number): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { telegramId: `${telegramUserId}` },
    include: { collections: true },
  });
}

// reset UserCollections for user
const resetUserCollections = async (
  telegramUserId: number
): Promise<boolean> => {
  const user: User | null = await getUser(telegramUserId);
  if (!user) {
    console.error(`cannot find user ${telegramUserId}`);
    return false;
  }
  try {
    await prisma.userCollection.deleteMany({
      where: { userId: user.id },
    });
    console.log(
      `All UserCollections for user ${telegramUserId} have been deleted`
    );
    return true;
  } catch (error) {
    console.error(
      `Error deleting UserCollections for user ${telegramUserId}`,
      error
    );
  }

  return false;
};

const addUserCollection = async (
  telegramUserId: number,
  collection: DataCollection,
  databaseId: string
): Promise<boolean> => {
  const user: User | null = await getUser(telegramUserId);
  if (!user) {
    console.error(`cannot find user ${telegramUserId}`);
    return false;
  }
  // console.log(
  //   `user: ${JSON.stringify({
  //     ...user,
  //     telegramId: user.telegramId.toString(),
  //   })}`
  // );

  const existingCollection = user.collections.find(
    (c) => c.collection === collection
  );

  if (existingCollection) {
    // Update the existing collection record
    await prisma.userCollection.update({
      where: { id: existingCollection.id },
      data: { databaseId, collection },
    });
  } else {
    // Create a new collection record
    try {
      await prisma.userCollection.create({
        data: {
          collection,
          databaseId,
          user: { connect: { id: user.id } },
        },
      });
    } catch (e) {
      // If there was a unique constraint violation, update the existing record instead
      if (e.code === "P2002") {
        // TODO: implement
        console.log("you're using a databaseId that has already been taken");

        // await prisma.userCollection.update({
        //   where: { userId: user.id, collection: { equals: collection } },
        //   data: { databaseId },
        // });
        return false;
      } else {
        throw e;
      }
    }
  }
  return true;
};

export {
  createTelegramClient,
  connectTelegramClient,
  getLastMessage,
  upsertUser,
  pushMessage,
  getUserCollection,
  getUserCollections,
  resetUserCollections,
  addUserCollection,
  getAndWarnDatabaseId,
  postUrlAndReply,
  postAddRow,
  getKeyFromUrl,
};
