# Stellar Tools

## Compound Components with MixinProps

Use `MixinProps` and `splitProps` to create compound components that accept props for child elements.

Pattern:

1. Extend your component props with `MixinProps<"mixinName", ComponentProps>`
2. Use `splitProps()` to separate prefixed props
3. Spread the separated props onto child components

**Example:**

```typescript
interface MyComponentProps
  extends MixinProps<"label", React.ComponentProps<typeof Label>>,
    MixinProps<"error", React.ComponentProps<"p">> {
  value: string;
  onChange: (value: string) => void;
}

export function MyComponent({
  value,
  onChange,
  ...mixProps
}: MyComponentProps) {
  const { label, error, rest } = splitProps(mixProps, "label", "error");

  return (
    <div>
      <Label {...label}>Label</Label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
      {error && <p {...error}>Error message</p>}
    </div>
  );
}
```

**Usage:**

```typescript
<MyComponent
  value={value}
  onChange={setValue}
  labelClassName="text-sm font-medium" // Goes to Label
  errorClassName="text-red-500" // Goes to error <p>
  className="border rounded" // Goes to input (rest)
/>
```

Props prefixed with the mixin name (e.g., `labelClassName`, `errorId`) are automatically routed to their respective components.
