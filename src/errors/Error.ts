import { errorConfig } from "../config/errorConfig.js";
import axios from "axios";

export default class Error {
  to: string;
  subject: string;
  errorDetails: any;
  html: string;
  urlApi: string;
  token: string;
  app: string;
  constructor(subject: string, errorDetails: any, html?: string) {
    this.to = errorConfig.email;
    this.subject = subject;
    this.errorDetails = errorDetails;
    this.html = html || "<p>Aconteceu um erro</p>";
    this.app = "Carrinho Abandonado";
    this.urlApi = errorConfig.baseURL;
    this.token = errorConfig.token;
  }
  sendError() {
    try {
      const body = {
        to: errorConfig.email,
        subject: this.subject,
        errorDetails: this.errorDetails,
        html: this.html,
        app: this.app,
      };

      axios.post(this.urlApi + "/send-email/error", body, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      });
    } catch (error) {}
  }
}
