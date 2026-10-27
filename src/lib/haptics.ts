// Getaran pembeda untuk jawaban benar dan salah.
// Android (Chrome): getaran standar. iPhone/iPad tidak punya fitur getar di peramban, jadi
// dicoba "ketukan haptic" lewat saklar tersembunyi (hanya iOS 17.4 ke atas, dan hanya
// terasa kalau dipicu langsung oleh sentuhan anak).
import { loadProfile } from "./store";

const enabled = () => {
  try {
    return loadProfile().haptics !== false;
  } catch {
    return true;
  }
};

const isIOS = () =>
  typeof navigator !== "undefined" &&
  (/iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

const hasVibrate = () => typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

/** Cara getar yang tersedia di perangkat ini. */
export const hapticsKind = (): "vibrate" | "ios" | "none" =>
  hasVibrate() ? "vibrate" : isIOS() ? "ios" : "none";

let iosLabel: HTMLLabelElement | null = null;
function iosTick() {
  if (typeof document === "undefined") return;
  if (!iosLabel) {
    iosLabel = document.createElement("label");
    iosLabel.setAttribute("aria-hidden", "true");
    iosLabel.style.cssText = "position:fixed;left:-100px;top:0;width:1px;height:1px;opacity:0;pointer-events:none";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.setAttribute("switch", "");
    iosLabel.appendChild(input);
    document.body.appendChild(iosLabel);
  }
  iosLabel.click();
}

/** Pola dalam milidetik: getar, jeda, getar, ... Di iOS tiap getaran jadi satu ketukan. */
function buzz(pattern: number | number[]) {
  if (!enabled()) return;
  const p = Array.isArray(pattern) ? pattern : [pattern];
  try {
    if (hasVibrate()) {
      navigator.vibrate(p);
    } else if (isIOS()) {
      let t = 0;
      p.forEach((ms, i) => {
        if (i % 2 === 0) setTimeout(iosTick, t);
        t += ms;
      });
    }
  } catch {
    /* abaikan */
  }
}

/** Benar: tiga ketukan cepat, yang terakhir lebih panjang (tuk-tuk-tuuuk). */
export const vibrateOk = () => buzz([70, 50, 70, 50, 180]);
/** Salah: satu getar panjang (bzzzzt). iOS: dua ketukan lambat. */
export const vibrateNo = () => buzz(hasVibrate() ? [450] : [30, 280, 30]);
/** Ketukan kecil (satu huruf benar, satu garis selesai). */
export const vibrateTick = () => buzz(30);
