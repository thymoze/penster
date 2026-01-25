"use server";

import { type Page, spotifyClient } from "@/lib/spotify/api";

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
