"use client";

import {
  CalendarX2Icon,
  EllipsisVerticalIcon,
  LaptopIcon,
  Maximize2Icon,
  Minimize2Icon,
  MonitorIcon,
  MusicIcon,
  RadioReceiverIcon,
  RotateCcwIcon,
  SearchIcon,
  SmartphoneIcon,
  SpeakerIcon,
  XIcon,
} from "lucide-react";
import { Suspense, use, useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Devices, Playlist } from "@/lib/spotify/types";
import type { RequiredFields } from "@/lib/utils";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Spinner } from "../ui/spinner";
import { type Device, DeviceContext } from "./device_context";
import type { TrackWithDates } from "@/lib/game/logic";
import Link from "next/link";

export function GameControls({
  initialPlaylist,
  active,
  restartGame,
  abortGame,
}: {
  initialPlaylist: Playlist;
  active?: TrackWithDates;
  restartGame: () => void;
  abortGame: () => void;
}) {
  const [fullscreen, setFullscreen] = useState(false);
  const [dateDialogOpen, setDateDialogOpen] = useState(false);

  const openFullscreen = async () => {
    await document.body.requestFullscreen();
  };

  const exitFullscreen = async () => {
    document.exitFullscreen();
  };

  useEffect(() => {
    const updateFullscreen = () =>
      setFullscreen(document.fullscreenElement !== null);

    document.addEventListener("fullscreenchange", updateFullscreen);
    return () =>
      document.removeEventListener("fullscreenchange", updateFullscreen);
  }, []);

  return (
    <>
      <DeviceDialog />
      {active && (
        <DateDialog
          open={dateDialogOpen}
          onOpenChange={setDateDialogOpen}
          track={active}
        />
      )}
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
        <DropdownMenuContent align="end" className="w-3xs md:w-xs lg:w-sm">
          <div className="flex items-center justify-start gap-2 p-1">
            <img
              src={initialPlaylist.images[0]?.url}
              alt="Playlist Cover"
              className="size-16 rounded-md"
            />
            <div className="flex flex-col justify-center">
              <h2 className="text-lg font-semibold wrap-anywhere line-clamp-1 text-ellipsis">
                {initialPlaylist.name}
              </h2>
              <span className="text-sm text-muted-foreground">
                {initialPlaylist.tracks.total} Titel
              </span>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DeviceMenu />
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={restartGame}>
              <RotateCcwIcon className="size-4" />
              Spiel neu starten
            </DropdownMenuItem>
            <DropdownMenuItem onClick={abortGame}>
              <XIcon className="size-4" />
              Spiel beenden
            </DropdownMenuItem>
          </DropdownMenuGroup>
          {active && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDateDialogOpen(true)}>
                <CalendarX2Icon className="size-4" />
                Datum falsch?
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          {fullscreen ? (
            <DropdownMenuItem onClick={exitFullscreen}>
              <Minimize2Icon className="size-4" />
              Vollbild beenden
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={openFullscreen}>
              <Maximize2Icon className="size-4" />
              Vollbild
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

function DateDialog({
  open,
  onOpenChange,
  track,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: TrackWithDates;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4 max-h-[90dvh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Datum falsch?</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 overflow-x-hidden overflow-y-auto">
          <div className="flex flex-col gap-2">
            <span className="font-semibold">Spotify</span>
            <div className="flex gap-4 items-center">
              <img
                src={track.track.album.images[0]?.url}
                alt="Spotify Cover"
                className="size-10 rounded-md"
              />
              <div className="flex-1 flex flex-col">
                <span className="leading-none line-clamp-1 text-ellipsis">
                  {track.dates.spotify}
                </span>
                <span className="text-sm text-muted-foreground line-clamp-1 text-ellipsis">
                  {`${track.track.artists.map((ac) => ac.name).join(", ")} - ${track.track.album.name}`}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-semibold">Musicbrainz</span>
            {track.dates.recordings.length === 0 ? (
              <span className="text-sm text-muted-foreground">
                Keine Ergebnisse
              </span>
            ) : (
              track.dates.recordings.map((recording) => (
                <div key={recording.id} className="flex gap-4 items-center">
                  <div className="size-10 rounded-md bg-muted flex items-center justify-center">
                    <MusicIcon className="size-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <span className="leading-none line-clamp-1 text-ellipsis">
                      {recording["first-release-date"]}
                    </span>
                    <span className="text-sm text-muted-foreground line-clamp-1 text-ellipsis">
                      {`${recording["artist-credit"].map((ac) => ac.name).join(", ")} - ${recording.release.title}`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-semibold">Discogs</span>
            {track.dates.masters.length === 0 ? (
              <span className="text-sm text-muted-foreground">
                Keine Ergebnisse
              </span>
            ) : (
              track.dates.masters.map((master) => (
                <a
                  target="_blank"
                  href={master.uri}
                  key={master.id}
                  className="flex gap-4 items-center"
                >
                  {master.thumb ? (
                    <img
                      src={master.thumb}
                      alt="Master Cover Thumbnail"
                      className="size-10 rounded-md"
                    />
                  ) : (
                    <div className="size-10 rounded-md bg-muted flex items-center justify-center">
                      <MusicIcon className="size-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 flex flex-col">
                    <span className="leading-none line-clamp-1 text-ellipsis">
                      {master.year}
                    </span>
                    <span className="text-sm text-muted-foreground line-clamp-1 text-ellipsis">
                      {master.title}
                    </span>
                  </div>
                </a>
              ))
            )}
          </div>
          <Button variant="secondary" asChild className="">
            <a
              target="_blank"
              href={`https://duckduckgo.com?q=${encodeURIComponent(track.dates.query)}&assist=true`}
            >
              <SearchIcon className="size-4 mr-2" />
              <span className="whitespace-normal text-ellipsis line-clamp-1">{`"${track.dates.query}"`}</span>
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeviceDialog() {
  const { devices, activeDevice, changeDevice } = use(DeviceContext);

  return (
    <Dialog open={devices.length > 0 && !activeDevice}>
      <DialogContent className="sm:max-w-sm gap-4" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Wiedergabegerät</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col" role="radiogroup">
          {devices
            ?.filter(
              (
                device,
              ): device is RequiredFields<Devices["devices"][number], "id"> =>
                device.id !== null,
            )
            .map((device) => (
              <Button
                key={device.id}
                variant="ghost"
                size="lg"
                className="justify-start"
                role="radio"
                aria-checked={device.is_active}
                onClick={() => changeDevice(device.id)}
              >
                <DeviceLabel device={device} />
              </Button>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeviceMenu() {
  const { devices, changeDevice } = use(DeviceContext);

  return (
    <Suspense fallback={<Spinner className="mx-auto my-4" />}>
      <DropdownMenuLabel className="text-muted-foreground">
        Wiedergabegeräte
      </DropdownMenuLabel>
      {devices.length > 0 ? (
        devices.map((device) => (
          <DropdownMenuItem
            key={device.id}
            onClick={() => changeDevice(device.id)}
          >
            <DeviceLabel device={device} />
          </DropdownMenuItem>
        ))
      ) : (
        <DropdownMenuItem disabled>Keine Geräte verfügbar</DropdownMenuItem>
      )}
    </Suspense>
  );
}

function DeviceLabel({ device }: { device: Device }) {
  return (
    <>
      {{
        computer: <LaptopIcon className="size-4" />,
        smartphone: <SmartphoneIcon className="size-4" />,
        speaker: <SpeakerIcon className="size-4" />,
        avr: <RadioReceiverIcon className="size-4" />,
        tv: <MonitorIcon className="size-4" />,
      }[device.type.toLowerCase()] ?? <SpeakerIcon className="size-4" />}
      {device.name}
      {device.is_active && (
        <span className="border rounded-full px-2 py-0.5 text-xs border-green-500 bg-green-500/20 text-green-500">
          aktiv
        </span>
      )}
    </>
  );
}
