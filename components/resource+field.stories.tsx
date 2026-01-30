import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ResourceField } from "./resource+field";

type SampleResource = {
  id: string;
  name: string;
  description?: string;
};

const sampleItems: SampleResource[] = [
  { id: "1", name: "Project Alpha", description: "Main dashboard project" },
  { id: "2", name: "Project Beta", description: "API integration" },
  { id: "3", name: "Project Gamma", description: "Mobile app" },
  { id: "4", name: "Project Delta", description: "Analytics pipeline" },
  { id: "5", name: "Project Epsilon", description: "Customer portal" },
];

const renderItem = (item: SampleResource) => ({
  id: item.id,
  title: item.name,
  subtitle: item.description,
  searchValue: [item.name, item.description].filter(Boolean).join(" ").toLowerCase(),
});

const meta = {
  title: "Components/ResourceField",
  component: ResourceField,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: "text",
    },
    error: {
      control: "text",
    },
    placeholder: {
      control: "text",
    },
    multiple: {
      control: "boolean",
    },
    isLoading: {
      control: "boolean",
    },
    maxHeight: {
      control: "text",
    },
  },
} satisfies Meta<typeof ResourceField>;

export default meta;
type Story = StoryObj<typeof meta>;

const ResourceFieldWithState = (args: any) => {
  const [value, setValue] = useState<string[]>(args.value ?? []);
  return (
    <div className="w-full max-w-md">
      <ResourceField<SampleResource>
        items={args.items ?? sampleItems}
        value={value}
        onChange={setValue}
        renderItem={renderItem}
        placeholder={args.placeholder ?? "Search resources..."}
        multiple={args.multiple ?? false}
        isLoading={args.isLoading ?? false}
        onAddNew={args.onAddNew}
        label={args.label === undefined ? "Resource" : args.label}
        error={args.error ?? undefined}
        maxHeight={args.maxHeight ?? "300px"}
        skeletonRowCount={args.skeletonRowCount ?? 5}
      />
    </div>
  );
};

export const Default: Story = {
  render: (args) => <ResourceFieldWithState {...args} />,
  args: {
    label: "Resource",
    placeholder: "Search resources...",
    items: sampleItems,
  } as any,
};

export const Multiple: Story = {
  render: (args) => <ResourceFieldWithState {...args} />,
  args: {
    label: "Resources",
    placeholder: "Search resources...",
    items: sampleItems,
    multiple: true,
  } as any,
};

export const WithInitialValue: Story = {
  render: (args) => <ResourceFieldWithState {...args} />,
  args: {
    label: "Resource",
    placeholder: "Search resources...",
    items: sampleItems,
    value: ["1"],
  } as any,
};

export const WithMultipleSelected: Story = {
  render: (args) => <ResourceFieldWithState {...args} />,
  args: {
    label: "Resources",
    placeholder: "Search resources...",
    items: sampleItems,
    multiple: true,
    value: ["1", "3", "5"],
  } as any,
};

export const Loading: Story = {
  render: (args) => <ResourceFieldWithState {...args} />,
  args: {
    label: "Resource",
    placeholder: "Search resources...",
    items: [],
    isLoading: true,
  } as any,
};

export const WithError: Story = {
  render: (args) => <ResourceFieldWithState {...args} />,
  args: {
    label: "Resource",
    placeholder: "Search resources...",
    items: sampleItems,
    error: "Please select a resource",
  } as any,
};

export const Empty: Story = {
  render: (args) => <ResourceFieldWithState {...args} />,
  args: {
    label: "Resource",
    placeholder: "Search resources...",
    items: [],
  } as any,
};

export const WithAddNew: Story = {
  render: (args) => <ResourceFieldWithState {...args} />,
  args: {
    label: "Resource",
    placeholder: "Search resources...",
    items: sampleItems,
    onAddNew: () => alert("Create new clicked"),
  } as any,
};

export const WithoutLabel: Story = {
  render: (args) => <ResourceFieldWithState {...args} />,
  args: {
    label: null,
    placeholder: "Search resources...",
    items: sampleItems,
  } as any,
};

export const CustomPlaceholder: Story = {
  render: (args) => <ResourceFieldWithState {...args} />,
  args: {
    label: "Resource",
    placeholder: "Type to search...",
    items: sampleItems,
  } as any,
};
