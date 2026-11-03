export function isDesktopApp() {
  return typeof window !== "undefined" && (window as { nodexDesktop?: boolean }).nodexDesktop === true;
}
