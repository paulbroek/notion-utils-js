// from: https://github.com/dmtrbrl/goodreads-web-scraping/blob/master/index.js
import puppeteer from "puppeteer";
import { bookScrapeItem } from "../models/bookScrapeItem";

const scrapeBook = async (url: string): Promise<null | bookScrapeItem> => {
  console.log("Warming up a scrapper");

  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  // let page;
  // try {
  // } catch (error) {
  //   console.error(`cannot load page with puppeteer. error: ${error}`);
  //   return null;
  // }

  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
    });
  } catch (error) {
    console.error(`cannot visit url: ${url}. error: ${error}`);
    return null;
  }

  const scrapeItem: bookScrapeItem = await page.evaluate(() => {
    const cover = (
      document.querySelector("#coverImage") as HTMLElement
    ).getAttribute("src");
    const title = (document.querySelector("#bookTitle") as HTMLElement)
      .innerText;
    const author = (document.querySelector(".authorName") as HTMLElement)
      .innerText;
    const published = "";
    // TODO: scrape `published`
    // const published = (document.querySelector("#details") as HTMLElement).innerText;
    console.log("got item");
    const res: bookScrapeItem = { title, author, published };
    return res;
  });

  return scrapeItem;
};

export default scrapeBook;
