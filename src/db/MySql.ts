import mysql from "mysql2/promise";
import mysqlConfig from "../config/mysqlConfig.js";

class MySql {
  private pool: mysql.Pool;

  constructor() {
    // Cria o pool imediatamente
    this.pool = mysql.createPool(mysqlConfig);
  }

  async query(sql: string, values?: any[]) {
    // O pool gerencia as conexões e reconnects automaticamente
    return await this.pool.execute(sql, values);
  }
}

export default new MySql();
