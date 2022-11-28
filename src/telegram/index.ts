import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import input from "input";

const apiId: number = parseInt(process.env.TELEGRAM_API_ID || "") as number;
const apiHash: string = process.env.TELEGRAM_API_HASH as string;

const connectTelegramClient = async (sessionKey: string) => {
  // when `sessionKey` is empty, automatically asks for user input
  const stringSession = new StringSession(sessionKey);

  console.debug("Loading interactive example...");
  //   console.log("stringSession: ", stringSession, apiId, apiHash);
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

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
    console.log("Saved login: " + client.session.save());
  }

  return client;
};

export { connectTelegramClient };
