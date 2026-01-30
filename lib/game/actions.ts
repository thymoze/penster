"use server";

import { spotifyClient } from "@/lib/spotify/api";

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
