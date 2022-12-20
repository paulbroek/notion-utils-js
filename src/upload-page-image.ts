// TODO: update page image through API
// TODO: auto search for matching images on google, send user suggestions
import { Client } from "@notionhq/client";
const notion = new Client({ auth: process.env.NOTION_API_KEY });

const updatePageImage = async (pageId: string) => {
  // beset practice is to not actually delete, but set `archived` to true.
  // also safer for exposing Notion through Telegram, if anyone would get access to your bot.
  //   await notion.pages.update({ page_id: pageId, archived: true });
  const res = await notion.pages.retrieve({ page_id: pageId });
  console.log("res: ", JSON.stringify(res));
};

const testPageId = "8b619c18d0ad410f887fda900209f128";
(async () => updatePageImage(testPageId))();
