import dotenv from "dotenv";
dotenv.config();

const rdConfig = {
  clientId: process.env.RD_CLIENT_ID || "seu_cliente_id",
  clientSecret: process.env.RD_CLIENT_SECRET || "seu_cliente_secret",
  apiHost: process.env.API_RDSTATION_HOST || "seu_api_host",
  ownerId: process.env.RD_OWNER_ID || "seu_owner_id",
  dealStageId: process.env.RD_DEAL_STAGE_ID || "seu_deal_stage_id",
};

export default rdConfig;
