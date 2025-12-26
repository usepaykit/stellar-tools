import { Canvg } from "canvg";
import { heicTo } from "heic-to";

export type MimeType = `image/${string}`;

type ImageFormat = "heic" | "svg" | "webp" | "bitmap" | "unknown";

export class ImageTransformer {
  private readonly mimeToExt: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
  };

  private getExtensionFromMimeType(mimeType: string): string {
    return this.mimeToExt[mimeType.toLowerCase()] || "png";
  }

  async getSupportedFormat(file: File): Promise<ImageFormat> {
    const type = file.type.toLowerCase();
    const name = file.name.toLowerCase();

    if (
      type === "image/heic" ||
      type === "image/heif" ||
      name.endsWith(".heic") ||
      name.endsWith(".heif")
    ) {
      return "heic";
    }
    if (type === "image/svg+xml" || name.endsWith(".svg")) {
      return "svg";
    }
    if (type === "image/webp" || name.endsWith(".webp")) {
      return "webp";
    }

    // Bitmap formats
    if (["image/png", "image/jpeg", "image/jpg", "image/gif"].includes(type)) {
      return "bitmap";
    }
    return "unknown";
  }

  async heicToFormat(file: File, to: MimeType): Promise<File> {
    try {
      const result = await heicTo({
        blob: file,
        type: to,
        quality: 1,
      });

      let blob: Blob;

      if (result instanceof Blob) {
        blob = result;
      } else {
        // Convert ImageBitmap to Blob
        const imageBitmap = result as ImageBitmap;
        const canvas = document.createElement("canvas");
        canvas.width = imageBitmap.width;
        canvas.height = imageBitmap.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Failed to get canvas context");
        }
        ctx.drawImage(imageBitmap, 0, 0);

        blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error("Failed to convert"))),
            to
          );
        });
      }

      const extension = this.getExtensionFromMimeType(to);
      const fileName = file.name.replace(/\.(heic|heif)$/i, `.${extension}`);
      return new File([blob], fileName, { type: to });
    } catch (error) {
      throw new Error(
        `HEIC conversion failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async svgToFormat(file: File, to: MimeType): Promise<File> {
    const svgText = await file.text();

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
    const svgElement = svgDoc.documentElement;

    const width = parseInt(svgElement.getAttribute("width") || "1000") || 1000;
    const height =
      parseInt(svgElement.getAttribute("height") || "1000") || 1000;
    canvas.width = width;
    canvas.height = height;

    await (await Canvg.from(ctx, svgText)).render();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, to);
    });

    if (!blob) {
      throw new Error("Failed to convert SVG to blob");
    }

    const extension = this.getExtensionFromMimeType(to);
    const fileName = file.name.replace(/\.svg$/i, `.${extension}`);
    return new File([blob], fileName, { type: to });
  }

  async bitmapToFormat(file: File, to: MimeType): Promise<File> {
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);

      // Wait for image to load
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        throw new Error("Failed to get canvas context");
      }
      ctx.drawImage(img, 0, 0);

      // Clean up
      URL.revokeObjectURL(url);

      // Convert to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, to);
      });

      if (!blob) {
        throw new Error("Failed to convert image to blob");
      }

      const extension = this.getExtensionFromMimeType(to);
      const currentExt = file.name.split(".").pop() || "";
      const fileName = file.name.replace(
        new RegExp(`\\.${currentExt}$`, "i"),
        `.${extension}`
      );
      return new File([blob], fileName, { type: to });
    } catch (error) {
      throw new Error(
        `Image conversion failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async transformTo(file: File, to: MimeType): Promise<File> {
    const format = await this.getSupportedFormat(file);

    // Already in target format
    if (file.type.toLowerCase() === to.toLowerCase()) {
      return file;
    }

    switch (format) {
      case "heic":
        return await this.heicToFormat(file, to);
      case "svg":
        return await this.svgToFormat(file, to);
      case "webp":
      case "bitmap":
        return await this.bitmapToFormat(file, to);
      default:
        // Unknown format, return as-is
        return file;
    }
  }

  async createPreviewUrl(file: File, targetFormat?: MimeType): Promise<string> {
    try {
      let processedFile = file;

      // Convert to target format if specified
      if (targetFormat && file.type !== targetFormat) {
        processedFile = await this.transformTo(file, targetFormat);
      }

      return URL.createObjectURL(processedFile);
    } catch (error) {
      console.error("Failed to create preview URL:", error);
      // Fallback to original file
      return URL.createObjectURL(file);
    }
  }

  async transformBatch(
    files: File[],
    to: MimeType
  ): Promise<{ file: File; original: File }[]> {
    return Promise.all(
      files.map(async (original) => ({
        file: await this.transformTo(original, to),
        original,
      }))
    );
  }

  /**
   * Check if a file needs transformation to be web-compatible
   */
  async needsTransformation(file: File): Promise<boolean> {
    const format = await this.getSupportedFormat(file);
    return format === "heic" || format === "svg";
  }
}
