import { Context, Telegraf } from "telegraf";
import { Update } from "typegram";
import scrapeBookRetry from "./scrape";
import { bookScrapeItem } from "./models/bookScrapeItem";
import {
  addSummaryToTable,
  bookExistsInTable,
  databaseExistsForUser,
  deleteLastSummary,
} from ".";
// const databaseId = process.env.NOTION_DATABASE_ID as string;
let databaseId: string;
const bot: Telegraf<Context<Update>> = new Telegraf(
  process.env.TELEGRAM_BOT_TOKEN as string
);

const didSetDatabaseId = (ctx: Context): boolean => {
  // TODO: turn into decorator that checks this
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

bot.command("quit", (ctx) => {
  // Explicit usage
  ctx.telegram.leaveChat(ctx.message.chat.id);
  // Context shortcut
  ctx.leaveChat();
});

const scrapeAndReply = async (ctx: Context, msg: string) => {
  // check if databaseId is set
  const didSet: boolean = didSetDatabaseId(ctx);
  if (!didSet) {
    return;
  }

  // check if msg is valid URL or ask user
  if (!msg.startsWith("https://www.goodreads.com/book/show/")) {
    ctx.reply("please pass valid goodreads book URL");
    return;
  }
  const goodreadsUrl: string = msg;

  // check if book exists
  const bookExists: Boolean = await bookExistsInTable({
    goodreadsUrl,
    databaseId,
  });
  if (bookExists) {
    // console.log("book exists");
    ctx.reply("Book already exists in summary database");
    return;
  }

  // user feedback, send message when starting scrape process, delete it when finished / error
  const { message_id } = await ctx.reply("scraping..");
  // console.log("message_id: ", message_id);

  const res: null | bookScrapeItem = await scrapeBookRetry(goodreadsUrl);
  // const res: null | bookScrapeItem = null;
  // ctx.reply(`res: ${JSON.stringify(res)}`);
  await ctx.deleteMessage(message_id);

  // create notion page, ask user first
  if (res) {
    // const { message_id } = await ctx.reply("creating record in Notion table..");
    const addResult = await addSummaryToTable(res, databaseId);
    // await ctx.deleteMessage(message_id);

    if (!addResult) {
      ctx.reply("could not add result to Notion");
      // TODO: retry automatically?
    } else {
      // console.log("addResult: ", JSON.stringify(addResult));
      // FIXME: very ugly method, but notion API does not allow to see properties of response directly
      // See: https://github.com/makenotion/notion-sdk-js/issues/247

      const recreatedObject = JSON.parse(JSON.stringify(addResult));
      console.log("addResult.reparsed: ", recreatedObject.url);
      ctx.reply(`Done! Visit the summary at: \n${recreatedObject.url}`);
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
  if (msgs.length == 1) {
    ctx.reply("please pass one databaseId");
    return;
  }
  databaseId = msgs[1];
  // TODO: how to save this state when restarting bot?
  // check if database exists for user
  const databaseExists: boolean = await databaseExistsForUser(databaseId);
  if (!databaseExists) {
    ctx.reply("databaseId does not exist for user");
    return;
  }

  ctx.reply("databaseId was set to: \n" + databaseId);
});

bot.command("delete_last", async (ctx) => {
  const didSet: boolean = didSetDatabaseId(ctx);
  if (!didSet) {
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
  if (msgs.length == 1) {
    ctx.reply("please pass an URL argument");
    return;
  }
  const msg = msgs[1];
  await scrapeAndReply(ctx, msg);
});

bot.on("text", async (ctx) => {
  await scrapeAndReply(ctx, ctx.message.text);
});

// TODO: ask user to optionally add reminders, they will be set in Notion

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
