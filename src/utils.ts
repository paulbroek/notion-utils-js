const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const periodicallyDoTillCondition = async (
  every: number = 3000,
  async_callback: Function,
  callback_params: any,
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

export { delay, periodicallyDoTillCondition };
