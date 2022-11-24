// TODO: move to seperate repo?
import { Context, Telegraf } from "telegraf";
import { Update } from "typegram";
import scrapeBookRetry from "./scrape";
import { bookScrapeItem } from "./models/bookScrapeItem";
import { addSummaryToTable, bookExistsInTable, deleteLastSummary } from ".";
const bot: Telegraf<Context<Update>> = new Telegraf(
  process.env.TELEGRAM_BOT_TOKEN as string
);

bot.start((ctx) => {
  ctx.reply("Hello " + ctx.from.first_name + "!");
});

bot.help((ctx) => {
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
  // check if msg is valid URL or ask user
  if (!msg.startsWith("https://www.goodreads.com/book/show/")) {
    ctx.reply("please pass valid goodreads book URL");
    return;
  }
  const url: string = msg;

  // check if book exists
  const bookExists: Boolean = await bookExistsInTable(url);
  if (bookExists) {
    console.log("book exists");
    ctx.reply("Book already exists in summary database");
    return;
  }

  // user feedback, send message when starting scrape process, delete it when finished / error
  const { message_id } = await ctx.reply("scraping..");
  // console.log("message_id: ", message_id);

  const res: null | bookScrapeItem = await scrapeBookRetry(url);
  // ctx.reply(`res: ${JSON.stringify(res)}`);
  await ctx.deleteMessage(message_id);

  // create notion page, ask user first
  if (res) {
    // const { message_id } = await ctx.reply("creating record in Notion table..");
    const addResult = await addSummaryToTable(res);
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

bot.command("delete_last", async (ctx) => {
  // delete last added book summary, but only when text is empty (safety check)
  await deleteLastSummary();
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
