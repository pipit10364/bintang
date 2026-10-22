import { useEffect, useState } from "react";

export type FamilyMember = { name: string; relation: string };
export type CustomStory = { id: string; title: string; emoji: string; pages: string[] };

export type Profile = {
  childName: string;
  fatherName: string;
  motherName: string;
  family: FamilyMember[];
  stories: CustomStory[];
  pin: string;
  stars: number;
  stickers: string[]; // completed letters
  numbers: number[]; // completed digits
  haptics: boolean; // getaran benar/salah
};

const KEY = "belajar-ceria-profile-v1";

export const defaultProfile: Profile = {
  childName: "",
  fatherName: "",
  motherName: "",
  family: [],
  stories: [],
  pin: "",
  stars: 0,
  stickers: [],
  numbers: [],
  haptics: true,
};

const listeners = new Set<(p: Profile) => void>();
let cache: Profile | null = null;

export function loadProfile(): Profile {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...defaultProfile, ...JSON.parse(raw) } : { ...defaultProfile };
  } catch {
    cache = { ...defaultProfile };
  }
  return cache!;
}

export function saveProfile(update: Partial<Profile> | ((p: Profile) => Partial<Profile>)) {
  const cur = loadProfile();
  const patch = typeof update === "function" ? update(cur) : update;
  cache = { ...cur, ...patch };
  localStorage.setItem(KEY, JSON.stringify(cache));
  listeners.forEach((l) => l(cache!));
}

export function addStars(n: number) {
  saveProfile((p) => ({ stars: p.stars + n }));
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setProfile(loadProfile());
    setReady(true);
    listeners.add(setProfile);
    return () => {
      listeners.delete(setProfile);
    };
  }, []);
  return { profile, ready };
}
