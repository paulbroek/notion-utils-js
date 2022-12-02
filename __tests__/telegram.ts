import { TelegramClient } from "telegram";
import { bookExistsInTable } from "../src/";
import { connectTelegramClient, getLastMessage } from "../src/telegram";
import { delay, periodicallyDoTillCondition } from "../src/utils";
import { createTextChangeRange } from "typescript";

const chatId: number = parseInt(process.env.TELEGRAM_CHAT_ID || "") as number;
const databaseId = process.env.NOTION_DATABASE_ID as string;
const sessionKey: undefined | string = process.env
  .TELEGRAM_SESSION_KEY as string;

const BOOK_URL =
  "https://www.goodreads.com/book/show/56275562-economics-and-math-of-token-engineering-and-defi";

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

test("Integration test: connect to Telegram, set databaseId, add Summary, and delete it", async () => {
  let client: TelegramClient;
  // beforeAll(async () => {
  //   client = await connectTelegramClient(sessionKey);
  // });
  client = await connectTelegramClient(sessionKey);

  try {
    // 0. Set database_id to test database
    await client.sendMessage(chatId, {
      message: `/set_database_id ${databaseId}`,
    });
    await delay(1500);
    // check if bot replied with this databaseId
    const shouldBeDatabaseIdMessage = await getLastMessage(client, chatId);
    console.log("shouldBeDatabaseIdMessage: ", shouldBeDatabaseIdMessage);
    const databaseIdFromMessage =
      "" + shouldBeDatabaseIdMessage.split(" ").pop()?.trim();
    console.log(
      `databaseIdFromMessage=${databaseIdFromMessage.length} databaseId=${databaseId.length}`
    );
    expect(databaseIdFromMessage).toEqual(databaseId);

    // 1. Summary should not exist in table yet
    const toBeAddedBookExists: Boolean = await bookExistsInTable({
      goodreadsUrl: BOOK_URL,
      databaseId,
    });
    expect(toBeAddedBookExists).toEqual(false);

    // 2. Send message to bot to add book summary to Notion
    await client.sendMessage(chatId, { message: `/add ${BOOK_URL}` });

    // 3. Check if page now exists in Notion database
    await delay(1500);
    const justAddedBookExists: Boolean = await periodicallyDoTillCondition(
      1000,
      bookExistsInTable,
      { goodreadsUrl: BOOK_URL, databaseId },
      true
    );
    expect(justAddedBookExists).toEqual(true);
  } finally {
    // reset state to default in case the test fails
    await client.sendMessage(chatId, { message: `/delete ${BOOK_URL}` });
    const lastBookNotExists: Boolean = await periodicallyDoTillCondition(
      1000,
      bookExistsInTable,
      { goodreadsUrl: BOOK_URL, databaseId },
      false
    );
    expect(lastBookNotExists).toEqual(true);
  }
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
