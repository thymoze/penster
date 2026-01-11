"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getPlaylist } from "@/lib/spotify/cached";
import type { Playlist } from "@/lib/spotify/types";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

export default function ContinueDialog() {
  const [playlist, setPlaylist] = useState<Playlist>();

  const abortGame = useCallback(() => {
    cookieStore.delete("penster_playlist_id");
    setPlaylist(undefined);
  }, []);

  useEffect(() => {
    const fn = async () => {
      const playlistId = (await cookieStore.get("penster_playlist_id"))?.value;
      if (playlistId) {
        try {
          const pl = await getPlaylist(playlistId);
          setPlaylist(pl);
        } catch (_e) {
          abortGame();
        }
      }
    };
    fn();
  }, [abortGame]);

  return (
    <Dialog
      open={!!playlist}
      onOpenChange={(open) => {
        if (!open) abortGame();
      }}
    >
      {playlist && (
        <DialogContent className="sm:max-w-sm gap-6">
          <DialogHeader>
            <DialogTitle>Spiel fortsetzen?</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <img
                src={playlist.images[0]?.url}
                alt="Playlist Cover"
                className="w-48 h-48 object-cover rounded-md mx-auto"
              />
              <h2 className="text-lg font-semibold line-clamp-2 text-ellipsis text-center">
                {playlist.name}
              </h2>
            </div>
            <div className="flex flex-col justify-center gap-2">
              <DialogClose asChild>
                <Button variant="outline">Beenden</Button>
              </DialogClose>
              <Button asChild>
                <Link href={`/play`}>Fortsetzen</Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
