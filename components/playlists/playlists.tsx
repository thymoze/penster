"use client";

import { CirclePlusIcon } from "lucide-react";
import Link from "next/link";
import { Fragment, useActionState } from "react";
import type { Result } from "@/lib";
import type { SimplifiedPlaylistsResponse } from "@/lib/spotify/types";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";

export function Playlists({
  playlists,
  loadMore,
}: {
  playlists: Result<SimplifiedPlaylistsResponse>;
  loadMore: (offset: number) => Promise<Result<SimplifiedPlaylistsResponse>>;
}) {
  const [displayedPlaylists, formAction, isPending] = useActionState(
    async (prev): Promise<Result<SimplifiedPlaylistsResponse>> => {
      if (!prev.success) {
        return prev;
      }

      const result = await loadMore(prev.data.offset + prev.data.limit);
      if (!result.success) {
        return result;
      }
      return {
        success: true,
        data: {
          ...result.data,
          items: [...prev.data.items, ...result.data.items],
        },
      };
    },
    playlists,
  );

  if (!displayedPlaylists.success) {
    return (
      <span className="text-destructive">Fehler beim Laden der Playlists</span>
    );
  }

  const length = displayedPlaylists.data.items.length;
  const total = displayedPlaylists.data.total;
  const step = displayedPlaylists.data.limit;

  if (length === 0) {
    return (
      <span className="text-muted-foreground">Keine Playlists vorhanden</span>
    );
  }

  return (
    <div className="grid auto-rows-fr grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 -mx-2 sm:-mx-3">
      {displayedPlaylists.data.items.map((playlist, index) =>
        length < total && length % step === 0 && index === length - 1 ? (
          <Fragment key={`hidden_${playlist.id}`}></Fragment>
        ) : (
          <div key={playlist.id}>
            <Link
              href={`/play?playlistId=${playlist.id}`}
              className="p-2 sm:p-3 flex flex-col items-start justify-start gap-2 rounded-md hover:bg-muted"
            >
              <img
                src={playlist.images[0]?.url}
                alt={playlist.name}
                className="w-full aspect-square object-cover rounded-md"
              />
              <h2 className="max-w-full text-foreground wrap-anywhere line-clamp-2 text-ellipsis text-sm sm:text-base hover:underline">
                {playlist.name}
              </h2>
            </Link>
          </div>
        ),
      )}
      {length < total && (
        <form action={formAction} className="contents">
          <Button
            variant="ghost"
            className="h-full flex flex-col gap-2 text-muted-foreground text-sm sm:text-base"
          >
            {!isPending ? (
              <CirclePlusIcon className="size-8" />
            ) : (
              <Spinner className="size-8" />
            )}
            <span className="hover:underline">Mehr anzeigen</span>
          </Button>
        </form>
      )}
    </div>
  );
}
