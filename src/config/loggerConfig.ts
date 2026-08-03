import dotenv from "dotenv";

dotenv.config();

const configs = {
  loggerUrl: process.env.LOGGER_URL || "http://localhost:3000",
  activeLogger: process.env.ACTIVE_LOGGER === "true" || false,
};

export default configs;
