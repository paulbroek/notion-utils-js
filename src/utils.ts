import { BotCommand } from "telegraf/typings/core/types/typegram";

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const periodicallyDoTillCondition = async (
  every: number = 3000,
  async_callback: Function,
  callback_params: object,
  condition: boolean = true
): Promise<Boolean> => {
  // try {
  while (true) {
    const res = await async_callback(callback_params);
    if (res == condition) {
      console.log("meets condition!");
      return true;
      // break;
    }
    await delay(every);
  }
  // } finally {
  //   return false;
  // }
  return false;
};

const createBotCommandsSummary = (
  botCommands: Array<BotCommand>,
  withDash = false
): string => {
  const res = botCommands.map(
    (o) => `${withDash && "/"}` + `${o.command} - ${o.description}`
  );
  return res.join("\n");
};

export { delay, periodicallyDoTillCondition, createBotCommandsSummary };
