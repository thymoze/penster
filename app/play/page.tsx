"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DeviceProvider } from "@/components/game/device_context";
import Game from "@/components/game/game";
import { spotifyClient } from "@/lib/spotify/api";
import { getPlaylist } from "@/lib/spotify/cached";

const PLAYLIST_COOKIE = "penster_playlist_id";

export default async function GamePage({ searchParams }: PageProps<"/play">) {
  const cookieStorage = await cookies();
  const playlistIdFromCookie = cookieStorage.get(PLAYLIST_COOKIE)?.value;

  const playlistId =
    (await searchParams).playlistId?.toString() ?? playlistIdFromCookie;

  if (!playlistId) {
    return redirect("/");
  }

  const spotify = await spotifyClient();
  const devicesPromise = spotify.getDevices();
  const playlistPromise = getPlaylist(playlistId);
  const [playlist, devices] = await Promise.all([
    playlistPromise,
    devicesPromise,
  ]);

  return (
    <div className="bg-card">
      <main className="max-w-7xl mx-auto min-h-dvh flex flex-col p-4 pb-12 relative">
        <DeviceProvider initialDevices={devices}>
          <Game initialPlaylist={playlist} />
        </DeviceProvider>
      </main>
    </div>
  );
}
