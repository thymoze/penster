"use client";

import { Suspense, use, useEffect, useState } from "react";
import type { Track } from "@/lib/spotify/types";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Card } from "./card";
import {
  getPlaybackState,
  play as playAction,
  pause as pauseAction,
} from "./actions";
import { PauseIcon, PlayIcon } from "lucide-react";

export default function Player({
  active,
  nextTrack,
  nextPromise,
}: {
  active: Track;
  nextTrack: () => void;
  nextPromise: Promise<unknown>;
}) {
  const [side, setSide] = useState<"front" | "back">("front");
  const [isPlaying, setIsPlaying] = useState(false);

  const reveal = () => {
    setSide("back");
  };

  const togglePlay = async () => {
    if (isPlaying) await pauseAction();
    else await playAction();
    setIsPlaying((isPlaying) => !isPlaying);
  };

  const next = () => {
    setSide("front");
    nextTrack();
  };

  useEffect(() => {
    const fn = async () => {
      const result = await getPlaybackState();
      if (!result.success) return;
      setIsPlaying(result.data.is_playing);
    };

    fn();
    const interval = setInterval(fn, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div
        key={active.id}
        className={cn(
          "relative size-full rounded-md shadow-lg duration-500 transform-3d transition-transform",
          side === "front" && "",
          side === "back" && "-rotate-y-180",
        )}
      >
        {/* front */}
        <Card className="flex items-center justify-center">
          {isPlaying ? (
            <PauseIcon className="size-1/3" onClick={togglePlay} />
          ) : (
            <PlayIcon className="size-1/3" onClick={togglePlay} />
          )}
        </Card>

        {/* back */}
        <div
          className="absolute size-full rounded-md backface-hidden -rotate-y-180 flex flex-col items-center justify-center gap-2"
          style={{
            background: `linear-gradient(rgb(0 0 0 / 20%), rgb(0 0 0 / 60%) 25%, rgb(0 0 0 / 90%)), url(${active?.album.images[0]?.url}) no-repeat center/cover`,
          }}
        >
          <span className="text-sm">{active.name}</span>
          <h1 className="text-7xl font-bold leading-none">
            {new Date(active.album.release_date).getFullYear()}
          </h1>
          <span className="text-sm">
            {active.artists.map((artist) => artist.name).join(", ")}
          </span>
        </div>
      </div>

      {side === "front" ? (
        <Button
          className="absolute top-full left-1/2 -translate-x-1/2 mt-8"
          size="lg"
          onClick={reveal}
        >
          Aufdecken
        </Button>
      ) : (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-8">
          <Suspense>
            <NextButton nextPromise={nextPromise} onClick={next} />
          </Suspense>
        </div>
      )}
    </>
  );
}

function NextButton({
  nextPromise,
  onClick,
}: {
  nextPromise: Promise<unknown>;
  onClick: () => void;
}) {
  use(nextPromise);

  return (
    <Button size="lg" onClick={onClick} className="animate-in fade-in">
      Nächster Song
    </Button>
  );
}
