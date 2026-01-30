"use client";

import { CirclePauseIcon, CirclePlayIcon } from "lucide-react";
import { Suspense, use, useEffect, useState } from "react";
import { pause as pauseAction, play as playAction } from "@/lib/game/actions";
import type { TrackWithDates } from "@/lib/game/logic";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Card } from "./card";
import { DeviceContext } from "./device_context";
import type { PlaybackState } from "@/lib/spotify/types";

export default function Player({
  side,
  active,
  reveal,
  nextTrack,
  nextPromise,
}: {
  side: "front" | "back";
  active: TrackWithDates;
  reveal: () => void;
  nextTrack: () => void;
  nextPromise?: Promise<void>;
}) {
  const { activeDevice } = use(DeviceContext);

  const [isPlaying, setIsPlaying] = useState(true);

  const togglePlay = async () => {
    if (isPlaying) await pauseAction();
    else await playAction();
    setIsPlaying((isPlaying) => !isPlaying);
  };

  useEffect(() => {
    if (!activeDevice) return;

    const fn = async () => {
      try {
        const response = await fetch("/api/playbackState");
        if (!response.ok) return;
        const playbackState = (await response.json()) as PlaybackState;
        setIsPlaying(playbackState.is_playing);
      } catch {}
    };

    const interval = setInterval(fn, 5000);
    return () => clearInterval(interval);
  }, [activeDevice]);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        key={active.track.id}
        className={cn(
          "relative size-full rounded-md shadow-lg duration-500 transform-3d transition-transform",
          side === "front" && "",
          side === "back" && "-rotate-y-180",
        )}
        onClick={togglePlay}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") togglePlay();
        }}
      >
        {/* glow */}
        <div
          className={cn(
            "absolute top-1/2 left-1/2 -translate-1/2 size-[calc(100%+10px)] blur-xl rounded-md overflow-hidden transition-opacity duration-1000",
            "animate-in fade-in",
            side === "front" && "opacity-100",
            side === "back" && "opacity-0",
          )}
        >
          <div
            className={cn(
              "absolute top-1/2 left-1/2 -translate-1/2 size-[200%] bg-conic-[#005f88,#998e00,#8a004b,#005f88] animate-[spin_4s_linear_infinite]",
              !isPlaying && "paused",
            )}
          ></div>
        </div>

        {/* front */}
        <Card className="flex items-center justify-center">
          {isPlaying ? (
            <CirclePauseIcon className="min-w-24 min-h-24 size-1/3" />
          ) : (
            <CirclePlayIcon className="min-w-24 min-h-24 size-1/3" />
          )}
        </Card>

        {/* back */}
        <div
          className="absolute size-full rounded-md backface-hidden -rotate-y-180 flex flex-col items-center justify-center text-center gap-2 p-4 md:p-8"
          style={{
            background: `linear-gradient(rgb(0 0 0 / 20%), rgb(0 0 0 / 60%) 25%, rgb(0 0 0 / 90%)), url(${active.track.album.images[0]?.url}) no-repeat center/cover`,
          }}
        >
          <span className="line-clamp-2 text-ellipsis wrap-anywhere">
            {active.track.name}
          </span>
          <h1 className="text-7xl font-bold leading-none">
            {active.dates.recommendation}
          </h1>
          <span className="line-clamp-2 text-ellipsis wrap-anywhere">
            {active.track.artists.map((artist) => artist.name).join(", ")}
          </span>
        </div>
      </div>

      {side === "front" ? (
        <Button
          className="absolute top-full left-1/2 -translate-x-1/2 mt-8"
          size="lg"
          onClick={reveal}
          autoFocus
        >
          Aufdecken
        </Button>
      ) : (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-8">
          <Suspense>
            {nextPromise && (
              <NextButton nextPromise={nextPromise} onClick={nextTrack} />
            )}
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
  nextPromise: Promise<void>;
  onClick: () => void;
}) {
  use(nextPromise);

  return (
    <Button
      size="lg"
      onClick={onClick}
      className="animate-in fade-in"
      autoFocus
    >
      Nächster Song
    </Button>
  );
}
