export type LooseAutoComplete<T extends string> = T | Omit<string, T>;

export type OverrideProps<T, V> = V & Omit<T, keyof V>;
