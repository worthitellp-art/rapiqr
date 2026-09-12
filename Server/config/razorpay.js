const Razorpay = require('razorpay');

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing in environment variables.');
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

// Proxied client instance so callers can use razorpay.orders.create(...) while always reading current env variables
const razorpay = new Proxy({}, {
  get(target, propertyName) {
    const clientInstance = getRazorpayClient();
    const value = clientInstance[propertyName];
    return typeof value === 'function' ? value.bind(clientInstance) : value;
  },
});

module.exports = razorpay;
module.exports.getRazorpayClient = getRazorpayClient;

