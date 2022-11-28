import { TelegramClient } from "telegram";
import { bookExistsInTable } from "../src/";
import { connectTelegramClient } from "../src/telegram";
import { periodicallyDoTillCondition } from "../src/utils";
import { createTextChangeRange } from "typescript";

const chatId: number = parseInt(process.env.TELEGRAM_CHAT_ID || "") as number;
const databaseId = process.env.NOTION_DATABASE_ID as string;
const sessionKey: undefined | string = process.env
  .TELEGRAM_SESSION_KEY as string;

const BOOK_URL =
  "https://www.goodreads.com/book/show/56275562-economics-and-math-of-token-engineering-and-defi?ref=nav_sb_ss_1_39";

// TODO: turn connectTelegramClient into fixture?
test("connect to Telegram and send message", async () => {
  const client = await connectTelegramClient(sessionKey);
  const testMessage: string = "@bookSummariesBot hoi";
  await client.sendMessage(chatId, { message: testMessage });
  // test if last message is indeed send
  const msgs = await client.getMessages(chatId, { limit: 1 });
  const lastMessage: string = msgs[0].message;
  expect(testMessage).toEqual(lastMessage);
});

describe("Integration test: connect to Telegram, set databaseId, add Summary, and delete it", () => {
  let client: TelegramClient;
  beforeAll(async () => {
    client = await connectTelegramClient(sessionKey);
  });

  test("0. Set database_id to test database", async () => {
    await client.sendMessage(chatId, {
      message: `/set_database_id ${databaseId}`,
    });
    // check if bot replied with this databaseId
    const msgs = await client.getMessages(chatId, { limit: 1 });
    const lastMessage: string = msgs[0].message;
    console.log("lastMessage: ", lastMessage);
    const databaseIdFromMessage = lastMessage.split(" ").pop();
    console.log("databaseIdFromMessage: ", databaseIdFromMessage);
    expect(databaseIdFromMessage).toEqual(databaseId);
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
  afterAll(async () => {
    await client.disconnect();
    await client.destroy();
  });
  // TODO: should be able to run without --force-exit flag
  // option: set databaseId back to what is was before testing.
  // option: create chatGroup progratically and add the bot
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
