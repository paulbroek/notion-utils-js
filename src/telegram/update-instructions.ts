import { connectTelegramClient, createTelegramClient } from ".";
import { createBotCommandsSummary } from "../utils";
import botCommands from "../data/bot-commands.json";

const sessionKey: undefined | string = process.env
  .TELEGRAM_SESSION_KEY as string;
const TELEGRAM_BOT_NAME: string = process.env.TELEGRAM_BOT_NAME as string;
// const TELEGRAM_BOT_NAME_TEST: string = process.env
//   .TELEGRAM_BOT_NAME_TEST as string;
const CHAT_ID = "botfather";

const BOT_NAME = TELEGRAM_BOT_NAME;
// const BOT_NAME = TELEGRAM_BOT_NAME_TEST;

const client = createTelegramClient(sessionKey);

// parse commands from json file and push to botfather
async function main(): Promise<void> {
  if (!sessionKey) {
    console.error("should pass sessionKey");
    return;
  }
  await connectTelegramClient(sessionKey, client);
  const summary = createBotCommandsSummary(botCommands);

  // console.log(summary);
  const msgFlow = ["/cancel", "/setcommands", `@${BOT_NAME}`, summary];

  for (const [ix, msg] of msgFlow.entries()) {
    console.log(`send msg ${ix} to ${CHAT_ID}: \n${msg}`);
    await client.sendMessage(CHAT_ID, { message: msg });
  }
}

main()
  .catch((e) => {
    console.error(e.message);
  })
  .finally(async () => {
    // not working? -> wait 30 seconds to finish
    await client.disconnect();
    await client.destroy();
  });
