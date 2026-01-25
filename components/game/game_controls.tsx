"use client";

import {
  EllipsisVerticalIcon,
  LaptopIcon,
  MonitorIcon,
  RadioReceiverIcon,
  RotateCcwIcon,
  SmartphoneIcon,
  SpeakerIcon,
  XIcon,
} from "lucide-react";
import { Suspense, use } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Spinner } from "../ui/spinner";
import { type Device, DeviceContext } from "./device_context";

export function GameControls({
  initialPlaylist,
  restartGame,
  abortGame,
}: {
  initialPlaylist: Playlist;
  restartGame: () => void;
  abortGame: () => void;
}) {
  return (
    <>
      <DeviceDialog />
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
        </DropdownMenuContent>
      </DropdownMenu>
    </>
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
              // biome-ignore lint/a11y/useSemanticElements: ...
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
