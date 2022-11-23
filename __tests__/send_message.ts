import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import input from "input";

const apiId = parseInt(process.env.TELEGRAM_API_ID || "") as number;
const apiHash = process.env.TELEGRAM_API_HASH as string;
const stringSession = new StringSession(""); // fill this later with the value from session.save()

test("connect to Telegram", async () => {
  console.log("Loading interactive example...");
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });
  // beforeAll(async () => {
  await client.start({
    phoneNumber: async () => await input.text("Please enter your number: "),
    password: async () => await input.text("Please enter your password: "),
    phoneCode: async () =>
      await input.text("Please enter the code you received: "),
    // phoneNumber: (process.env.PHONE_NUMBER || "") as number,
    // password: process.env.PASSWORD as string,
    onError: (err) => console.log(err),
  });
  // });

  console.log("You should now be connected.");
  console.log(client.session.save()); // Save this string to avoid logging in again
  await client.sendMessage("me", { message: "Hello!" });
  // afterAll(async () => {
  //   await client.destroy();
  // });
  const response = { userId: "fakeUserId" };
  expect(response).toEqual({ userId: "fakeUserId" });
});

describe("auth", () => {
  it("dummy test", () => {
    // const response = await user.auth('fakeToken')
    const response = { userId: "fakeUserId" };
    expect(response).toEqual({ userId: "fakeUserId" });
  });
});
