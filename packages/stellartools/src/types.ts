export type OverrideProps<T, V> = V & Omit<T, keyof V>;

export type MaybeArray<T> = T | Array<T>;

export type SuggestedString<T extends string> = T | (string & {});
