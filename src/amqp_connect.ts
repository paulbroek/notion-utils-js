import amqp from "amqplib/callback_api";
import { Context, Telegraf, Telegram } from "telegraf";
import axios from "axios";
import { Update } from "typegram";

import { postAddRow, getKeyFromUrl } from "./telegram/index";

const API_HOST: string = process.env.API_HOST as string;
const API_PORT: string = process.env.API_PORT as string;

const MAX_RETRIES = 5;
const RETRY_TIMEOUT_MS = 5000;

console.log("rmq url: ", process.env.RMQ_URL);

const sendMessageToChat = (
  bot: Telegraf<Context<Update>>,
  telegram: Telegram,
  chatId: string,
  msg: string
) => {
  bot.telegram
    .getChat(chatId)
    .then((chat) => {
      telegram.sendMessage(chatId, msg);
    })
    .catch((error) => {
      console.log(`Chat ${chatId} does not exist: ${error.description}`);
    });
};

// connect to rabbitmq
// auto reconnect for lost connection
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

        // the queue of ready-to-add items. they exist in db
        const queue_publish = process.env.RMQ_PUBLISH_QUEUE;
        channel.assertQueue(queue_publish, { durable: false });

        // the queue of not-ready-to-add items. they are being scraped
        const queue_to_scrape = process.env.RMQ_VERIFY_SCRAPED_QUEUE;
        channel.assertQueue(queue_to_scrape, { durable: false });

        console.log(
          ` [*] Waiting for messages in '${queue_publish}' and '${queue_to_scrape}'. To exit press CTRL+C`
        );

        channel.consume(
          queue_publish,
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

        channel.consume(
          queue_to_scrape,
          async (msg) => {
            const raw_message: string = msg.content.toString();
            console.log(` [x] Received to_scrape message: ${raw_message}`);

            const message = JSON.parse(raw_message);
            const chatId = message.telegramChatId;

            // periodically check if item exists in database
            // not sure if this is best approach, calling pg/book endpoint directly

            const endpoint: string = "pg/book";
            // const params = { url_or_id: message.url };

            // const url: string = `http://${API_HOST}:${API_PORT}/${endpoint}`;
            const url: string = `http://${API_HOST}:${API_PORT}/${endpoint}?url_or_id=${message.url}`;
            console.debug(`url: ${url}`);

            sendMessageToChat(
              bot,
              telegram,
              chatId,
              "item does not exist in db, it is being collected"
            );

            // max 5 times check if item exists in db
            let retries = 0;
            while (retries < MAX_RETRIES) {
              try {
                const response = await axios.get(url);
                console.log(
                  "pg/book response: " + JSON.stringify(response.data)
                );
                console.log(`retries: ${retries}`);
                if (response.data.success) {
                  // adding the row to notion table via rabbitmq request through fastapi
                  msg = `added book to Notion page in ${
                    retries * (RETRY_TIMEOUT_MS / 1000)
                  } seconds`;
                  console.log(msg);
                  const collectionKey: string | null = getKeyFromUrl(
                    message.url
                  );
                  if (collectionKey === null) {
                    msg = `something went wrong, collection cannot be extracted from url: ${message.url}`;
                    return msg;
                  }
                  // TODO: retrieve telegramChatId
                  const params = {
                    url: message.url,
                    telegramChatId: "-877077753",
                    telegramUserId: message.telegramUserId,
                    notionDatabaseId: message.databaseId,
                  };
                  msg = await postAddRow(params, collectionKey);
                  sendMessageToChat(bot, telegram, chatId, msg);
                  return;
                }
                // return response.data.message;
              } catch (error) {
                // TODO: do not output to user, but to issue list
                msg = "internal error calling api: " + error.response.body;
                console.log(msg);
                console.log("error.message: " + error.message);

                return;
              }

              retries++;

              if (retries < MAX_RETRIES) {
                console.log(`Retrying in ${RETRY_TIMEOUT_MS}ms...`);
                await new Promise((resolve) =>
                  setTimeout(resolve, RETRY_TIMEOUT_MS)
                );
              } else {
                console.log(`Max retries reached (${MAX_RETRIES}).`);
                msg = "could not add row to notion table, inform admin";
                //   return msg;
                sendMessageToChat(bot, telegram, chatId, msg);
              }
            }
          },
          { noAck: true }
        );
      });
    });
  };

  connectAndConsume();
};
