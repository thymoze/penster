import { spotifyClient } from "@/lib/spotify/api";

export async function GET() {
  const spotify = await spotifyClient();
  const result = await spotify.getDevices();
  if (!result.success) {
    return new Response("Failed to fetch devices", { status: 500 });
  }
  return Response.json(result.data);
}
