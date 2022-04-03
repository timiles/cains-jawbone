// This is needed for serving app from subdirectory
export const APP_BASE =
  process.env.NODE_ENV !== "production" ? "" : "/cains-jawbone";
