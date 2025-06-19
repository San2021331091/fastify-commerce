export interface OrderRequestBody {
  items: {
    productId: string;
    img_url: string;
    quantity: number;
    price: number;
  }[];
  total: number;
}
