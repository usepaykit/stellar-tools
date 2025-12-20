import { z } from "zod";

export interface ApiResponse<T, E = string> {
  data: T;
  error?: E;
}

/**
 * validates that a zod schema exactly matches a typescript interface.
 *
 * @example
 * export const mySchema = schema<MyInterface>()(z.object({ ... }));
 */
export const schemaFor = <TInterface>() => {
  return <TSchema extends z.ZodType<TInterface>>(schema: TSchema): TSchema =>
    schema;
};
