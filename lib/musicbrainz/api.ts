import z from "zod";
import { config } from "../config";
import { RateLimiter } from "limiter";
import type { RequiredFields } from "../utils";

const BASE_URL = "https://musicbrainz.org/ws/2";

const RecordingResponse = z.object({
  id: z.string(),
  title: z.string(),
  "artist-credit": z.array(
    z.object({
      name: z.string(),
    }),
  ),
  "first-release-date": z.string().optional(),
  releases: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      date: z.string().optional(),
    }),
  ),
});
type RecordingResponse = z.infer<typeof RecordingResponse>;
export type Recording = Omit<
  RecordingResponse,
  "first-release-date" | "releases"
> & {
  "first-release-date": number;
  release: {
    id: string;
    title: string;
  };
};

const Recordings = z.object({
  recordings: z.array(RecordingResponse),
});

const limiter = new RateLimiter({ tokensPerInterval: 1, interval: 1000 });

export async function searchRecordings(
  title: string,
  artist: string,
): Promise<Recording[]> {
  const query = new URLSearchParams({
    query: `recording:${title} AND artistname:${artist} AND status:official AND video:false`,
    limit: "5",
    fmt: "json",
  });

  try {
    await limiter.removeTokens(1);
    const response = await fetch(`${BASE_URL}/recording/?${query}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": config.userAgent,
      },
    });

    const data = await response.json();
    const recordings = Recordings.parse(data).recordings.filter(
      (r): r is RequiredFields<RecordingResponse, "first-release-date"> =>
        !!r["first-release-date"],
    );

    const recordingsWithRelease = recordings.map((r) => {
      const release =
        r.releases.find((rel) => rel.date === r["first-release-date"]) ??
        r.releases[0];
      return {
        ...r,
        "first-release-date": new Date(r["first-release-date"]).getFullYear(),
        release,
      } satisfies Recording;
    });

    recordingsWithRelease.sort(
      (a, b) => a["first-release-date"] - b["first-release-date"],
    );
    return recordingsWithRelease;
  } catch (error) {
    console.error("Error fetching release data:", error);
    return [];
  }
}
