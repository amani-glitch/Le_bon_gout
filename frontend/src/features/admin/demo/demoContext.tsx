import { createContext, useContext } from "react";

/**
 * When true, the admin screens are running in the public, read-only preview
 * (the `/demo/admin` route). Data hooks serve fixtures instead of calling the
 * API, and mutations become no-ops. Defaults to false so the real admin area
 * is unaffected.
 */
const DemoContext = createContext(false);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  return <DemoContext.Provider value={true}>{children}</DemoContext.Provider>;
}

export function useIsDemo(): boolean {
  return useContext(DemoContext);
}

/** Toast shown when a visitor triggers a write action inside the preview. */
export const DEMO_ACTION_MESSAGE = "This is a read-only preview — actions are disabled.";
