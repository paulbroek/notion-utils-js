import { scrapeItem } from "./scrapeItem";

export interface bookScrapeItem extends scrapeItem {
  author: string;
  isbn?: string;
  published: string;
  coverUrl?: string;
  authorUrl: any;
}
