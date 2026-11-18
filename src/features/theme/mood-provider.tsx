"use client";

import { useEffect } from "react";
import type { LevelKey } from "@/lib/levels";
import { useSettings } from "@/features/settings/hooks/use-settings";
import { useCurrentMood } from "@/features/theme/use-current-mood";
import { LEVEL_HEX, SHAPES } from "@/features/mascot/shapes";

/** Small favicon: the mood's Rumbo body with a simple face. */
function faviconSvg(level: LevelKey): string {
  const s = SHAPES[level];
  const hex = LEVEL_HEX[level];
  const happy = level === "soaring" || level === "rising";
  const sad = level === "slipping" || level === "falling";
  const my = s.mouthY;
  const mouth = happy
    ? `M41 ${my - 1} Q50 ${my + 9} 59 ${my - 1}`
    : sad
      ? `M42 ${my + 3} Q50 ${my - 4} 58 ${my + 3}`
      : `M43 ${my} L57 ${my}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="2 4 96 96"><path d="${s.d}" fill="${hex}" stroke="${hex}" stroke-width="${s.stroke}" stroke-linejoin="round"/><circle cx="${50 - s.eyeGap}" cy="${s.eyeY}" r="5" fill="#1C1C1A"/><circle cx="${50 + s.eyeGap}" cy="${s.eyeY}" r="5" fill="#1C1C1A"/><path d="${mouth}" stroke="#1C1C1A" stroke-width="5" stroke-linecap="round" fill="none"/></svg>`;
}

function setFavicon(href: string) {
  let link = document.querySelector<HTMLLinkElement>('link[data-mood-icon]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/svg+xml";
    link.setAttribute("data-mood-icon", "");
    document.head.appendChild(link);
  }
  link.href = href;
}

function setThemeColor(color: string | null) {
  let meta = document.querySelector<HTMLMetaElement>('meta[data-mood-theme]');
  if (!color) {
    meta?.remove();
    return;
  }
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.setAttribute("data-mood-theme", "");
    document.head.prepend(meta);
  }
  meta.content = color;
}

/**
 * The color is the mood: puts the current level on <html data-mood> (CSS does the rest),
 * swaps the favicon to the matching Rumbo, and mirrors the in-app animation setting.
 */
export function MoodProvider() {
  const settings = useSettings();
  const mood = useCurrentMood();
  const level: LevelKey | null = settings.followMood && mood ? mood.level.key : null;

  useEffect(() => {
    const root = document.documentElement;
    if (level) root.dataset.mood = level;
    else delete root.dataset.mood;
    const shown = level ?? "steady";
    setFavicon(`data:image/svg+xml,${encodeURIComponent(faviconSvg(shown))}`);
    setThemeColor(level ? LEVEL_HEX[level] : null);
  }, [level]);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.mascotMotion === "on") delete root.dataset.motion;
    else root.dataset.motion = settings.mascotMotion;
  }, [settings.mascotMotion]);

  // Leave the landing page neutral after signing out / navigating away.
  useEffect(
    () => () => {
      delete document.documentElement.dataset.mood;
      document.querySelector('link[data-mood-icon]')?.remove();
      document.querySelector('meta[data-mood-theme]')?.remove();
    },
    [],
  );

  return null;
}
