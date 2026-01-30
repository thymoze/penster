import type { NextRequest } from "next/server";
import { spotifyClient } from "@/lib/spotify/api";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const playlistId = searchParams.get("playlistId");
  if (!playlistId) {
    return new Response("Missing playlistId", { status: 400 });
  }

  const limitQ = searchParams.get("limit");
  const limit = limitQ ? parseInt(limitQ, 10) : undefined;

  const offsetQ = searchParams.get("offset");
  const offset = offsetQ ? parseInt(offsetQ, 10) : undefined;

  if (Number.isNaN(limit) || Number.isNaN(offset)) {
    return new Response("Invalid limit or offset", { status: 400 });
  }

  const spotify = await spotifyClient();
  const result = await spotify.getPlaylistTracks(playlistId, { limit, offset });
  if (!result.success) {
    return new Response("Failed to fetch playlist tracks", { status: 500 });
  }
  return Response.json(result.data);
}
