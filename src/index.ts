import { Client } from "@notionhq/client";
import { bookScrapeItem } from "./models/bookScrapeItem";
import { CreatePageResponse } from "@notionhq/client/build/src/api-endpoints";
const notion = new Client({ auth: process.env.NOTION_API_KEY });

const pageId = process.env.NOTION_PAGE_ID as string;
const databaseId = process.env.NOTION_DATABASE_ID as string;

// dummy method to verify if any data can be pulled from Notion API

// (async () => {
//   const response = await notion.pages.retrieve({ page_id: pageId });
//   console.log(response);
// })();

const addSummaryToTable = async (item: bookScrapeItem) => {
  // TODO: check if book exists in table
  const response: CreatePageResponse = await notion.pages.create({
    cover: {
      type: "external",
      external: {
        url: "https://upload.wikimedia.org/wikipedia/commons/6/62/Tuscankale.jpg",
      },
    },
    icon: {
      type: "emoji",
      emoji: "🥬",
    },
    parent: {
      type: "database_id",
      database_id: databaseId,
    },
    properties: {
      Author: {
        title: [
          {
            text: {
              content: item.author,
            },
          },
        ],
      },
      Title: {
        rich_text: [
          {
            text: {
              content: item.title,
            },
          },
        ],
      },
      // isbn: {
      //   rich_text: [
      //     {
      //       text: {
      //         content: item.isbn,
      //       },
      //     },
      //   ],
      // },
    },
    // the actual summary..
    // children: [
    //   {
    //     object: "block",
    //     heading_2: {
    //       rich_text: [
    //         {
    //           text: {
    //             content: "Lacinato kale",
    //           },
    //         },
    //       ],
    //     },
    //   },
    //   {
    //     object: "block",
    //     paragraph: {
    //       rich_text: [
    //         {
    //           text: {
    //             content:
    //               "Lacinato kale is a variety of kale with a long tradition in Italian cuisine, especially that of Tuscany. It is also known as Tuscan kale, Italian kale, dinosaur kale, kale, flat back kale, palm tree kale, or black Tuscan palm.",
    //             link: {
    //               url: "https://en.wikipedia.org/wiki/Lacinato_kale",
    //             },
    //           },
    //           // href: "https://en.wikipedia.org/wiki/Lacinato_kale",
    //         },
    //       ],
    //       color: "default",
    //     },
    //   },
    // ],
  });

  console.log(response);
  return response;
};

export { addSummaryToTable };
