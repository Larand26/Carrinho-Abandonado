import type { IResponse } from "../interfaces/interfaces.js";
import RdService from "../services/RdService.js";

export default class RdController {
  static async getRdAccessToken(): Promise<IResponse> {
    try {
      const response = await RdService.getRdAccessToken();
      return {
        success: true,
        message: "RD Access Token fetched successfully",
        data: response,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        message: "Error fetching RD Access Token",
        data: null,
        error: error,
      };
    }
  }

  static async getOrganizationByCnpj(
    cnpj: string,
    token: string,
  ): Promise<IResponse> {
    try {
      const response = await RdService.getOrganizationByCnpj(cnpj, token);
      return {
        success: true,
        message: "Organization fetched successfully",
        data: response,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        message: "Error fetching organization by CNPJ",
        data: null,
        error: error,
      };
    }
  }
}
