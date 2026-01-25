import { use, useTransition } from "react";
import type { Playlist } from "@/lib/spotify/types";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Card } from "./card";
import { DeviceContext } from "./device_context";

export function GamePreview({
  initialPlaylist,
  startGame,
}: {
  initialPlaylist: Playlist;
  startGame: () => void;
}) {
  const { activeDevice } = use(DeviceContext);
  const [starting, setStarting] = useTransition();

  const beginGame = () => {
    setStarting(
      () =>
        new Promise((resolve) =>
          setTimeout(() => {
            startGame();
            resolve();
          }, 1200),
        ),
    );
  };

  return (
    <>
      <Card
        className={cn(
          !starting && "rotate-2 group-hover:rotate-6",
          starting && "rotate-0 duration-200 opacity-0",
        )}
      />
      <Card
        className={cn(
          "bg-slate-700",
          !starting && "-rotate-2 group-hover:-rotate-6",
          starting && "rotate-0 duration-200 opacity-0",
        )}
      />

      <div
        className={cn(
          "relative size-full rounded-md shadow-lg transform-3d transition-transform",
          starting && "delay-500 duration-500 rotate-y-180",
        )}
      >
        <img
          src={initialPlaylist.images[0]?.url}
          alt="Playlist Cover"
          className={cn(
            "absolute size-full object-cover rounded-md backface-hidden",
          )}
        />
        <Card className="rotate-y-180" />
      </div>

      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-8 flex flex-col items-center gap-4">
        <h2
          className={cn(
            "text-2xl text-center font-semibold transition-opacity max-w-2xl wrap-break-word text-ellipsis line-clamp-3",
            starting && "opacity-0 invisible",
          )}
        >
          {initialPlaylist.name}
        </h2>
        <Button
          size="lg"
          onClick={beginGame}
          className={cn(
            "transition-opacity",
            starting && "opacity-0 invisible",
          )}
          disabled={!activeDevice}
        >
          Spiel starten
        </Button>
      </div>
    </>
  );
}
