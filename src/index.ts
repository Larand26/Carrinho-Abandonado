import App from "./App.js";
import nodeCron from "node-cron";
import { appConfig } from "./config/appConfig.js";
const app = new App();

nodeCron.schedule(appConfig.intervalCron, async () => {
  app.start();
});

nodeCron.schedule("0 21 * * *", async () => {
  await app.clearDatabase();
});

app.start();
