import type { ICarts } from "./interfaces/interfaces.js";
import { logger } from "./utils/logger.js";
import CartsController from "./controllers/CartsController.js";

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
    // Salva os carrinhos no banco de dados
    // Avisa os vendedores que tem um carrinho novo para ser processado
  }
}

export default App;
