import { BotCommand } from "telegraf/typings/core/types/typegram";

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const periodicallyDoTillCondition = async (
  every: number = 3000,
  async_callback: Function,
  callback_params: object,
  condition: boolean = true
) => {
  while (true) {
    // console.log("call");
    const res = await async_callback(callback_params);
    if (res == condition) {
      break;
    }
    await delay(every);
  }
};

const createBotCommandsSummary = (botCommands: Array<BotCommand>): string => {
  const res = botCommands.map((o) => `${o.command} - ${o.description}`);
  return res.join("\n");
};

export { delay, periodicallyDoTillCondition, createBotCommandsSummary };
