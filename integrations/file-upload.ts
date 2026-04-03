import sharp from "sharp";
import { UTApi, UTFile } from "uploadthing/server";

interface FileWithMetadata extends File {
  metadata?: Record<string, unknown>;
}

export interface UploadOptions {
  maxSizeKB?: number;
}

export class FileUploadApi {
  private api = new UTApi();

  async upload(filesWithMetadata: FileWithMetadata[], options?: UploadOptions): Promise<Array<string> | null> {
    const processedFiles = await Promise.all(
      filesWithMetadata.map(async (file) => {
        if (options?.maxSizeKB && file.type.startsWith("image/")) {
          file = await this.compressToTarget(file, options.maxSizeKB).catch((err) => {
            console.error(`Compression failed for ${file.name}, uploading original.`, err);
            return file;
          });
        }
        return file;
      })
    );

    const utFiles = processedFiles.map(
      (file) => new UTFile([file], file.name, { customId: JSON.stringify(file.metadata) })
    );

    const response = await this.api.uploadFiles(utFiles);

    const errors = response.filter((file) => file.error);

    if (errors.length > 0) {
      throw new Error(`Failed to upload files: ${errors.map((file) => file.error?.message).join(", ")}`);
    }

    return response
      .map((file) => file.data?.ufsUrl ?? null)
      .filter((url): url is NonNullable<typeof url> => url !== null);
  }

  async delete(fileKeys: string[]) {
    const response = await this.api.deleteFiles(fileKeys);

    if (!response.success) {
      throw new Error(`Failed to delete files: ${response.deletedCount} files not deleted`);
    }

    return true;
  }

  async replace(oldFileKeys: string[], newFilesWithMetadata: FileWithMetadata[]) {
    const deleted = await this.delete(oldFileKeys);

    if (!deleted) {
      throw new Error(`Failed to delete files: ${oldFileKeys.join(", ")}`);
    }

    return await this.upload(newFilesWithMetadata);
  }

  // -- INTERNAL --

  private async compressToTarget(file: File, maxKB: number): Promise<File> {
    const targetBytes = maxKB * 1024;
    const buffer = Buffer.from(await file.arrayBuffer());
    const metadata = await sharp(buffer).metadata();
    const originalWidth = metadata.width ?? 1200;

    for (let q = 85; q >= 30; q -= 10) {
      const candidate = await sharp(buffer).jpeg({ quality: q }).toBuffer();
      if (candidate.byteLength <= targetBytes) return this.bufferToFile(candidate, file.name, "jpeg");
    }

    for (let scale = 0.8; scale >= 0.1; scale -= 0.2) {
      const candidate = await sharp(buffer)
        .jpeg({ quality: 50 })
        .resize({ width: Math.round(originalWidth * scale), withoutEnlargement: true })
        .toBuffer();

      if (candidate.byteLength <= targetBytes) return this.bufferToFile(candidate, file.name, "jpeg");
    }

    const finalBuffer = await sharp(buffer)
      .resize({ width: Math.round(originalWidth * 0.1) })
      .jpeg({ quality: 20 })
      .toBuffer();

    return this.bufferToFile(finalBuffer, file.name, "jpeg");
  }

  private bufferToFile(buffer: Buffer, originalName: string, format: "jpeg"): File {
    const newName = originalName.replace(/\.[^/.]+$/, "") + `.${format}`;
    return new File([new Uint8Array(buffer)], newName, { type: `image/${format}` });
  }
}
