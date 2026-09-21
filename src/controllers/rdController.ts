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

  static async getDealByOrganizationId(
    organizationId: string,
    token: string,
  ): Promise<IResponse> {
    try {
      const response = await RdService.getDealByOrganizationId(
        organizationId,
        token,
      );
      return {
        success: true,
        message: "Deal fetched successfully",
        data: response,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        message: "Error fetching deal by organization ID",
        data: null,
        error: error,
      };
    }
  }

  static async updateDeal(dealId: string, token: string): Promise<IResponse> {
    try {
      await RdService.updateDeal(dealId, token);
      return {
        success: true,
        message: "Deal updated successfully",
        data: null,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        message: "Error updating deal",
        data: null,
        error: error,
      };
    }
  }

  static async createTask(
    dealId: string,
    ownerId: string,
    token: string,
  ): Promise<IResponse> {
    try {
      const response = await RdService.createTask(dealId, ownerId, token);
      return {
        success: true,
        message: "Task created successfully",
        data: response,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        message: "Error creating task",
        data: null,
        error: error,
      };
    }
  }
}
