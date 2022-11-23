import { bookScrapeItem } from "./../models/bookScrapeItem";
// from: https://github.com/dmtrbrl/goodreads-web-scraping/blob/master/index.js
import puppeteer from "puppeteer";
// import fs from "fs";
const fs = require("fs");

// const extractNumberFromString = (str: string): null | number => {
//   const matches = str.match(/\d+/);
//   if (!matches) {
//     return null;
//   }
//   return Number(matches[0]);
// };

const defaultCoverImage =
  "https://upload.wikimedia.org/wikipedia/commons/6/62/Tuscankale.jpg";

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const scrapeBookRetry = async (
  url: string,
  nRetry = 5
): Promise<null | bookScrapeItem> => {
  for (let i = 0; i < nRetry; i++) {
    console.log("Block statement execution no." + i);
    const res: null | bookScrapeItem = await scrapeBook(url);
    if (res != null) {
      return res;
    }
    // retry after delay
    await delay(1000);
  }
  return null;
};

const scrapeBook = async (url: string): Promise<null | bookScrapeItem> => {
  console.log("Warming up a scrapper");

  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    // dumpio: true,
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

  // console.log statements inside page.evaluate callback run in puppeteer browser, so they will not be displayed here, unless:
  // page.on("console", (msg) => {
  //   for (let i = 0; i < msg.args.length; ++i)
  //     console.log(`${i}: ${msg.args[i]}`);
  // });

  const scrapeItem: null | bookScrapeItem = await page.evaluate(async function (
    goodreadsUrl: string
  ) {
    // if (!document.querySelector("#coverImage")) {
    //   console.error("could not locate content of page");
    //   return null;
    // }
    // const coverUrl: string | null = (
    //   document.querySelector("#coverImage") as HTMLElement
    // ).getAttribute("src");
    const title = (document.querySelector("#bookTitle") as HTMLElement)
      .innerText;
    // TODO: deal with multiple author case, scrape ContributorLinksList first
    const author = (document.querySelector(".authorName") as HTMLElement)
      .innerText;
    // const authorUrl = document.querySelector(
    //   ".ContributorLinksList"
    // ) as HTMLElement;
    // const authorUrl = (document.querySelector(".authorUrl") as HTMLElement)
    //   .innerText;
    const authorUrl = "nothing";
    // .getAttribute("href");
    const isbnElement = document.querySelector(
      "#bookDataBox > div.clearFloats > div.infoBoxRowItem"
    ) as HTMLElement;
    const isbn = isbnElement ? isbnElement.innerText : "";
    const published = "";
    // TODO: scrape `published`
    // const published = (document.querySelector("#details") as HTMLElement).innerText;
    const res: bookScrapeItem = {
      title,
      author,
      isbn,
      published,
      // coverUrl: coverUrl === null ? defaultCoverImage : coverUrl,
      coverUrl: defaultCoverImage,
      goodreadsUrl,
      authorUrl,
    };

    // dump to json file?
    fs.writeFile(
      "scrapeItem.json",
      JSON.stringify(res),
      "utf8",
      function (err) {
        if (err) throw err;
        console.log("complete");
      }
    );

    return res;
  },
  url);

  return scrapeItem;
};

export default scrapeBookRetry;
