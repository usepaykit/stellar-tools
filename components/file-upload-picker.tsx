"use client";

import * as React from "react";
import Image from "next/image";
import {
  useDropzone,
  type DropzoneOptions,
  type FileRejection,
} from "react-dropzone";
import { ImagePlus, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { MixinProps, splitProps } from "@/lib/mixin";

export interface FileWithPreview extends File {
  preview: string;
}

interface FileUploadPickerProps
  extends MixinProps<"dropzone", Omit<DropzoneOptions, "onDrop">> {
  id?: string;
  value?: FileWithPreview[];
  onFilesChange?: (files: FileWithPreview[]) => void;
  onFilesRejected?: (rejections: FileRejection[]) => void;
  label?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
}

export const FileUploadPicker = React.forwardRef<
  HTMLInputElement,
  FileUploadPickerProps
>(
  (
    {
      value = [],
      onFilesChange,
      onFilesRejected,
      label = "Drag & drop an image here, or click to select",
      description,
      className,
      id,
      disabled = false,
      ...mixinProps
    },
    ref
  ) => {
    const { dropzone } = splitProps(mixinProps, "dropzone");

    const onDrop = React.useCallback(
      (acceptedFiles: File[], fileRejections: FileRejection[]) => {
        if (acceptedFiles.length > 0) {
          // Revoke old preview URLs when replacing files in single mode
          if (!dropzone.multiple && value.length > 0) {
            value.forEach((file) => URL.revokeObjectURL(file.preview));
          }

          const newFiles = acceptedFiles.map((file) =>
            Object.assign(file, {
              preview: URL.createObjectURL(file),
            })
          );

          const updatedFiles = dropzone.multiple
            ? [...value, ...newFiles]
            : newFiles;
          onFilesChange?.(updatedFiles);
        }

        if (fileRejections.length > 0) {
          onFilesRejected?.(fileRejections);
        }
      },
      [dropzone.multiple, value, onFilesChange, onFilesRejected]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      disabled,
      ...dropzone,
    });

    React.useEffect(() => {
      return () => value.forEach((file) => URL.revokeObjectURL(file.preview));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const currentFile = value[0];
    const hasImage = currentFile && currentFile.type.startsWith("image/");

    return (
      <div className={cn("w-full", className)}>
        <div
          {...getRootProps()}
          className={cn(
            "group relative flex flex-col items-center justify-center w-full h-64 rounded-lg border-2 border-dashed border-input bg-muted/5 transition-all cursor-pointer overflow-hidden",
            isDragActive &&
              "border-primary bg-primary/5 ring-4 ring-primary/10",
            disabled && "opacity-50 cursor-not-allowed",
            !hasImage && "hover:bg-muted/50 hover:border-primary/50"
          )}
        >
          <input ref={ref} {...getInputProps({ id })} />

          {hasImage ? (
            <>
              <Image
                key={currentFile.preview}
                src={currentFile.preview}
                alt={currentFile.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center gap-2 text-white">
                  <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
                    <Pencil className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium">Change image</p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center px-6">
              <div className="p-4 rounded-full bg-background border shadow-sm">
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{label}</p>
                {description && (
                  <p className="text-xs text-muted-foreground">{description}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

FileUploadPicker.displayName = "FileUploadPicker";
