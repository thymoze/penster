"use client";

import {
  createContext,
  startTransition,
  use,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useOptimistic,
  useState,
} from "react";
import type { Result } from "@/lib";
import { setDevice } from "@/lib/game/actions";
import type { Devices } from "@/lib/spotify/types";
import type { RequiredFields } from "@/lib/utils";

export type DeviceContextType = {
  devices: Device[];
  activeDevice: Device | null;
  changeDevice: (deviceId: string) => void;
};

export const DeviceContext = createContext<DeviceContextType>({
  devices: [],
  activeDevice: null,
  changeDevice: (_: string) => {},
});

export type Device = RequiredFields<Devices["devices"][number], "id">;

async function fetchDevices(): Promise<Device[]> {
  try {
    const res = await fetch("/api/devices");
    if (!res.ok) {
      throw new Error("Failed to fetch devices");
    }
    const devices = (await res.json()) as Devices;
    return devices.devices.filter(
      (device): device is RequiredFields<Devices["devices"][number], "id"> =>
        device.id !== null,
    );
  } catch {
    return [];
  }
}

export function DeviceProvider({
  initialDevices,
  children,
}: {
  initialDevices: Result<Devices>;
  children: React.ReactNode;
}) {
  const [devicesPromise, setDevicesPromise] = useState(
    initialDevices.success ? null : fetchDevices,
  );
  const deferredDevicesPromise = useDeferredValue(devicesPromise);
  const devices =
    deferredDevicesPromise !== null
      ? use(deferredDevicesPromise)
      : initialDevices.success
        ? initialDevices.data.devices.filter(
            (device): device is Device => device.id !== null,
          )
        : [];
  const [optimisticDevices, changeDeviceOptimistic] = useOptimistic(
    devices,
    (devices, deviceId: string) => {
      return devices.map((device) => ({
        ...device,
        is_active: device.id === deviceId,
      }));
    },
  );

  const changeDevice = useCallback(
    async (deviceId: string) => {
      startTransition(async () => {
        changeDeviceOptimistic(deviceId);
        await setDevice(deviceId);
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            setDevicesPromise(fetchDevices());
            resolve();
          }, 3000);
        });
      });
    },
    [changeDeviceOptimistic],
  );

  const contextValue = useMemo(
    () => ({
      devices: optimisticDevices,
      activeDevice:
        optimisticDevices.find((device) => device.is_active) || null,
      changeDevice,
    }),
    [optimisticDevices, changeDevice],
  );

  useEffect(() => {
    const interval = setInterval(async () => {
      setDevicesPromise(fetchDevices());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DeviceContext.Provider value={contextValue}>
      {children}
    </DeviceContext.Provider>
  );
}
