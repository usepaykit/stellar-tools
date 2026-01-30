import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { RadioGroup } from "./radio-group";

const defaultItems = [
  { value: "option-a", label: "Option A" },
  { value: "option-b", label: "Option B" },
  { value: "option-c", label: "Option C" },
];

const meta = {
  title: "Components/RadioGroup",
  component: RadioGroup,
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
    helpText: {
      control: "text",
    },
    itemLayout: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
    disabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const RadioGroupWithState = (args: any) => {
  const [value, setValue] = useState(args.value ?? args.items?.[0]?.value ?? "");
  return (
    <div className="w-full max-w-sm">
      <RadioGroup
        id="radio-group"
        items={args.items ?? defaultItems}
        value={value}
        onChange={setValue}
        label={args.label === undefined ? "Choose an option" : args.label}
        error={args.error ?? null}
        helpText={args.helpText ?? null}
        itemLayout={args.itemLayout ?? "horizontal"}
        disabled={args.disabled}
      />
    </div>
  );
};

export const Default: Story = {
  render: (args) => <RadioGroupWithState {...args} />,
  args: {
    label: "Choose an option",
    items: defaultItems,
  } as any,
};

export const WithInitialValue: Story = {
  render: (args) => <RadioGroupWithState {...args} />,
  args: {
    label: "Choose an option",
    items: defaultItems,
    value: "option-b",
  } as any,
};

export const VerticalLayout: Story = {
  render: (args) => <RadioGroupWithState {...args} />,
  args: {
    label: "Choose an option",
    items: defaultItems,
    itemLayout: "vertical",
  } as any,
};

export const WithError: Story = {
  render: (args) => <RadioGroupWithState {...args} />,
  args: {
    label: "Choose an option",
    items: defaultItems,
    error: "Please select an option",
  } as any,
};

export const WithHelpText: Story = {
  render: (args) => <RadioGroupWithState {...args} />,
  args: {
    label: "Choose an option",
    items: defaultItems,
    helpText: "Select the option that best fits your needs.",
  } as any,
};

export const Disabled: Story = {
  render: (args) => <RadioGroupWithState {...args} />,
  args: {
    label: "Choose an option",
    items: defaultItems,
    value: "option-a",
    disabled: true,
  } as any,
};

export const WithoutLabel: Story = {
  render: (args) => <RadioGroupWithState {...args} />,
  args: {
    label: null,
    items: defaultItems,
  } as any,
};
