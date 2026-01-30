import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import type { FileWithPreview } from "./file+upload";
import { FileUpload } from "./file+upload";

// 1x1 transparent PNG data URL for image preview in stories
const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function createImageFile(name: string): FileWithPreview {
  const file = new File([], name, { type: "image/png" });
  return Object.assign(file, { preview: TINY_PNG });
}

function createNonImageFile(name: string, type: string): FileWithPreview {
  const file = new File([], name, { type });
  return Object.assign(file, { preview: "#" });
}

const FileUploadWithState = (args: any) => {
  const [value, setValue] = useState<FileWithPreview[]>(args.value ?? []);
  return (
    <div className="min-w-[400px] w-full max-w-md">
      <FileUpload
        value={value}
        onFilesChange={setValue}
        onFilesRejected={args.onFilesRejected}
        label={args.label}
        error={args.error}
        description={args.description}
        placeholder={args.placeholder}
        disabled={args.disabled}
        enableTransformation={args.enableTransformation}
        targetFormat={args.targetFormat}
        dropzoneMultiple={args.dropzoneMultiple}
        dropzoneAccept={args.dropzoneAccept}
      />
    </div>
  );
};

const meta = {
  title: "Components/FileUpload",
  component: FileUpload,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-[480px]">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    label: {
      control: "text",
    },
    error: {
      control: "text",
    },
    description: {
      control: "text",
    },
    placeholder: {
      control: "text",
    },
    disabled: {
      control: "boolean",
    },
    enableTransformation: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <FileUploadWithState {...args} />,
  args: {
    label: "Upload file",
    placeholder: "Drag & drop an image here, or click to select",
  } as any,
};

export const WithDescription: Story = {
  render: (args) => <FileUploadWithState {...args} />,
  args: {
    label: "Upload file",
    placeholder: "Drag & drop an image here, or click to select",
    description: "PNG, JPG or GIF up to 10MB",
  } as any,
};

export const WithError: Story = {
  render: (args) => <FileUploadWithState {...args} />,
  args: {
    label: "Upload file",
    placeholder: "Drag & drop an image here, or click to select",
    error: "Please upload an image file",
  } as any,
};

export const Disabled: Story = {
  render: (args) => <FileUploadWithState {...args} />,
  args: {
    label: "Upload file",
    placeholder: "Drag & drop an image here, or click to select",
    disabled: true,
  } as any,
};

export const WithoutLabel: Story = {
  render: (args) => <FileUploadWithState {...args} />,
  args: {
    label: null,
    placeholder: "Drag & drop an image here, or click to select",
  } as any,
};

export const CustomPlaceholder: Story = {
  render: (args) => <FileUploadWithState {...args} />,
  args: {
    label: "Upload file",
    placeholder: "Click or drop your file here",
  } as any,
};

export const WithInitialImage: Story = {
  render: (args) => <FileUploadWithState {...args} />,
  args: {
    label: "Upload file",
    placeholder: "Drag & drop an image here, or click to select",
    value: [createImageFile("example.png")],
  } as any,
};

export const WithInitialFile: Story = {
  render: (args) => <FileUploadWithState {...args} />,
  args: {
    label: "Upload file",
    placeholder: "Drag & drop an image here, or click to select",
    value: [createNonImageFile("document.pdf", "application/pdf")],
  } as any,
};

export const Multiple: Story = {
  render: (args) => <FileUploadWithState {...args} />,
  args: {
    label: "Upload files",
    placeholder: "Drag & drop images here, or click to select",
    description: "You can select multiple files",
    dropzoneMultiple: true,
  } as any,
};

export const AcceptImagesOnly: Story = {
  render: (args) => <FileUploadWithState {...args} />,
  args: {
    label: "Upload image",
    placeholder: "Drag & drop an image here, or click to select",
    description: "Only PNG, JPG and GIF",
    dropzoneAccept: { "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"], "image/gif": [".gif"] },
  } as any,
};
