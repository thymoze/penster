import { trackDates } from "@/lib/game/trackDates";
import { Track } from "@/lib/spotify/types";

export async function POST(request: Request) {
  const body = await request.json();
  const track = Track.parse(body);
  const dates = await trackDates(track);
  return Response.json(dates);
}
