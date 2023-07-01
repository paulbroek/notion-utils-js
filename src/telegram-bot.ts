import { Context, Telegraf, Telegram } from "telegraf";
import { Update } from "typegram";

import { createBotCommandsSummary } from "./utils";

import { DataCollection } from "@prisma/client";
import { amqp_connect } from "./amqp_connect";
import version from "project-version";
import {
  upsertUser,
  addUserCollection,
  resetUserCollections,
  getUserCollection,
  getUserCollections,
  getAndWarnDatabaseId,
  postUrlAndReply,
} from "./telegram";
import { databaseExistsForUser, deleteLastSummary, deleteSummaryById } from ".";
import botCommands from "./data/bot-commands.json";

import { User as PrismaUser } from "@prisma/client";

const NOT_IMPLEMENTED: string = "command not implemented yet";

const bot: Telegraf<Context<Update>> = new Telegraf(
  process.env.TELEGRAM_BOT_TOKEN as string
);
// TODO: is this best approach? `Telegraf` only interacts with Telegram API. `Telegram` can send messages directly to any chatId
const telegram: Telegram = new Telegram(
  process.env.TELEGRAM_BOT_TOKEN as string
);

amqp_connect(bot, telegram);

bot.start((ctx) => {
  ctx.reply("Hello " + ctx.from.first_name + "!");
});

bot.help((ctx) => {
  const summary: string = createBotCommandsSummary(botCommands, true);

  // console.log("chat_id is: " + ctx.message.chat.id);
  // console.log("summary: \n\n" + summary);

  ctx.reply("commands summary: \n\n" + summary);
});

bot.command("get_current_database_id", async (ctx) => {
  const msgs = ctx.update.message.text.split(" ");
  if (msgs.length != 2) {
    return ctx.reply(
      "please pass a collection, example: \nget_current_database_id youtube"
    );
  }
  const collection: DataCollection = msgs[1].toUpperCase() as DataCollection;

  // check if collection exists
  if (!Object.values(DataCollection).includes(collection)) {
    return ctx.reply(
      `Invalid collection name. Supported collections are: ${Object.values(
        DataCollection
      ).join(", ")}`
    );
  }
  const userCollection = await getUserCollection(ctx.from.id, collection);

  return ctx.reply("current databaseId: \n" + userCollection?.databaseId);
});

bot.command("get_user_collections", async (ctx) => {
  console.log("DATABASE_URL: ", process.env.DATABASE_URL);
  const collections = await getUserCollections(ctx.from.id);

  ctx.reply("current user collections: \n" + JSON.stringify(collections));
});

bot.command("set_database_id", async (ctx) => {
  const msgs = ctx.update.message.text.split(" ");
  if (msgs.length != 3) {
    return ctx.reply(
      "please pass a collection and databaseId, example: \n\nset_database_id youtube 75f14122dabc4196c6f37f92b580bbfc"
    );
  }
  const collection: DataCollection = msgs[1].toUpperCase() as DataCollection;

  // check if collection exists
  if (!Object.values(DataCollection).includes(collection)) {
    return ctx.reply(
      `Invalid collection name. Supported collections are: ${Object.values(
        DataCollection
      ).join(", ")}`
    );
  }

  const databaseId: string = msgs[2];
  // database exists for user?
  if (!(await databaseExistsForUser(databaseId))) {
    return ctx.reply("databaseId does not exist for user");
  }

  const success: boolean = await addUserCollection(
    ctx.from.id,
    collection,
    databaseId
  );

  if (success) return ctx.reply("databaseId was set to: \n" + databaseId);

  return ctx.reply("databaseId was not set");
});

bot.command("reset_database_ids", async (ctx) => {
  const success: boolean = await resetUserCollections(ctx.from.id);
  if (success) return ctx.reply("reset all databaseIds for user");

  return ctx.reply("could not reset all databaseIds");
});

bot.command("nrow", async () => {
  // TODO: implement method
  // get number of rows in notion database
});

bot.command("repeat_last", async (ctx) => {
  // TODO: get last command from database
  ctx.reply(NOT_IMPLEMENTED);
});

bot.command("delete_last", async (ctx) => {
  const databaseId = await getAndWarnDatabaseId(ctx);
  if (databaseId == null) {
    return;
  }

  // delete last added book summary, but only when text is empty (safety check)
  const pageTitle = await deleteLastSummary(databaseId);
  ctx.reply("deleted page: \n" + pageTitle);
});

bot.command("delete", async (ctx) => {
  const msgs = ctx.update.message.text.split(" ");
  if (msgs.length != 2) {
    ctx.reply("please pass one url to delete");
    return;
  }
  const url = msgs[1];

  const databaseId = await getAndWarnDatabaseId(ctx);
  if (databaseId == null) {
    return;
  }

  // delete book summary
  const pageTitle = await deleteSummaryById(databaseId, url);
  ctx.reply("deleted page: \n" + pageTitle);
});

// only /add commands will add summaries to Notion
bot.command("add", async (ctx) => {
  const msgs = ctx.update.message.text.split(" ");
  // console.log("msgs: ", JSON.stringify(msgs));
  if (msgs.length != 2) {
    ctx.reply("please pass one URL argument");
    return;
  }
  const msg = msgs[1];

  // get or create user from DB
  // TODO: should always run, for every endpoint
  const user: PrismaUser | null = await upsertUser(ctx.message);
  // TODO: implement pushMessage, save all messages to db
  // await pushMessage(ctx.from.id, ctx.update.message);

  // calling api in background
  if (user) {
    const replyMsg: string = await postUrlAndReply(msg, user);
    ctx.reply(replyMsg, { disable_web_page_preview: true });
  }

  // Either the item exists in db, you can immediately request AddRowToTable microservice, OR
  // TODO: subscribe to RabbitMQ / feedback message should return to telegram chat when row got added
});

// bot.on("text", async (ctx) => {
//   // await scrapeAndReply(ctx, ctx.message.text);
//   const msg = "I got: " + ctx.message.text;
//   console.log(msg);
//   // ctx.reply(msg);
// });

bot.command("bot_version", async (ctx) => {
  ctx.reply(`version of bot running: ${version}`);
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
