export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: 'created';
}

export class PaymentService {
  static async createOrder(amount: number, currency: string, receiptId: string): Promise<RazorpayOrder> {
    const orderId = `order_${Math.random().toString(36).substring(2, 15)}`;
    console.log(`[Razorpay Service] Order created: ${orderId} | Amount: ${amount} ${currency}`);
    return {
      id: orderId,
      amount,
      currency,
      receipt: receiptId,
      status: 'created',
    };
  }

  static verifySignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    console.log(`[Razorpay Service] Verifying signature for payment ${paymentId} in order ${orderId}`);
    // Simulate valid signature verification
    return signature.startsWith('hmac_');
  }

  static async initiateRefund(transactionId: string, amount: number): Promise<{ refundId: string; status: string }> {
    const refundId = `rfnd_${Math.random().toString(36).substring(2, 15)}`;
    console.log(`[Razorpay Service] Initiating refund for transaction: ${transactionId} | Amount: ${amount}`);
    return {
      refundId,
      status: 'processed',
    };
  }
}
