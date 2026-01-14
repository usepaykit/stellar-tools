import { UTApi, UTFile } from "uploadthing/server";

export class FileUpload {
  private api = new UTApi();

  async upload(files: File[], id: string) {
    const utFiles = files.map(
      (file) => new UTFile([file], file.name, { customId: id })
    );

    return this.api.uploadFiles(utFiles);
  }
  async delete(fileKeys: string | string[]) {
    return this.api.deleteFiles(fileKeys);
  }

  async replace(
    oldFileKeys: string | string[],
    newFiles: File[],
    id: string
  ) {
    await this.delete(oldFileKeys);
    return this.upload(newFiles, id);
  }
}
