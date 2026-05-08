import dotenv from "dotenv";
dotenv.config();

export const appConfig = {
  timeToProcessCart: Number(process.env.CART_ABANDON_THRESHOLD_MINUTES) || 120,
  intervalCron: process.env.CHECK_INTERVAL_CRON || "*/15 * * * *",
};
