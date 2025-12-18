import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { PhoneNumberPicker, type PhoneNumber } from "./phone-number-picker";

const meta = {
  title: "Components/PhoneNumberPicker",
  component: PhoneNumberPicker,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    disabled: {
      control: "boolean",
    },
    label: {
      control: "text",
    },
    error: {
      control: "text",
    },
    value: {
      control: "object",
    },
  },
} satisfies Meta<typeof PhoneNumberPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

const PhoneNumberPickerWithState = (args: any) => {
  const [value, setValue] = useState<PhoneNumber>(
    args.value || { countryCode: "US", number: "" }
  );

  return (
    <div className="w-[350px]">
      <PhoneNumberPicker
        id="phone-picker"
        value={value}
        onChange={setValue}
        label={args.label ?? "Phone Number"}
        error={args.error ?? null}
        disabled={args.disabled}
      />
    </div>
  );
};

export const Default: Story = {
  render: () => (
    <div className="w-[350px]">
      <PhoneNumberPickerWithState label="Phone Number" />
    </div>
  ),
  args: {} as any,
};

export const WithInitialValue: Story = {
  render: () => (
    <div className="w-[350px]">
      <PhoneNumberPickerWithState
        label="Phone Number"
        value={{ countryCode: "US", number: "5551234567" }}
      />
    </div>
  ),
  args: {} as any,
};

export const Disabled: Story = {
  render: () => (
    <div className="w-[350px]">
      <PhoneNumberPickerWithState
        label="Phone Number"
        disabled={true}
        value={{ countryCode: "US", number: "5551234567" }}
      />
    </div>
  ),
  args: {} as any,
};

export const WithError: Story = {
  render: () => (
    <div className="w-[350px]">
      <PhoneNumberPickerWithState
        label="Phone Number"
        error="Please enter a valid phone number"
        value={{ countryCode: "US", number: "123" }}
      />
    </div>
  ),
  args: {} as any,
};

export const WithoutLabel: Story = {
  render: () => (
    <div className="w-[350px]">
      <PhoneNumberPickerWithState label={null} />
    </div>
  ),
  args: {} as any,
};
