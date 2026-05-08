/*
  # DineDrop - Seed Data

  1. Categories (6)
    - Indian, Chinese, Italian, Fast Food, Beverages, Desserts

  2. Menu Items (24)
    - Realistic Indian/Chinese/Italian dishes with prices
    - Using Pexels stock food images
    - Some marked as popular

  3. Important Notes
    - Admin and user accounts are created via Supabase Auth (not in this migration)
    - This migration only seeds categories and menu items
*/

-- Insert categories
INSERT INTO categories (name, description) VALUES
  ('Indian', 'Authentic Indian cuisine with rich spices and flavors'),
  ('Chinese', 'Traditional and Indo-Chinese dishes'),
  ('Italian', 'Classic Italian pasta, pizza, and more'),
  ('Fast Food', 'Quick bites, burgers, and fries'),
  ('Beverages', 'Refreshing drinks and smoothies'),
  ('Desserts', 'Sweet treats and traditional sweets')
ON CONFLICT (name) DO NOTHING;

-- Insert menu items
INSERT INTO menu_items (name, description, price, category_id, image_url, is_available, is_popular) VALUES
-- Indian (category_id = 1)
('Butter Chicken', 'Creamy tomato-based curry with tender chicken pieces', 14.99, 1, 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=600', true, true),
('Biryani', 'Fragrant basmati rice layered with spiced meat and saffron', 13.99, 1, 'https://images.pexels.com/photos/12737656/pexels-photo-12737656.jpeg?auto=compress&cs=tinysrgb&w=600', true, true),
('Paneer Tikka', 'Grilled cottage cheese marinated in spiced yogurt', 11.99, 1, 'https://images.pexels.com/photos/12690962/pexels-photo-12690962.jpeg?auto=compress&cs=tinysrgb&w=600', true, false),
('Dal Makhani', 'Slow-cooked black lentils in creamy butter sauce', 10.99, 1, 'https://images.pexels.com/photos/7516462/pexels-photo-7516462.jpeg?auto=compress&cs=tinysrgb&w=600', true, false),
('Tandoori Chicken', 'Chicken roasted in clay oven with aromatic spices', 15.99, 1, 'https://images.pexels.com/photos/6287525/pexels-photo-6287525.jpeg?auto=compress&cs=tinysrgb&w=600', true, true),

-- Chinese (category_id = 2)
('Hakka Noodles', 'Stir-fried noodles with vegetables and soy sauce', 9.99, 2, 'https://images.pexels.com/photos/2347311/pexels-photo-2347311.jpeg?auto=compress&cs=tinysrgb&w=600', true, true),
('Manchurian', 'Deep-fried vegetable balls in spicy Indo-Chinese sauce', 10.99, 2, 'https://images.pexels.com/photos/2098085/pexels-photo-2098085.jpeg?auto=compress&cs=tinysrgb&w=600', true, false),
('Fried Rice', 'Wok-tossed rice with eggs, vegetables, and soy sauce', 8.99, 2, 'https://images.pexels.com/photos/12840152/pexels-photo-12840152.jpeg?auto=compress&cs=tinysrgb&w=600', true, true),
('Chilli Chicken', 'Crispy chicken tossed in spicy chilli sauce', 12.99, 2, 'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=600', true, false),
('Spring Rolls', 'Crispy rolls stuffed with seasoned vegetables', 7.99, 2, 'https://images.pexels.com/photos/6287525/pexels-photo-6287525.jpeg?auto=compress&cs=tinysrgb&w=600', true, false),

-- Italian (category_id = 3)
('Margherita Pizza', 'Classic pizza with fresh mozzarella and basil', 12.99, 3, 'https://images.pexels.com/photos/1566837/pexels-photo-1566837.jpeg?auto=compress&cs=tinysrgb&w=600', true, true),
('Pasta Alfredo', 'Creamy fettuccine pasta in rich parmesan sauce', 11.99, 3, 'https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg?auto=compress&cs=tinysrgb&w=600', true, false),
('Lasagna', 'Layered pasta with meat sauce and melted cheese', 13.99, 3, 'https://images.pexels.com/photos/6287525/pexels-photo-6287525.jpeg?auto=compress&cs=tinysrgb&w=600', true, true),
('Bruschetta', 'Toasted bread topped with fresh tomatoes and basil', 8.99, 3, 'https://images.pexels.com/photos/2232433/pexels-photo-2232433.jpeg?auto=compress&cs=tinysrgb&w=600', true, false),
('Risotto', 'Creamy arborio rice cooked with mushrooms and parmesan', 14.99, 3, 'https://images.pexels.com/photos/2066823/pexels-photo-2066823.jpeg?auto=compress&cs=tinysrgb&w=600', true, false),

-- Fast Food (category_id = 4)
('Classic Burger', 'Juicy beef patty with lettuce, tomato, and special sauce', 9.99, 4, 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=600', true, true),
('French Fries', 'Crispy golden fries with seasoning', 4.99, 4, 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=600', true, false),
('Chicken Wings', 'Spicy buffalo wings with ranch dip', 11.99, 4, 'https://images.pexels.com/photos/7625100/pexels-photo-7625100.jpeg?auto=compress&cs=tinysrgb&w=600', true, true),
('Loaded Nachos', 'Tortilla chips loaded with cheese, jalapenos, and salsa', 8.99, 4, 'https://images.pexels.com/photos/5409035/pexels-photo-5409035.jpeg?auto=compress&cs=tinysrgb&w=600', true, false),

-- Beverages (category_id = 5)
('Mango Lassi', 'Sweet yogurt drink blended with fresh mango', 4.99, 5, 'https://images.pexels.com/photos/5409035/pexels-photo-5409035.jpeg?auto=compress&cs=tinysrgb&w=600', true, true),
('Masala Chai', 'Spiced Indian tea with milk and cardamom', 2.99, 5, 'https://images.pexels.com/photos/5409035/pexels-photo-5409035.jpeg?auto=compress&cs=tinysrgb&w=600', true, false),
('Fresh Lime Soda', 'Refreshing lime juice with soda and mint', 3.99, 5, 'https://images.pexels.com/photos/5409035/pexels-photo-5409035.jpeg?auto=compress&cs=tinysrgb&w=600', true, false),

-- Desserts (category_id = 6)
('Gulab Jamun', 'Deep-fried milk dumplings soaked in rose syrup', 5.99, 6, 'https://images.pexels.com/photos/5409035/pexels-photo-5409035.jpeg?auto=compress&cs=tinysrgb&w=600', true, true),
('Tiramisu', 'Italian coffee-flavored layered dessert', 7.99, 6, 'https://images.pexels.com/photos/5409035/pexels-photo-5409035.jpeg?auto=compress&cs=tinysrgb&w=600', true, false);
