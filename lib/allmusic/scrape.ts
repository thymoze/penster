import * as cheerio from "cheerio";
import { RateLimiter } from "limiter";

export type ScrapedSong = {
  title: string;
  artist: string;
  year: number;
  release:
    | {
        name: string;
        cover: string;
      }
    | undefined;
  uri: string;
};

const limiter = new RateLimiter({ tokensPerInterval: 5, interval: 1000 });

export async function scrapeSongs(
  title: string,
  artists: string[],
  signal?: AbortSignal,
): Promise<ScrapedSong[]> {
  const query = encodeURIComponent(`${title} ${artists[0]}`);
  try {
    await limiter.removeTokens(1);
    const response = await fetch(
      `https://www.allmusic.com/search/songs/${query}`,
      { signal },
    );
    const html = await response.text();
    const $ = cheerio.load(html);

    const songLinks = $.extract({
      links: [
        {
          selector: "#resultsContainer .song .title a",
          value: "href",
        },
      ],
    }).links.slice(0, 3);

    await limiter.removeTokens(songLinks.length);
    const songs = await Promise.all(
      songLinks.map(async (link) => {
        const res = await fetch(link, { signal });
        const songHtml = await res.text();
        const $$ = cheerio.load(songHtml);
        const song = $$.extract({
          title: "#songHeadline h1",
          artist: "#songHeadline h2",
          year: {
            selector: ".releaseYearStatic",
            value: (el) => parseInt($$(el).attr("data-releaseyear") ?? "", 10),
          },
          release: {
            selector: "#appearsOn img:first",
            value: (el) => ({
              name: $$(el).attr("alt"),
              cover: $$(el).attr("data-src"),
            }),
          },
        });
        return {
          ...song,
          uri: link,
        };
      }),
    );
    const filteredSongs = songs.filter(
      (s): s is ScrapedSong =>
        !!s.title && !!s.artist && !!s.year && !Number.isNaN(s.year),
    );
    filteredSongs.sort((a, b) => a.year - b.year);
    return filteredSongs;
  } catch (error) {
    console.error("Error scraping AllMusic data:", error);
    return [];
  }
}
