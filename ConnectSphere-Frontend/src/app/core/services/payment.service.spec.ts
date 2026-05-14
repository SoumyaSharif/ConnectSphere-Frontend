import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { PaymentService, PaymentVerificationResponse } from './payment.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PaymentService, provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(PaymentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    delete (window as Window & { Razorpay?: unknown }).Razorpay;
  });

  it('creates an order through the backend API', () => {
    service.createOrder().subscribe((response) => {
      expect(response.orderId).toBe('order_1');
      expect(response.keyId).toBe('rzp_test');
    });

    const req = httpMock.expectOne((request) => request.method === 'POST' && request.url.endsWith('/api/v1/payments/create-order'));
    expect(req.request.body).toEqual({});
    req.flush({
      orderId: 'order_1',
      amount: 49900,
      currency: 'INR',
      keyId: 'rzp_test',
      description: 'Blue tick'
    });
  });

  it('verifies a payment through the backend API', () => {
    const payload = {
      razorpayOrderId: 'order_1',
      razorpayPaymentId: 'pay_1',
      razorpaySignature: 'sig_1'
    };

    service.verifyPayment(payload).subscribe((response) => {
      expect(response.success).toBe(true);
    });

    const req = httpMock.expectOne((request) => request.method === 'POST' && request.url.endsWith('/api/v1/payments/verify'));
    expect(req.request.body).toEqual(payload);
    req.flush({ success: true, message: 'verified', isVerified: true, verificationPending: false });
  });

  it('gets verification status and cancellation state from the backend', () => {
    service.getMyStatus().subscribe((response) => expect(response.isVerified).toBe(false));
    service.cancelVerification().subscribe((response) => expect(response.message).toBe('cancelled'));

    httpMock.expectOne((request) => request.method === 'GET' && request.url.endsWith('/api/v1/payments/my-status'))
      .flush({ isVerified: false, verificationPending: true });
    httpMock.expectOne((request) => request.method === 'POST' && request.url.endsWith('/api/v1/payments/cancel'))
      .flush({ success: true, message: 'cancelled', isVerified: false, verificationPending: false });
  });

  it('opens checkout and resolves after successful Razorpay verification', async () => {
    let capturedOptions: any;
    const razorpayInstance = {
      on: vi.fn(),
      open: vi.fn(() => {
        capturedOptions.handler({
          razorpay_order_id: 'order_1',
          razorpay_payment_id: 'pay_1',
          razorpay_signature: 'sig_1'
        });
      })
    };
    const RazorpayMock = function (this: unknown, options: any) {
      capturedOptions = options;
      return razorpayInstance;
    };
    (window as Window & { Razorpay?: unknown }).Razorpay = RazorpayMock;

    const checkoutPromise = service.openCheckout('alice@example.com', 'Alice');
    await Promise.resolve();

    const orderReq = httpMock.expectOne((request) => request.method === 'POST' && request.url.endsWith('/api/v1/payments/create-order'));
    orderReq.flush({
      orderId: 'order_1',
      amount: 49900,
      currency: 'INR',
      keyId: 'rzp_test',
      description: 'Blue tick'
    });
    await Promise.resolve();

    const verifyReq = httpMock.expectOne((request) => request.method === 'POST' && request.url.endsWith('/api/v1/payments/verify'));
    verifyReq.flush({
      success: true,
      message: 'verified',
      isVerified: true,
      verificationPending: false
    } satisfies PaymentVerificationResponse);

    const result = await checkoutPromise;
    expect(result.isVerified).toBe(true);
    expect(razorpayInstance.open).toHaveBeenCalled();
  });

  it('rejects checkout when Razorpay dismisses the modal', async () => {
    let capturedOptions: any;
    const RazorpayMock = function (this: unknown, options: any) {
      capturedOptions = options;
      return { on: vi.fn(), open: vi.fn(() => capturedOptions.modal.ondismiss()) };
    };
    (window as Window & { Razorpay?: unknown }).Razorpay = RazorpayMock;

    const checkoutPromise = service.openCheckout('alice@example.com', 'Alice');
    await Promise.resolve();

    httpMock.expectOne((request) => request.method === 'POST' && request.url.endsWith('/api/v1/payments/create-order'))
      .flush({
        orderId: 'order_2',
        amount: 49900,
        currency: 'INR',
        keyId: 'rzp_test',
        description: 'Blue tick'
      });

    await expect(checkoutPromise).rejects.toThrow('Payment cancelled by user.');
  });

  it('rejects checkout when the Razorpay script cannot be loaded', async () => {
    const appendSpy = vi.spyOn(document.head, 'appendChild').mockImplementation((node: Node) => {
      const script = node as HTMLScriptElement;
      script.onerror?.(new Event('error'));
      return node;
    });

    await expect(service.openCheckout('alice@example.com', 'Alice')).rejects.toThrow(
      'Failed to load Razorpay checkout script.'
    );

    appendSpy.mockRestore();
  });
});
