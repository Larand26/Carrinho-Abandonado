import axios from "axios";
import loggerConfig from "../config/loggerConfig.js";

interface iLog {
  jobName: string;
  runId: number;
  environment: string;
  status: "success" | "error" | "warning" | "running";
  startedAt: Date;
  finishedAt?: Date;
  durationMs?: number;
  message?: string;
  details?: { [key: string]: any };
}

export default class Log {
  static async addLog(log: iLog) {
    try {
      const response = await axios.post(
        `${loggerConfig.loggerUrl}/rest/v1/add-log`,
        {
          log,
        },
      );
      if (response.status === 200) {
      } else {
        console.error("Failed to add log. Status:", response.status);
      }
    } catch (error) {
      console.error("Error occurred while adding log:", error);
    }
  }
}
