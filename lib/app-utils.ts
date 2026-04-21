import { APP_CONFIG, AppResource } from "@stellartools/app-embed-bridge";

/**
 * Identifies which resource category an event belongs to.
 * e.g. "customer::created" -> "customers"
 */
export const getResourceForEvent = (eventType: string): AppResource | undefined => {
  return (Object.keys(APP_CONFIG) as AppResource[]).find((key) =>
    (APP_CONFIG[key].events as readonly string[]).includes(eventType)
  );
};
