// Add content (== notion row) to Notion database
// consumes data from rabbitmq, sends success/failure message back to Telgram

import amqp from "amqplib/callback_api";
import { bookScrapeItem } from "./models/bookScrapeItem";
import { addSummaryToTable } from "./";

const RMQ_CONNECTION_URL = process.env.RMQ_URL;
// const RMQ_CONSUME_QUEUE = process.env.RMQ_CONSUME_QUEUE;
const RMQ_CONSUME_QUEUE = process.env.RMQ_ADD_ROW_QUEUE;
const RMQ_PUBLISH_QUEUE = process.env.RMQ_PUBLISH_QUEUE;

amqp.connect(RMQ_CONNECTION_URL, (error0, connection) => {
  if (error0) {
    throw error0;
  }

  connection.createChannel((error1, channel) => {
    if (error1) {
      throw error1;
    }

    const queue = RMQ_CONSUME_QUEUE;

    channel.assertQueue(queue, { durable: false });

    console.log(
      ` [*] Waiting for messages in '${queue}'. To exit press CTRL+C`
    );

    channel.consume(
      queue,
      async (msg) => {
        const message = JSON.parse(msg?.content.toString() || "{}");
        console.log(` [x] Received ${JSON.stringify(message)}`);

        // TODO: check if row exists in table?

        // TODO: make generic, support any collection content type
        // TODO: and make any user
        try {
          const { item, databaseId } = message as {
            item: bookScrapeItem;
            databaseId: string;
          };
          const result = await addSummaryToTable(item, databaseId);

          // If successful, publish message to RMQ_PUBLISH_QUEUE
          const publishChannel = await connection.createChannel();
          const publishQueue = RMQ_PUBLISH_QUEUE;
          const publishMessage = JSON.stringify(result);

          publishChannel.assertQueue(publishQueue, { durable: false });
          publishChannel.sendToQueue(publishQueue, Buffer.from(publishMessage));
          console.log(` [x] Sent ${publishMessage} to ${publishQueue}`);
        } catch (error) {
          console.error(`Error adding summary to table: ${error.message}`);
        }

        // Acknowledge message receipt
        channel.ack(msg as amqp.Message);
      },
      { noAck: false }
    );
  });
});
