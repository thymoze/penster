"use client";

import { RotateCcwIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { pause, play } from "@/lib/game/actions";
import { GameLogic, type TrackWithDates } from "@/lib/game/logic";
import type { Playlist } from "@/lib/spotify/types";
import { Button } from "../ui/button";
import { GameControls } from "./controls";
import Player from "./player";
import { GamePreview } from "./preview";
import { Wrapper } from "./card";

export default function Game({
  initialPlaylist,
}: {
  initialPlaylist: Playlist;
}) {
  const router = useRouter();

  // biome-ignore lint/style/noNonNullAssertion: immediate initialization
  const gameLogic = useRef<GameLogic>(null!);
  gameLogic.current ??= new GameLogic(initialPlaylist);

  const [playing, setPlaying] = useState(false);
  const [active, setActive] = useState<TrackWithDates | undefined>(undefined);
  const [side, setSide] = useState<"front" | "back">("front");

  const reveal = () => {
    setSide("back");
  };

  const [prefetchPromise, setPrefetchPromise] = useState<
    Promise<void> | undefined
  >(undefined);

  const startGame = async () => {
    await cookieStore.set("penster_playlist_id", initialPlaylist.id);
    await nextTrack();
    setPlaying(true);
  };

  const restartGame = async () => {
    await pause();

    setPlaying(false);
    setActive(undefined);
    gameLogic.current.restart();
  };

  const abortGame = async () => {
    try {
      await Promise.all([
        pause(),
        document.exitFullscreen(),
        cookieStore.delete("penster_playlist_id"),
      ]);
    } catch {}
    localStorage.clear();
    router.push("/");
  };

  const nextTrack = async () => {
    await prefetchPromise;
    const track = await gameLogic.current.nextTrack();
    setSide("front");
    setActive(track);
  };

  useEffect(() => {
    const fn = async () => {
      if (active !== undefined) {
        await play(active.track.id);
      }
      setPrefetchPromise(gameLogic.current.prefetchNext());
    };
    fn();
  }, [active]);

  return (
    <>
      <GameControls
        initialPlaylist={initialPlaylist}
        active={active}
        side={side}
        restartGame={restartGame}
        abortGame={abortGame}
      />
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        {playing ? (
          active !== undefined ? (
            <Wrapper>
              <Player
                active={active}
                side={side}
                reveal={reveal}
                nextTrack={nextTrack}
                nextPromise={prefetchPromise}
              />
            </Wrapper>
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
          <Wrapper>
            <GamePreview
              initialPlaylist={initialPlaylist}
              startGame={startGame}
            />
          </Wrapper>
        )}
      </div>
    </>
  );
}
