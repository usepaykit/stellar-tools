export type OverrideProps<T, V> = V & Omit<T, keyof V>;

export type MaybeArray<T> = T | Array<T>;

export type MaybePromise<T> = T | Promise<T>;

export type SuggestedString<T extends string> = T | (string & {});

export type Prettify<T> = { [K in keyof T]: T[K] } & {};

// -- INTERNAL TYPES -- //

export type Network = "testnet" | "mainnet";
