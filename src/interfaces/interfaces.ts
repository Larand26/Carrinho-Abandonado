export interface ICarts {
  cart_id: number;
  customer_id: number;
  customer_cnpj: string;
  updated_at: Date;
}

export interface IResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
}
