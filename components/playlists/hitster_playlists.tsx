"use server";

import { HITSTER_DE_PLAYLIST_IDS } from "@/lib/spotify/auth";
import { getHitsterPlaylists } from "@/lib/spotify/cached";
import { Playlists } from "./playlists";

async function loadAllHitsterPlaylists() {
  "use server";

  const hitsterPlaylists = await getHitsterPlaylists();
  return {
    success: true,
    data: {
      items: hitsterPlaylists,
      limit: 0,
      offset: 0,
      total: hitsterPlaylists.length,
    },
  } as const;
}

async function loadMore() {
  "use server";

  const hitsterPlaylists = await loadAllHitsterPlaylists();
  return {
    ...hitsterPlaylists,
    data: {
      ...hitsterPlaylists.data,
      items: hitsterPlaylists.data.items.slice(HITSTER_DE_PLAYLIST_IDS.length),
    },
  };
}

export async function HitsterPlaylists() {
  const hitsterPlaylists = await loadAllHitsterPlaylists();
  const playlists = {
    ...hitsterPlaylists,
    data: {
      ...hitsterPlaylists.data,
      items: hitsterPlaylists.data.items.slice(
        0,
        HITSTER_DE_PLAYLIST_IDS.length
      ),
    },
  };

  return <Playlists playlists={playlists} loadMore={loadMore} />;
}
