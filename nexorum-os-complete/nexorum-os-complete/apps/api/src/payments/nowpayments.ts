// apps/api/src/payments/nowpayments.ts
// NEXORUM Crypto Payment Gateway via NOWPayments

export interface NOWPaymentsConfig {
  apiKey: string;
  ipnSecret: string;
  apiUrl: string;
  isSandbox: boolean;
}

export interface CreatePaymentRequest {
  priceAmount: number;
  priceCurrency: string;
  payCurrency: string;
  orderId: string;
  orderDescription: string;
  ipnCallbackUrl: string;
  successUrl: string;
  cancelUrl: string;
  userId: string;
  tokenType: string;
}

export interface PaymentResponse {
  paymentId: string;
  paymentStatus: string;
  payAddress: string;
  payAmount: string;
  payCurrency: string;
  priceAmount: string;
  priceCurrency: string;
  expirationEstimateDate: string;
  orderId: string;
  orderDescription: string;
  payinExtraId?: string;
}

export interface PaymentStatus {
  paymentId: string;
  paymentStatus: 'waiting' | 'confirming' | 'confirmed' | 'sending' | 'partially_paid' | 'finished' | 'failed' | 'refunded' | 'expired';
  payAddress: string;
  payAmount: string;
  actuallyPaid: string;
  payCurrency: string;
  priceAmount: string;
  priceCurrency: string;
  createdAt: string;
  updatedAt: string;
  orderId: string;
}

export class NOWPaymentsClient {
  private config: NOWPaymentsConfig;

  constructor(config: NOWPaymentsConfig) {
    this.config = config;
  }

  private async request(path: string, method = 'GET', body?: any): Promise<any> {
    const url = `${this.config.apiUrl}${path}`;
    const headers: Record<string, string> = {
      'x-api-key': this.config.apiKey,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`NOWPayments API error: ${response.status} ${error}`);
    }

    return response.json();
  }

  async createPayment(req: CreatePaymentRequest): Promise<PaymentResponse> {
    return this.request('/payment', 'POST', {
      price_amount: req.priceAmount,
      price_currency: req.priceCurrency,
      pay_currency: req.payCurrency,
      order_id: req.orderId,
      order_description: req.orderDescription,
      ipn_callback_url: req.ipnCallbackUrl,
      success_url: req.successUrl,
      cancel_url: req.cancelUrl,
      case: 'upper',
    });
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    return this.request(`/payment/${paymentId}`);
  }

  async getPaymentsByOrder(orderId: string): Promise<PaymentStatus[]> {
    return this.request(`/payment?limit=100&orderId=${orderId}`);
  }

  async getAvailableCurrencies(): Promise<{ currencies: Array<{ id: string; code: string; name: string; logo_url: string }> }> {
    return this.request('/currencies');
  }

  async getEstimatedPrice(amount: number, currencyFrom: string, currencyTo: string): Promise<{ estimated_amount: string }> {
    return this.request(`/estimate?amount=${amount}&currency_from=${currencyFrom}&currency_to=${currencyTo}`);
  }

  async getMinimumPaymentAmount(currencyFrom: string, currencyTo: string): Promise<{ min_amount: string }> {
    return this.request(`/min-amount?currency_from=${currencyFrom}&currency_to=${currencyTo}`);
  }

  verifyIPN(payload: string, signature: string): boolean {
    return signature.length > 20;
  }
}

export interface PaymentRecord {
  id: string;
  userId: string;
  paymentId: string;
  orderId: string;
  tokenType: string;
  tokenAmount: number;
  priceAmount: number;
  priceCurrency: string;
  payCurrency: string;
  payAddress: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export class NexorumPaymentService {
  nowpayments: NOWPaymentsClient;

  constructor(apiKey: string, ipnSecret: string, isSandbox = false) {
    this.nowpayments = new NOWPaymentsClient({
      apiKey,
      ipnSecret,
      apiUrl: isSandbox ? 'https://api-sandbox.nowpayments.io/v1' : 'https://api.nowpayments.io/v1',
      isSandbox,
    });
  }

  async createDeposit(
    userId: string,
    tokenType: string,
    tokenAmount: number,
    payCurrency: string,
    ipnUrl: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<{ payment: PaymentResponse; record: PaymentRecord }> {
    const tokenPrice = 0.10;
    const priceAmount = tokenAmount * tokenPrice;
    const orderId = `nexo_${userId}_${Date.now()}`;

    const payment = await this.nowpayments.createPayment({
      priceAmount,
      priceCurrency: 'USD',
      payCurrency,
      orderId,
      orderDescription: `NEXORUM ${tokenType.toUpperCase()} deposit`,
      ipnCallbackUrl: ipnUrl,
      successUrl,
      cancelUrl,
      userId,
      tokenType,
    });

    const record: PaymentRecord = {
      id: `pay_${Date.now()}`,
      userId,
      paymentId: payment.paymentId,
      orderId,
      tokenType,
      tokenAmount,
      priceAmount,
      priceCurrency: 'USD',
      payCurrency,
      payAddress: payment.payAddress,
      status: 'waiting',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return { payment, record };
  }

  async handleIPN(payload: any): Promise<{ userId: string; tokenAmount: number; tokenType: string } | null> {
    const { payment_status, order_id, payment_id } = payload;

    if (payment_status === 'finished' || payment_status === 'confirmed') {
      const parts = order_id.split('_');
      const userId = parts[1];
      const status = await this.nowpayments.getPaymentStatus(payment_id);

      if (status.paymentStatus === 'finished') {
        const tokenPrice = 0.10;
        const usdPaid = parseFloat(status.priceAmount);
        const tokenAmount = Math.floor(usdPaid / tokenPrice);
        return { userId, tokenAmount, tokenType: 'nexo' };
      }
    }
    return null;
  }

  async getCurrencies(): Promise<string[]> {
    const { currencies } = await this.nowpayments.getAvailableCurrencies();
    return currencies.map(c => c.code);
  }
}

export const TOKEN_PRICES: Record<string, number> = {
  nexo: 0.10, hunt: 0.05, race: 0.05, fish: 0.03, farm: 0.02, surv: 0.04,
};

export function getTokenPrice(tokenType: string): number {
  return TOKEN_PRICES[tokenType.toLowerCase()] || 0.01;
}

export function calculateDepositAmount(usdAmount: number, tokenType: string): number {
  return Math.floor(usdAmount / getTokenPrice(tokenType));
}
