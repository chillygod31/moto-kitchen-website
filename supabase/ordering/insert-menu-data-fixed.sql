-- ============================================================================
-- Insert Menu Data for Moto Kitchen (Fixed Version)
-- This version properly handles existing data
-- Run this in Supabase SQL Editor AFTER running COMPLETE_SCHEMA_FRESH.sql
-- ============================================================================

DO $$
DECLARE
  moto_kitchen_id UUID;
  cat_poultry_id UUID;
  cat_vegetables_id UUID;
  cat_sides_id UUID;
  cat_bites_id UUID;
  cat_dessert_id UUID;
  cat_drinks_id UUID;
BEGIN
  -- Get tenant ID
  SELECT id INTO moto_kitchen_id FROM tenants WHERE slug = 'moto-kitchen';
  
  IF moto_kitchen_id IS NULL THEN
    RAISE EXCEPTION 'Moto Kitchen tenant not found. Please run COMPLETE_SCHEMA_FRESH.sql first.';
  END IF;

  -- Delete existing menu items first (to avoid duplicates)
  DELETE FROM menu_items WHERE tenant_id = moto_kitchen_id;
  DELETE FROM menu_categories WHERE tenant_id = moto_kitchen_id;

  -- Create categories
  INSERT INTO menu_categories (tenant_id, name, sort_order, is_active)
  VALUES (moto_kitchen_id, 'Poultry, Fish & Meats', 1, true)
  RETURNING id INTO cat_poultry_id;

  INSERT INTO menu_categories (tenant_id, name, sort_order, is_active)
  VALUES (moto_kitchen_id, 'Vegetables & Stews', 2, true)
  RETURNING id INTO cat_vegetables_id;

  INSERT INTO menu_categories (tenant_id, name, sort_order, is_active)
  VALUES (moto_kitchen_id, 'Sides', 3, true)
  RETURNING id INTO cat_sides_id;

  INSERT INTO menu_categories (tenant_id, name, sort_order, is_active)
  VALUES (moto_kitchen_id, 'Bites & Snacks', 4, true)
  RETURNING id INTO cat_bites_id;

  INSERT INTO menu_categories (tenant_id, name, sort_order, is_active)
  VALUES (moto_kitchen_id, 'Dessert', 5, true)
  RETURNING id INTO cat_dessert_id;

  INSERT INTO menu_categories (tenant_id, name, sort_order, is_active)
  VALUES (moto_kitchen_id, 'Drinks', 6, true)
  RETURNING id INTO cat_drinks_id;

  -- ============================================================================
  -- Insert Menu Items - Poultry, Fish & Meats
  -- ============================================================================
  
  INSERT INTO menu_items (tenant_id, category_id, name, description, price, image_url, dietary_tags, is_available, sort_order) VALUES
  (moto_kitchen_id, cat_poultry_id, 'Mshikaki/Skewers', 'Tender marinated meat skewers grilled over open flames with aromatic spices.', 5.00, '/mshikaki.jpg', '[]'::jsonb, true, 1),
  (moto_kitchen_id, cat_poultry_id, 'Goat meat/Mbuzi', 'Slow-cooked goat meat with traditional Tanzanian spices. *Only made on BBQ in the summer', 5.00, '/goat-meat-mbuzi.jpg', '[]'::jsonb, true, 2),
  (moto_kitchen_id, cat_poultry_id, 'Chicken/Kuku', 'Succulent chicken pieces seasoned and cooked in authentic East African style.', 3.50, '/chicken-kuku.jpg', '[]'::jsonb, true, 3),
  (moto_kitchen_id, cat_poultry_id, 'Fried Fish/Samaki', 'Crispy fried fish seasoned with a blend of coastal Tanzanian spices.', 4.50, '/fried-fish-samaki.jpg', '[]'::jsonb, true, 4),
  (moto_kitchen_id, cat_poultry_id, 'Minced meat in tomato sauce', 'Savoury minced beef simmered in a rich, spiced tomato sauce.', 2.50, '/minced-meat-tomato-sauce.jpg', '[]'::jsonb, true, 5),
  (moto_kitchen_id, cat_poultry_id, 'Chicken biriyani stew', 'Aromatic chicken stew with biriyani spices, perfect over rice.', 4.00, '/chicken-biriyani-stew.jpg', '[]'::jsonb, true, 6),
  (moto_kitchen_id, cat_poultry_id, 'Mchuzi wa Samaki/Fish stew', 'Fresh fish simmered in a creamy coconut curry sauce.', 5.00, '/mchuzi-wa-samaki.jpg', '[]'::jsonb, true, 7),
  (moto_kitchen_id, cat_poultry_id, 'Mchuzi wa Kuku/Chicken stew', 'Tender chicken in a rich, aromatic coconut-based curry.', 4.00, '/mchuzi-wa-kuku.jpg', '[]'::jsonb, true, 8),
  (moto_kitchen_id, cat_poultry_id, 'Mchuzi wa Nyama/Beef stew', 'Slow-cooked beef in a flavourful spiced coconut gravy.', 4.00, '/mchuzi-wa-nyama.jpg', '[]'::jsonb, true, 9),
  (moto_kitchen_id, cat_poultry_id, 'Ndizi wa Nyama/Green bananas & beef', 'Traditional dish of green bananas stewed with tender beef.', 7.50, '/ndizi-wa-nyama.jpg', '[]'::jsonb, true, 10),
  (moto_kitchen_id, cat_poultry_id, 'Urojo/Zanzibar mix', 'Famous Zanzibari street food, a tangy, spiced soup with fritters and potatoes.', 7.50, '/urojo-vegetarian.jpg', '[]'::jsonb, true, 11);

  -- ============================================================================
  -- Insert Menu Items - Vegetables & Stews
  -- ============================================================================
  
  INSERT INTO menu_items (tenant_id, category_id, name, description, price, image_url, dietary_tags, is_available, sort_order) VALUES
  (moto_kitchen_id, cat_vegetables_id, 'Njegere/Peas', 'Green peas cooked in a light coconut sauce with onions and tomatoes.', 3.00, '/njegere.jpg', '["vegetarian", "vegan", "gluten-free"]'::jsonb, true, 1),
  (moto_kitchen_id, cat_vegetables_id, 'Kisamvu/Cassava leaves', 'Pounded cassava leaves slow-cooked in coconut milk until tender and flavorful.', 3.00, '/kisamvu-cassava-leaves.jpg', '["vegetarian", "vegan", "gluten-free"]'::jsonb, true, 2),
  (moto_kitchen_id, cat_vegetables_id, 'Kabichi/Fried cabbage', 'Sautéed cabbage with onions, tomatoes, and mild spices.', 3.00, '/kabichi-fried-cabbage.jpg', '["vegetarian", "vegan", "gluten-free"]'::jsonb, true, 3),
  (moto_kitchen_id, cat_vegetables_id, 'Mchicha/Spinach', 'Fresh spinach cooked with coconut milk and ground peanuts.', 3.00, '/mchicha-spinach.jpg', '["vegetarian", "vegan", "gluten-free"]'::jsonb, true, 4),
  (moto_kitchen_id, cat_vegetables_id, 'Biriganya/Eggplant', 'Tender eggplant cooked in a spiced tomato and onion sauce.', 3.00, '/biriganya-eggplant.jpg', '["vegetarian", "vegan", "gluten-free"]'::jsonb, true, 5),
  (moto_kitchen_id, cat_vegetables_id, 'Vegetarian Biriyani sauce', 'Aromatic biriyani gravy with vegetables and fragrant spices.', 3.50, '/vegetarian-biriyani-sauce.jpg', '["vegetarian", "vegan", "gluten-free"]'::jsonb, true, 6),
  (moto_kitchen_id, cat_vegetables_id, 'Maharage/Brown beans', 'Hearty brown beans simmered in coconut milk with spices.', 3.00, '/maharage-brown-beans.jpg', '["vegetarian", "vegan", "gluten-free"]'::jsonb, true, 7),
  (moto_kitchen_id, cat_vegetables_id, 'Bamia', 'Okra stewed in a tomato-based sauce with onions and spices.', 4.00, '/bamia.jpg', '["vegetarian", "vegan", "gluten-free"]'::jsonb, true, 8),
  (moto_kitchen_id, cat_vegetables_id, 'Urojo Vegetarian', 'Meat-free version of the famous Zanzibari tangy soup with fritters and potatoes.', 6.75, '/urojo-vegetarian.jpg', '["vegetarian", "vegan"]'::jsonb, true, 9);

  -- ============================================================================
  -- Insert Menu Items - Sides
  -- ============================================================================
  
  INSERT INTO menu_items (tenant_id, category_id, name, description, price, image_url, dietary_tags, is_available, sort_order) VALUES
  (moto_kitchen_id, cat_sides_id, 'Pilau Veg', 'Fragrant spiced rice cooked with vegetables and aromatic spices.', 4.00, '/pilau-veg.jpg', '["vegetarian", "vegan"]'::jsonb, true, 1),
  (moto_kitchen_id, cat_sides_id, 'Pilau Beef', 'Traditional spiced rice cooked with tender beef pieces.', 4.50, '/pilau-beef.jpg', '[]'::jsonb, true, 2),
  (moto_kitchen_id, cat_sides_id, 'Pilau Chicken', 'Aromatic rice dish with chicken, cumin, and cardamom.', 4.50, '/pilau-chicken.jpg', '[]'::jsonb, true, 3),
  (moto_kitchen_id, cat_sides_id, 'Wali wa nazi/Coconut rice', 'Fluffy rice cooked in creamy coconut milk.', 3.50, '/wali-wa-nazi-coconut-rice.jpg', '["vegetarian", "vegan", "gluten-free"]'::jsonb, true, 4),
  (moto_kitchen_id, cat_sides_id, 'Chapati', 'Flaky, layered flatbread — a staple at every Tanzanian meal.', 2.00, '/chapati.jpg', '["vegetarian"]'::jsonb, true, 5),
  (moto_kitchen_id, cat_sides_id, 'Ugali', 'Traditional cornmeal porridge with a firm, satisfying texture.', 4.50, '/ugali.jpg', '["vegetarian", "vegan", "gluten-free"]'::jsonb, true, 6),
  (moto_kitchen_id, cat_sides_id, 'Mihogo', 'Boiled or fried cassava, a starchy East African staple.', 3.50, '/mihogo.jpg', '["vegetarian", "vegan", "gluten-free"]'::jsonb, true, 7),
  (moto_kitchen_id, cat_sides_id, 'Plantain', 'Sweet fried plantains, caramelized to perfection.', 5.00, '/plantain.jpg', '["vegetarian", "vegan", "gluten-free"]'::jsonb, true, 8),
  (moto_kitchen_id, cat_sides_id, 'Rice', 'Perfectly steamed white rice with a fluffy, light texture.', 3.00, '/rice.jpg', '["vegetarian", "vegan", "gluten-free"]'::jsonb, true, 9),
  (moto_kitchen_id, cat_sides_id, 'Biriyani', 'Layered aromatic rice with saffron and fried onions.', 4.00, '/biriyani.jpg', '["vegetarian"]'::jsonb, true, 10),
  (moto_kitchen_id, cat_sides_id, 'Vegetarian rice with peas', 'Light rice dish with green peas and mild spices.', 4.00, '/vegetarian-rice-peas.jpg', '["vegetarian", "vegan", "gluten-free"]'::jsonb, true, 11),
  (moto_kitchen_id, cat_sides_id, 'Kachumbari', 'Fresh tomato and onion salad with cilantro and lime.', 1.50, '/kachumbari.jpg', '["vegetarian", "vegan", "gluten-free"]'::jsonb, true, 12),
  (moto_kitchen_id, cat_sides_id, 'Salad', 'Fresh mixed garden salad with crisp vegetables.', 3.00, '/salad.jpg', '["vegetarian", "vegan", "gluten-free"]'::jsonb, true, 13);

  -- ============================================================================
  -- Insert Menu Items - Bites & Snacks
  -- ============================================================================
  
  INSERT INTO menu_items (tenant_id, category_id, name, description, price, image_url, dietary_tags, is_available, sort_order) VALUES
  (moto_kitchen_id, cat_bites_id, 'Samosa', 'Crispy triangular pastries filled with spiced meat or vegetables.', 3.50, '/samosa.jpg', '[]'::jsonb, true, 1),
  (moto_kitchen_id, cat_bites_id, 'Bahjia with chutney', 'Spiced vegetable fritters served with tangy tamarind chutney.', 1.50, '/bahjia-chutney.jpg', '["vegetarian", "vegan"]'::jsonb, true, 2),
  (moto_kitchen_id, cat_bites_id, 'Visheti', 'Sweet fried pastry twists, crispy and lightly sweetened.', 1.50, '/visheti.jpg', '["vegetarian"]'::jsonb, true, 3),
  (moto_kitchen_id, cat_bites_id, 'Kalimati', 'Traditional sweet treats made with coconut and sugar.', 1.50, '/kalimati.jpg', '["vegetarian", "vegan", "gluten-free"]'::jsonb, true, 4),
  (moto_kitchen_id, cat_bites_id, 'Kachori', 'Deep-fried pastry balls filled with spiced lentils.', 1.75, '/kachori.jpg', '["vegetarian", "vegan"]'::jsonb, true, 5),
  (moto_kitchen_id, cat_bites_id, 'Katlesi/Cutlets', 'Crispy potato and meat cutlets, pan-fried until golden.', 2.00, '/katlesi-cutlets.jpg', '[]'::jsonb, true, 6),
  (moto_kitchen_id, cat_bites_id, 'Eggchop', 'Boiled egg wrapped in spiced meat, coated and fried.', 2.00, '/eggchop.jpg', '[]'::jsonb, true, 7),
  (moto_kitchen_id, cat_bites_id, 'Kebab', 'Spiced minced meat shaped and grilled to perfection.', 3.00, '/kebab.jpg', '[]'::jsonb, true, 8),
  (moto_kitchen_id, cat_bites_id, 'Mandazi', 'East African doughnuts with a hint of cardamom and coconut.', 1.50, '/mandazi.jpg', '["vegetarian"]'::jsonb, true, 9),
  (moto_kitchen_id, cat_bites_id, 'Vitumbua', 'Sweet rice pancakes with coconut milk and cardamom.', 1.75, '/vitumbua.jpg', '["vegetarian", "vegan", "gluten-free"]'::jsonb, true, 10),
  (moto_kitchen_id, cat_bites_id, 'Pili Pili', 'Spicy chili sauce/condiment.', 0.50, NULL, '["vegetarian", "vegan", "gluten-free"]'::jsonb, true, 11);

  -- ============================================================================
  -- Insert Menu Items - Dessert
  -- ============================================================================
  
  INSERT INTO menu_items (tenant_id, category_id, name, description, price, image_url, dietary_tags, is_available, sort_order) VALUES
  (moto_kitchen_id, cat_dessert_id, 'Coconut cake', 'Moist, fluffy cake infused with fresh coconut.', 3.00, '/coconut-cake.jpg', '["vegetarian"]'::jsonb, true, 1);

  -- ============================================================================
  -- Insert Menu Items - Drinks
  -- ============================================================================
  
  INSERT INTO menu_items (tenant_id, category_id, name, description, price, image_url, dietary_tags, is_available, sort_order) VALUES
  (moto_kitchen_id, cat_drinks_id, 'Fresh Fruit', 'Seasonal fresh fruit platter featuring tropical favorites.', 4.00, '/fresh-fruit.jpg', '["vegetarian", "vegan", "gluten-free"]'::jsonb, true, 1),
  (moto_kitchen_id, cat_drinks_id, 'Fresh juice', 'Freshly squeezed tropical fruit juice, vibrant and refreshing.', 4.50, '/fresh-juice.jpg', '["vegetarian", "vegan", "gluten-free"]'::jsonb, true, 2),
  (moto_kitchen_id, cat_drinks_id, 'Chai ya Maziwa/Milk Tea', 'Creamy spiced tea brewed with milk and aromatic spices.', 4.00, '/chai-ya-maziwa.jpg', '["vegetarian"]'::jsonb, true, 3),
  (moto_kitchen_id, cat_drinks_id, 'Chai ya Tangawizi/Ginger tea', 'Warming ginger tea with a spicy kick.', 4.00, '/chai-ya-tangawizi.jpg', '["vegetarian", "vegan", "gluten-free"]'::jsonb, true, 4);

  RAISE NOTICE 'Menu data inserted successfully!';
END $$;

-- Verify the data was inserted
SELECT 
  mc.name as category,
  COUNT(mi.id) as item_count
FROM menu_categories mc
LEFT JOIN menu_items mi ON mi.category_id = mc.id
JOIN tenants t ON mc.tenant_id = t.id
WHERE t.slug = 'moto-kitchen'
GROUP BY mc.id, mc.name
ORDER BY mc.sort_order;
