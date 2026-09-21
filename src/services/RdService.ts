import MySql from "../db/MySql.js";
import axios from "axios";
import rdConfig from "../config/rdConfig.js";

import type { IResponse } from "../interfaces/interfaces.js";

export default class RdService {
  static async getRdAccessToken(): Promise<IResponse> {
    try {
      // Pega token no banco de dados
      const sqlAccesToken = "SELECT * FROM token WHERE type = ?";
      const [rows]: any = await MySql.query(sqlAccesToken, ["rd_access_token"]);
      const accessToken = rows[0]?.token;
      if (!accessToken) {
        return {
          success: false,
          message: "RD Access Token not found in the database",
          data: null,
        };
      }
      // Verifica se o token está expirado
      if (new Date() > new Date(rows[0]?.expire_at)) {
        // Se estiver expirado, faz a requisição para obter um novo token
        // pega o refresh token do banco de dados
        const sqlRefreshToken = "SELECT * FROM token WHERE type = ?";
        const [refreshRows]: any = await MySql.query(sqlRefreshToken, [
          "rd_refresh_token",
        ]);
        const refreshToken = refreshRows[0]?.token;
        if (!refreshToken) {
          return {
            success: false,
            message: "RD Refresh Token not found in the database",
            data: null,
          };
        }
        // Faz a requisição para obter um novo token usando o refresh token
        const body = new URLSearchParams();
        body.append("client_id", rdConfig.clientId);
        body.append("client_secret", rdConfig.clientSecret);
        body.append("refresh_token", refreshToken);
        body.append("grant_type", "refresh_token");

        const response = await axios.post(
          "https://api.rd.services/oauth2/token",
          body,
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          },
        );

        const newToken = response.data.access_token;
        const newRefreshToken = response.data.refresh_token;
        const newExpireAt = new Date(
          Date.now() + response.data.expires_in * 500,
        );

        const updateTokenQuery =
          "UPDATE token SET token = ?, expire_at = ? WHERE type = ?";
        await MySql.query(updateTokenQuery, [
          newToken,
          newExpireAt,
          "rd_access_token",
        ]);
        await MySql.query(updateTokenQuery, [
          newRefreshToken,
          newExpireAt,
          "rd_refresh_token",
        ]);

        return {
          success: true,
          message: "RD Access Token refreshed successfully",
          data: newToken,
        };
      } else {
        return {
          success: true,
          message: "RD Access Token is valid",
          data: accessToken,
        };
      }
    } catch (error) {
      console.error("Error fetching RD Access Token:", error);
      throw error;
    }
  }
}
