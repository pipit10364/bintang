// Getaran pembeda untuk jawaban benar dan salah (Android Chrome; iPhone tidak mendukung).
import { loadProfile } from "./store";

const enabled = () => {
  try {
    return loadProfile().haptics !== false;
  } catch {
    return true;
  }
};

const buzz = (pattern: number | number[]) => {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function" || !enabled()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* abaikan */
  }
};

/** Benar: tiga denyut, makin panjang (tuk-tuk-tuuuk). */
export const vibrateOk = () => buzz([40, 60, 40, 60, 140]);
/** Salah: satu getar panjang (bzzzzt). */
export const vibrateNo = () => buzz(400);
/** Garis selesai: ketukan kecil. */
export const vibrateTick = () => buzz(25);
