import dotenv from "dotenv";
dotenv.config();

export const errorConfig = {
  baseURL: process.env.URL_ERROR_API || "http://localhost/error",
  token: process.env.TOKEN_ERROR_API || "your-error-token",
  email: process.env.EMAIL_ERROR_API || "your-email@example.com",
};
