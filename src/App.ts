import type { ICarts } from "./interfaces/interfaces.js";
import { logger } from "./utils/logger.js";
import CartsController from "./controllers/CartsController.js";
import { appConfig } from "./config/appConfig.js";
import Error from "./errors/Error.js";

import Log from "./log/Log.js";

class App {
  async getCartsMagento(): Promise<ICarts[]> {
    const cartsResponse = await CartsController.getCartsMagento();

    if (!cartsResponse.success) {
      await Log.addLog({
        jobName: "Carrinho Abandonado",
        runId: Date.now(),
        environment: appConfig.mode,
        status: "error",
        startedAt: new Date(),
        finishedAt: new Date(),
        message: cartsResponse.message,
        details: {
          error: cartsResponse.error,
        },
      });
      logger.error(cartsResponse.message);
      const error = new Error(
        "Erro ao buscar carrinhos na API Magento",
        cartsResponse.error,
      );
      error.sendError();
      return [];
    }

    await Log.addLog({
      jobName: "Carrinho Abandonado",
      runId: Date.now(),
      environment: appConfig.mode,
      status: "success",
      startedAt: new Date(),
      finishedAt: new Date(),
      message: "Carrinhos buscados com sucesso na API Magento",
      details: {
        totalCarts: cartsResponse.data.length,
      },
    });

    return cartsResponse.data as ICarts[];
  }

  async getCartsFromDatabase(carts: ICarts[]): Promise<ICarts[]> {
    const cartsResponse = await CartsController.getCartsFromDatabase(carts);
    if (!cartsResponse.success) {
      logger.error(cartsResponse.message);
      const error = new Error(
        "Erro ao buscar carrinhos no banco de dados",
        cartsResponse.error,
      );

      await Log.addLog({
        jobName: "Carrinho Abandonado",
        runId: Date.now(),
        environment: appConfig.mode,
        status: "error",
        startedAt: new Date(),
        finishedAt: new Date(),
        message: cartsResponse.message,
        details: {
          error: cartsResponse.error,
        },
      });

      error.sendError();
      return [];
    }

    await Log.addLog({
      jobName: "Carrinho Abandonado",
      runId: Date.now(),
      environment: appConfig.mode,
      status: "success",
      startedAt: new Date(),
      finishedAt: new Date(),
      message: "Carrinhos buscados com sucesso no banco de dados",
      details: {
        totalCarts: cartsResponse.data.length,
      },
    });

    return cartsResponse.data as ICarts[];
  }

  filterNewCarts(apiCarts: ICarts[], dbCarts: ICarts[]): ICarts[] {
    const dbCartIds = new Set(dbCarts.map((c) => c.cart_id));
    return apiCarts.filter((cart) => !dbCartIds.has(cart.cart_id));
  }

  filterCartsToProcess(carts: ICarts[]): ICarts[] {
    const now = new Date();
    return carts.filter((cart) => {
      const updatedAt = new Date(cart.updated_at);
      const minutesSinceUpdate =
        (now.getTime() - updatedAt.getTime()) / (1000 * 60);
      return minutesSinceUpdate >= appConfig.timeToProcessCart;
    });
  }

  async saveCartsToDatabase(carts: ICarts[]): Promise<ICarts[]> {
    const saveResponse = await CartsController.saveCartsToDatabase(carts);
    if (!saveResponse.success) {
      const error = new Error(
        "Erro ao salvar carrinhos no banco de dados",
        saveResponse.error,
      );
      await Log.addLog({
        jobName: "Carrinho Abandonado",
        runId: Date.now(),
        environment: appConfig.mode,
        status: "error",
        startedAt: new Date(),
        finishedAt: new Date(),
        message: saveResponse.message,
        details: {
          error: saveResponse.error,
        },
      });

      error.sendError();
      return [];
    }
    return saveResponse.data as ICarts[];
  }

  async getSellerByCart(carts: ICarts[]): Promise<ICarts[]> {
    const sellerResponse = await CartsController.getSellerByCart(carts);
    if (!sellerResponse.success) {
      const error = new Error(
        "Erro ao buscar vendedor para os carrinhos",
        sellerResponse.error,
      );

      await Log.addLog({
        jobName: "Carrinho Abandonado",
        runId: Date.now(),
        environment: appConfig.mode,
        status: "error",
        startedAt: new Date(),
        finishedAt: new Date(),
        message: sellerResponse.message,
        details: {
          error: sellerResponse.error,
        },
      });

      error.sendError();
      return [];
    }

    await Log.addLog({
      jobName: "Carrinho Abandonado",
      runId: Date.now(),
      environment: appConfig.mode,
      status: "success",
      startedAt: new Date(),
      finishedAt: new Date(),
      message: "Vendedores buscados com sucesso para os carrinhos",
      details: {
        totalCarts: sellerResponse.data.length,
        sellers: sellerResponse.data.map((cart: ICarts) => ({
          cart_id: cart.cart_id,
          seller_id: cart.seller_id,
        })),
      },
    });

    return sellerResponse.data as ICarts[];
  }

  async notifySellers(carts: ICarts[]): Promise<void> {
    for (const cart of carts) {
      const response = await CartsController.notifySeller(cart);
      logger.info(
        `Notification for cart ${cart.cart_id}: ${response.message} para vendedor ${cart.seller_id}`,
      );
      if (!response.success) {
        logger.error(`Failed to notify seller for cart ${cart.cart_id}`);
        const error = new Error("Erro ao notificar vendedor", response.error);
        error.sendError();
      }

      await Log.addLog({
        jobName: "Carrinho Abandonado",
        runId: Date.now(),
        environment: appConfig.mode,
        status: "success",
        startedAt: new Date(),
        finishedAt: new Date(),
        message: `Notification sent for cart ${cart.cart_id}`,
        details: {
          cart_id: cart.cart_id,
          seller_id: cart.seller_id,
          notificationResponse: response,
        },
      });
    }
  }

  async clearDatabase(): Promise<void> {
    const response = await CartsController.clearDatabase();
    if (!response.success) {
      await Log.addLog({
        jobName: "Carrinho Abandonado",
        runId: Date.now(),
        environment: appConfig.mode,
        status: "error",
        startedAt: new Date(),
        finishedAt: new Date(),
        message: "Failed to clear database",
        details: {
          error: response.error,
        },
      });
      const error = new Error("Erro ao limpar banco de dados", response.error);
      error.sendError();
      console.error(response.error);
      return;
    }

    await Log.addLog({
      jobName: "Carrinho Abandonado",
      runId: Date.now(),
      environment: appConfig.mode,
      status: "success",
      startedAt: new Date(),
      finishedAt: new Date(),
      message: "Banco de dados limpo com sucesso",
    });
  }

  async start() {
    await Log.addLog({
      jobName: "Carrinho Abandonado",
      runId: Date.now(),
      environment: appConfig.mode,
      status: "running",
      startedAt: new Date(),
    });
    // Pega os carrinhos da api
    const apiCarts = await this.getCartsMagento();
    logger.info(`Total de carrinhos encontrados na API: ${apiCarts.length}`);

    if (apiCarts.length === 0) {
      logger.info("Nenhum carrinho encontrado na API. Encerrando processo.");
      return;
    }

    // Pega os carrinhos do banco de dados
    const dbCarts = await this.getCartsFromDatabase(apiCarts);
    logger.info(
      `Total de carrinhos encontrados no banco de dados: ${dbCarts.length}`,
    );
    // Filtra apenas os carrinhos que não estão no banco de dados
    const newCarts = this.filterNewCarts(apiCarts, dbCarts);
    logger.info(`Total de carrinhos novos para processar: ${newCarts.length}`);
    // filtra carrinhos que tem o tempo X para serem processados
    const cartsToProcess = this.filterCartsToProcess(newCarts);
    logger.info(`Total de carrinhos para processar: ${cartsToProcess.length}`);

    if (cartsToProcess.length === 0) {
      logger.info("Nenhum carrinho para processar. Encerrando processo.");
      return;
    }

    // Salva os carrinhos no banco de dados
    const saveResponse = await this.saveCartsToDatabase(cartsToProcess);
    logger.info(
      `Total de carrinhos salvos no banco de dados: ${saveResponse.length}`,
    );
    // Pega o vendedor responsável por cada carrinho
    const cartsWithSeller = await this.getSellerByCart(cartsToProcess);
    logger.info(
      `Total de carrinhos com vendedor atribuído: ${cartsWithSeller.length}`,
    );

    // Avisa os vendedores que tem um carrinho novo para ser processado
    await this.notifySellers(cartsWithSeller);

    await Log.addLog({
      jobName: "Carrinho Abandonado",
      runId: Date.now(),
      environment: appConfig.mode,
      status: "success",
      startedAt: new Date(),
      finishedAt: new Date(),
      message: "Processamento concluído com sucesso",
      details: {
        apiCarts: apiCarts.length,
        dbCarts: dbCarts.length,
        newCarts: newCarts.length,
        cartsToProcess: cartsToProcess.length,
        cartsSaved: saveResponse.length,
        cartsWithSeller: cartsWithSeller.length,
      },
    });
  }
}

export default App;
