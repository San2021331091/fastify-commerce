export interface AddToCartRequestBody {
  user_uid: string;
  product_id: number;
  img_url:string;
  quantity?: number;
  price: number;
}
