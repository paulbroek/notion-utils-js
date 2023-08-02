import { DataCollection } from "@prisma/client";

export interface scrapeItem {
  title: string;
  url: string;
  collection: DataCollection;
}
