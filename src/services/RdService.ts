import MySql from "../db/MySql.js";
import axios from "axios";
import rdConfig from "../config/rdConfig.js";

import Utils from "../utils/Utils.js";

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

  static async getOrganizationByCnpj(
    cnpj: string,
    token: string,
  ): Promise<string | null> {
    try {
      const response = await axios.get(
        `${rdConfig.apiHost}/crm/v2/organizations`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          params: {
            "page[number]": 1,
            "page[size]": 1,
            filter: `@cnpj:"${Utils.cleanCNPJ(cnpj)}"`,
          },
        },
      );
      const id = response.data.data[0]?.id;
      if (!id) return null;
      return id;
    } catch (error) {
      console.error("Error fetching organization by CNPJ:", error);
      return null;
    }
  }

  static async getDealByOrganizationId(
    organizationId: string,
    token: string,
  ): Promise<string | null> {
    try {
      const response = await axios.get(`${rdConfig.apiHost}/crm/v2/deals`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        params: {
          "page[number]": 1,
          "page[size]": 1,
          filter: `organization_id:"${organizationId}"`,
        },
      });
      const id = response.data.data[0]?.id;
      const ownerId = response.data.data[0]?.owner_id;

      if (!id || !ownerId) return null;
      return id + "|" + ownerId;
    } catch (error) {
      console.error("Error fetching deal by organization ID:", error);
      return null;
    }
  }

  static async updateDeal(dealId: string, token: string) {
    try {
      const body = {
        data: {
          name: "Carrinho Abandonado",
          stage_id: rdConfig.dealStageId,
        },
      };

      const response = await axios.put(
        `${rdConfig.apiHost}/crm/v2/deals/${dealId}`,
        body,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error("Error updating deal:", error);
      throw error;
    }
  }

  static async createTask(dealId: string, ownerId: string, token: string) {
    try {
      const dueDate = new Date();
      dueDate.setMinutes(dueDate.getMinutes() + 30);
      const body = {
        data: {
          name: "Acompanhamento Carrinho Abandonado",
          status: "open",
          type: "call",
          due_date: dueDate.toISOString(),
          created_by_id: rdConfig.ownerId,
          deal_id: dealId,
          owner_ids: [ownerId],
        },
      };
      const response = await axios.post(
        `${rdConfig.apiHost}/crm/v2/tasks`,
        body,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  }
}
