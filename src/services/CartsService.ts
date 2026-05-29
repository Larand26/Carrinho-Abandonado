import type { ICarts, IResponse } from "../interfaces/interfaces.js";

import axios from "axios";
import { magentoConfig } from "../config/magentoConfig.js";
import { whatsappConfig } from "../config/whatsappConfig.js";
import { apiConfig } from "../config/apiConfig.js";

import MySql from "../db/MySql.js";
import Utils from "../utils/Utils.js";
import { logger } from "../utils/logger.js";

import ErrorEmail from "../errors/Error.js";

abstract class CartsService {
  static async getCartsMagento(): Promise<IResponse> {
    try {
      logger.info("getCartsMagento: iniciando busca de carrinhos no Magento");
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

      logger.success(
        `getCartsMagento: ${data.length} carrinhos processados com sucesso`,
      );

      return {
        success: true,
        message: "Carts fetched successfully",
        data: data as ICarts[],
      };
    } catch (error) {
      logger.error(
        `getCartsMagento: erro ao buscar carrinhos - ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
      const errorEmail = new ErrorEmail(
        "Erro ao buscar carrinhos no Magento",
        error instanceof Error ? error.message : "Unknown error",
      );
      errorEmail.sendError();
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
      logger.info("getCartsFromDatabase: buscando carrinhos no banco");

      const cartIds = carts.map((c) => c.cart_id);
      const placeholders = cartIds.map(() => "?").join(", ");
      const query = `SELECT * FROM carts WHERE cart_id IN (${placeholders})`;
      const [results] = await MySql.query(query, cartIds);
      logger.success(
        `getCartsFromDatabase: retornados ${((results as any[]) || []).length} registros do banco`,
      );

      return {
        success: true,
        message: "Carts fetched successfully from database",
        data: results as ICarts[],
      };
    } catch (error) {
      logger.error(
        `getCartsFromDatabase: erro ao buscar no banco - ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
      const errorEmail = new ErrorEmail(
        "Erro ao buscar carrinhos no banco de dados",
        error instanceof Error ? error.message : "Unknown error",
      );
      errorEmail.sendError();
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
      logger.info(
        `saveCartsToDatabase: iniciando salvamento de ${carts.length} carrinhos`,
      );

      if (carts.length === 0) {
        logger.warning("saveCartsToDatabase: sem carrinhos para salvar");
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
      logger.success(
        `saveCartsToDatabase: ${(result as any)?.affectedRows ?? 0} linhas afetadas`,
      );

      return {
        success: true,
        message: "Carts saved successfully to database",
        data: carts,
      };
    } catch (error) {
      logger.error(
        `saveCartsToDatabase: erro ao salvar - ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
      const errorEmail = new ErrorEmail(
        "Erro ao salvar carrinhos no banco de dados",
        error instanceof Error ? error.message : "Unknown error",
      );
      errorEmail.sendError();
      return {
        success: false,
        message: "Error saving carts to database",
        data: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private static async getSellerIdByCNPJ(cnpj: string): Promise<number> {
    interface IClientResponseItem {
      client_id: number;
      corporate_name: string;
      client_cnpj: string;
      salesperson_id: number;
    }

    const cleanedCnpj = Utils.cleanCNPJ(cnpj);

    if (!cleanedCnpj) {
      logger.warning(
        `getSellerIdByCNPJ: CNPJ inválido ou ausente (${cnpj || "vazio"})`,
      );
      return 0;
    }

    try {
      logger.info(
        `getSellerIdByCNPJ: consultando API externa para CNPJ ${cleanedCnpj}`,
      );
      const response = await axios.get<
        IClientResponseItem | IClientResponseItem[]
      >(`${apiConfig.apiUrl}/api/get-client/${cleanedCnpj}`, {
        headers: {
          Authorization: `Bearer ${apiConfig.apiToken}`,
        },
      });

      if (response.status !== 200) {
        logger.warning(
          `getSellerIdByCNPJ: resposta inesperada ${response.status}`,
        );
        return 5536;
      }

      const clientData = Array.isArray(response.data)
        ? response.data[0]
        : response.data;

      logger.success(
        `getSellerIdByCNPJ: vendedor encontrado ${clientData?.salesperson_id ?? 5536}`,
      );

      return clientData?.salesperson_id ?? 5536;
    } catch {
      logger.error(
        `getSellerIdByCNPJ: erro na consulta externa para ${cleanedCnpj}`,
      );
      return 5536;
    }
  }

  private static async getSellerPhoneById(sellerId: number): Promise<number> {
    const query = `SELECT cellphone FROM celphone_seller WHERE id_seller = ?`;
    try {
      logger.info(
        `getSellerPhoneById: consultando telefone do vendedor ${sellerId}`,
      );
      const [results] = (await MySql.query(query, [sellerId])) as [
        Array<{ cellphone?: string | number }>,
        unknown,
      ];

      let phone = results[0]?.cellphone;

      if (!phone && sellerId !== 5536) {
        logger.warning(
          `getSellerPhoneById: telefone nao encontrado para ${sellerId}, tentando fallback 5536`,
        );

        const [fallbackResults] = (await MySql.query(query, [5536])) as [
          Array<{ cellphone?: string | number }>,
          unknown,
        ];

        phone = fallbackResults[0]?.cellphone;
      }

      logger.success(
        `getSellerPhoneById: telefone retornado ${phone ?? "nenhum"}`,
      );
      return phone ? Number(phone) : 0;
    } catch {
      logger.error(
        `getSellerPhoneById: erro ao consultar telefone do vendedor ${sellerId}`,
      );
      return 0;
    }
  }

  static async getSellerByCart(carts: ICarts[]): Promise<IResponse> {
    try {
      logger.info(
        "getSellerByCart: iniciando associação de vendedores aos carrinhos",
      );
      // Pega o Id dos Vendedores
      await Promise.all(
        carts.map(async (cart) => {
          const sellerId = await CartsService.getSellerIdByCNPJ(
            cart.customer_cnpj,
          );
          cart.seller_id = sellerId;
        }),
      );

      // Pega o telefone do vendedor

      await Promise.all(
        carts.map(async (cart) => {
          if (cart.seller_id) {
            const sellerPhone = await CartsService.getSellerPhoneById(
              cart.seller_id,
            );
            cart.seller_telphone = sellerPhone;
          }
        }),
      );

      logger.success(
        `getSellerByCart: vendedores associados para ${carts.length} carrinhos`,
      );

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
      logger.info(
        `notifySeller: notificando vendedor ${cart.seller_id} pelo cart ${cart.cart_id}`,
      );
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
      logger.success(
        `notifySeller: notificação enviada para ${cart.seller_telphone}`,
      );

      return {
        success: true,
        message: `Seller notified successfully for cart ${cart.cart_id}`,
        data: null,
      };
    } catch (error) {
      logger.error(
        `notifySeller: erro ao notificar vendedor - ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
      const errorEmail = new ErrorEmail(
        "Erro ao notificar vendedor",
        error instanceof Error ? error.message : "Unknown error",
      );
      errorEmail.sendError();
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
      logger.info("clearDatabase: limpando tabela de carrinhos");
      const query = `DELETE FROM carts`;
      await MySql.query(query);
      logger.success("clearDatabase: tabela limpa com sucesso");
      return {
        success: true,
        message: "Database cleared successfully",
        data: null,
      };
    } catch (error) {
      logger.error(
        `clearDatabase: erro ao limpar banco - ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
      const errorEmail = new ErrorEmail(
        "Erro ao limpar banco de dados",
        error instanceof Error ? error.message : "Unknown error",
      );
      errorEmail.sendError();
      return {
        success: false,
        message: "Error clearing database",
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export default CartsService;
