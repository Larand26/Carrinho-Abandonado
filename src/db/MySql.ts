import mysql from "mysql2/promise";
import mysqlConfig from "../config/mysqlConfig.js";

class MySql {
  private pool: mysql.Pool;

  constructor() {
    // Cria o pool imediatamente
    this.pool = mysql.createPool(mysqlConfig);
  }

  async query(sql: string, values?: any[]) {
    return await this.pool.query(sql, values);
  }
}

export default new MySql();
