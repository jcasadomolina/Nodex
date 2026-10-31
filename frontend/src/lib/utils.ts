import type { CSSProperties } from "react"

export { cn } from "cn"

export function cue(d: number, o?: number) {
  return { "--d": `${d}s`, ...(o !== undefined && { "--o": `${o}s` }) } as CSSProperties
}
