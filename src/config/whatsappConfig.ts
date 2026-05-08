import dotenv from "dotenv";

dotenv.config();

export const whatsappConfig = {
  apiUrl: process.env.WHATSAPP_API_URL || "",
  apiToken: process.env.WHATSAPP_API_TOKEN || "",
};
