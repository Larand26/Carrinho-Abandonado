import dotenv from "dotenv";
dotenv.config();

export const magentoConfig = {
  baseURL: process.env.MAGENTO_BASE_URL || "http://localhost/magento",
  token: process.env.MAGENTO_ACCESS_TOKEN || "your-magento-token",
};
