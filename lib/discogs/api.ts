import z from "zod";
import { config } from "../config";
import type { RequiredFields } from "../utils";

const BASE_URL = "https://api.discogs.com";

const MasterResponse = z.object({
  id: z.number(),
  title: z.string(),
  year: z
    .string()
    .transform((y) => new Date(y).getFullYear())
    .optional(),
  uri: z.string().transform((u) => `https://discogs.com${u}`),
  type: z.string().optional(),
  thumb: z.string().optional(),
  cover_image: z.string().optional(),
});
type MasterResponse = z.infer<typeof MasterResponse>;
export type Master = RequiredFields<MasterResponse, "year">;

const Results = z.object({
  results: z.array(MasterResponse),
});

export async function searchMasterReleases(
  title: string,
  artist: string,
): Promise<Master[]> {
  const query = new URLSearchParams({
    type: "master",
    per_page: "25",
    track: title,
    artist: artist,
  });

  try {
    const response = await fetch(`${BASE_URL}/database/search?${query}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": config.userAgent,
        Authorization: `Discogs key=${config.discogsKey}, secret=${config.discogsSecret}`,
      },
    });
    const data = await response.json();
    const releases = Results.parse(data).results.filter(
      (r): r is Master => !!r.year,
    );
    releases.sort((a, b) => a.year - b.year);
    return releases.slice(0, 3);
  } catch (error) {
    console.error("Error fetching Discogs data:", error);
    return [];
  }
}
