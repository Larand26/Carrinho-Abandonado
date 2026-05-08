import type { ICarts, IResponse } from "../interfaces/interfaces.js";

import axios from "axios";
import { magentoConfig } from "../config/magentoConfig.js";
import { whatsappConfig } from "../config/whatsappConfig.js";

import MySql from "../db/MySql.js";

abstract class CartsService {
  static async getCartsMagento(): Promise<IResponse> {
    try {
      const now = new Date();
      now.setHours(3, 0, 0, 0);
      const todayDateString = now.toISOString().slice(0, 19).replace("T", " ");

      const response = await axios.get(
        `${magentoConfig.baseURL}/rest/all/V1/carts/search`,
        {
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${magentoConfig.token}`,
          },
          params: {
            "searchCriteria[pageSize]": 100,
            "searchCriteria[currentPage]": 1,
            "searchCriteria[sortOrders][0][field]": "updated_at",
            "searchCriteria[sortOrders][0][direction]": "DESC",
            // Filtro por data
            "searchCriteria[filter_groups][0][filters][0][field]": "updated_at",
            "searchCriteria[filter_groups][0][filters][0][value]":
              todayDateString,
            "searchCriteria[filter_groups][0][filters][0][condition_type]":
              "gteq",
            // NOVOS FILTROS - apenas ativos com itens
            "searchCriteria[filter_groups][1][filters][0][field]": "is_active",
            "searchCriteria[filter_groups][1][filters][0][value]": "1",
            "searchCriteria[filter_groups][2][filters][0][field]":
              "items_count",
            "searchCriteria[filter_groups][2][filters][0][value]": "0",
            "searchCriteria[filter_groups][2][filters][0][condition_type]":
              "gt", // > 0
          },
        },
      );

      const data = response.data.items
        .filter((cart: any) => cart.customer.firstname)
        .map((cart: any) => {
          const rawUpdatedAt = cart.updated_at.replace(" ", "T");
          const updatedAt = new Date(
            rawUpdatedAt.endsWith("Z") ? rawUpdatedAt : `${rawUpdatedAt}Z`,
          );
          updatedAt.setUTCHours(updatedAt.getUTCHours() - 3);

          console.log(cart.customer.addresses[0].telephone);
          return {
            cart_id: cart.id,
            customer_id: cart.customer?.id,
            customer_name: cart.customer?.firstname || "Anônimo",
            customer_telphone:
              cart.customer.addresses[0]?.telephone || "Sem telefone",
            updated_at: updatedAt,
            customer_cnpj: cart.customer.taxvat || "Sem CNPJ",
          };
        });

      return {
        success: true,
        message: "Carts fetched successfully",
        data: data as ICarts[],
      };
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
      const cartIds = carts.map((c) => c.cart_id);
      const placeholders = cartIds.map(() => "?").join(", ");
      const query = `SELECT * FROM carts WHERE cart_id IN (${placeholders})`;
      const [results] = await MySql.query(query, cartIds);

      return {
        success: true,
        message: "Carts fetched successfully from database",
        data: results as ICarts[],
      };
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
      if (carts.length === 0) {
        return {
          success: true,
          message: "No carts to save",
          data: [],
        };
      }
      const values = carts.map((cart) => [
        cart.cart_id,
        cart.customer_id,
        cart.customer_name,
        cart.customer_cnpj,
        cart.updated_at,
      ]);
      const query = `INSERT INTO carts (cart_id, customer_id, customer_name, customer_cnpj, updated_at) VALUES ? ON DUPLICATE KEY UPDATE updated_at = VALUES(updated_at)`;
      const [result] = await MySql.query(query, [values]);
      return {
        success: true,
        message: "Carts saved successfully to database",
        data: carts,
      };
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
      // Falsa lógica para atribuir um vendedor a cada carrinho
      carts.map((cart) => {
        cart.seller_telphone = 5511959077823; // Telefone do vendedor responsável pelo carrinho (exemplo fixo)
      });

      return {
        success: true,
        message: "Seller fetched successfully for cart",
        data: carts as ICarts[],
      };
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
      const body = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cart.seller_telphone?.toString() || "",
        type: "template",
        template: {
          name: "carrinho_abandonado",
          language: {
            code: "en",
          },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: cart.customer_name },
                { type: "text", text: cart.customer_cnpj },
                {
                  type: "text",
                  text: cart.customer_telphone,
                },
              ],
            },
          ],
        },
      };
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${whatsappConfig.apiToken}`,
      };

      const response = await axios.post(whatsappConfig.apiUrl, body, {
        headers,
      });

      return {
        success: true,
        message: `Seller notified successfully for cart ${cart.cart_id}`,
        data: null,
      };
    } catch (error) {
      return {
        success: false,
        message: "Error notifying seller",
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export default CartsService;
