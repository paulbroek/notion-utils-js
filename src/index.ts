// const path = require("path");
// import path from "path";
// require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
// import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import { Client } from "@notionhq/client";
// import dotenv from "dotenv";
// dotenv.config();
// console.log("key: ", process.env.NOTION_API_KEY);
console.log("process.env: ", process.env);
const notion = new Client({ auth: process.env.NOTION_API_KEY });

(async () => {
  // const pageId = "801cb6e570304bd89dfb3a2a3adbbeec";
  const pageId =
    "https://www.notion.so/Book-summaries-801cb6e570304bd89dfb3a2a3adbbeec";
  // const pageId =
  //   "https://arrow-inch-f1e.notion.site/Book-summaries-801cb6e570304bd89dfb3a2a3adbbeec";
  const response = await notion.pages.retrieve({ page_id: pageId });
  console.log(response);
})();

// (async () => {
//   const response = await notion.pages.create({
//     cover: {
//       type: "external",
//       external: {
//         url: "https://upload.wikimedia.org/wikipedia/commons/6/62/Tuscankale.jpg",
//       },
//     },
//     icon: {
//       type: "emoji",
//       emoji: "🥬",
//     },
//     parent: {
//       type: "database_id",
//       // database_id: "d9824bdc-8445-4327-be8b-5b47500af6ce",
//       database_id: "98e9ac610f6b4025a4b65d86b12809e8",
//     },
//     properties: {
//       Name: {
//         title: [
//           {
//             text: {
//               content: "Tuscan kale",
//             },
//           },
//         ],
//       },
//       Description: {
//         rich_text: [
//           {
//             text: {
//               content: "A dark green leafy vegetable",
//             },
//           },
//         ],
//       },
//       "Food group": {
//         select: {
//           name: "🥬 Vegetable",
//         },
//       },
//     },
//     children: [
//       {
//         object: "block",
//         heading_2: {
//           rich_text: [
//             {
//               text: {
//                 content: "Lacinato kale",
//               },
//             },
//           ],
//         },
//       },
//       {
//         object: "block",
//         paragraph: {
//           rich_text: [
//             {
//               text: {
//                 content:
//                   "Lacinato kale is a variety of kale with a long tradition in Italian cuisine, especially that of Tuscany. It is also known as Tuscan kale, Italian kale, dinosaur kale, kale, flat back kale, palm tree kale, or black Tuscan palm.",
//                 link: {
//                   url: "https://en.wikipedia.org/wiki/Lacinato_kale",
//                 },
//               },
//               // href: "https://en.wikipedia.org/wiki/Lacinato_kale",
//             },
//           ],
//           color: "default",
//         },
//       },
//     ],
//   });
//   console.log(response);
// })();

// const databaseId = process.env.NOTION_DATABASE_ID

// async function addItem(text) {
//   try {
//     const response = await notion.pages.create({
//       parent: { database_id: databaseId },
//       properties: {
//         title: {
//           title:[
//             {
//               "text": {
//                 "content": text
//               }
//             }
//           ]
//         }
//       },
//     })
//     console.log(response)
//     console.log("Success! Entry added.")
//   } catch (error) {
//     console.error(error.body)
//   }
// }

// addItem("Yurts in Big Sur, California")
