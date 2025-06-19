export interface PaymentIntentRequestBody {
  amount: number | string;
  card_type: 'visa' | 'mastercard';
  card_number: string;
  expiry: string;
  cvv: string;
  email?: string;
  username?: string;
}
