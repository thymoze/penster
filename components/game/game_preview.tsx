"use client";

import { EllipsisVerticalIcon, RotateCcwIcon, XIcon } from "lucide-react";
import { Suspense, use, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { Playlist } from "@/lib/spotify/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import Game from "./game";
import { cn } from "@/lib/utils";

export default function GamePreview({
  initialPlaylist,
  completePlaylist,
}: {
  initialPlaylist: Playlist;
  completePlaylist: Promise<Playlist>;
}) {
  const [start, setStart] = useState(false);
  const [play, setPlay] = useState(false);

  const startGame = async () => {
    await cookieStore.set("penster_playlist_id", initialPlaylist.id);
    setStart(true);
  };

  const NUM_CARDS = 15;

  return (
    <>
      <div className="flex-1 flex flex-col items-center justify-center gap-4 perspective-distant">
        {play ? (
          <Suspense fallback={<Spinner className="size-16" />}>
            <Game completePlaylist={completePlaylist} />
          </Suspense>
        ) : (
          <>
            <div
              className={cn(
                "size-48 sm:size-64 lg:size-80 mb-12 relative transform-3d transition-transform",
                "rotate-x-45 rotate-z-12"
                // start && "rotate-x-0 rotate-z-0"
              )}
            >
              {Array.from({ length: NUM_CARDS }).map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "size-full absolute top-0 left-0 border bg-muted rounded-md transform shadow transition-transform"
                    // start && "translate-x-500"
                  )}
                  style={{
                    translate: `0 ${start ? 9999 : 0}px -${(index + 1) * 5}px`,
                    transitionDelay: `${(NUM_CARDS - (index + 1)) * 30}ms`,
                  }}
                ></div>
              ))}

              <img
                src={initialPlaylist.images[0]?.url}
                alt="Playlist Cover"
                className="size-full object-cover rounded-md relative shadow"
                style={{
                  translate: start ? "0 9999px 0" : undefined,
                  transitionDelay: `${NUM_CARDS * 30}ms`,
                }}
                onTransitionEnd={() => setPlay(true)}
              />
            </div>

            <h2
              className={cn(
                "text-2xl text-center font-semibold transition-opacity",
                start && "opacity-0"
              )}
            >
              {initialPlaylist.name}
            </h2>
            <Button
              size="lg"
              onClick={startGame}
              className={cn("transition-opacity", start && "opacity-0")}
            >
              Spiel starten
            </Button>
          </>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon-lg"
            className="absolute bottom-6 right-6 rounded-full"
          >
            <EllipsisVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-3xs md:min-w-xs lg:min-w-sm"
        >
          <div className="flex items-center justify-start gap-2 p-1">
            <img
              src={initialPlaylist.images[0]?.url}
              alt="Playlist Cover"
              className="size-16 rounded-md"
            />
            <div className="flex flex-col justify-center">
              <h2 className="text-lg font-semibold line-clamp-1 text-ellipsis">
                {initialPlaylist.name}
              </h2>
              <span className="text-sm text-muted-foreground">
                <Suspense
                  fallback={
                    <div className="inline-flex items-center gap-2">
                      <Spinner />
                      <TotalTracks playlist={initialPlaylist} />
                    </div>
                  }
                >
                  <TotalTracks playlist={completePlaylist} />
                </Suspense>
              </span>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <RotateCcwIcon className="size-4" />
            Wiedergabegerät
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <RotateCcwIcon className="size-4" />
              Spiel neu starten
            </DropdownMenuItem>
            <DropdownMenuItem>
              <XIcon className="size-4" />
              Spiel beenden
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

function TotalTracks({ playlist }: { playlist: Playlist | Promise<Playlist> }) {
  const resolvedPlaylist =
    playlist instanceof Promise ? use(playlist) : playlist;
  return (
    <span className="text-sm text-muted-foreground">
      {resolvedPlaylist.tracks.total} Titel
    </span>
  );
}
