import { scrapeItem } from "./models/scrapeItem";
import { Client } from "@notionhq/client";
import { bookScrapeItem } from "./models/bookScrapeItem";
import { CreatePageResponse } from "@notionhq/client/build/src/api-endpoints";
import { COLLECTIONS } from "./types";
import { DataCollection } from "@prisma/client";
import { videoScrapeItem } from "./models/videoScrapeItem";
const notion = new Client({ auth: process.env.NOTION_API_KEY });

// const pageId = process.env.NOTION_PAGE_ID as string;
// console.log("pageId: ", pageId);

// dummy method to verify if any data can be pulled from Notion API
// const getPage = async (pageId: string) => {
//   const response: any = await notion.pages.retrieve({ page_id: pageId });
//   console.log("response: ", response);
//   console.log("Object.keys(response): ", Object.keys(response));
//   console.log(
//     "response.properties.title.title: ",
//     response.properties.title.title
//   );
//   return response;
// };
// (async () => getPage(pageId))();

const deletePage = async (pageId: string) => {
  // best practice is to not actually delete, but set `archived` to true.
  // also safer for exposing Notion through Telegram, if anyone would get access to your bot.
  await notion.pages.update({ page_id: pageId, archived: true });
  console.log("page deleted");
};

const deleteSummaryById = async (
  databaseId: string,
  url: string,
  allowOnlyNonEdited = true
): Promise<string | undefined> => {
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: "Goodreads URL",
      url: { equals: url },
    },

    page_size: 1,
  });
  if (response.results.length == 0) {
    const msg = "could not find book in table";
    console.error(msg);
    return msg;
  }

  const lastSummaryPage = response.results[0];
  const lastSummaryId = lastSummaryPage.id;
  const lastSummaryTitle =
    lastSummaryPage["properties"]["Title"].title[0].text.content;

  if (
    allowOnlyNonEdited &&
    lastSummaryPage["created_time"] != lastSummaryPage["last_edited_time"]
  ) {
    // TODO: tell user when it was last edited using timeAgo
    const msg = "cannot delete, since page was manually edited";
    console.error(msg);
    return msg;
  }

  try {
    await deletePage(lastSummaryId);
    console.log("deleted ", lastSummaryTitle);
    return lastSummaryTitle;
  } catch (error) {
    console.error(error);
  }
};

const deleteLastSummary = async (
  databaseId: string,
  allowOnlyNonEdited = true
): Promise<string | undefined> => {
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

  if (response.results.length == 0) {
    console.error("no results in table");
    return;
  }
  const lastSummaryPage = response.results[0];
  const lastSummaryId = lastSummaryPage.id;
  const lastSummaryTitle =
    lastSummaryPage["properties"]["Title"].title[0].text.content;
  console.log("lastSummaryId: " + lastSummaryId);
  console.log("lastSummaryTitle: " + lastSummaryTitle);
  console.log(lastSummaryPage);

  // 2. delete summary
  // 2.1 only allow to delete when page text is empty
  // retrieving page content is not easy, so use the difference between created_time and last_edited_time to determine if it has been manually edited
  if (
    allowOnlyNonEdited &&
    lastSummaryPage["created_time"] != lastSummaryPage["last_edited_time"]
  ) {
    return "cannot delete, since page was manually edited";
  }

  try {
    await deletePage(lastSummaryId);
    return lastSummaryTitle;
  } catch (error) {
    console.error(error);
  }
};

const databaseExistsForUser = async (databaseId: string): Promise<boolean> => {
  // TODO: check if database exists for specific User, so reconnect to Notion
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      page_size: 1,
    });
  } catch (error) {
    console.error(error);
    return false;
  }
  return true;
};

interface Props {
  url: string;
  databaseId: string;
}

// TODO: will become a generic method that can check if any item exists in any table
const itemExistsInTable = async (props: Props): Promise<Boolean> => {
  const response = await notion.databases.query({
    database_id: props.databaseId,
    filter: {
      and: [{ property: "url", url: { equals: props.url } }],
    },
  });
  const resLen = response.results.length;
  console.log("resLen: ", resLen);
  return resLen ? true : false;
};

// TODO: make generic for any item type
const bookExistsInTable = async (props: Props): Promise<Boolean> => {
  const response = await notion.databases.query({
    database_id: props.databaseId,
    filter: {
      and: [{ property: "url", url: { equals: props.url } }],
    },
  });
  const resLen = response.results.length;
  console.log("resLen: ", resLen);
  return resLen ? true : false;
};

const addGenericRowToTable = async (
  item: scrapeItem,
  databaseId: string
): Promise<CreatePageResponse> => {
  console.log("item: ", JSON.stringify(item));
  const createPageResponse: CreatePageResponse = await notion.pages.create({
    parent: { type: "database_id", database_id: databaseId },
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
    },
  });
  // TODO: how to know what properties to add to the database?
  console.log(createPageResponse);
  return createPageResponse;
};

const addYoutubeMetadataToTable = async (
  item: videoScrapeItem,
  databaseId: string
): Promise<CreatePageResponse> => {
  console.error("item.authorUrl: ", JSON.stringify(item.channelUrl));
  const response: CreatePageResponse = await notion.pages.create({
    cover: {
      type: "external",
      external: {
        url:
          item.thumbnailUrl ||
          "https://upload.wikimedia.org/wikipedia/commons/6/62/Tuscankale.jpg",
      },
    },
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
      URL: {
        url: item.url,
      },
    },
  });
  console.log(response);
  return response;
};

// TODO: turn into generic method that can accept any form of data, matching the Collection type
const addSummaryToTable = async (
  item: bookScrapeItem,
  databaseId: string
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
                url: item.authorUrl,
                // url: "http://www.nu.nl",
              },
            },
          },
        ],
      },
      url: {
        url: item.url,
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
  });

  console.log(response);
  return response;
};

const violatesUniqueRows = async (
  // item: Item,
  item: scrapeItem,
  collection: DataCollection,
  databaseId: string
): Promise<Boolean> => {
  const uniqueCol: string = COLLECTIONS[collection].UNIQUE_COLUMN;
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: uniqueCol,
      rich_text: {
        equals: item.url,
      },
    },
  });

  // console.log(`response length: ${JSON.stringify(response.results.length)}`);
  if (response.results.length) {
    console.error(
      `item already exists in notion database for id_col '${uniqueCol}'`
    );
    return true;
  }
  return false;
};

export {
  addSummaryToTable,
  bookExistsInTable,
  deleteLastSummary,
  deleteSummaryById,
  databaseExistsForUser,
  addYoutubeMetadataToTable,
  violatesUniqueRows,
};
