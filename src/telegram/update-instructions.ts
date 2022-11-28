import { connectTelegramClient } from ".";
import { createBotCommandsSummary } from "../utils";
import botCommands from "../bot-commands.json";

const sessionKey: undefined | string = process.env
  .TELEGRAM_SESSION_KEY as string;
const TELEGRAM_BOT_NAME: string = process.env.TELEGRAM_BOT_NAME as string;
const TELEGRAM_BOT_NAME_TEST: string = process.env
  .TELEGRAM_BOT_NAME_TEST as string;
const CHAT_ID = "botfather";

// const BOT_NAME = TELEGRAM_BOT_NAME;
const BOT_NAME = TELEGRAM_BOT_NAME_TEST;

// parse commands from json file and push to botfather
(async () => {
  const summary = createBotCommandsSummary(botCommands);
  // console.log(summary);
  const msgFlow = ["/cancel", "/setcommands", `@${BOT_NAME}`, summary];

  const client = await connectTelegramClient(sessionKey);

  for (const [ix, msg] of msgFlow.entries()) {
    console.log(`send msg ${ix} to ${CHAT_ID}: \n${msg}`);
    await client.sendMessage(CHAT_ID, { message: msg });
  }
})();
