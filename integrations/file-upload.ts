import { UTApi, UTFile } from "uploadthing/server";

interface FileWithMetadata extends File {
  metadata?: Record<string, unknown>;
}

export class FileUploadApi {
  private api = new UTApi();

  async upload(filesWithMetadata: FileWithMetadata[]): Promise<Array<string> | null> {
    const utFiles = filesWithMetadata.map(
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
}
