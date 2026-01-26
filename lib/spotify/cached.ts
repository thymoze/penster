"use server";

import Keyv from "keyv";
import type { Result } from "..";
import { spotifyClient } from "./api";
import { HITSTER_DE_PLAYLIST_IDS, HITSTER_USER_ID } from "./auth";
import type {
  Playlist,
  SimplifiedPlaylist,
  SimplifiedPlaylistsResponse,
} from "./types";

const ttl = 6 * 60 * 60 * 1000; // 6 hours
const cache = new Keyv({ namespace: "spotify-cache", ttl });

export const getHitsterPlaylists = async () => {
  const cache_result =
    await cache.get<SimplifiedPlaylist[]>("hitster_playlists");
  if (cache_result) {
    return cache_result;
  }

  const spotify = await spotifyClient();
  const hitsterPlaylists: SimplifiedPlaylist[] = [];
  let offset = 0;
  let result: Result<SimplifiedPlaylistsResponse>;
  do {
    result = await spotify.getUserPlaylists(HITSTER_USER_ID, {
      offset,
      limit: 50,
    });
    if (!result.success) {
      throw new Error(`Failed to fetch Hitster playlists: ${result.error}`);
    }
    hitsterPlaylists.push(...result.data.items);
    offset += 50;
  } while (offset < result.data.total);

  hitsterPlaylists.sort((a, b) => {
    const isDeA = HITSTER_DE_PLAYLIST_IDS.indexOf(a.id);
    const isDeB = HITSTER_DE_PLAYLIST_IDS.indexOf(b.id);

    if (isDeA !== -1 && isDeB === -1) return -1;
    if (isDeA === -1 && isDeB !== -1) return 1;
    if (isDeA !== -1 && isDeB !== -1) return isDeA - isDeB;

    return a.name.localeCompare(b.name);
  });

  await cache.set("hitster_playlists", hitsterPlaylists);
  return hitsterPlaylists;
};

export const getPlaylist = async (playlistId: string) => {
  const cache_result = await cache.get<Playlist>(`playlist_${playlistId}`);
  if (cache_result) {
    return cache_result;
  }

  const spotify = await spotifyClient();
  const result = await spotify.getPlaylist(playlistId);
  if (!result.success) {
    throw new Error(`Failed to fetch playlist: ${result.error}`);
  }

  result.data.tracks.items = [
    ...new Map(
      result.data.tracks.items
        .filter((item) => item.track.is_playable && !item.track.is_local)
        .map((item) => [item.track.id, item]),
    ).values(),
  ];

  await cache.set(`playlist_${playlistId}`, result.data);

  return result.data;
};

// export const getCompletePlaylist = async (playlistId: string) => {
//   const cache_result = await cache.get<Playlist>(
//     `complete_playlist_${playlistId}`,
//   );
//   if (cache_result) {
//     return cache_result;
//   }

//   const spotify = await spotifyClient();
//   const playlist = await getPlaylist(playlistId);

//   let offset = playlist.tracks.items.length;
//   while (offset < playlist.tracks.total) {
//     const result = await spotify.getPlaylistTracks(playlistId, {
//       offset,
//       limit: 50,
//     });
//     if (!result.success) {
//       throw new Error(`Failed to fetch playlist tracks: ${result.error}`);
//     }
//     playlist.tracks.items.push(...result.data.items);
//     offset += result.data.items.length;
//   }
//   playlist.tracks.items = [
//     ...new Map(
//       playlist.tracks.items
//         .filter((item) => item.track.is_playable && !item.track.is_local)
//         .map((item) => [item.track.id, item]),
//     ).values(),
//   ];
//   playlist.tracks.total = playlist.tracks.items.length;
//   await cache.set(`complete_playlist_${playlistId}`, playlist);
//   return playlist;
// };
