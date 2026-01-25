import { Suspense } from "react";
import ContinueDialog from "@/components/game/continue_dialog";
import DefaultPlaylists from "@/components/home/default_playlists";
import Home from "@/components/home/home";
import Profile from "@/components/home/profile";
import type { Result } from "@/lib";
import { type Page, spotifyClient } from "@/lib/spotify/api";
import { getPlaylist } from "@/lib/spotify/cached";
import type { SimplifiedPlaylistsResponse } from "@/lib/spotify/types";

async function searchAction(
  query: string,
  page?: Page,
): Promise<Result<SimplifiedPlaylistsResponse>> {
  "use server";
  const spotify = await spotifyClient();

  try {
    const url = new URL(query);
    if (
      url.hostname === "open.spotify.com" &&
      url.pathname.startsWith("/playlist/")
    ) {
      const id = url.pathname.split("/")[2];
      const playlist = await getPlaylist(id);
      return {
        success: true,
        data: {
          items: [playlist],
          limit: 1,
          offset: 0,
          total: 1,
        },
      };
    }
  } catch {}

  return spotify.searchPlaylist(query, page);
}

export default function HomePage() {
  return (
    <>
      <Suspense>
        <ContinueDialog />
      </Suspense>
      <Home
        searchAction={searchAction}
        profile={<Profile />}
        playlists={<DefaultPlaylists />}
      />
    </>
  );
}
