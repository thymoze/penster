"use server";

import { type Page, spotifyClient } from "@/lib/spotify/api";
import type { Track } from "../spotify/types";
import { type Recording, searchRecordings } from "../musicbrainz/api";
import { type Master, searchMasterReleases } from "../discogs/api";

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
  recordings: Recording[];
  masters: Master[];
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

  const [recordings, masters] = await Promise.all([
    searchRecordings(title, artist),
    searchMasterReleases(title, artist),
  ]);
  const spotify = new Date(track.album.release_date).getFullYear();

  let recommendation: number;
  if (
    recordings[0]?.["first-release-date"] === spotify &&
    masters[0]?.year === spotify
  ) {
    recommendation = spotify;
  } else if (
    recordings[0] &&
    masters[0] &&
    masters[0].year === recordings[0]["first-release-date"]
  ) {
    recommendation = masters[0].year;
  } else {
    const sorted = [
      spotify,
      ...recordings.map((r) => r["first-release-date"]),
      ...masters.map((m) => m.year),
    ].sort((a, b) => a - b);
    recommendation = sorted[0];
  }

  return {
    query: `${title} ${artist}`,
    spotify,
    recordings,
    masters,
    recommendation,
  };
}
