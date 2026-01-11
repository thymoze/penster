"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import GamePreview from "@/components/game/game_preview";
import { getCompletePlaylist, getPlaylist } from "@/lib/spotify/cached";

const PLAYLIST_COOKIE = "penster_playlist_id";

export default async function GamePage({ searchParams }: PageProps<"/play">) {
  const cookieStorage = await cookies();
  const playlistIdFromCookie = cookieStorage.get(PLAYLIST_COOKIE)?.value;

  const playlistId =
    (await searchParams).playlistId?.toString() ?? playlistIdFromCookie;

  if (!playlistId) {
    return redirect("/");
  }

  const playlist = await getPlaylist(playlistId);
  const completePlaylist = getCompletePlaylist(playlistId);

  return (
    <GamePreview
      initialPlaylist={playlist}
      completePlaylist={completePlaylist}
    />
  );
}
