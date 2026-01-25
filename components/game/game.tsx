"use client";

import { act, startTransition, useEffect, useState } from "react";
import type { Playlist, Track } from "@/lib/spotify/types";

import { GameControls } from "./game_controls";
import { GamePreview } from "./preview";
import Player from "./player";
import { getPlaylistTracks, pause, play } from "./actions";
import { useLocalStorage } from "@/lib/hooks/use_local_storage";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { RotateCcwIcon, XIcon } from "lucide-react";

export default function Game({
  initialPlaylist,
}: {
  initialPlaylist: Playlist;
}) {
  const router = useRouter();

  const [playing, setPlaying] = useState(false);
  const [active, setActive] = useState<Track>();

  const [remaining, setRemaining] = useLocalStorage<number[]>(
    `remaining_${initialPlaylist.id}`,
    () => Array.from({ length: initialPlaylist.tracks.total }, (_, i) => i),
  );

  const [tracks, setTracks] = useState<(Track | undefined)[]>(() =>
    Object.assign(
      new Array(initialPlaylist.tracks.total),
      initialPlaylist.tracks.items.map((item) => item.track),
    ),
  );

  const nextIndex = (remainingIndices: number[]): number | undefined => {
    if (remainingIndices.length === 0) return undefined;

    const randomIndex = Math.floor(Math.random() * remainingIndices.length);
    const trackIndex = remainingIndices[randomIndex];
    setRemaining(remainingIndices.filter((_, i) => i !== randomIndex));

    return trackIndex;
  };

  const nextTrack = async (
    remainingIndices: number[],
  ): Promise<Track | undefined> => {
    const trackIndex = nextIndex(remainingIndices);
    if (trackIndex === undefined) return undefined;

    const track = await getTrackAtIndex(trackIndex);
    return track;
  };

  const getTrackAtIndex = async (index: number): Promise<Track> => {
    if (tracks[index]) return tracks[index];

    const offset = Math.floor(index / 50) * 50;
    const result = await getPlaylistTracks(initialPlaylist.id, {
      offset,
      limit: 50,
    });
    if (!result.success) {
      throw new Error("Failed to fetch tracks");
    }
    const newTracks = [...tracks];
    newTracks.splice(
      result.data.offset,
      result.data.items.length,
      ...result.data.items.map((item) => item.track),
    );
    setTracks(newTracks);
    // biome-ignore lint/style/noNonNullAssertion: ...
    return newTracks[index]!;
  };

  const [nextTrackPromise, setNextTrackPromise] = useState<
    Promise<Track | undefined>
  >(() => nextTrack(remaining));

  const next = async () => {
    const track = await nextTrackPromise;
    setActive(track);
    if (track !== undefined) {
      setNextTrackPromise(nextTrack(remaining));
      await play(track.id);
    }
  };

  const startGame = async () => {
    await cookieStore.set("penster_playlist_id", initialPlaylist.id);
    setPlaying(true);
    await next();
  };

  const restartGame = async () => {
    await pause();

    setPlaying(false);
    setActive(undefined);
    const rem = Array.from(
      { length: initialPlaylist.tracks.total },
      (_, i) => i,
    );
    setRemaining(rem);
    setNextTrackPromise(nextTrack(rem));
  };

  useEffect(() => {
    console.log("Active track changed:", active?.name);
  }, [active]);

  const abortGame = async () => {
    await pause();
    await cookieStore.delete("penster_playlist_id");
    localStorage.clear();
    router.push("/");
  };

  return (
    <>
      <GameControls
        initialPlaylist={initialPlaylist}
        restartGame={restartGame}
        abortGame={abortGame}
      />
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        {playing ? (
          active !== undefined ? (
            <div className="group size-48 sm:size-64 lg:size-80 relative perspective-distant">
              <Player
                active={active}
                nextTrack={next}
                nextPromise={nextTrackPromise}
              />
            </div>
          ) : (
            <>
              <p className="text-center px-4">Keine weiteren Songs im Spiel.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="secondary" onClick={restartGame}>
                  <RotateCcwIcon className="size-4" />
                  Spiel neu starten
                </Button>
                <Button onClick={abortGame}>
                  <XIcon className="size-4" />
                  Spiel beenden
                </Button>
              </div>
            </>
          )
        ) : (
          <div className="group size-48 sm:size-64 lg:size-80 relative perspective-distant">
            <GamePreview
              initialPlaylist={initialPlaylist}
              startGame={startGame}
            />
          </div>
        )}
      </div>
    </>
  );
}
