// ─────────────────────────────────────────────────────────────────────────────
// useSound — plays an Uber-style notification using the Web Audio API
// No external files needed — generates the sound programmatically
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useRef } from "react";

export function useNotificationSound() {
  const ctx = useRef(null);

  const getCtx = () => {
    if (!ctx.current) {
      ctx.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return ctx.current;
  };

  // Plays a two-tone "ding ding" — warm and clear like Uber/Deliveroo
  const playNewBooking = useCallback(() => {
    try {
      const ac  = getCtx();
      const now = ac.currentTime;

      const playTone = (freq, startTime, duration) => {
        const osc  = ac.createOscillator();
        const gain = ac.createGain();

        osc.connect(gain);
        gain.connect(ac.destination);

        osc.type      = "sine";
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.35, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      // Two ascending tones — 800 Hz then 1050 Hz
      playTone(800,  now,        0.35);
      playTone(1050, now + 0.22, 0.45);
    } catch (err) {
      console.warn("[Sound] Could not play notification:", err.message);
    }
  }, []);

  return { playNewBooking };
}
