import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  description: string;
}

export interface PaymentVerificationRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  message: string;
  isVerified: boolean;
  verificationPending: boolean;
}

// Razorpay checkout options type
declare var Razorpay: any;

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly paymentApiUrl = `${environment.apiUrl}/api/v1/payments`;

  /** Step 1: Create a Razorpay order on the backend */
  createOrder(userId?: string): Observable<CreateOrderResponse> {
    return this.http.post<CreateOrderResponse>(`${this.paymentApiUrl}/create-order`, {});
  }

  /** Step 2: Verify payment signature on the backend */
  verifyPayment(request: PaymentVerificationRequest, userId?: string): Observable<PaymentVerificationResponse> {
    return this.http.post<PaymentVerificationResponse>(`${this.paymentApiUrl}/verify`, request);
  }

  /** Get current user verification status */
  getMyStatus(): Observable<{ isVerified: boolean; verificationPending: boolean }> {
    return this.http.get<{ isVerified: boolean; verificationPending: boolean }>(`${this.paymentApiUrl}/my-status`);
  }

  /** Opt-out of blue-tick verification */
  cancelVerification(): Observable<PaymentVerificationResponse> {
    return this.http.post<PaymentVerificationResponse>(`${this.paymentApiUrl}/cancel`, {});
  }

  /**
   * Full checkout flow:
   * 1. Load Razorpay checkout script dynamically
   * 2. Create backend order
   * 3. Open Razorpay modal
   * 4. On payment success → verify with backend
   * 5. Resolve with PaymentVerificationResponse
   */
  openCheckout(userEmail: string, userName: string, userId?: string): Promise<PaymentVerificationResponse> {
    return new Promise((resolve, reject) => {
      this.loadRazorpayScript().then(() => {
        this.createOrder(userId).subscribe({
          next: (order) => {
            const options = {
              key: order.keyId, // Use the key returned by backend for better consistency
              amount: order.amount,
              currency: order.currency,
              name: 'ConnectSphere',
              description: order.description,
              order_id: order.orderId,
              prefill: {
                email: userEmail,
                name: userName,
              },
              theme: {
                color: '#6c63ff',
                backdrop_color: 'rgba(10, 10, 30, 0.85)',
              },
              modal: {
                ondismiss: () => {
                  reject(new Error('Payment cancelled by user.'));
                },
              },
              handler: (response: any) => {
                const verificationReq: PaymentVerificationRequest = {
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                };
                this.verifyPayment(verificationReq, userId).subscribe({
                  next: (res) => resolve(res),
                  error: (err) => reject(err),
                });
              },
            };

            const rzp = new Razorpay(options);
            rzp.on('payment.failed', (response: any) => {
              reject(new Error(response.error?.description || 'Payment failed.'));
            });
            rzp.open();
          },
          error: (err) => reject(err),
        });
      }).catch(reject);
    });
  }

  /** Dynamically inject the Razorpay Checkout JS script */
  private loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof Razorpay !== 'undefined') {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay checkout script.'));
      document.head.appendChild(script);
    });
  }
}
