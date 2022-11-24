import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import input from "input";
import { bookExistsInTable } from "../src/";
import { periodicallyDoTillCondition } from "../src/utils";

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

test("connect to Telegram, add Summary, and delete it", async () => {
  const client = await connectTelegramClient();
  await client.sendMessage(chatId, { message: `/add ${BOOK_URL}` });
  // check if page exists in Notion database
  // TODO: and bot should not have returned error msg
  await periodicallyDoTillCondition(1000, bookExistsInTable, BOOK_URL, true);

  await client.sendMessage(chatId, { message: "/delete_last" });
  // now wait for it to disappear
  await periodicallyDoTillCondition(1000, bookExistsInTable, BOOK_URL, false);
});

// TODO: runs after previous test?
// or include both functionalities in above test
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
