"use client";

import { useState } from "react";
import { Loader2, Share2 } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { useToast } from "@/components/ui/toast";

/** The Rumbodia mark as a standalone SVG (for drawing on the share canvas). */
function logoSvg(brand: string, onBrand: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="96" height="96"><rect x="1" y="1" width="46" height="46" rx="13" fill="${brand}"/><circle cx="16.5" cy="18.5" r="3.1" fill="${onBrand}"/><circle cx="29.5" cy="18.5" r="3.1" fill="${onBrand}"/><g fill="none" stroke="${onBrand}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M11.5 26.5C14.5 33.5 23.5 36.5 30 32L37 25"/><path d="M31 25H37V31"/></g></svg>`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Render a card to a PNG with a Rumbodia footer. */
async function renderCard(node: HTMLElement): Promise<Blob> {
  const { toCanvas } = await import("html-to-image");
  const css = getComputedStyle(document.documentElement);
  const bg = css.getPropertyValue("--card").trim() || "#ffffff";
  const brand = css.getPropertyValue("--brand").trim() || "#13A38B";
  const onBrand = css.getPropertyValue("--on-brand").trim() || "#ffffff";
  const ink = css.getPropertyValue("--ink").trim() || "#16181D";
  const page = css.getPropertyValue("--bg").trim() || "#F2F3F7";

  const card = await toCanvas(node, {
    pixelRatio: 2,
    backgroundColor: bg,
    filter: (n) => !(n instanceof HTMLElement && n.dataset.shareIgnore !== undefined),
  });

  const pad = 48;
  const footer = 112;
  const out = document.createElement("canvas");
  out.width = card.width + pad * 2;
  out.height = card.height + pad * 2 + footer;
  const ctx = out.getContext("2d")!;
  ctx.fillStyle = page;
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(card, pad, pad);

  const logo = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(logoSvg(brand, onBrand))}`);
  const y = card.height + pad + 32;
  ctx.drawImage(logo, pad, y, 64, 64);
  ctx.fillStyle = ink;
  ctx.font = `700 40px ${getComputedStyle(document.body).fontFamily}`;
  ctx.textBaseline = "middle";
  ctx.fillText("Rumbodia", pad + 84, y + 32);

  return new Promise((resolve, reject) => out.toBlob((b) => (b ? resolve(b) : reject(new Error("empty"))), "image/png"));
}

interface ShareButtonProps {
  targetSelector: string;
  title: string;
}

/** Share a card as an image (Web Share API), falling back to a download. */
export function ShareButton({ targetSelector, title }: ShareButtonProps) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function share(e: React.MouseEvent<HTMLButtonElement>) {
    const node = (e.currentTarget.closest(targetSelector) as HTMLElement | null) ?? document.querySelector<HTMLElement>(targetSelector);
    if (!node) return;
    setBusy(true);
    try {
      const blob = await renderCard(node);
      const file = new File([blob], `${title.toLowerCase().replace(/\s+/g, "-")}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast.show({ message: "Image saved to your downloads." });
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") toast.show({ message: "Could not create the image. Try again.", tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <IconButton label="Share as image" onClick={share} disabled={busy} data-share-ignore="">
      {busy ? <Loader2 size={20} className="animate-spin" aria-hidden /> : <Share2 size={20} aria-hidden />}
    </IconButton>
  );
}
