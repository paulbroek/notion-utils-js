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
const databaseId = process.env.NOTION_DATABASE_ID as string;

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

// TODO: use inner tests for longer tests, see:
// https://stackoverflow.com/questions/51269431/jest-mock-inner-function
describe("Integration test: connect to Telegram, set databaseId, add Summary, and delete it", () => {
  let client: TelegramClient;
  beforeAll(async () => {
    client = await connectTelegramClient();
  });

  test("0. Set database_id to test database", async () => {
    await client.sendMessage(chatId, {
      message: `/set_database_id ${databaseId}`,
    });
    // TODO: check if bot replied with this databaseId
  });

  // Summary should not exist in table yet, or create a new database yourself
  test("1. Summary should not exist in table yet", async () => {
    const bookExists = await bookExistsInTable({
      goodreadsUrl: BOOK_URL,
      databaseId,
    });
    expect(bookExists).toEqual(false);
  });

  test("2. Send message to bot to add book summary to Notion", async () => {
    await client.sendMessage(chatId, { message: `/add ${BOOK_URL}` });
  });

  test("3. Check if page now exists in Notion database", async () => {
    await periodicallyDoTillCondition(
      1000,
      bookExistsInTable,
      { goodreadsUrl: BOOK_URL, databaseId },
      true
    );
  });

  test("4. Delete summary from Notion database through Telegram and check if it is deleted", async () => {
    await client.sendMessage(chatId, { message: "/delete_last" });
    await periodicallyDoTillCondition(
      1000,
      bookExistsInTable,
      { goodreadsUrl: BOOK_URL, databaseId },
      false
    );
  });

  // TODO: add afterAll to close client connection
  // should be able to run without --force-exit flag
  // option: set databaseId back to what is was before testing.
  // option: create chatGroup programatically and add the bot
});

// describe("Add a book summary twice, should fail second time", async () => {
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
