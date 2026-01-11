"use client";

import { use, useState } from "react";
import type { Playlist } from "@/lib/spotify/types";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/lib/hooks/use_local_storage";

export default function Game({
  completePlaylist,
}: {
  completePlaylist: Promise<Playlist>;
}) {
  const [playlist, setPlaylist] = useLocalStorage(
    "playlist",
    use(completePlaylist)
  );
  const [active, setActive] = useLocalStorage("active", null);

  const [flipped, setFlipped] = useState(false);

  const handleCardClick = () => {
    setFlipped(!flipped);
  };

  return (
    <div className="relative size-64 lg:size-80 cursor-pointer perspective-distant">
      <div
        className={cn(
          "relative w-full h-full transition-transform duration-700 transform-3d animate-[slidein-bottom_0.5s_ease-out_forwards]",
          flipped ? "rotate-y-180" : ""
        )}
        onClick={handleCardClick}
      >
        {/* Front face */}
        <div className="absolute size-full bg-muted backface-hidden rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg">
          <div className="text-center">
            <div className="text-2xl mb-2">🎵</div>
            <div>Click to flip!</div>
          </div>
        </div>

        {/* Back face */}
        <div className="absolute size-full bg-muted border border-lime-300 backface-hidden rounded-lg flex flex-col items-center justify-center text-white p-4 shadow-lg rotate-y-180"></div>
      </div>
    </div>
  );
}
