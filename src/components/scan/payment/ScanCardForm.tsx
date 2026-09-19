import React, { useState } from 'react';
import { PaymentMethod } from './ScanPaymentMethodSelector';
import { Loader2 } from 'lucide-react';

interface ScanCardFormProps {
  activeMethod: PaymentMethod;
  isProcessing?: boolean;
  onContinue: (details: {
    cardNumber?: string;
    expiry?: string;
    cvv?: string;
    upiId?: string;
  }) => void;
}

export default function ScanCardForm({
  activeMethod,
  isProcessing = false,
  onContinue,
}: ScanCardFormProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [saveCard, setSaveCard] = useState(true);

  const handleCardNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let raw = event.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = raw.slice(0, 2) + ' / ' + raw.slice(2);
    }
    setExpiry(raw);
  };

  const handleCvvChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value.replace(/\D/g, '').slice(0, 4);
    setCvv(raw);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onContinue({
      cardNumber,
      expiry,
      cvv,
      upiId,
    });
  };

  return (
    <div className="w-full sm:w-[58%] lg:w-[60%] p-6 sm:p-8 flex flex-col justify-between text-left">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Method Title */}
        <div>
          <h3 className="text-base font-bold text-slate-800">
            {activeMethod === 'cards' && 'Add a new card'}
            {activeMethod === 'netbanking' && 'Select Netbanking Bank'}
            {activeMethod === 'wallet' && 'Select Wallet'}
            {activeMethod === 'upi' && 'Pay via UPI / QR'}
          </h3>
        </div>

        {/* Form Inputs for Cards */}
        {activeMethod === 'cards' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-200 bg-white shadow-sm">
              {/* Card Number */}
              <div className="p-3.5">
                <input
                  type="text"
                  inputMode="numeric"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="Card Number"
                  required
                  className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none"
                />
              </div>

              {/* Split Row for Expiry & CVV */}
              <div className="grid grid-cols-2 divide-x divide-slate-200">
                <div className="p-3.5">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={expiry}
                    onChange={handleExpiryChange}
                    placeholder="MM / YY"
                    required
                    className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none"
                  />
                </div>
                <div className="p-3.5">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={cvv}
                    onChange={handleCvvChange}
                    placeholder="CVV"
                    required
                    className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* RBI Guideline Checkbox */}
            <label className="flex items-center gap-2.5 text-xs text-slate-600 font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={saveCard}
                onChange={(e) => setSaveCard(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-black focus:ring-black accent-black cursor-pointer"
              />
              <span>Save this card as per RBI guidelines</span>
            </label>
          </div>
        )}

        {/* UPI Form */}
        {activeMethod === 'upi' && (
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 p-3.5 bg-white shadow-sm">
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="mobileNumber@upi (or GPay/PhonePe ID)"
                required
                className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none"
              />
            </div>
            <p className="text-xs text-slate-500">
              Enter your UPI ID to receive a payment request on your UPI app.
            </p>
          </div>
        )}

        {/* Netbanking / Wallet Presets */}
        {(activeMethod === 'netbanking' || activeMethod === 'wallet') && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button
                type="button"
                className="p-3 rounded-xl border border-slate-200 bg-white hover:border-black transition-colors text-left"
              >
                HDFC Bank
              </button>
              <button
                type="button"
                className="p-3 rounded-xl border border-slate-200 bg-white hover:border-black transition-colors text-left"
              >
                State Bank of India
              </button>
              <button
                type="button"
                className="p-3 rounded-xl border border-slate-200 bg-white hover:border-black transition-colors text-left"
              >
                ICICI Bank
              </button>
              <button
                type="button"
                className="p-3 rounded-xl border border-slate-200 bg-white hover:border-black transition-colors text-left"
              >
                Axis Bank
              </button>
            </div>
          </div>
        )}

        {/* Action Button: White Background Button with Black Text */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isProcessing}
            className="w-full h-11 rounded-lg bg-white hover:bg-gray-50 active:scale-[0.99] text-black border border-gray-300 hover:border-black font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 size={16} className="animate-spin text-black" />
                <span>Processing...</span>
              </>
            ) : (
              <span>Continue</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
