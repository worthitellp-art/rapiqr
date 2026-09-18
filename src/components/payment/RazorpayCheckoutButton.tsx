import React, { useState } from 'react';
import { CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

interface RazorpayCheckoutButtonProps {
  amount: number; // Amount in paise (e.g. 50000 for ₹500.00)
  currency?: string;
  orderId?: string; // Optional existing internal order ID
  receipt?: string;
  name?: string;
  description?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  buttonText?: string;
  className?: string;
  disabled?: boolean;
  onSuccess?: (verificationResult: any) => void;
  onFailure?: (error: string) => void;
  onDismiss?: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const RazorpayCheckoutButton: React.FC<RazorpayCheckoutButtonProps> = ({
  amount,
  currency = 'INR',
  orderId,
  receipt,
  name = 'RapiQR Safety Protection',
  description = 'Smart QR Tags & Safety Subscriptions',
  customerName = '',
  customerEmail = '',
  customerPhone = '',
  buttonText,
  className = '',
  disabled = false,
  onSuccess,
  onFailure,
  onDismiss,
}) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

  const handleOpenCheckoutModal = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);

      // Verify that Razorpay checkout script is loaded
      if (typeof window.Razorpay === 'undefined') {
        throw new Error('Razorpay SDK is not available. Please check your internet connection.');
      }

      // Step 1: Call backend endpoint to create Razorpay order
      const orderResponse = await apiClient.payments.createOrder(
        orderId ? { orderId } : { amount, currency, receipt }
      );

      const generatedOrderId =
        orderResponse.order_id ||
        orderResponse.data?.razorpayOrderId ||
        orderResponse.data?.order_id;

      if (!generatedOrderId) {
        throw new Error(orderResponse.error || 'Failed to initialize payment order with gateway');
      }

      const activeKeyId = orderResponse.keyId || orderResponse.data?.keyId || keyId;

      // Step 2: Configure Razorpay Checkout Modal
      const checkoutOptions = {
        key: activeKeyId,
        amount: orderResponse.amount || orderResponse.data?.amount || amount,
        currency: orderResponse.currency || orderResponse.data?.currency || currency,
        name: name,
        description: description,
        order_id: generatedOrderId,
        prefill: {
          name: customerName.trim(),
          email: customerEmail.trim(),
          contact: customerPhone.trim(),
        },
        theme: {
          color: '#111111',
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            setIsProcessing(true);

            // Step 3: Call backend verification endpoint to check HMAC-SHA256 signature
            const verifyResponse = await apiClient.payments.verify({
              orderId: orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (!verifyResponse.success) {
              throw new Error(verifyResponse.error || 'Payment signature verification failed.');
            }

            setIsProcessing(false);
            if (onSuccess) {
              onSuccess(verifyResponse);
            }
          } catch (verificationError: any) {
            const message = verificationError?.message || 'Payment signature verification failed';
            setErrorMessage(message);
            setIsProcessing(false);
            if (onFailure) {
              onFailure(message);
            }
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            const userCancelledMessage = 'Payment was cancelled by the user.';
            setErrorMessage(userCancelledMessage);
            if (onDismiss) {
              onDismiss();
            }
          },
        },
      };

      const razorpayInstance = new window.Razorpay(checkoutOptions);

      // Handle payment failure event
      razorpayInstance.on('payment.failed', (failedResponse: any) => {
        setIsProcessing(false);
        const reason =
          failedResponse?.error?.description ||
          failedResponse?.error?.reason ||
          'Payment failed. Please try again with another method.';
        setErrorMessage(reason);
        if (onFailure) {
          onFailure(reason);
        }
      });

      razorpayInstance.open();
    } catch (err: any) {
      const message = err?.message || 'Unable to open checkout';
      setErrorMessage(message);
      setIsProcessing(false);
      if (onFailure) {
        onFailure(message);
      }
    }
  };

  const defaultButtonLabel = `Pay ₹${(amount / 100).toFixed(2)}`;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleOpenCheckoutModal}
        disabled={disabled || isProcessing}
        className={
          className ||
          'inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 active:scale-[0.98]'
        }
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
            <span>Processing Payment…</span>
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 text-white" />
            <span>{buttonText || defaultButtonLabel}</span>
          </>
        )}
      </button>

      {errorMessage && (
        <div className="flex items-start gap-2 p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
