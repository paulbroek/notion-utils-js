// from: https://github.com/dmtrbrl/goodreads-web-scraping/blob/master/index.js
import puppeteer from "puppeteer";
import { bookScrapeItem } from "../models/bookScrapeItem";

const extractNumberFromString = (str: string): null | number => {
  // const str = "The number 345 has three digits";

  const matches = str.match(/\d+/);
  if (!matches) {
    return null;
  }
  return Number(matches[0]);
};
const scrapeBook = async (url: string): Promise<null | bookScrapeItem> => {
  console.log("Warming up a scrapper");

  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
    });
  } catch (error) {
    console.error(`cannot visit url: ${url}. error: ${error}`);
    return null;
  }

  const scrapeItem: null | bookScrapeItem = await page.evaluate(() => {
    if (!document.querySelector("#coverImage")) {
      console.error("could not locate content of page");
      return null;
    }
    // const cover = (
    //   document.querySelector("#coverImage") as HTMLElement
    // ).getAttribute("src");
    const title = (document.querySelector("#bookTitle") as HTMLElement)
      .innerText;
    const author = (document.querySelector(".authorName") as HTMLElement)
      .innerText;
    const isbnElement = document.querySelector(
      "#bookDataBox > div.clearFloats > div.infoBoxRowItem"
    ) as HTMLElement;
    const isbn = isbnElement ? isbnElement.innerText : "";
    const published = "";
    // TODO: scrape `published`
    // const published = (document.querySelector("#details") as HTMLElement).innerText;
    console.log("got item");
    const res: bookScrapeItem = { title, author, isbn, published };
    return res;
  });

  return scrapeItem;
};

export default scrapeBook;
