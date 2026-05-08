/*
  # Add Order Type (Dine In / Home Delivery)

  1. Changes
    - Add `order_type` column to `orders` table
    - Values: 'DINE_IN' or 'HOME_DELIVERY' (defaults to 'HOME_DELIVERY')
    - For DINE_IN orders, `delivery_address` is optional (table number could be used)
    - Add `table_number` column for dine-in orders

  2. Important Notes
    - Existing orders default to HOME_DELIVERY
    - DINE_IN orders skip delivery address requirement
    - Estimated delivery time applies differently: DINE_IN = prep time, HOME_DELIVERY = prep + transit
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'order_type'
  ) THEN
    ALTER TABLE orders ADD COLUMN order_type TEXT DEFAULT 'HOME_DELIVERY';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'table_number'
  ) THEN
    ALTER TABLE orders ADD COLUMN table_number TEXT;
  END IF;
END $$;

-- Update existing orders to HOME_DELIVERY
UPDATE orders SET order_type = 'HOME_DELIVERY' WHERE order_type IS NULL;
