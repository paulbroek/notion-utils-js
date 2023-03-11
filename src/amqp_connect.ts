// TODO: move rabbitmq functionality to other file
import amqp from "amqplib/callback_api";
import { Context, Telegraf, Telegram } from "telegraf";
import { Update } from "typegram";

console.log("rmq url: ", process.env.RMQ_URL);

export const amqp_connect = (
  bot: Telegraf<Context<Update>>,
  telegram: Telegram
) => {
  amqp.connect(process.env.RMQ_URL, (error0, connection) => {
    if (error0) {
      throw error0;
    }

    connection.createChannel((error1, channel) => {
      if (error1) {
        throw error1;
      }

      // TODO: how to pass publish queue msgs to consume?
      // const queue = process.env.RMQ_CONSUME_QUEUE;
      const queue = process.env.RMQ_PUBLISH_QUEUE;

      channel.assertQueue(queue, { durable: false });

      console.log(
        ` [*] Waiting for messages in ${queue}. To exit press CTRL+C`
      );

      channel.consume(
        queue,
        (msg) => {
          const raw_message: string = msg.content.toString();
          console.log(` [x] Received ${raw_message}`);

          const message = JSON.parse(raw_message);
          const chatId = message.telegramChatId;

          // check if chatId exists
          bot.telegram
            .getChat(chatId)
            .then((chat) => {
              // console.log(`Chat ${chatId} exists: ${chat}`);
              // Send the received message to the Telegram bot
              telegram.sendMessage(chatId, message.message);
            })
            .catch((error) => {
              console.log(
                `Chat ${chatId} does not exist: ${error.description}`
              );
            });
        },
        { noAck: true }
      );
    });
  });
};
