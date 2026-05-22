import dotenv from "dotenv";
dotenv.config();

export const apiConfig = {
  apiUrl:
    process.env.API_HOST +
      (process.env.API_PORT ? `:${process.env.API_PORT}` : "") ||
    "http://localhost:3000",
  apiToken: process.env.API_TOKEN || "",
};
