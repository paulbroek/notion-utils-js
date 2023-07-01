import { bookScrapeItem } from "./../models/bookScrapeItem";
import { PrismaClient } from "@prisma/client";
// from: https://github.com/dmtrbrl/goodreads-web-scraping/blob/master/index.js
import puppeteer from "puppeteer";
import { delay } from "../utils";
// import fs from "fs";
const fs = require("fs");

const prisma = new PrismaClient();
const ENABLE_JSON_DUMP = false;
// const ENABLE_JSON_DUMP = true;

// const extractNumberFromString = (str: string): null | number => {
//   const matches = str.match(/\d+/);
//   if (!matches) {
//     return null;
//   }
//   return Number(matches[0]);
// };

const scrapeBookRetry = async (
  url: string,
  nRetry = 5
): Promise<null | bookScrapeItem> => {
  for (let i = 0; i < nRetry; i++) {
    console.log("Block statement execution no." + i);
    const res: null | bookScrapeItem = await scrapeBook(url);
    if (res != null) {
      if (ENABLE_JSON_DUMP) {
        // dump to json file?
        fs.writeFile(
          "/tmp/scrapeItem.json",
          JSON.stringify(res),
          "utf8",
          function (err) {
            if (err) throw err;
            console.log("complete");
          }
        );
      }

      // TODO: save to postgres

      return res;
    }
    // retry after delay
    await delay(1000);
  }
  return null;
};

const scrapeBook = async (url: string): Promise<null | bookScrapeItem> => {
  console.log("Warming up a scraper");

  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    // dumpio: true,
  });
  const page = await browser.newPage();

  try {
    const res = await page.goto(url, {
      waitUntil: "domcontentloaded",
    });
    // wait until all elements loaded?
    // await page.waitForSelector("#bookAuthors", {
    //   visible: true,
    // });
    // await page.waitForSelector("#bookAuthors");
    // await page.waitForSelector(".authorName", { visible: true });
    // await page.waitForFunction(
    //   (selector) => !!document.querySelector(selector),
    //   {},
    //   ".authorName"
    // );
    // dump to .html when `ENABLE_JSON_DUMP` is enabled
    if (res != null) {
      const htmlDump = await res.text();
      // console.log(htmlDump);
      if (ENABLE_JSON_DUMP) {
        fs.writeFile(
          "/tmp/bookItem.html",
          // JSON.stringify(htmlDump),
          htmlDump,
          "utf8",
          function (err) {
            if (err) throw err;
            console.log("complete");
          }
        );
      }
    }
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
    url: string
  ) {
    // wait for element to be ready
    if (!document.querySelector("#coverImage")) {
      console.error("could not locate content of page");
      return null;
    }
    const coverUrl: string | null = (
      document.querySelector("#coverImage") as HTMLElement
    ).getAttribute("src");
    const defaultCoverUrl =
      "https://upload.wikimedia.org/wikipedia/commons/6/62/Tuscankale.jpg";
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
    // const authorUrl = (
    //   document.querySelector(".authorName > a") as HTMLAnchorElement
    // )?.href;
    console.log("authorUrl: ", authorUrl);
    // .getAttribute("href");
    const isbnElement = document.querySelector(
      "#bookDataBox > div.clearFloats > div.infoBoxRowItem"
    ) as HTMLElement;
    const isbn = isbnElement ? isbnElement.innerText : "";
    // TODO: scrape `published`
    // const published = (
    //   document.querySelector(
    //     "#details .row .dateFormat:nth-child(2)"
    //   ) as HTMLElement
    // ).innerText;
    const published = "";
    // const published = (document.querySelector("#details") as HTMLElement).innerText;
    console.log("published: ", published);
    const res: bookScrapeItem = {
      title,
      author,
      isbn,
      published,
      coverUrl: coverUrl === null ? defaultCoverUrl : coverUrl,
      // coverUrl,
      url,
      authorUrl,
    };

    return res;
  },
  url);

  return scrapeItem;
};

export default scrapeBookRetry;
