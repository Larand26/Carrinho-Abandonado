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

  static async saveCartsToDatabase(carts: ICarts[]): Promise<IResponse> {
    try {
      return await CartsService.saveCartsToDatabase(carts);
    } catch (error) {
      return {
        success: false,
        message: "Error saving carts to database",
        data: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async getSellerByCart(carts: ICarts[]): Promise<IResponse> {
    try {
      return await CartsService.getSellerByCart(carts);
    } catch (error) {
      return {
        success: false,
        message: "Error fetching seller for cart",
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async notifySeller(cart: ICarts): Promise<IResponse> {
    try {
      return await CartsService.notifySeller(cart);
    } catch (error) {
      return {
        success: false,
        message: "Error notifying seller",
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async clearDatabase(): Promise<IResponse> {
    try {
      return await CartsService.clearDatabase();
    } catch (error) {
      return {
        success: false,
        message: "Error clearing database",
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export default CartsController;
