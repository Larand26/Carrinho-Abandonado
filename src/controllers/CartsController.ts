import type { IResponse } from "../interfaces/interfaces.js";

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
}

export default CartsController;
