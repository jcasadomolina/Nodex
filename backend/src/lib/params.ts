import { z } from "zod";
import { HttpError } from "./http-error.js";

export function parseId(value: string | undefined, notFoundMessage: string) {
  const result = z.uuid().safeParse(value);
  if (!result.success) {
    throw new HttpError(404, notFoundMessage);
  }
  return result.data;
}
