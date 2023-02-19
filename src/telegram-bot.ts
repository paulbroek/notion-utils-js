import { Context, Telegraf } from "telegraf";
import { Update } from "typegram";

import { createBotCommandsSummary } from "./utils";

import { DataCollection } from "@prisma/client";

import version from "project-version";
import {
  upsertUser,
  updateUserSettings,
  // getUserSettings,
  getUserCollection,
  getAndWarnDatabaseId,
  postUrlAndReply,
} from "./telegram";
import { databaseExistsForUser, deleteLastSummary, deleteSummaryById } from ".";
import botCommands from "./bot-commands.json";

const bot: Telegraf<Context<Update>> = new Telegraf(
  process.env.TELEGRAM_BOT_TOKEN as string
);

const NOT_IMPLEMENTED: string = "command not implemented yet";

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
  console.log("DATABASE_URL: ", process.env.DATABASE_URL);
  // const userSettings = await getUserSettings(ctx.from.id);
  const userSettings = await getUserCollection(
    ctx.from.id,
    DataCollection.GOODREADS
  );

  ctx.reply("current databaseId: \n" + userSettings?.databaseId);
  // ctx.reply("current databaseId: \n" + userSettings?.databaseId);
});

bot.command("set_database_id", async (ctx) => {
  const msgs = ctx.update.message.text.split(" ");
  // console.log("msgs: ", JSON.stringify(msgs));
  if (msgs.length != 3) {
    ctx.reply(
      "please pass a collection and databaseId, example: \n\nset_database_id youtube 39j239jasdfkj233f"
    );
    return;
  }
  const collection: string = msgs[1];
  const databaseId: string = msgs[2];
  // TODO: how to save this state when restarting bot?
  // -> use DB to store user data
  // database exists for user?
  if (!(await databaseExistsForUser(databaseId))) {
    ctx.reply("databaseId does not exist for user");
    return;
  }

  await updateUserSettings(ctx.from.id, { databaseId: databaseId });

  ctx.reply("databaseId was set to: \n" + databaseId);
});

bot.command("reset_database_id", async (ctx) => {
  const newDatabaseId = null;
  await updateUserSettings(ctx.from.id, { databaseId: newDatabaseId });

  ctx.reply("databaseId was set to: \n" + newDatabaseId);
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
    ctx.reply("please pass one bookId to delete");
    return;
  }
  const goodreadsUrl = msgs[1];

  const databaseId = await getAndWarnDatabaseId(ctx);
  if (databaseId == null) {
    return;
  }

  // delete book summary
  const pageTitle = await deleteSummaryById(databaseId, goodreadsUrl);
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
  await upsertUser(ctx.message);
  // TODO: implement pushMessage, save all messages to db
  // await pushMessage(ctx.from.id, ctx.update.message);

  // await scrapeAndReply(ctx, msg);
  // TODO: call fastAPI instead
  const replyMsg: string = await postUrlAndReply(msg);
  ctx.reply(replyMsg, { disable_web_page_preview: true });
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
