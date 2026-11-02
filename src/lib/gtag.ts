// Google Analytics 4 (GA4) Utility Functions
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || "G-VN0DHF5VPL";

// Log page views
export const pageview = (url: string) => {
  if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
    (window as any).gtag("config", GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// Log custom GA4 events
export const trackEvent = (
  action: string,
  params: Record<string, any> = {}
) => {
  if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
    (window as any).gtag("event", action, params);
  }
};
