import App from "./App.js";
import nodeCron from "node-cron";
const app = new App();

nodeCron.schedule("0 10,12,14,16,18 * * *", async () => {
  app.start();
});

nodeCron.schedule("0 21 * * *", async () => {
  await app.clearDatabase();
});

app.start();
