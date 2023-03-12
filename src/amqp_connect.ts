import amqp from "amqplib/callback_api";
import { Context, Telegraf, Telegram } from "telegraf";
import { Update } from "typegram";

console.log("rmq url: ", process.env.RMQ_URL);

export const amqp_connect = (
  bot: Telegraf<Context<Update>>,
  telegram: Telegram,
  reconnectDelay = 5000 // delay between reconnection attempts in milliseconds
) => {
  console.log("rmq url: ", process.env.RMQ_URL);

  const connectAndConsume = () => {
    amqp.connect(process.env.RMQ_URL, (error0, connection) => {
      if (error0) {
        console.error("AMQP connection error", error0);
        setTimeout(connectAndConsume, reconnectDelay);
        return;
      }

      connection.on("error", (error) => {
        console.error("AMQP connection error", error);
        if (!error.message.includes("HEARTBEAT")) {
          connection.close();
          setTimeout(connectAndConsume, reconnectDelay);
        }
      });

      connection.on("close", () => {
        console.warn("AMQP connection closed");
        setTimeout(connectAndConsume, reconnectDelay);
      });

      connection.createChannel((error1, channel) => {
        if (error1) {
          console.error("AMQP channel error", error1);
          connection.close();
          setTimeout(connectAndConsume, reconnectDelay);
          return;
        }

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

  connectAndConsume();
};
