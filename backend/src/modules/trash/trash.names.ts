export const MAX_GROUP_NAME = 80;

const RESTORED_SUFFIX = / \(restaurado(?: \d+)?\)$/;

export function restoredName(name: string, attempt: number) {
  if (attempt === 0) return name;
  const suffix = attempt === 1 ? " (restaurado)" : ` (restaurado ${attempt})`;
  return name.replace(RESTORED_SUFFIX, "").slice(0, MAX_GROUP_NAME - suffix.length) + suffix;
}
