import type { ICarts } from "./interfaces/interfaces.js";
import { logger } from "./utils/logger.js";
import CartsController from "./controllers/CartsController.js";
import { appConfig } from "./config/appConfig.js";

class App {
  async getCartsMagento(): Promise<ICarts[]> {
    const cartsResponse = await CartsController.getCartsMagento();

    if (!cartsResponse.success) {
      logger.error(cartsResponse.message);
      return [];
    }

    return cartsResponse.data as ICarts[];
  }

  async getCartsFromDatabase(carts: ICarts[]): Promise<ICarts[]> {
    const cartsResponse = await CartsController.getCartsFromDatabase(carts);
    if (!cartsResponse.success) {
      logger.error(cartsResponse.message);
      return [];
    }

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

  async start() {
    // Pega os carrinhos da api
    const apiCarts = await this.getCartsMagento();
    logger.info(`Total de carrinhos encontrados na API: ${apiCarts.length}`);
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
    // Salva os carrinhos no banco de dados
    // Avisa os vendedores que tem um carrinho novo para ser processado
  }
}

export default App;
