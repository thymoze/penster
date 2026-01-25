"use client";

import { useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T | (() => T)) {
  const setLocalStorage = (value: T) => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue instanceof Function ? initialValue() : initialValue;
    }
    const item = window.localStorage.getItem(key);
    if (item !== null) {
      try {
        return JSON.parse(item) as T;
      } catch (error) {
        console.warn(`Error parsing localStorage key "${key}":`, error);
      }
    }
    const initial =
      initialValue instanceof Function ? initialValue() : initialValue;
    setLocalStorage(initial);
    return initial;
  });

  const setValue = (value: T | ((val: T) => T)) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
    setLocalStorage(valueToStore);
  };

  return [storedValue, setValue] as const;
}
