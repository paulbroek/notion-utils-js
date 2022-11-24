import { Client } from "@notionhq/client";
import { bookScrapeItem } from "./models/bookScrapeItem";
import { CreatePageResponse } from "@notionhq/client/build/src/api-endpoints";
import { WatchDirectoryFlags } from "typescript";
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

const deletePage = async (pageId: string) => {
  // beset practice is to not actually delete, but set `archived` to true.
  // also safer for exposing Notion through Telegram, if anyone would get access to your bot.
  await notion.pages.update({ page_id: pageId, archived: true });
  console.log("page deleted");
};

const deleteLastSummary = async (): Promise<string | undefined> => {
  // 1. get summaries sorted by `Created time`
  const response = await notion.databases.query({
    database_id: databaseId,
    sorts: [
      {
        property: "Created time",
        direction: "descending",
      },
    ],
    page_size: 1,
  });

  // console.log("res len: " + response.results.length);
  if (response.results.length == 0) {
    console.error("no results in table");
    return;
  }
  const lastSummaryPage = response.results[0];
  const lastSummaryId = lastSummaryPage.id;
  // const lastSummaryUrl = lastSummaryPage["url"];
  const lastSummaryTitle =
    lastSummaryPage["properties"]["Title"].title[0].text.content;
  console.log("lastSummaryId: " + lastSummaryId);
  // console.log("lastSummaryUrl: " + lastSummaryUrl);
  console.log("lastSummaryTitle: " + lastSummaryTitle);
  console.log(lastSummaryPage);

  // 2. delete summary
  // 2.1 only allow to delete when page text is empty
  // retrieving page content is not easy, so use the difference between created_time and last_edited_time to determine if it has been manually edited
  if (lastSummaryPage["created_time"] != lastSummaryPage["last_edited_time"]) {
    return "cannot delete, since page was manually edited";
  }

  try {
    await deletePage(lastSummaryId);
    // return lastSummaryId;
    return lastSummaryTitle;
  } catch (error) {
    console.error(error);
  }
};

const bookExistsInTable = async (url: string): Promise<Boolean> => {
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      and: [{ property: "Goodreads URL", url: { equals: url } }],
    },
  });
  return response.results.length ? true : false;
};

const addSummaryToTable = async (
  item: bookScrapeItem
): Promise<CreatePageResponse> => {
  // TODO: check if book exists in table
  // Use title + author
  console.error("item.authorUrl: ", JSON.stringify(item.authorUrl));
  const response: CreatePageResponse = await notion.pages.create({
    cover: {
      type: "external",
      external: {
        url:
          item.coverUrl ||
          "https://upload.wikimedia.org/wikipedia/commons/6/62/Tuscankale.jpg",
        // url: "https://upload.wikimedia.org/wikipedia/commons/6/62/Tuscankale.jpg",
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
            type: "text",
            text: {
              content: item.author,
              link: {
                // TODO: inject author URL
                // url: item.authorUrl,
                url: "http://www.nu.nl",
              },
            },
          },
        ],
      },
      "Goodreads URL": {
        url: item.goodreadsUrl,
        // url: "" + item.coverUrl,
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

export { addSummaryToTable, bookExistsInTable, deleteLastSummary };
