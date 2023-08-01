import { BotCommand } from "telegraf/typings/core/types/typegram";

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const periodicallyDoTillCondition = async (
  every: number = 3000,
  async_callback: Function,
  callback_params: object,
  condition: boolean = true
): Promise<Boolean> => {
  while (true) {
    const res = await async_callback(callback_params);
    if (res == condition) {
      console.log("meets condition!");
      return true;
    }
    await delay(every);
  }
  return false;
};

const createBotCommandsSummary = (
  botCommands: Array<BotCommand>,
  withDash = false
): string => {
  const pfx = withDash ? "/" : "";
  const res = botCommands.map(
    (o) => `${pfx}` + `${o.command} - ${o.description}`
  );
  return res.join("\n");
};

const enableTimestampedLogging = () => {
  const originalLog = console.log;

  // Overwriting console.* methods
  console.log = function () {
    const args = [].slice.call(arguments);
    originalLog.apply(console.log, [getCurrentDateString()].concat(args));
  };

  console.debug = function () {
    const args = [].slice.call(arguments);
    originalLog.apply(console.log, [getCurrentDateString()].concat(args));
  };

  // Returns current timestamp
  console.error = function () {
    const args = [].slice.call(arguments);
    originalLog.apply(console.log, [getCurrentDateString()].concat(args));
  };

  function getCurrentDateString() {
    return new Date().toISOString() + " ::";
  }
};
export {
  delay,
  periodicallyDoTillCondition,
  createBotCommandsSummary,
  enableTimestampedLogging,
};
