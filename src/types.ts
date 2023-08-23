import { DataCollection } from "@prisma/client";

interface Collection {
  NAME: string;
  PFX: string[];
  ENDPOINT: string;
  UNIQUE_COLUMN: string;
}

const defaultEndpoint: string = "notion/add_row";

export const COLLECTIONS: { [k in DataCollection]: Collection } = {
  [DataCollection.GOODREADS]: {
    NAME: "Goodreads",
    PFX: ["https://www.goodreads.com/book/show/"],
    // ENDPOINT: "scrape/goodreads",
    ENDPOINT: defaultEndpoint,
    UNIQUE_COLUMN: "url",
  },
  [DataCollection.YOUTUBE]: {
    NAME: "YouTube",
    PFX: ["https://www.youtube.com/watch?v=", "https://youtu.be/"],
    // ENDPOINT: "scrape/youtube",
    ENDPOINT: defaultEndpoint,
    UNIQUE_COLUMN: "URL",
  },
  [DataCollection.PODCHASER]: {
    NAME: "Podchaser",
    PFX: ["https://www.podchaser.com/podcasts/"],
    // ENDPOINT: "scrape/podchaser",
    ENDPOINT: defaultEndpoint,
    UNIQUE_COLUMN: "url",
  },
  [DataCollection.MEETUP]: {
    NAME: "Meetup",
    PFX: ["https://www.meetup.com/"],
    // ENDPOINT: "scrape/meetup",
    ENDPOINT: defaultEndpoint,
    UNIQUE_COLUMN: "url",
  },
};
