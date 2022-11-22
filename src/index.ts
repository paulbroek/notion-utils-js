import { Client } from "@notionhq/client";
import { bookScrapeItem } from "./models/bookScrapeItem";
import { CreatePageResponse } from "@notionhq/client/build/src/api-endpoints";
const notion = new Client({ auth: process.env.NOTION_API_KEY });

const pageId = process.env.NOTION_PAGE_ID as string;
const databaseId = process.env.NOTION_DATABASE_ID as string;
console.log("pageId: ", pageId);

// dummy method to verify if any data can be pulled from Notion API

const getPage = async (pageId: string) => {
  const response: any = await notion.pages.retrieve({ page_id: pageId });
  console.log("response: ", response);
  console.log("Object.keys(response): ", Object.keys(response));
  console.log(
    "response.properties.title.title: ",
    response.properties.title.title
  );
  return response;
};
(async () => getPage(pageId))();

// Can only fetch pages by parent page
// const getPages = async (): Promise<null> => {};

// const getPageProperties = async (pageId: string, propertyId: string) => {
//   const response = await notion.pages.properties.retrieve({
//     page_id: pageId,
//     property_id: propertyId,
//   });
//   console.log("response: ", response);
//   return response;
// };
// (async () => getPageProperties(pageId))();

const bookExistsInTable = async (item: bookScrapeItem): Promise<Boolean> => {
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      and: [
        { property: "Author", rich_text: { equals: item.author } },
        { property: "Title", title: { equals: item.title } },
      ],
    },
  });
  // console.log("response: ", JSON.stringify(response));
  return response.results.length ? true : false;
};

const addSummaryToTable = async (
  item: bookScrapeItem
): Promise<CreatePageResponse> => {
  // TODO: check if book exists in table
  // Use title + author
  const response: CreatePageResponse = await notion.pages.create({
    cover: {
      type: "external",
      external: {
        url: "https://upload.wikimedia.org/wikipedia/commons/6/62/Tuscankale.jpg",
      },
    },
    // icon: {
    //   type: "emoji",
    //   emoji: "🥬",
    // },
    parent: {
      type: "database_id",
      database_id: databaseId,
    },
    properties: {
      Title: {
        title: [
          {
            text: {
              content: item.title,
            },
          },
        ],
      },
      Author: {
        rich_text: [
          {
            text: {
              content: item.author,
            },
          },
        ],
      },
      Goodreads: {
        url: item.goodreadsUrl,
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

export { addSummaryToTable, bookExistsInTable };
