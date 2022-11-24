import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import input from "input";
import { bookExistsInTable, periodicallyDoTillSuccess } from "../src/";

const apiId: number = parseInt(process.env.TELEGRAM_API_ID || "") as number;
const apiHash: string = process.env.TELEGRAM_API_HASH as string;
const chatId: number = parseInt(process.env.TELEGRAM_CHAT_ID || "") as number;
const sessionKey: undefined | string = process.env
  .TELEGRAM_SESSION_KEY as string;

const BOOK_URL =
  "https://www.goodreads.com/book/show/56275562-economics-and-math-of-token-engineering-and-defi?ref=nav_sb_ss_1_39";

// when `sessionKey` is empty, automatically asks for user input
const stringSession = new StringSession(sessionKey);

const connectTelegramClient = async () => {
  console.debug("Loading interactive example...");
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

  console.debug("You should now be connected.");
  if (!sessionKey) {
    // Save this string to ./config/.env.test to auto login later
    console.log("Saved login: " + client.session.save());
  }

  return client;
};

// TODO: turn connectTelegramClient into fixture?
test("connect to Telegram and send message", async () => {
  const client = await connectTelegramClient();
  await client.sendMessage(chatId, { message: "@bookSummariesBot hoi" });
});

test("connect to Telegram and add Summary", async () => {
  const client = await connectTelegramClient();
  await client.sendMessage(chatId, { message: `/add ${BOOK_URL}` });
  // TODO: check if page exists in Notion database
  // TODO: and bot should not have returned error msg
  await periodicallyDoTillSuccess(2000, bookExistsInTable, BOOK_URL);
});

// test("connect to Telegram and delete last Summary", async () => {
//   const client = await connectTelegramClient();
//   await client.sendMessage(chatId, { message: "/delete_last" });
// });

// describe("auth", () => {
//   it("dummy test", () => {
//     // const response = await user.auth('fakeToken')
//     const response = { userId: "fakeUserId" };
//     expect(response).toEqual({ userId: "fakeUserId" });
//   });
// });
