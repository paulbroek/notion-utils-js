import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import input from "input";

const apiId: number = parseInt(process.env.TELEGRAM_API_ID || "") as number;
const apiHash: string = process.env.TELEGRAM_API_HASH as string;
const chatId: number = parseInt(process.env.TELEGRAM_CHAT_ID || "") as number;
const sessionKey: undefined | string = process.env
  .TELEGRAM_SESSION_KEY as string;
// console.log("sessionKey: ", sessionKey);
const stringSession = new StringSession(sessionKey); // this later with the value from session.save()

test("connect to Telegram", async () => {
  console.log("Loading interactive example...");
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

  console.log("You should now be connected.");
  if (!sessionKey) {
    console.log("Saved login: " + client.session.save()); // Save this string to ./config/.env.test to auto login later
  }
  // await client.sendMessage("me", { message: "Hello!" });
  await client.sendMessage(chatId, { message: "@bookSummariesBot hoi" });

  const response = { userId: "fakeUserId" };
  expect(response).toEqual({ userId: "fakeUserId" });
});

// describe("auth", () => {
//   it("dummy test", () => {
//     // const response = await user.auth('fakeToken')
//     const response = { userId: "fakeUserId" };
//     expect(response).toEqual({ userId: "fakeUserId" });
//   });
// });
