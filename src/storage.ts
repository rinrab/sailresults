import React from "react";
import { Racer, Series } from "./scoring";

export function getStoredObject<T>(key: string, createNew: () => T): T {
  const value = localStorage.getItem(key);
  if (value) {
    try {
      return JSON.parse(value) ?? createNew();
    } catch {
      return createNew();
    }
  } else {
    return createNew();
  }
}

export function setStoredObject<T>(key: string, value?: T) {
  if (value) {
    localStorage.setItem(key, JSON.stringify(value));
  } else {
    localStorage.removeItem(key);
  }
}

export function useLocalStorage<T>(key: string, createNew: () => T): [T, (newValue?: T) => void] {
  const [value, setValue] = React.useState(() => getStoredObject(key, createNew));
  return [
    value,
    (newValue: T) => {
      setStoredObject(key, newValue);
      setValue(newValue);
    }
  ];
}

export function useSeriesList() {
  return useLocalStorage<{ [key: number]: Series }>("series", () => ({}));
}

export function useRacers() {
  return useLocalStorage<{ [key: number]: Racer }>("racers", () => ({}));
}

export function useSeries(id: number): [Series | null, (newValue?: Series) => void] {
  const [list, setList] = useSeriesList();

  return [
    list[id],
    (value) => {
      const copy = { ...list };
      copy[id] = value;
      setList(copy);
    }
  ];
}

export function nextRacerId() {
  const id = getStoredObject("globalRacerId", () => 67) + 1;
  setStoredObject("globalRacerId", id);
  return id;
}
