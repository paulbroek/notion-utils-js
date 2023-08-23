import { scrapeItem } from "./scrapeItem";

export interface videoScrapeItem extends scrapeItem {
  published?: string;
  thumbnailUrl?: string;
  channelUrl: string;
  channelName: string;
  duration: number;
  views: number;
}
