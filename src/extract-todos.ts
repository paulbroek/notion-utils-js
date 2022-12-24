// TODO: extract to-do items from any page
// TODO: to sync later with a todo app like Todoist

import { Client } from "@notionhq/client";
const notion = new Client({ auth: process.env.NOTION_API_KEY });

// const testPageName = "updatePageIcon test page";

const searchPages = async () => {
  // beset practice is to not actually delete, but set `archived` to true.
  // also safer for exposing Notion through Telegram, if anyone would get access to your bot.
  // TODO: cannot upload custom images through API asof dec '22
  const res = await notion.search({
    query: "",
    filter: { property: "object", value: "page" },
  });

  //   const res = await notion.pages.retrieve({ page_id: pageId });
  //   notion.pages.update({})
  console.log("res: ", JSON.stringify(res));
  console.log("n item: ", res.results.length);
};

(async () => searchPages())();
