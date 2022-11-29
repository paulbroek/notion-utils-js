import { Context, Telegraf } from "telegraf";
import { Update } from "typegram";
import scrapeBookRetry from "./scrape";
import { createBotCommandsSummary } from "./utils";
import { bookScrapeItem } from "./models/bookScrapeItem";
import {
  upsertUser,
  pushMessage,
  upsertUserSettings,
  getUserSettings,
} from "./telegram";
import {
  addSummaryToTable,
  bookExistsInTable,
  databaseExistsForUser,
  deleteLastSummary,
} from ".";
import botCommands from "./bot-commands.json";
import { PrismaClient } from "@prisma/client";

let databaseId: string;
const bot: Telegraf<Context<Update>> = new Telegraf(
  process.env.TELEGRAM_BOT_TOKEN as string
);

const prisma = new PrismaClient();

const didSetDatabaseId = (ctx: Context): boolean => {
  // TODO: turn into decorator that checks condition
  if (!databaseId) {
    ctx.reply(
      "please set a databaseId first using\n /set_database_id YOUR_DATABASE_ID"
    );
    return false;
  }
  return true;
};

bot.start((ctx) => {
  ctx.reply("Hello " + ctx.from.first_name + "!");
});

bot.help((ctx) => {
  // TODO: send list of all commands
  ctx.reply("Send /start to receive a greeting");
  ctx.reply("Send /keyboard to receive a message with a keyboard");
  ctx.reply("Send /quit to stop the bot");
  ctx.reply("chat_id is: " + ctx.message.chat.id);
});

// bot.command("quit", (ctx) => {
//   // Explicit usage
//   ctx.telegram.leaveChat(ctx.message.chat.id);
//   // Context shortcut
//   ctx.leaveChat();
// });

const scrapeAndReply = async (ctx: Context, msg: string) => {
  // check if databaseId is set
  if (!didSetDatabaseId(ctx)) {
    return;
  }

  // check if msg is valid URL or ask user
  if (!msg.startsWith("https://www.goodreads.com/book/show/")) {
    ctx.reply("please pass valid goodreads book URL");
    return;
  }
  const goodreadsUrl: string = msg;

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

bot.command("get_current_database_id", async (ctx) => {
  ctx.reply("current databaseId: \n" + databaseId);
});

bot.command("set_database_id", async (ctx) => {
  const msgs = ctx.update.message.text.split(" ");
  // console.log("msgs: ", JSON.stringify(msgs));
  if (msgs.length != 2) {
    ctx.reply("please pass one databaseId");
    return;
  }
  databaseId = msgs[1];
  // TODO: how to save this state when restarting bot?
  // -> use DB to store user data
  // database exists for user?
  if (!(await databaseExistsForUser(databaseId))) {
    ctx.reply("databaseId does not exist for user");
    return;
  }

  await upsertUserSettings(ctx.from.id, { databaseId: databaseId });

  ctx.reply("databaseId was set to: \n" + databaseId);
});

bot.command("delete_last", async (ctx) => {
  if (!didSetDatabaseId(ctx)) {
    return;
  }

  // delete last added book summary, but only when text is empty (safety check)
  const pageId = await deleteLastSummary(databaseId);
  ctx.reply("deleted page: \n" + pageId);
});

// both plain messages and /add commands will add summaries to Notion
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
  await pushMessage(ctx.from.id, ctx.update.message);

  // get userSettings
  const res = await getUserSettings(ctx.from.id);
  if (res?.databaseId) {
    databaseId = res.databaseId;
  }

  await scrapeAndReply(ctx, msg);
});

// bot.on("text", async (ctx) => {
//   // await scrapeAndReply(ctx, ctx.message.text);
//   const msg = "I got: " + ctx.message.text;
//   console.log(msg);
//   // ctx.reply(msg);
// });

bot.command("db", async (ctx) => {
  const res = await prisma.user.findMany();
  console.log("db res: ", JSON.stringify(res));
});

bot.command("commands", async (ctx) => {
  const summary = createBotCommandsSummary(botCommands);
  console.log("summary: \n\n" + summary);
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
