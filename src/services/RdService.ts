import MySql from "../db/MySql.js";
import axios from "axios";
import rdConfig from "../config/rdConfig.js";

import type { IResponse } from "../interfaces/interfaces.js";

export default class RdService {
  static async getRdAccessToken() {
    try {
      // Pega token no banco de dados
      const sqlAccesToken = "SELECT * FROM token WHERE type = ?";
      const [rows]: any = await MySql.query(sqlAccesToken, ["rd_access_token"]);
      console.log("Token fetched from database:", rows[0]);
      // Verifica se o token está expirado
      // Se estiver expirado, faz a requisição para obter um novo token
      // pega o refresh token do banco de dados
      // Faz a requisição para obter um novo token usando o refresh token
    } catch (error) {
      console.error("Error fetching RD Access Token:", error);
      throw error;
    }
  }
}
