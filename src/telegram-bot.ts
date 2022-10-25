// TODO: move to seperate repo?
import { Context, Telegraf } from "telegraf";
import { Update } from "typegram";
import scrapeBook from "./scrape";
import { bookScrapeItem } from "./models/bookScrapeItem";
import { addSummaryToTable } from ".";
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
});

bot.command("quit", (ctx) => {
  // Explicit usage
  ctx.telegram.leaveChat(ctx.message.chat.id);
  // Context shortcut
  ctx.leaveChat();
});

bot.on("text", async (ctx) => {
  //   ctx.reply(`you send me: ${ctx.message.text}`);
  const url = ctx.message.text;
  const res: null | bookScrapeItem = await scrapeBook(url);
  ctx.reply(`res: ${JSON.stringify(res)}`);
  // create notion page, ask user first
  if (res) {
    ctx.reply("creating record in Notion table..");
    const addResult = await addSummaryToTable(res);

    if (!addResult) {
      console.log("could not add result to Notion");
      // TODO: retry automatically?
    } else {
      // console.log("addResult: ", JSON.stringify(addResult));
      // FIXME: very ugly method, but notion API does not allow to see properties of response directly
      // See: https://github.com/makenotion/notion-sdk-js/issues/247

      const recreatedObject = JSON.parse(JSON.stringify(addResult));
      console.log("addResult.reparsed: ", recreatedObject.url);
      ctx.reply(`visit the summary at: ${recreatedObject.url}`);
    }
  } else {
    ctx.reply("could not scrape goodreads page");
  }
});

// TODO: ask user to optionally add reminders, they will be set in Notion

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
