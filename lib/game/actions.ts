"use server";

import { type Page, spotifyClient } from "@/lib/spotify/api";
import type { Track } from "../spotify/types";
import { type Recording, searchRecordings } from "../musicbrainz/api";
import { type Master, searchMasterReleases } from "../discogs/api";
import { type ScrapedSong, scrapeSongs } from "../allmusic/scrape";

export async function getDevices() {
  const spotify = await spotifyClient();
  return spotify.getDevices();
}

export async function setDevice(deviceId: string) {
  const spotify = await spotifyClient();
  return spotify.setDevice(deviceId);
}

export async function play(trackUri?: string) {
  const spotify = await spotifyClient();
  return spotify.play(trackUri);
}

export async function pause() {
  const spotify = await spotifyClient();
  return spotify.pause();
}

export async function getPlaybackState() {
  const spotify = await spotifyClient();
  return spotify.playbackState();
}

export async function getPlaylistTracks(playlistId: string, page: Page) {
  const spotify = await spotifyClient();
  return spotify.getPlaylistTracks(playlistId, page);
}

const titleRegex = /(\(.*((Remaster(ed)?)|(feat\.)).*\)|(\[.*\]))/g;

export type TrackDates = {
  query: string;
  spotify: number;
  musicbrainz: Recording[];
  discogs: Master[];
  allMusic: ScrapedSong[];
  recommendation: number;
};

export async function searchFields(track: Track) {
  const artist = track.artists[0]?.name || "";
  let title = track.name;
  const dashIndex = title.lastIndexOf(" - ");
  if (dashIndex !== -1) {
    title = title.substring(0, dashIndex).trim();
  }
  title = title.replaceAll(titleRegex, "").trim();
  return { title, artist };
}

export async function trackDates(track: Track): Promise<TrackDates> {
  const { title, artist } = await searchFields(track);

  const [musicbrainz, discogs, allMusic] = await Promise.all([
    searchRecordings(title, artist),
    searchMasterReleases(title, artist),
    scrapeSongs(title, artist),
  ]);
  const spotify = new Date(track.album.release_date).getFullYear();

  let recommendation: number;
  if (
    musicbrainz[0]?.["first-release-date"] === spotify &&
    discogs[0]?.year === spotify &&
    allMusic[0]?.year === spotify
  ) {
    recommendation = spotify;
  } else {
    const arrays = [
      [spotify],
      musicbrainz.map((r) => r["first-release-date"]),
      discogs.map((m) => m.year),
      allMusic.map((s) => s.year),
    ];
    const smallestIn3 = smallestInN(arrays, 3);
    if (smallestIn3 !== null) {
      recommendation = smallestIn3;
    } else {
      recommendation = Math.min(...arrays.flat());
    }
  }

  return {
    query: `${title} ${artist}`,
    spotify,
    musicbrainz,
    discogs,
    allMusic,
    recommendation,
  };
}

function smallestInN(arrays: number[][], n: number): number | null {
  const count = new Map<number, number>();

  for (const array of arrays) {
    const set = new Set(array);
    for (const num of set) {
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
