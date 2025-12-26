"use client";

import * as React from "react";

import {
  ImageTransformer,
  type MimeType,
} from "@/integrations/image-transformer";
import { MixinProps, splitProps } from "@/lib/mixin";
import { cn } from "@/lib/utils";
import { ImagePlus, Loader2, Pencil } from "lucide-react";
import Image from "next/image";
import {
  type DropzoneOptions,
  type FileRejection,
  useDropzone,
} from "react-dropzone";

export interface FileWithPreview extends File {
  preview: string;
}

interface FileUploadPickerProps extends MixinProps<
  "dropzone",
  Omit<DropzoneOptions, "onDrop">
> {
  id?: string;
  value?: FileWithPreview[];
  onFilesChange?: (files: FileWithPreview[]) => void;
  onFilesRejected?: (rejections: FileRejection[]) => void;
  label?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
  /**
   * Enable automatic image transformation for web-compatible formats
   * @default false
   */
  enableTransformation?: boolean;
  /**
   * Target format for image transformation
   * @default "image/png"
   */
  targetFormat?: MimeType;
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
      enableTransformation = false,
      targetFormat = "image/png",
      ...mixinProps
    },
    ref
  ) => {
    const { dropzone } = splitProps(mixinProps, "dropzone");
    const [isTransforming, setIsTransforming] = React.useState(false);

    const onDrop = React.useCallback(
      async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
        if (acceptedFiles.length > 0) {
          setIsTransforming(true);

          try {
            // Revoke old preview URLs when replacing files in single mode
            if (!dropzone.multiple && value.length > 0) {
              value.forEach((file) => URL.revokeObjectURL(file.preview));
            }

            // Transform and create preview URLs
            const processedFiles = await Promise.all(
              acceptedFiles.map(async (file) => {
                let processedFile = file;
                let previewUrl: string;

                if (enableTransformation) {
                  try {
                    processedFile = await new ImageTransformer().transformTo(
                      file,
                      targetFormat
                    );
                    previewUrl = URL.createObjectURL(processedFile);
                  } catch (error) {
                    console.error("Image transformation failed:", error);
                    previewUrl = URL.createObjectURL(file);
                  }
                } else {
                  previewUrl = URL.createObjectURL(file);
                }

                return Object.assign(processedFile, {
                  preview: previewUrl,
                });
              })
            );

            const updatedFiles = dropzone.multiple
              ? [...value, ...processedFiles]
              : processedFiles;
            onFilesChange?.(updatedFiles);
          } finally {
            setIsTransforming(false);
          }
        }

        if (fileRejections.length > 0) {
          onFilesRejected?.(fileRejections);
        }
      },
      [
        dropzone.multiple,
        value,
        onFilesChange,
        onFilesRejected,
        enableTransformation,
        targetFormat,
      ]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      disabled: disabled || isTransforming,
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
            "group border-input bg-muted/5 relative flex h-64 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-all",
            isDragActive &&
              "border-primary bg-primary/5 ring-primary/10 ring-4",
            (disabled || isTransforming) && "cursor-not-allowed opacity-50",
            !hasImage &&
              !isTransforming &&
              "hover:bg-muted/50 hover:border-primary/50"
          )}
        >
          <input ref={ref} {...getInputProps({ id })} />

          {isTransforming && (
            <div className="bg-background/80 absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
              <p className="text-sm font-medium">Processing image...</p>
            </div>
          )}

          {hasImage ? (
            <>
              <Image
                key={currentFile.preview}
                src={currentFile.preview}
                alt={currentFile.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-200 group-hover:bg-black/40">
                <div className="flex flex-col items-center gap-2 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
                    <Pencil className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium">Change image</p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 px-6 text-center">
              <div className="bg-background rounded-full border p-4 shadow-sm">
                <ImagePlus className="text-muted-foreground h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{label}</p>
                {description && (
                  <p className="text-muted-foreground text-xs">{description}</p>
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
