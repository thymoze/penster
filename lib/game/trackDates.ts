import { type ScrapedSong, scrapeSongs } from "../allmusic/scrape";
import { type Master, searchMasterReleases } from "../discogs/api";
import { type Recording, searchRecordings } from "../musicbrainz/api";
import type { Track } from "../spotify/types";

const titleRegex = /(\(.*((Remaster(ed)?)|(feat\.)).*\)|(\[.*\]))/g;

export type TrackDates = {
  query: string;
  spotify: number;
  musicbrainz: Recording[];
  discogs: Master[];
  allMusic: ScrapedSong[];
  recommendation: number;
  confidence: number;
};

export async function searchFields(track: Track) {
  const artists = track.artists.map((artist) => artist.name);
  let title = track.name;
  const dashIndex = title.lastIndexOf(" - ");
  if (dashIndex !== -1) {
    title = title.substring(0, dashIndex).trim();
  }
  title = title.replaceAll(titleRegex, "").trim();
  return { title, artists };
}

export async function trackDates(track: Track): Promise<TrackDates> {
  const { title, artists } = await searchFields(track);

  const timeoutSignal = AbortSignal.timeout(5000);
  const [musicbrainz, discogs, allMusic] = await Promise.all([
    searchRecordings(title, artists, timeoutSignal),
    searchMasterReleases(title, artists, timeoutSignal),
    scrapeSongs(title, artists, timeoutSignal),
  ]);
  const spotify = new Date(track.album.release_date).getFullYear();

  let recommendation: number | null = null;

  const arrays = [
    new Set([spotify]),
    new Set(musicbrainz.map((r) => r["first-release-date"])),
    new Set(discogs.map((m) => m.year)),
    new Set(allMusic.map((s) => s.year)),
  ];
  let n = 4;
  while (recommendation === null) {
    recommendation = smallestInN(arrays, n--);
  }

  return {
    query: `${title} ${artists[0]}`,
    spotify,
    musicbrainz,
    discogs,
    allMusic,
    recommendation,
    confidence: (n + 1) / 4,
  };
}

function smallestInN(arrays: Set<number>[], n: number): number | null {
  const count = new Map<number, number>();

  for (const array of arrays) {
    for (const num of array) {
      count.set(num, (count.get(num) || 0) + 1);
    }
  }

  const min = Math.min(
    ...count
      .entries()
      .filter(([_, cnt]) => cnt >= n)
      .map(([num]) => num),
  );

  return min === Infinity ? null : min;
}
