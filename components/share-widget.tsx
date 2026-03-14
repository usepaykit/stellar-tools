"use client";

import * as React from "react";

import { useCookieState } from "@/hooks/use-cookie-state";
import { Button } from "@/components/ui/button";
import { type NormalizedChartPoint, cn } from "@/lib/utils";
import { saveAs } from "file-saver";
import { Check, Copy, Download } from "lucide-react";

export interface ShareWidgetProps {
  title: string;
  value: string | number;
  subtitle: string;
  sparkData: NormalizedChartPoint[];
}

type ThemeId = "dark" | "midnight" | "light";

interface ThemeConfig {
  id: ThemeId;
  label: string;
  outerBg: [string, string];
  frameFill: [string, string];
  cardBg: string;
  titleColor: string;
  valueColor: string;
  subtitleColor: string;
  lineColor: string;
  areaColor: string;
  logoColor: string;
  swatchStyle: React.CSSProperties;
}

const THEMES: ThemeConfig[] = [
  {
    id: "dark",
    label: "Dark",
    outerBg: ["#080808", "#111111"],
    frameFill: ["#3a3a3a", "#1a1a1a"],
    cardBg: "#0f0f0f",
    titleColor: "#71717a",
    valueColor: "#fafafa",
    subtitleColor: "#52525b",
    lineColor: "#6366f1",
    areaColor: "#6366f138",
    logoColor: "#e4e4e7",
    swatchStyle: {
      background: "radial-gradient(circle at 35% 35%, #6b7280, #111827)",
    },
  },
  {
    id: "midnight",
    label: "Midnight",
    outerBg: ["#0c0a1e", "#1a1535"],
    frameFill: ["#4c3b8a", "#1e1b4b"],
    cardBg: "#100e24",
    titleColor: "#a5b4fc",
    valueColor: "#f0f0ff",
    subtitleColor: "#6d28d9",
    lineColor: "#818cf8",
    areaColor: "#818cf838",
    logoColor: "#c4b5fd",
    swatchStyle: {
      background: "radial-gradient(circle at 35% 35%, #818cf8, #312e81)",
    },
  },
  {
    id: "light",
    label: "Light",
    outerBg: ["#f0f0f4", "#e4e4ec"],
    frameFill: ["#d4d4d8", "#a1a1aa"],
    cardBg: "#ffffff",
    titleColor: "#71717a",
    valueColor: "#09090b",
    subtitleColor: "#a1a1aa",
    lineColor: "#6366f1",
    areaColor: "#6366f128",
    logoColor: "#a1a1aa",
    swatchStyle: {
      background: "radial-gradient(circle at 35% 35%, #e5e7eb, #9ca3af)",
    },
  },
];

const W = 640;
const H = 460;
const PREVIEW_MAX_W = 560;

const DM_SANS_FAMILY = "DM Sans";

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawSparkline(
  ctx: CanvasRenderingContext2D,
  data: NormalizedChartPoint[],
  x: number,
  y: number,
  w: number,
  h: number,
  lineColor: string,
  areaColor: string
) {
  if (data.length < 2) {
    ctx.beginPath();
    ctx.moveTo(x, y + h / 2);
    ctx.lineTo(x + w, y + h / 2);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    return;
  }

  const vals = data.map((d) => d.value);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const range = hi - lo || 1;

  const pts = vals.map((v, i) => ({
    px: x + (i / (vals.length - 1)) * w,
    py: y + (1 - (v - lo) / range) * h * 0.75 + h * 0.12,
  }));

  const areaGrad = ctx.createLinearGradient(0, y, 0, y + h);
  areaGrad.addColorStop(0, areaColor);
  areaGrad.addColorStop(1, "transparent");

  ctx.beginPath();
  ctx.moveTo(pts[0].px, y + h);
  ctx.lineTo(pts[0].px, pts[0].py);
  for (let i = 1; i < pts.length; i++) {
    const mx = (pts[i - 1].px + pts[i].px) / 2;
    ctx.bezierCurveTo(mx, pts[i - 1].py, mx, pts[i].py, pts[i].px, pts[i].py);
  }
  ctx.lineTo(pts[pts.length - 1].px, y + h);
  ctx.closePath();
  ctx.fillStyle = areaGrad;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(pts[0].px, pts[0].py);
  for (let i = 1; i < pts.length; i++) {
    const mx = (pts[i - 1].px + pts[i].px) / 2;
    ctx.bezierCurveTo(mx, pts[i - 1].py, mx, pts[i].py, pts[i].px, pts[i].py);
  }
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.stroke();
}

function renderToCanvas(
  canvas: HTMLCanvasElement,
  theme: ThemeConfig,
  title: string,
  value: string | number,
  subtitle: string,
  sparkData: NormalizedChartPoint[],
  logoImage: HTMLImageElement | null
) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr;
  canvas.height = H * dpr;

  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);

  const fontFamily = DM_SANS_FAMILY;

  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, theme.outerBg[0]);
  bgGrad.addColorStop(1, theme.outerBg[1]);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  const FX = 26,
    FY = 26,
    FW = W - 52,
    FH = 330;
  const frameGrad = ctx.createLinearGradient(FX, FY, FX + FW, FY + FH);
  frameGrad.addColorStop(0, theme.frameFill[0]);
  frameGrad.addColorStop(1, theme.frameFill[1]);
  roundedRect(ctx, FX, FY, FW, FH, 22);
  ctx.fillStyle = frameGrad;
  ctx.fill();

  // Inner card
  const CP = 13;
  const CX = FX + CP,
    CY = FY + CP;
  const CW = FW - CP * 2,
    CH = FH - CP * 2;
  roundedRect(ctx, CX, CY, CW, CH, 12);
  ctx.fillStyle = theme.cardBg;
  ctx.fill();

  const pad = 24;
  const contentLeft = CX + pad;
  const contentWidth = CW - pad * 2;

  // Clip content to card shape
  ctx.save();
  roundedRect(ctx, CX, CY, CW, CH, 12);
  ctx.clip();

  // Title (app font: DM Sans)
  ctx.font = `500 11px ${fontFamily}, -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.fillStyle = theme.titleColor;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillText(title.toUpperCase(), contentLeft, CY + 20);

  ctx.font = `700 40px ${fontFamily}, -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.fillStyle = theme.valueColor;
  const displayValue = typeof value === "number" ? value.toLocaleString() : String(value);
  let valueText = displayValue;
  while (ctx.measureText(valueText + "…").width > contentWidth && valueText.length > 0) {
    valueText = valueText.slice(0, -1);
  }
  if (valueText.length < displayValue.length) valueText += "…";
  ctx.fillText(valueText, contentLeft, CY + 50);

  // Subtitle dot + text
  const dotCY = CY + 108;
  ctx.beginPath();
  ctx.arc(contentLeft + 4, dotCY + 5, 4, 0, Math.PI * 2);
  ctx.fillStyle = theme.lineColor;
  ctx.fill();

  ctx.font = `400 11px ${fontFamily}, -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.fillStyle = theme.subtitleColor;
  ctx.fillText(subtitle, contentLeft + 20, dotCY);

  // Sparkline in the bottom portion of the card (with horizontal padding)
  const sparkTop = CY + CH * 0.5;
  const sparkH = CY + CH - sparkTop;
  drawSparkline(ctx, sparkData, contentLeft, sparkTop, contentWidth, sparkH, theme.lineColor, theme.areaColor);

  ctx.restore();

  // Logo + "StellarTools" below the frame (centered as a group, larger and brighter)
  const logoAreaTop = FY + FH;
  const logoCenterY = logoAreaTop + (H - logoAreaTop) / 2;
  const logoLabel = "StellarTools";
  const logoFontSize = 20;
  ctx.font = `600 ${logoFontSize}px ${fontFamily}, -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.fillStyle = theme.logoColor;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const labelW = ctx.measureText(logoLabel).width;
  const logoSize = 32;
  const logoGap = 10;
  const groupW = (logoImage ? logoSize + logoGap : 0) + labelW;
  let logoTextX = (W - groupW) / 2;
  if (logoImage && logoImage.complete && logoImage.naturalWidth > 0) {
    const logoY = logoCenterY - logoSize / 2;
    ctx.drawImage(logoImage, logoTextX, logoY, logoSize, logoSize);
    logoTextX += logoSize + logoGap;
  }
  ctx.fillText(logoLabel, logoTextX, logoCenterY);
  ctx.textAlign = "left";
}

const LOGO_LIGHT_SRC = "/images/logo-light.png";
const LOGO_DARK_SRC = "/images/logo-dark.png";

export function ShareWidget({ title, value, subtitle, sparkData }: ShareWidgetProps) {
  const [theme, setTheme] = useCookieState<ThemeId>("share_theme", "dark");
  const [copied, setCopied] = React.useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [logos, setLogos] = React.useState<{ light: HTMLImageElement | null; dark: HTMLImageElement | null }>({
    light: null,
    dark: null,
  });

  const currentTheme = THEMES.find((t) => t.id === theme)!;
  const logoImage = theme === "light" ? logos.dark : logos.light;

  React.useEffect(() => {
    const light = new Image();
    light.crossOrigin = "anonymous";
    light.onload = () => setLogos((prev) => ({ ...prev, light }));
    light.src = LOGO_LIGHT_SRC;
    const dark = new Image();
    dark.crossOrigin = "anonymous";
    dark.onload = () => setLogos((prev) => ({ ...prev, dark }));
    dark.src = LOGO_DARK_SRC;
  }, []);

  const redraw = React.useCallback(() => {
    if (canvasRef.current) {
      renderToCanvas(canvasRef.current, currentTheme, title, value, subtitle, sparkData, logoImage);
    }
  }, [currentTheme, title, value, subtitle, sparkData, logoImage]);

  React.useEffect(() => {
    // Wait for DM Sans (from Google Fonts in layout) to be available for canvas
    document.fonts.ready.then(redraw);
  }, [redraw]);

  const getBlob = (): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      if (!canvas) return reject(new Error("Canvas not ready"));
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/png");
    });

  const handleDownload = async () => {
    const blob = await getBlob();
    saveAs(blob, `${title.toLowerCase().replace(/\s+/g, "-")}-metric.png`);
  };

  const handleCopy = async () => {
    try {
      const blob = await getBlob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const canvas = canvasRef.current;
      if (canvas) await navigator.clipboard.writeText(canvas.toDataURL());
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="flex w-full max-w-full justify-center overflow-hidden rounded-xl">
        <canvas
          ref={canvasRef}
          className="h-auto w-full max-w-full"
          style={{ width: "100%", maxWidth: PREVIEW_MAX_W, aspectRatio: `${W} / ${H}` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              title={t.label}
              className={cn(
                "size-8 rounded-full transition-all",
                theme === t.id
                  ? "ring-primary ring-offset-background ring-2 ring-offset-2"
                  : "opacity-60 hover:opacity-90"
              )}
              style={t.swatchStyle}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1.5">
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button size="sm" onClick={handleDownload} className="gap-1.5">
            <Download className="size-3.5" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
}
