"use server";

import type { Result } from "@/lib";
import { spotifyClient } from "@/lib/spotify/api";
import type { SimplifiedPlaylistsResponse } from "@/lib/spotify/types";
import { Playlists } from "./playlists";

async function loadMyPlaylists(
  offset: number,
): Promise<Result<SimplifiedPlaylistsResponse>> {
  "use server";

  const spotify = await spotifyClient();
  const limit = 12;
  return spotify.getMyPlaylists({ offset, limit });
}

export async function MyPlaylists() {
  const playlists = await loadMyPlaylists(0);

  return <Playlists playlists={playlists} loadMore={loadMyPlaylists} />;
}
