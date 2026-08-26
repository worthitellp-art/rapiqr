-- Order fulfillment: the columns the delivery/tracking flow writes to.
-- Run this once in the Supabase SQL editor.
--
-- `payment` already exists (added when Razorpay went live). `shiprocket` does
-- NOT — every write in ShiprocketController/OrderModel.attachShiprocketInfo
-- fails with PGRST204 until this runs, which is why the shipping path was inert
-- even though the server routes existed. OrderModel detects the missing column
-- and returns a pointer to this file rather than a raw PostgREST error.
--
-- Shape written into `shiprocket` (see Server/models/orderModel.js):
--   {
--     orderId, shipmentId, awbCode, courierName, trackingUrl,
--     currentStatus, etd, lastUpdatedAt,
--     timeline: [{ status, at, location, note }]   -- newest last
--   }

alter table public.orders add column if not exists shiprocket jsonb;

-- The admin Orders page filters by fulfillment status, and the Razorpay webhook
-- looks an order up by the Razorpay order id stored inside the `payment` blob.
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_razorpay_order_idx
  on public.orders ((payment ->> 'razorpayOrderId'));

-- Tracking webhooks arrive keyed by AWB, not by our order id.
create index if not exists orders_awb_idx
  on public.orders ((shiprocket ->> 'awbCode'));
