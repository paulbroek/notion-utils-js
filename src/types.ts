// import { DataCollection } from "./enums";

import { DataCollection } from "@prisma/client";
// type ValidPfx = {
//   [key in DataCollection]: string;
// };

interface Collection {
  NAME: string;
  PFX: string[];
  ENDPOINT: string;
}

export const COLLECTIONS: { [k in DataCollection]: Collection } = {
  [DataCollection.GOODREADS]: {
    NAME: "Goodreads",
    PFX: ["https://www.goodreads.com/book/show/"],
    ENDPOINT: "scrape/goodreads",
  },
  [DataCollection.YOUTUBE]: {
    NAME: "YouTube",
    PFX: ["https://www.youtube.com/watch?v=", "https://youtu.be/"],
    ENDPOINT: "scrape/youtube",
  },
  [DataCollection.PODCHASER]: {
    NAME: "Podchaser",
    PFX: ["https://www.podchaser.com/podcasts/"],
    ENDPOINT: "scrape/podchaser",
  },
  [DataCollection.MEETUP]: {
    NAME: "Meetup",
    PFX: ["https://www.meetup.com/"],
    ENDPOINT: "scrape/meetup",
  },
};

// export { COLLECTIONS };
