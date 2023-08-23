// Add content (== notion row) to Notion database
// consumes data from rabbitmq, sends success/failure message back to Telgram

import amqp, { Channel, Connection } from "amqplib/callback_api";
import { bookScrapeItem } from "./models/bookScrapeItem";
import {
  addSummaryToTable,
  addYoutubeMetadataToTable,
  violatesUniqueRows,
} from "./";
import { enableTimestampedLogging } from "./utils";
import { scrapeItem } from "./models/scrapeItem";
import { DataCollection } from "@prisma/client";
import { CreatePageResponse } from "@notionhq/client/build/src/api-endpoints";
import { videoScrapeItem } from "./models/videoScrapeItem";

const RMQ_CONNECTION_URL = process.env.RMQ_URL;
// const RMQ_CONSUME_QUEUE = process.env.RMQ_CONSUME_QUEUE;
const RMQ_CONSUME_QUEUE = process.env.RMQ_ADD_ROW_QUEUE;
const RMQ_PUBLISH_QUEUE = process.env.RMQ_PUBLISH_QUEUE;

if (!RMQ_CONSUME_QUEUE) {
  throw new Error("RMQ_ADD_ROW_QUEUE environment variable is not set");
}

enableTimestampedLogging();

let connection: Connection;
let channel: Channel;

// how to auto connect after restart of rabbitmq service?

// amqp.connect(RMQ_CONNECTION_URL, (error0, connection) => {
//   if (error0) {
//     throw error0;
//   }

//   connection.createChannel((error1, channel) => {
//     if (error1) {
//       throw error1;
//     }

//     const queue = RMQ_CONSUME_QUEUE;

//     channel.assertQueue(queue, { durable: false });

//     console.log(
//       ` [*] Waiting for messages in '${queue}'. To exit press CTRL+C`
//     );

//     channel.consume(
//       queue,
//       async (msg) => {
//         const message = JSON.parse(msg?.content.toString() || "{}");
//         console.log(` [x] Received ${JSON.stringify(message)}`);

//         // TODO: check if row exists in table?

//         // TODO: make generic, support any collection content type
//         // TODO: and make any user
//         try {
//           const { item, databaseId } = message as {
//             item: bookScrapeItem;
//             databaseId: string;
//           };
//           const addSummaryResult = await addSummaryToTable(item, databaseId);

//           // If successful, publish message to RMQ_PUBLISH_QUEUE
//           const publishChannel = await connection.createChannel();
//           const publishQueue = RMQ_PUBLISH_QUEUE;
//           const publishMessage = JSON.stringify(addSummaryResult);

//           publishChannel.assertQueue(publishQueue, { durable: false });
//           // combine the addSummaryResult with the parameters received from queue
//           const combinedPayload = Object.assign(
//             {},
//             { message: "succesfully added row to Notion table!" },
//             message
//           );
//           const combinedMessage = JSON.stringify(combinedPayload);
//           // publishChannel.sendToQueue(publishQueue, Buffer.from(publishMessage));
//           publishChannel.sendToQueue(
//             publishQueue,
//             Buffer.from(combinedMessage)
//           );
//           console.log(
//             ` [x] Sent \n\n${combinedMessage} \n\nto ${publishQueue}`
//           );
//         } catch (error) {
//           console.error(`Error adding summary to table: ${error.message}`);
//         }

//         // Acknowledge message receipt
//         channel.ack(msg as amqp.Message);
//       },
//       { noAck: false }
//     );
//   });
// });

// TODO: should be generic, support any collection type
// TODO: and support any user
const handleReceivedMessage = async (msg: amqp.Message | null) => {
  if (!msg) {
    return;
  }

  const message = JSON.parse(msg.content.toString() || "{}");
  console.log(
    ` [x] Received from '${RMQ_CONSUME_QUEUE}': \n${JSON.stringify(message)}`
  );

  const { item, collection, notionDatabaseId } = message as {
    item: scrapeItem;
    // item: bookScrapeItem;
    collection: DataCollection;
    notionDatabaseId: string;
  };

  // TODO: check if row exists in table?
  try {
    const existsInTable: Boolean = await violatesUniqueRows(
      item,
      collection,
      notionDatabaseId
    );
    if (existsInTable) {
      channel.ack(msg);
      return;
    }
  } catch (error) {
    console.error(`Error verifying duplicate rows: ${error.message}`);
    // channel.ack(msg);
    return;
  }

  try {
    let addRowResult: CreatePageResponse;

    // determine what endpoint should be called based on collection type
    switch (collection) {
      case DataCollection.GOODREADS:
        // unsafe?
        const bookItem = item as bookScrapeItem;
        // TODO: check if bookItem not null
        addRowResult = await addSummaryToTable(bookItem, notionDatabaseId);
        break;

      case DataCollection.YOUTUBE:
        // TODO: include type checking of pydantic model
        const videoItem = item as videoScrapeItem;
        addRowResult = await addYoutubeMetadataToTable(
          videoItem,
          notionDatabaseId
        );
        break;

      default:
        throw new Error(
          `collection type not implemented for collection: ${collection}`
        );
    }

    // If successful, publish message to RMQ_PUBLISH_QUEUE
    const publishChannel = await connection.createChannel();
    const publishQueue = RMQ_PUBLISH_QUEUE;
    const publishMessage = JSON.stringify(addRowResult);

    publishChannel.assertQueue(publishQueue, { durable: false });
    // combine the addRowResult with the parameters received from queue
    const combinedPayload = Object.assign(
      {},
      { message: "successfully added row to Notion table!" },
      message
    );
    const combinedMessage = JSON.stringify(combinedPayload);
    // publishChannel.sendToQueue(publishQueue, Buffer.from(publishMessage));
    publishChannel.sendToQueue(publishQueue, Buffer.from(combinedMessage));
    console.log(` [x] Sent to '${publishQueue}': \n\n${combinedMessage}`);
  } catch (error) {
    console.error(`Error adding row to table: ${error.message}`);
  }

  // Acknowledge message receipt
  channel.ack(msg);
};

const consumeFromQueue = (queue: string) => {
  channel.assertQueue(queue, { durable: false });

  console.log(` [*] Waiting for messages in '${queue}'. To exit press CTRL+C`);

  channel.consume(queue, handleReceivedMessage, { noAck: false });
};

// implements auto reconnecting to rabbitmq in case container restarts or any other connection error
// TODO: this approach suggested by ChatGPT is not working yet, I don't see it auto reconnecting
const connectToRMQ = () => {
  amqp.connect(RMQ_CONNECTION_URL, (error0, conn) => {
    if (error0) {
      console.error(`Failed to connect to RMQ: ${error0.message}`);
      setTimeout(connectToRMQ, 5000); // try to reconnect every 5 seconds
      return;
    }

    connection = conn;

    connection.on("error", (error) => {
      if (error.message !== "Connection closing") {
        console.error(`RMQ connection error: ${error.message}`);
      }
    });

    connection.on("close", () => {
      console.warn(`RMQ connection closed, trying to reconnect...`);
      setTimeout(connectToRMQ, 5000); // try to reconnect every 5 seconds
    });

    connection.createChannel((error1, ch) => {
      if (error1) {
        console.error(`Failed to create RMQ channel: ${error1.message}`);
        return;
      }

      channel = ch;

      consumeFromQueue(RMQ_CONSUME_QUEUE);
    });
  });
};

connectToRMQ();
