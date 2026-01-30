import z from "zod";
import { type Playlist, Track, TracksResponse } from "@/lib/spotify/types";
import { TrackDates } from "./trackDates";

const GameState = z.object({
  remaining: z.array(z.number()),
  tracks: z.array(Track.nullish().transform((x) => x ?? undefined)),
});

export type TrackWithDates = {
  track: Track;
  dates: TrackDates;
};

export class GameLogic {
  private tracks: (Track | undefined)[];
  private remaining: number[];
  private next: { idx: number; track: TrackWithDates } | undefined;

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
    this.next = undefined;
    this.saveState();
  }

  private nextIndex(): number | undefined {
    if (this.remaining.length === 0) return undefined;

    const randomIndex = Math.floor(Math.random() * this.remaining.length);
    return this.remaining[randomIndex];
  }

  async nextTrack(): Promise<TrackWithDates | undefined> {
    if (this.next === undefined && this.remaining.length !== 0) {
      await this.prefetchNext();
    }
    if (this.next === undefined) return;

    const { idx, track } = this.next;
    this.remaining = this.remaining.filter((index) => index !== idx);
    this.next = undefined;
    this.saveState();
    return track;
  }

  async prefetchNext(): Promise<void> {
    let idx: number | undefined;
    do {
      idx = this.nextIndex();
      if (idx === undefined) {
        this.next = undefined;
        return;
      }

      if (this.tracks[idx] === undefined) {
        const offset = Math.floor(idx / 50) * 50;
        const params = new URLSearchParams({
          playlistId: this.playlist.id,
          offset: offset.toString(),
          limit: "50",
        });
        const response = await fetch(`/api/playlistTracks?${params}`);
        if (!response.ok) {
          throw new Error("Failed to fetch tracks");
        }
        const tracks = (await response.json()) as TracksResponse;
        const newTracks = tracks.items.map((item) => item.track);
        this.tracks.splice(tracks.offset, newTracks.length, ...newTracks);
      }
      if (!this.tracks[idx]?.is_playable) {
        this.remaining = this.remaining.filter((index) => index !== idx);
      }
    } while (!this.tracks[idx]?.is_playable);

    const track = this.tracks[idx] as Track;
    const res = await fetch("/api/trackDates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(track),
    });
    if (!res.ok) {
      throw new Error("Failed to fetch track dates");
    }
    const dates = (await res.json()) as TrackDates;
    this.next = { idx, track: { track, dates } };
  }

  private saveState() {
    if (typeof window !== "undefined") {
      const state = {
        tracks: this.tracks,
        remaining: this.remaining,
        nextIdx: this.next,
      };
      window.localStorage.setItem(this.playlist.id, JSON.stringify(state));
    }
  }
}
