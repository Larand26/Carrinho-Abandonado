export interface ICarts {
  cart_id: number;
  customer_id: number;
  customer_name: string;
  customer_cnpj: string;
  customer_telphone: string;
  updated_at: Date;
  seller_telphone?: number;
}

export interface IResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
}
