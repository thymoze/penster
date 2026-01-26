import z from "zod";
import { type Playlist, Track } from "@/lib/spotify/types";
import { getPlaylistTracks } from "./actions";

const GameState = z.object({
  remaining: z.array(z.number()),
  tracks: z.array(Track.nullish().transform((x) => x ?? undefined)),
});

export class GameLogic {
  private tracks: (Track | undefined)[];
  private remaining: number[];
  private nextIdx: number | undefined;

  constructor(private playlist: Playlist) {
    if (typeof window !== "undefined") {
      const savedState = window.localStorage.getItem(playlist.id);
      if (savedState !== null) {
        try {
          const parsed = GameState.parse(JSON.parse(savedState));
          this.tracks = parsed.tracks;
          this.remaining = parsed.remaining;
          return;
        } catch (e) {
          console.error("No valid saved state found", e);
        }
      }
    }

    this.tracks = new Array(playlist.tracks.total).toSpliced(
      0,
      playlist.tracks.items.length,
      ...playlist.tracks.items.map((item) => item.track),
    );
    this.remaining = Array.from({ length: playlist.tracks.total }, (_, i) => i);
    this.saveState();
  }

  restart() {
    this.remaining = Array.from(
      { length: this.playlist.tracks.total },
      (_, i) => i,
    );
    this.nextIdx = undefined;
    this.saveState();
  }

  private nextIndex(): number | undefined {
    if (this.remaining.length === 0) return undefined;

    const randomIndex = Math.floor(Math.random() * this.remaining.length);
    return this.remaining[randomIndex];
  }

  async next(): Promise<Track | undefined> {
    if (this.nextIdx === undefined && this.remaining.length !== 0) {
      await this.prefetchNext();
    }
    if (this.nextIdx === undefined) return;

    const track = this.tracks[this.nextIdx];
    this.remaining = this.remaining.filter((index) => index !== this.nextIdx);
    this.nextIdx = undefined;
    this.saveState();
    return track;
  }

  async prefetchNext(): Promise<void> {
    let i: number | undefined;
    do {
      i = this.nextIndex();
      if (i === undefined) {
        this.nextIdx = undefined;
        return;
      }

      if (this.tracks[i] === undefined) {
        const offset = Math.floor(i / 50) * 50;
        const result = await getPlaylistTracks(this.playlist.id, {
          offset,
          limit: 50,
        });
        if (!result.success) {
          throw new Error("Failed to fetch tracks");
        }
        const newTracks = result.data.items.map((item) => item.track);
        this.tracks.splice(result.data.offset, newTracks.length, ...newTracks);
      }
      if (!this.tracks[i]?.is_playable) {
        this.remaining = this.remaining.filter((index) => index !== i);
      }
    } while (!this.tracks[i]?.is_playable);

    this.nextIdx = i;
  }

  private saveState() {
    if (typeof window !== "undefined") {
      const state = {
        tracks: this.tracks,
        remaining: this.remaining,
        nextIdx: this.nextIdx,
      };
      window.localStorage.setItem(this.playlist.id, JSON.stringify(state));
    }
  }
}
