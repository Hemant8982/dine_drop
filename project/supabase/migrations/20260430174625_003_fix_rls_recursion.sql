/*
  # Fix RLS Policy Recursion

  1. Problem
    - The `users` table SELECT policy references the `users` table itself to check admin role,
      causing infinite recursion: "Users can read own profile" policy does
      EXISTS (SELECT 1 FROM users WHERE ...) which re-evaluates the same policy.
    - Other tables (cart_items, orders) also reference the `users` table in their policies,
      which can fail when the users table policies are broken.

  2. Solution
    - Drop ALL existing policies on all tables
    - Recreate policies using only auth.uid() / auth.jwt() without self-referencing the users table
    - For admin checks, store the role in auth.users.raw_app_meta_data and check via auth.jwt()
    - For user-owned data checks, use auth.uid() directly against the auth_id column
    - Create a helper function get_user_role() that reads from auth.jwt() app_metadata

  3. Important Notes
    - A trigger on users table will sync the role to auth.users.raw_app_meta_data
    - This avoids any circular policy evaluation
*/

-- Helper function to get user role from JWT app_metadata
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', 'USER');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function to get current user's profile id
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS BIGINT AS $$
  SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Drop all existing policies
DROP POLICY IF EXISTS "Categories are publicly readable" ON categories;
DROP POLICY IF EXISTS "Unauthenticated can view categories" ON categories;
DROP POLICY IF EXISTS "Menu items are publicly readable" ON menu_items;
DROP POLICY IF EXISTS "Unauthenticated can view menu items" ON menu_items;
DROP POLICY IF EXISTS "Admins can insert menu items" ON menu_items;
DROP POLICY IF EXISTS "Admins can update menu items" ON menu_items;
DROP POLICY IF EXISTS "Admins can delete menu items" ON menu_items;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can read own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can add to own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can update own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can delete own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can read own orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
DROP POLICY IF EXISTS "Users can read own order items" ON order_items;
DROP POLICY IF EXISTS "Users can create order items for own orders" ON order_items;

-- CATEGORIES: public read
CREATE POLICY "Categories public read"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Categories anon read"
  ON categories FOR SELECT
  TO anon
  USING (true);

-- MENU ITEMS: public read, admin write via helper function
CREATE POLICY "Menu items public read"
  ON menu_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Menu items anon read"
  ON menu_items FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Admins insert menu items"
  ON menu_items FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'ADMIN');

CREATE POLICY "Admins update menu items"
  ON menu_items FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'ADMIN')
  WITH CHECK (get_user_role() = 'ADMIN');

CREATE POLICY "Admins delete menu items"
  ON menu_items FOR DELETE
  TO authenticated
  USING (get_user_role() = 'ADMIN');

-- USERS: read own profile via auth_id = auth.uid(), admin read all via helper
CREATE POLICY "Users read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth_id = auth.uid() OR get_user_role() = 'ADMIN');

CREATE POLICY "Users insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth_id = auth.uid());

CREATE POLICY "Users update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

-- CART ITEMS: user-owned via helper function
CREATE POLICY "Users read own cart"
  ON cart_items FOR SELECT
  TO authenticated
  USING (user_id = get_current_user_id());

CREATE POLICY "Users add to own cart"
  ON cart_items FOR INSERT
  TO authenticated
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users update own cart"
  ON cart_items FOR UPDATE
  TO authenticated
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users delete own cart items"
  ON cart_items FOR DELETE
  TO authenticated
  USING (user_id = get_current_user_id());

-- ORDERS: user-owned or admin
CREATE POLICY "Users read own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (user_id = get_current_user_id() OR get_user_role() = 'ADMIN');

CREATE POLICY "Users create own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Admins update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'ADMIN')
  WITH CHECK (get_user_role() = 'ADMIN');

-- ORDER ITEMS: follow order ownership
CREATE POLICY "Users read own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = get_current_user_id() OR get_user_role() = 'ADMIN')
    )
  );

CREATE POLICY "Users create own order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = get_current_user_id()
    )
  );

-- Trigger to sync role to auth.users.app_metadata when users table is inserted/updated
CREATE OR REPLACE FUNCTION sync_user_role_to_app_meta()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role OR (TG_OP = 'INSERT') THEN
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}') || jsonb_build_object('role', NEW.role)
    WHERE id = NEW.auth_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_user_role ON users;
CREATE TRIGGER trigger_sync_user_role
  AFTER INSERT OR UPDATE OF role ON users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_role_to_app_meta();
