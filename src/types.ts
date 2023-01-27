import { DataCollections } from "./enums";

// type ValidPfx = {
//   [key in DataCollections]: string;
// };

interface Collection {
  PFX: string[];
  ENDPOINT: string;
}

export const COLLECTIONS: { [k in DataCollections]: Collection } = {
  [DataCollections.GOODREADS]: {
    PFX: ["https://www.goodreads.com/book/show/"],
    ENDPOINT: "scrape/goodreads",
  },
  [DataCollections.YOUTUBE]: {
    PFX: ["https://www.youtube.com/watch?v=", "https://youtu.be/"],
    ENDPOINT: "scrape/youtube",
  },
  [DataCollections.PODCHASER]: {
    PFX: ["https://www.podchaser.com/podcasts/"],
    ENDPOINT: "scrape/podchaser",
  },
};

// export { COLLECTIONS };
