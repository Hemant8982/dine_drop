import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ success: false, data: null, message }, status);
}

// Service role client - bypasses RLS for all operations
function getServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// Verify user token and return auth user
async function getAuthUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data } = await supabase.auth.getUser(token);
  return data.user;
}

// Get user profile from users table (using service role to bypass RLS)
async function getProfile(authId: string) {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", authId)
    .maybeSingle();
  return data;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace("/api", "") || "/";
  const supabase = getServiceClient();
  const authUser = await getAuthUser(req);

  try {
    // AUTH ROUTES
    if (path === "/auth/register" && req.method === "POST") {
      const body = await req.json();
      const { email, password, name, phone, address } = body;

      if (!email || !password || !name) {
        return errorResponse("Name, email, and password are required");
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) return errorResponse(authError.message);

      // Set role in app_metadata so JWT includes it
      await supabase.auth.updateUser(authData.user!.id, {
        app_metadata: { role: "USER" },
      });

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .insert({
          auth_id: authData.user!.id,
          name,
          email,
          phone: phone || null,
          address: address || null,
          role: "USER",
        })
        .select()
        .single();

      if (profileError) return errorResponse(profileError.message);

      return jsonResponse({
        success: true,
        data: { token: authData.session?.access_token, user: profile },
        message: "Registration successful",
      });
    }

    if (path === "/auth/login" && req.method === "POST") {
      const body = await req.json();
      const { email, password } = body;

      if (!email || !password) return errorResponse("Email and password required");

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (authError) return errorResponse("Invalid credentials");

      let profile = await getProfile(authData.user.id);

      // Auto-create profile if missing (orphaned auth user)
      if (!profile) {
        const meta = authData.user.user_metadata || {};
        const { data: newProfile, error: createError } = await supabase
          .from("users")
          .insert({
            auth_id: authData.user.id,
            name: meta.name || authData.user.email!.split("@")[0],
            email: authData.user.email!,
            role: "USER",
          })
          .select()
          .single();

        if (!createError && newProfile) {
          profile = newProfile;
          await supabase.auth.updateUser(authData.user.id, {
            app_metadata: { role: "USER" },
          });
        }
      }

      return jsonResponse({
        success: true,
        data: { token: authData.session.access_token, user: profile },
        message: "Login successful",
      });
    }

    // MENU ROUTES (public)
    if (path === "/menu" && req.method === "GET") {
      const category = url.searchParams.get("category");
      let query = supabase
        .from("menu_items")
        .select("*, category:categories(*)")
        .eq("is_available", true);

      if (category) {
        const { data: cat } = await supabase
          .from("categories")
          .select("id")
          .eq("name", category)
          .maybeSingle();
        if (cat) query = query.eq("category_id", cat.id);
      }

      const { data, error } = await query;
      if (error) return errorResponse(error.message);

      return jsonResponse({ success: true, data, message: "Menu items fetched" });
    }

    if (path === "/menu/popular" && req.method === "GET") {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*, category:categories(*)")
        .eq("is_popular", true)
        .eq("is_available", true);

      if (error) return errorResponse(error.message);

      return jsonResponse({ success: true, data, message: "Popular items fetched" });
    }

    if (path.match(/^\/menu\/\d+$/) && req.method === "GET") {
      const id = path.split("/")[2];
      const { data, error } = await supabase
        .from("menu_items")
        .select("*, category:categories(*)")
        .eq("id", id)
        .maybeSingle();

      if (error) return errorResponse(error.message);
      if (!data) return errorResponse("Menu item not found", 404);

      return jsonResponse({ success: true, data, message: "Menu item fetched" });
    }

    // CATEGORIES (public read)
    if (path === "/categories" && req.method === "GET") {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) return errorResponse(error.message);

      return jsonResponse({ success: true, data, message: "Categories fetched" });
    }

    // ADMIN: Create category
    if (path === "/admin/categories" && req.method === "POST") {
      if (!authUser) return errorResponse("Unauthorized", 401);
      const profile = await getProfile(authUser.id);
      if (!profile || profile.role !== "ADMIN") return errorResponse("Forbidden", 403);

      const body = await req.json();
      const { name, description, imageUrl } = body;
      if (!name) return errorResponse("Category name required");

      const { data, error } = await supabase
        .from("categories")
        .insert({ name, description: description || null, image_url: imageUrl || null })
        .select()
        .single();

      if (error) return errorResponse(error.message);
      return jsonResponse({ success: true, data, message: "Category created" });
    }

    // ADMIN: Update category
    if (path.match(/^\/admin\/categories\/\d+$/) && req.method === "PUT") {
      if (!authUser) return errorResponse("Unauthorized", 401);
      const profile = await getProfile(authUser.id);
      if (!profile || profile.role !== "ADMIN") return errorResponse("Forbidden", 403);

      const id = path.split("/")[3];
      const body = await req.json();

      const updateFields: Record<string, any> = {};
      if (body.name !== undefined) updateFields.name = body.name;
      if (body.description !== undefined) updateFields.description = body.description;
      if (body.imageUrl !== undefined) updateFields.image_url = body.imageUrl;

      const { data, error } = await supabase
        .from("categories")
        .update(updateFields)
        .eq("id", id)
        .select()
        .single();

      if (error) return errorResponse(error.message);
      return jsonResponse({ success: true, data, message: "Category updated" });
    }

    // ADMIN: Delete category
    if (path.match(/^\/admin\/categories\/\d+$/) && req.method === "DELETE") {
      if (!authUser) return errorResponse("Unauthorized", 401);
      const profile = await getProfile(authUser.id);
      if (!profile || profile.role !== "ADMIN") return errorResponse("Forbidden", 403);

      const id = path.split("/")[3];
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) return errorResponse(error.message);

      return jsonResponse({ success: true, data: null, message: "Category deleted" });
    }

    // CART ROUTES (requires auth)
    if (path === "/cart" && req.method === "GET") {
      if (!authUser) return errorResponse("Unauthorized", 401);
      const profile = await getProfile(authUser.id);
      if (!profile) return errorResponse("Profile not found", 404);

      const { data, error } = await supabase
        .from("cart_items")
        .select("*, menu_item:menu_items(*, category:categories(*))")
        .eq("user_id", profile.id);

      if (error) return errorResponse(error.message);

      return jsonResponse({ success: true, data, message: "Cart fetched" });
    }

    if (path === "/cart/add" && req.method === "POST") {
      if (!authUser) return errorResponse("Unauthorized", 401);
      const profile = await getProfile(authUser.id);
      if (!profile) return errorResponse("Profile not found", 404);

      const body = await req.json();
      const { menuItemId, quantity = 1 } = body;
      if (!menuItemId) return errorResponse("menuItemId required");

      const { data: existing } = await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", profile.id)
        .eq("menu_item_id", menuItemId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + quantity })
          .eq("id", existing.id)
          .select("*, menu_item:menu_items(*, category:categories(*))")
          .single();

        if (error) return errorResponse(error.message);
        return jsonResponse({ success: true, data, message: "Cart updated" });
      }

      const { data, error } = await supabase
        .from("cart_items")
        .insert({ user_id: profile.id, menu_item_id: menuItemId, quantity })
        .select("*, menu_item:menu_items(*, category:categories(*))")
        .single();

      if (error) return errorResponse(error.message);
      return jsonResponse({ success: true, data, message: "Item added to cart" });
    }

    if (path === "/cart/update" && req.method === "PUT") {
      if (!authUser) return errorResponse("Unauthorized", 401);
      const profile = await getProfile(authUser.id);
      if (!profile) return errorResponse("Profile not found", 404);

      const body = await req.json();
      const { cartItemId, quantity } = body;
      if (!cartItemId || quantity === undefined) return errorResponse("cartItemId and quantity required");
      if (quantity <= 0) {
        const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId);
        if (error) return errorResponse(error.message);
        return jsonResponse({ success: true, data: null, message: "Item removed" });
      }

      const { data, error } = await supabase
        .from("cart_items")
        .update({ quantity })
        .eq("id", cartItemId)
        .select("*, menu_item:menu_items(*, category:categories(*))")
        .single();

      if (error) return errorResponse(error.message);
      return jsonResponse({ success: true, data, message: "Cart updated" });
    }

    if (path.match(/^\/cart\/\d+$/) && req.method === "DELETE") {
      if (!authUser) return errorResponse("Unauthorized", 401);
      const id = path.split("/")[2];
      const { error } = await supabase.from("cart_items").delete().eq("id", id);
      if (error) return errorResponse(error.message);

      return jsonResponse({ success: true, data: null, message: "Item removed from cart" });
    }

    if (path === "/cart/clear" && req.method === "DELETE") {
      if (!authUser) return errorResponse("Unauthorized", 401);
      const profile = await getProfile(authUser.id);
      if (!profile) return errorResponse("Profile not found", 404);

      const { error } = await supabase.from("cart_items").delete().eq("user_id", profile.id);
      if (error) return errorResponse(error.message);

      return jsonResponse({ success: true, data: null, message: "Cart cleared" });
    }

    // ORDER ROUTES (requires auth)
    if (path === "/orders/place" && req.method === "POST") {
      if (!authUser) return errorResponse("Unauthorized", 401);
      const profile = await getProfile(authUser.id);
      if (!profile) return errorResponse("Profile not found", 404);

      const body = await req.json();
      const { deliveryAddress, orderType, tableNumber } = body;
      const orderTypeVal = orderType === "DINE_IN" ? "DINE_IN" : "HOME_DELIVERY";

      if (orderTypeVal === "HOME_DELIVERY" && !deliveryAddress) {
        return errorResponse("Delivery address required for home delivery");
      }

      const { data: cartItems, error: cartError } = await supabase
        .from("cart_items")
        .select("*, menu_item:menu_items(*)")
        .eq("user_id", profile.id);

      if (cartError) return errorResponse(cartError.message);
      if (!cartItems || cartItems.length === 0) return errorResponse("Cart is empty");

      const totalAmount = cartItems.reduce(
        (sum: number, item: any) => sum + item.menu_item.price * item.quantity,
        0
      );

      const estimatedMinutes = orderTypeVal === "DINE_IN"
        ? 15 + Math.floor(Math.random() * 15)
        : 30 + Math.floor(Math.random() * 30);

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: profile.id,
          total_amount: totalAmount,
          status: "PENDING",
          estimated_delivery_minutes: estimatedMinutes,
          delivery_address: orderTypeVal === "HOME_DELIVERY" ? deliveryAddress : null,
          order_type: orderTypeVal,
          table_number: orderTypeVal === "DINE_IN" ? (tableNumber || null) : null,
        })
        .select()
        .single();

      if (orderError) return errorResponse(orderError.message);

      const orderItems = cartItems.map((item: any) => ({
        order_id: order.id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        price_at_time: item.menu_item.price,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) return errorResponse(itemsError.message);

      await supabase.from("cart_items").delete().eq("user_id", profile.id);

      const { data: fullOrder } = await supabase
        .from("orders")
        .select("*, order_items:order_items(*, menu_item:menu_items(*))")
        .eq("id", order.id)
        .single();

      return jsonResponse({ success: true, data: fullOrder, message: "Order placed successfully" });
    }

    if (path === "/orders" && req.method === "GET") {
      if (!authUser) return errorResponse("Unauthorized", 401);
      const profile = await getProfile(authUser.id);
      if (!profile) return errorResponse("Profile not found", 404);

      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items:order_items(*, menu_item:menu_items(*))")
        .eq("user_id", profile.id)
        .order("order_date", { ascending: false });

      if (error) return errorResponse(error.message);

      return jsonResponse({ success: true, data, message: "Orders fetched" });
    }

    if (path.match(/^\/orders\/\d+$/) && req.method === "GET") {
      if (!authUser) return errorResponse("Unauthorized", 401);
      const id = path.split("/")[2];

      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items:order_items(*, menu_item:menu_items(*))")
        .eq("id", id)
        .maybeSingle();

      if (error) return errorResponse(error.message);
      if (!data) return errorResponse("Order not found", 404);

      return jsonResponse({ success: true, data, message: "Order fetched" });
    }

    if (path.match(/^\/orders\/track\/\d+$/) && req.method === "GET") {
      if (!authUser) return errorResponse("Unauthorized", 401);
      const id = path.split("/")[3];

      const { data, error } = await supabase
        .from("orders")
        .select("id, status, estimated_delivery_minutes, order_date")
        .eq("id", id)
        .maybeSingle();

      if (error) return errorResponse(error.message);
      if (!data) return errorResponse("Order not found", 404);

      return jsonResponse({ success: true, data, message: "Order tracking fetched" });
    }

    // ADMIN ROUTES
    if (path === "/admin/menu" && req.method === "POST") {
      if (!authUser) return errorResponse("Unauthorized", 401);
      const profile = await getProfile(authUser.id);
      if (!profile || profile.role !== "ADMIN") return errorResponse("Forbidden", 403);

      const body = await req.json();
      const { name, description, price, categoryId, imageUrl, isAvailable, isPopular } = body;

      if (!name || !price || !categoryId) return errorResponse("Name, price, and categoryId required");

      const { data, error } = await supabase
        .from("menu_items")
        .insert({
          name,
          description,
          price,
          category_id: categoryId,
          image_url: imageUrl || null,
          is_available: isAvailable !== false,
          is_popular: isPopular === true,
        })
        .select("*, category:categories(*)")
        .single();

      if (error) return errorResponse(error.message);
      return jsonResponse({ success: true, data, message: "Menu item created" });
    }

    if (path.match(/^\/admin\/menu\/\d+$/) && req.method === "PUT") {
      if (!authUser) return errorResponse("Unauthorized", 401);
      const profile = await getProfile(authUser.id);
      if (!profile || profile.role !== "ADMIN") return errorResponse("Forbidden", 403);

      const id = path.split("/")[3];
      const body = await req.json();

      const updateFields: Record<string, any> = {};
      if (body.name !== undefined) updateFields.name = body.name;
      if (body.description !== undefined) updateFields.description = body.description;
      if (body.price !== undefined) updateFields.price = body.price;
      if (body.categoryId !== undefined) updateFields.category_id = body.categoryId;
      if (body.imageUrl !== undefined) updateFields.image_url = body.imageUrl;
      if (body.isAvailable !== undefined) updateFields.is_available = body.isAvailable;
      if (body.isPopular !== undefined) updateFields.is_popular = body.isPopular;

      const { data, error } = await supabase
        .from("menu_items")
        .update(updateFields)
        .eq("id", id)
        .select("*, category:categories(*)")
        .single();

      if (error) return errorResponse(error.message);
      return jsonResponse({ success: true, data, message: "Menu item updated" });
    }

    if (path.match(/^\/admin\/menu\/\d+$/) && req.method === "DELETE") {
      if (!authUser) return errorResponse("Unauthorized", 401);
      const profile = await getProfile(authUser.id);
      if (!profile || profile.role !== "ADMIN") return errorResponse("Forbidden", 403);

      const id = path.split("/")[3];
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) return errorResponse(error.message);

      return jsonResponse({ success: true, data: null, message: "Menu item deleted" });
    }

    if (path === "/admin/orders" && req.method === "GET") {
      if (!authUser) return errorResponse("Unauthorized", 401);
      const profile = await getProfile(authUser.id);
      if (!profile || profile.role !== "ADMIN") return errorResponse("Forbidden", 403);

      const { data, error } = await supabase
        .from("orders")
        .select("*, user:users(name, email, phone), order_items:order_items(*, menu_item:menu_items(*))")
        .order("order_date", { ascending: false });

      if (error) return errorResponse(error.message);

      return jsonResponse({ success: true, data, message: "All orders fetched" });
    }

    if (path.match(/^\/admin\/orders\/\d+\/status$/) && req.method === "PUT") {
      if (!authUser) return errorResponse("Unauthorized", 401);
      const profile = await getProfile(authUser.id);
      if (!profile || profile.role !== "ADMIN") return errorResponse("Forbidden", 403);

      const id = path.split("/")[3];
      const body = await req.json();
      const { status } = body;

      const validStatuses = ["PENDING", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
      if (!validStatuses.includes(status)) return errorResponse("Invalid status");

      const { data, error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) return errorResponse(error.message);
      return jsonResponse({ success: true, data, message: "Order status updated" });
    }

    if (path === "/admin/stats" && req.method === "GET") {
      if (!authUser) return errorResponse("Unauthorized", 401);
      const profile = await getProfile(authUser.id);
      if (!profile || profile.role !== "ADMIN") return errorResponse("Forbidden", 403);

      const { data: popularItems } = await supabase
        .from("order_items")
        .select("menu_item_id, quantity, menu_item:menu_items(*, category:categories(*))");

      const itemCounts: Record<number, { item: any; totalQty: number }> = {};
      for (const oi of popularItems || []) {
        if (!itemCounts[oi.menu_item_id]) {
          itemCounts[oi.menu_item_id] = { item: oi.menu_item, totalQty: 0 };
        }
        itemCounts[oi.menu_item_id].totalQty += oi.quantity;
      }

      const mostOrdered = Object.values(itemCounts)
        .sort((a: any, b: any) => b.totalQty - a.totalQty)
        .slice(0, 5);

      const today = new Date().toISOString().split("T")[0];
      const { data: todayOrders } = await supabase
        .from("orders")
        .select("total_amount")
        .gte("order_date", today);

      const totalRevenue = (todayOrders || []).reduce(
        (sum: number, o: any) => sum + Number(o.total_amount),
        0
      );

      return jsonResponse({
        success: true,
        data: { mostOrdered, totalRevenue, totalOrdersToday: todayOrders?.length || 0 },
        message: "Stats fetched",
      });
    }

    // Admin: create admin user
    if (path === "/admin/create-admin" && req.method === "POST") {
      if (!authUser) return errorResponse("Unauthorized", 401);
      const profile = await getProfile(authUser.id);
      if (!profile || profile.role !== "ADMIN") return errorResponse("Forbidden", 403);

      const body = await req.json();
      const { email, password, name } = body;
      if (!email || !password || !name) return errorResponse("Name, email, and password required");

      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) return errorResponse(authError.message);

      await supabase.auth.updateUser(authData.user!.id, {
        app_metadata: { role: "ADMIN" },
      });

      const { data: newAdmin, error: adminError } = await supabase
        .from("users")
        .insert({ auth_id: authData.user!.id, name, email, role: "ADMIN" })
        .select()
        .single();

      if (adminError) return errorResponse(adminError.message);
      return jsonResponse({ success: true, data: newAdmin, message: "Admin created" });
    }

    return errorResponse("Route not found", 404);
  } catch (err) {
    return errorResponse(err.message || "Internal server error", 500);
  }
});
