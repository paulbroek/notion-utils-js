// TODO: move to seperate repo?
import { Context, Markup, Telegraf } from "telegraf";
import { Update } from "typegram";
import scrapeBook from "./scrape";
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
bot.command("keyboard", (ctx) => {
  ctx.reply(
    "Keyboard",
    Markup.inlineKeyboard([
      Markup.button.callback("First option", "first"),
      Markup.button.callback("Second option", "second"),
    ])
  );
});
bot.on("text", async (ctx) => {
  ctx.reply(`you send me: ${ctx.message.text}`);

  const url = ctx.message.text;
  const res = await scrapeBook(url);
  ctx.reply(`res: ${JSON.stringify(res)}`);
  // create notion page, ask user first
  ctx.reply("creating notion page..");
    

  // send url of page to user
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
