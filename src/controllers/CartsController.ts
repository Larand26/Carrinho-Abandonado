import type { IResponse, ICarts } from "../interfaces/interfaces.js";

import CartsService from "../services/CartsService.js";

abstract class CartsController {
  static async getCartsMagento(): Promise<IResponse> {
    try {
      return await CartsService.getCartsMagento();
    } catch (error) {
      return {
        success: false,
        message: "Error fetching carts from Magento",
        data: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async getCartsFromDatabase(carts: ICarts[]): Promise<IResponse> {
    try {
      return await CartsService.getCartsFromDatabase(carts);
    } catch (error) {
      return {
        success: false,
        message: "Error fetching carts from database",
        data: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export default CartsController;
