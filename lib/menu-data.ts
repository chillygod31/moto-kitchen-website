// Shared menu dishes data
export interface DietaryTag {
  type: "vegetarian" | "vegan" | "gluten-free" | "dairy-free" | "spicy";
  label: string;
  level?: "mild" | "medium" | "hot";
}

export interface Dish {
  id: number;
  name: string;
  description: string;
  category: string;
  image: string;
  note?: string;
  tags?: DietaryTag[];
}

export const dishes: Dish[] = [
  // Poultry, Fish & Meats
  { 
    id: 1, 
    name: "Mshikaki/Skewers", 
    description: "Tender marinated meat skewers grilled over open flames with aromatic spices. Medium spice level with notes of cumin, coriander, and garlic. Perfect paired with pilau rice and kachumbari salad. A beloved street food across Tanzania, especially popular during celebrations.", 
    category: "poultry-fish-meats", 
    image: "mshikaki.jpg", 
    note: "Only made on BBQ in the summer",
  },
  { 
    id: 2, 
    name: "Goat meat/Mbuzi", 
    description: "Slow-cooked goat meat with traditional Tanzanian spices creating a rich, tender texture. Mild to medium spice with deep, savory flavors from cardamom and turmeric. Traditionally served with ugali or pilau rice. A celebratory dish that brings families together for special occasions.", 
    category: "poultry-fish-meats", 
    image: "goat-meat-mbuzi.jpg"
  },
  { 
    id: 3, 
    name: "Chicken/Kuku", 
    description: "Succulent chicken pieces seasoned and cooked in authentic East African style. Medium spice with aromatic notes of ginger, garlic, and coconut. Pairs beautifully with coconut rice and fresh vegetables. A staple dish that represents the heart of Tanzanian home cooking.", 
    category: "poultry-fish-meats", 
    image: "chicken-kuku.jpg",
  },
  { 
    id: 4, 
    name: "Fried Fish/Samaki", 
    description: "Crispy fried fish seasoned with a blend of coastal Tanzanian spices. Mild spice with bright, fresh flavors enhanced by lemon and herbs. Best enjoyed with coconut rice and a side of kachumbari. A coastal favorite that reflects Tanzania's rich Swahili culinary heritage.", 
    category: "poultry-fish-meats", 
    image: "fried-fish-samaki.jpg"
  },
  { 
    id: 5, 
    name: "Minced meat in tomato sauce", 
    description: "Savoury minced beef simmered in a rich, spiced tomato sauce. Medium spice with warming notes of cinnamon and cloves. Perfect over pilau rice or with chapati. A comforting dish that brings the flavors of home to any table.", 
    category: "poultry-fish-meats", 
    image: "minced-meat-tomato-sauce.jpg",
  },
  { 
    id: 6, 
    name: "Chicken biriyani stew", 
    description: "Aromatic chicken stew with biriyani spices, perfect over rice. Medium to hot spice with complex layers of cardamom, saffron, and star anise. Traditionally served with basmati rice and raita. A dish that showcases the Indian influence in Tanzanian cuisine.", 
    category: "poultry-fish-meats", 
    image: "chicken-biriyani-stew.jpg"
  },
  { 
    id: 7, 
    name: "Mchuzi wa Samaki/Fish stew", 
    description: "Fresh fish simmered in a creamy coconut curry sauce. Mild to medium spice with delicate flavors that let the fish shine. Best paired with coconut rice and steamed vegetables. A coastal specialty that celebrates the bounty of the Indian Ocean.", 
    category: "poultry-fish-meats", 
    image: "mchuzi-wa-samaki.jpg",
  },
  { 
    id: 8, 
    name: "Mchuzi wa Kuku/Chicken stew", 
    description: "Tender chicken in a rich, aromatic coconut-based curry. Medium spice with warming notes of turmeric and coriander. Perfect with pilau rice or chapati for scooping. A beloved family dish that represents the essence of Tanzanian comfort food.", 
    category: "poultry-fish-meats", 
    image: "mchuzi-wa-kuku.jpg"
  },
  { 
    id: 9, 
    name: "Mchuzi wa Nyama/Beef stew", 
    description: "Slow-cooked beef in a flavourful spiced coconut gravy. Medium spice with deep, savory flavors that develop over hours of cooking. Traditionally served with ugali or rice. A hearty dish that satisfies and nourishes, perfect for gatherings.", 
    category: "poultry-fish-meats", 
    image: "mchuzi-wa-nyama.jpg"
  },
  { 
    id: 10, 
    name: "Ndizi na Nyama/Green bananas & beef", 
    description: "Traditional dish of green bananas stewed with tender beef. Mild to medium spice with earthy, comforting flavors. The green bananas add a unique texture and subtle sweetness. A traditional Tanzanian dish that showcases local ingredients and cooking methods.", 
    category: "poultry-fish-meats", 
    image: "ndizi-wa-nyama.jpg",
  },
  { 
    id: 11, 
    name: "Urojo/Zanzibar mix", 
    description: "Famous Zanzibari street food, a tangy, spiced soup with fritters and potatoes. Medium to hot spice with a bright, acidic kick from tamarind and lime. Topped with crispy bhajias and fresh herbs. A beloved street food that captures the vibrant energy of Zanzibar's food culture.", 
    category: "poultry-fish-meats", 
    image: "urojo-vegetarian.jpg"
  },

  // Vegetables & Stews
  { 
    id: 12, 
    name: "Njegere/Peas", 
    description: "Green peas cooked in a light coconut sauce with onions and tomatoes. Mild spice with fresh, sweet flavors from the peas. Perfect paired with rice or chapati. A simple yet satisfying vegetable dish that brings color and nutrition to any meal.", 
    category: "vegetables-stews", 
    image: "njegere.jpg",
    tags: [{ type: "vegetarian", label: "Vegetarian" }, { type: "vegan", label: "Vegan" }, { type: "gluten-free", label: "Gluten-Free" }]
  },
  { 
    id: 13, 
    name: "Kisamvu/Cassava leaves", 
    description: "Pounded cassava leaves slow-cooked in coconut milk until tender and flavorful. Mild spice with earthy, slightly bitter notes balanced by creamy coconut. Traditionally served with ugali or rice. A traditional Tanzanian vegetable dish that showcases local cooking techniques.", 
    category: "vegetables-stews", 
    image: "kisamvu-cassava-leaves.jpg",
    tags: [{ type: "vegetarian", label: "Vegetarian" }, { type: "vegan", label: "Vegan" }, { type: "gluten-free", label: "Gluten-Free" }]
  },
  { 
    id: 14, 
    name: "Kabichi/Fried cabbage", 
    description: "Sautéed cabbage with onions, tomatoes, and mild spices creating a simple yet delicious side. Mild spice with sweet, caramelized flavors. Pairs well with any main dish or rice. A versatile vegetable dish that adds freshness and crunch to the meal.", 
    category: "vegetables-stews", 
    image: "kabichi-fried-cabbage.jpg",
    tags: [{ type: "vegetarian", label: "Vegetarian" }, { type: "vegan", label: "Vegan" }, { type: "gluten-free", label: "Gluten-Free" }]
  },
  { 
    id: 15, 
    name: "Mchicha/Spinach", 
    description: "Fresh spinach cooked with coconut milk and ground peanuts for a rich, creamy texture. Mild spice with nutty, earthy flavors. Perfect with rice or as a side to meat dishes. A nutritious vegetable stew that's a staple in Tanzanian households.", 
    category: "vegetables-stews", 
    image: "mchicha-spinach.jpg",
    tags: [{ type: "vegetarian", label: "Vegetarian" }, { type: "vegan", label: "Vegan" }, { type: "gluten-free", label: "Gluten-Free" }]
  },
  { 
    id: 16, 
    name: "Biriganya/Eggplant", 
    description: "Tender eggplant cooked in a spiced tomato and onion sauce until meltingly soft. Medium spice with smoky, rich flavors. Best enjoyed with rice or chapati. A satisfying vegetarian option that showcases how simple ingredients create complex flavors.", 
    category: "vegetables-stews", 
    image: "biriganya-eggplant.jpg",
    tags: [{ type: "vegetarian", label: "Vegetarian" }, { type: "vegan", label: "Vegan" }, { type: "gluten-free", label: "Gluten-Free" }]
  },
  { 
    id: 17, 
    name: "Vegetarian Biriyani sauce", 
    description: "Aromatic biriyani gravy with vegetables and fragrant spices creating layers of flavor. Medium to hot spice with notes of cardamom, cinnamon, and saffron. Perfect over basmati rice. A vegetarian version of the beloved biriyani that doesn't compromise on flavor.", 
    category: "vegetables-stews", 
    image: "vegetarian-biriyani-sauce.jpg",
    tags: [{ type: "vegetarian", label: "Vegetarian" }, { type: "vegan", label: "Vegan" }, { type: "gluten-free", label: "Gluten-Free" }]
  },
  { 
    id: 18, 
    name: "Maharage/Brown beans", 
    description: "Hearty brown beans simmered in coconut milk with spices until creamy and tender. Mild spice with rich, comforting flavors. Traditionally served with rice or ugali. A protein-rich vegetarian dish that's both filling and nutritious.", 
    category: "vegetables-stews", 
    image: "maharage-brown-beans.jpg",
    tags: [{ type: "vegetarian", label: "Vegetarian" }, { type: "vegan", label: "Vegan" }, { type: "gluten-free", label: "Gluten-Free" }]
  },
  { 
    id: 19, 
    name: "Bamia", 
    description: "Okra stewed in a tomato-based sauce with onions and spices until tender. Medium spice with a unique texture from the okra. Best paired with rice or chapati. A beloved vegetable dish that's popular throughout East Africa.", 
    category: "vegetables-stews", 
    image: "bamia.jpg",
    tags: [{ type: "vegetarian", label: "Vegetarian" }, { type: "vegan", label: "Vegan" }, { type: "gluten-free", label: "Gluten-Free" }]
  },
  { 
    id: 20, 
    name: "Urojo Vegetarian", 
    description: "Meat-free version of the famous Zanzibari tangy soup with fritters and potatoes. Medium to hot spice with bright, acidic flavors from tamarind. Topped with crispy vegetable fritters. A vegetarian street food favorite that captures the essence of Zanzibar's vibrant food scene.", 
    category: "vegetables-stews", 
    image: "urojo-vegetarian.jpg",
    tags: [{ type: "vegetarian", label: "Vegetarian" }, { type: "vegan", label: "Vegan" }]
  },

  // Sides
  { 
    id: 21, 
    name: "Pilau Veg", 
    description: "Fragrant spiced rice cooked with vegetables and aromatic spices creating a colorful, flavorful side. Medium spice with notes of cardamom, cumin, and cinnamon. Perfect accompaniment to any curry or stew. A vegetarian version of the beloved pilau that's equally satisfying.", 
    category: "sides", 
    image: "pilau-veg.jpg",
    tags: [{ type: "vegetarian", label: "Vegetarian" }, { type: "vegan", label: "Vegan" }]
  },
  { 
    id: 22, 
    name: "Pilau Beef", 
    description: "Traditional spiced rice cooked with tender beef pieces until the flavors meld together. Medium spice with rich, savory notes from the meat and spices. A complete meal in itself or perfect with a side of kachumbari. The national dish of Tanzania, served at celebrations and special occasions.", 
    category: "sides", 
    image: "pilau-beef.jpg",
  },
  { 
    id: 23, 
    name: "Pilau Chicken", 
    description: "Aromatic rice dish with chicken, cumin, and cardamom creating layers of flavor. Medium spice with tender, juicy chicken pieces throughout. Best enjoyed with a side of kachumbari for freshness. A beloved variation of pilau that's lighter yet equally flavorful.", 
    category: "sides", 
    image: "pilau-chicken.jpg",
  },
  { 
    id: 24, 
    name: "Wali wa nazi/Coconut rice", 
    description: "Fluffy rice cooked in creamy coconut milk for a rich, slightly sweet flavor. Mild spice with a subtle coconut aroma. Perfect paired with fish or vegetable curries. A coastal specialty that brings a touch of tropical flavor to any meal.", 
    category: "sides", 
    image: "wali-wa-nazi-coconut-rice.jpg",
    tags: [{ type: "vegetarian", label: "Vegetarian" }, { type: "vegan", label: "Vegan" }, { type: "gluten-free", label: "Gluten-Free" }]
  },
  { 
    id: 25, 
    name: "Chapati", 
    description: "Flaky, layered flatbread — a staple at every Tanzanian meal. Mild flavor with a buttery, soft texture. Perfect for scooping up curries and stews. An essential side that's been part of East African cuisine for generations, influenced by Indian culinary traditions.", 
    category: "sides", 
    image: "chapati.jpg",
    tags: [{ type: "vegetarian", label: "Vegetarian" }]
  },
  { 
    id: 26, 
    name: "Ugali", 
    description: "Traditional cornmeal porridge with a firm, satisfying texture that's perfect for scooping. Mild, neutral flavor that complements spicy dishes. Best enjoyed with stews and vegetables. The cornerstone of Tanzanian cuisine, eaten daily across the country.", 
    category: "sides", 
    image: "ugali.jpg",
    tags: [{ type: "vegetarian", label: "Vegetarian" }, { type: "vegan", label: "Vegan" }, { type: "gluten-free", label: "Gluten-Free" }]
  },
  { 
    id: 27, 
    name: "Mihogo", 
    description: "Boiled or fried cassava, a starchy East African staple with a mild, slightly sweet flavor. Simple preparation that lets the natural taste shine. Perfect as a side or snack. A traditional root vegetable that's been a dietary staple in Tanzania for centuries.", 
    category: "sides", 
    image: "mihogo.jpg",
    tags: [{ type: "vegetarian", label: "Vegetarian" }, { type: "vegan", label: "Vegan" }, { type: "gluten-free", label: "Gluten-Free" }]
  },
  { 
    id: 28, 
    name: "Plantain", 
    description: "Sweet fried plantains, caramelized to perfection with a golden, crispy exterior. Naturally sweet with a soft, creamy interior. Perfect as a side or dessert. A beloved ingredient in Tanzanian cooking that adds sweetness and texture to meals.", 
    category: "sides", 
    image: "plantain.jpg",
    tags: [{ type: "vegetarian", label: "Vegetarian" }, { type: "vegan", label: "Vegan" }, { type: "gluten-free", label: "Gluten-Free" }]
  },
  { 
    id: 29, 
    name: "Rice", 
    description: "Perfectly steamed white rice with a fluffy, light texture. Neutral flavor that complements any dish. The perfect base for curries, stews, and sauces. A simple yet essential side that's part of every Tanzanian meal.", 
    category: "sides", 
    image: "rice.jpg",
    tags: [{ type: "vegetarian", label: "Vegetarian" }, { type: "vegan", label: "Vegan" }, { type: "gluten-free", label: "Gluten-Free" }]
  },
  { 
    id: 30, 
    name: "Biriyani", 
    description: "Layered aromatic rice with saffron and fried onions creating a fragrant, colorful dish. Medium to hot spice with complex flavors from whole spices. Often served with raita or salad. A celebratory dish that showcases the rich culinary heritage of Tanzania's coastal regions.", 
    category: "sides", 
    image: "biriyani.jpg",
    tags: [{ type: "vegetarian", label: "Vegetarian" }]
  },
  { 
    id: 31, 
    name: "Vegetarian rice with peas", 
    description: "Light rice dish with green peas and mild spices for a fresh, simple side. Mild flavor with pops of sweetness from the peas. Perfect with any curry or stew. A light, nutritious option that adds color and texture to the meal.", 
    category: "sides", 
    image: "vegetarian-rice-peas.jpg",
    tags: [{ type: "vegetarian", label: "Vegetarian" }, { type: "vegan", label: "Vegan" }, { type: "gluten-free", label: "Gluten-Free" }]
  },
  { 
    id: 32, 
    name: "Kachumbari", 
    description: "Fresh tomato and onion salad with cilantro and lime creating a bright, tangy condiment. Mild spice with fresh, zesty flavors. Perfect served alongside grilled meats or curries. A refreshing side that cuts through rich flavors and adds a burst of freshness.", 
    category: "sides", 
    image: "kachumbari.jpg",
    tags: [{ type: "vegetarian", label: "Vegetarian" }, { type: "vegan", label: "Vegan" }, { type: "gluten-free", label: "Gluten-Free" }]
  },
  { 
    id: 33, 
    name: "Salad", 
    description: "Fresh mixed garden salad with crisp vegetables and a light dressing. Mild, fresh flavors that cleanse the palate. Perfect as a starter or side to any meal. A simple, healthy addition that brings freshness and nutrition to the table.", 
    category: "sides", 
    image: "salad.jpg",
    tags: [{ type: "vegetarian", label: "Vegetarian" }, { type: "vegan", label: "Vegan" }, { type: "gluten-free", label: "Gluten-Free" }]
  },

  // Bites & Snacks
  { 
    id: 34, 
    name: "Samosa", 
    description: "Crispy triangular pastries filled with spiced meat or vegetables. Medium spice with a satisfying crunch. Perfect as an appetizer or snack, served with chutney. A beloved snack that reflects the Indian influence in Tanzanian street food culture.", 
    category: "bites-snacks", 
    image: "samosa.jpg",
  },
  { 
    id: 35, 
    name: "Bahjia with chutney", 
    description: "Spiced vegetable fritters served with tangy tamarind chutney. Medium spice with crispy exterior and soft interior. The chutney adds a sweet and sour contrast. A popular street food snack that's both satisfying and flavorful.", 
    category: "bites-snacks", 
    image: "bahjia-chutney.jpg",
    tags: [{ type: "vegetarian", label: "Vegetarian" }, { type: "vegan", label: "Vegan" }]
  },
  { 
    id: 36, 
    name: "Kachori", 
    description: "Deep-fried pastry balls filled with spiced lentils. Medium spice with a crispy shell and flavorful filling. Best enjoyed hot with chutney or yogurt. A popular snack that's perfect for sharing at gatherings.", 
    category: "bites-snacks", 
    image: "kachori.jpg",
    tags: [{ type: "vegetarian", label: "Vegetarian" }, { type: "vegan", label: "Vegan" }]
  },
  { 
    id: 37, 
    name: "Katlesi/Cutlets", 
    description: "Crispy potato and meat cutlets, pan-fried until golden. Mild to medium spice with a satisfying texture. Perfect as an appetizer or side dish. A comforting snack that combines familiar ingredients with Tanzanian spices.", 
    category: "bites-snacks", 
    image: "katlesi-cutlets.jpg",
  },
  { 
    id: 38, 
    name: "Eggchop", 
    description: "Boiled egg wrapped in spiced meat, coated and fried until golden. Medium spice with layers of flavor and texture. A unique snack that's both protein-rich and satisfying. A creative street food that showcases Tanzanian culinary innovation.", 
    category: "bites-snacks", 
    image: "eggchop.jpg",
  },
  { 
    id: 39, 
    name: "Kebab", 
    description: "Spiced minced meat shaped and grilled to perfection. Medium to hot spice with smoky, charred flavors. Best enjoyed with fresh bread or as part of a platter. A popular grilled snack that's perfect for any time of day.", 
    category: "bites-snacks", 
    image: "kebab.jpg",
  },

  // Dessert
  { 
    id: 40, 
    name: "Mandazi", 
    description: "East African doughnuts with a hint of cardamom and coconut. Mildly sweet with a soft, pillowy texture. Perfect with tea or coffee. A beloved breakfast treat and snack that's enjoyed throughout Tanzania.", 
    category: "dessert", 
    image: "mandazi.jpg",
    tags: [{ type: "vegetarian", label: "Vegetarian" }]
  },
  { 
    id: 41, 
    name: "Visheti", 
    description: "Sweet fried pastry twists, crispy and lightly sweetened. Delicate sweetness with a satisfying crunch. Perfect as a light dessert or snack. A traditional sweet treat that's simple yet delightful.", 
    category: "dessert", 
    image: "visheti.jpg",
    tags: [{ type: "vegetarian", label: "Vegetarian" }]
  },
  { 
    id: 42, 
    name: "Kalimati", 
    description: "Traditional sweet treats made with coconut and sugar. Rich, sweet flavors with a chewy texture. Perfect for satisfying a sweet tooth. A classic Tanzanian confection that's been enjoyed for generations.", 
    category: "dessert", 
    image: "kalimati.jpg",
    tags: [{ type: "vegetarian", label: "Vegetarian" }, { type: "vegan", label: "Vegan" }, { type: "gluten-free", label: "Gluten-Free" }]
  },
  { 
    id: 43, 
    name: "Vitumbua", 
    description: "Sweet rice pancakes with coconut milk and cardamom. Mildly sweet with a soft, slightly dense texture. Best enjoyed warm, often with tea. A traditional breakfast and snack that's especially popular during Ramadan.", 
    category: "dessert", 
    image: "vitumbua.jpg",
    tags: [{ type: "vegetarian", label: "Vegetarian" }, { type: "vegan", label: "Vegan" }, { type: "gluten-free", label: "Gluten-Free" }]
  },
  { 
    id: 44, 
    name: "Coconut cake", 
    description: "Moist, fluffy cake infused with fresh coconut. Sweet and rich with a tropical flavor. Perfect for celebrations and special occasions. A beloved dessert that brings a taste of the tropics to any event.", 
    category: "dessert", 
    image: "coconut-cake.jpg",
    tags: [{ type: "vegetarian", label: "Vegetarian" }]
  },

  // Drinks
  { 
    id: 45, 
    name: "Fresh Fruit", 
    description: "Seasonal fresh fruit platter featuring tropical favorites. Naturally sweet and refreshing. Perfect as a light dessert or healthy snack. A colorful, nutritious option that showcases the best of Tanzania's fruit harvest.", 
    category: "drinks", 
    image: "fresh-fruit.jpg",
    tags: [{ type: "vegetarian", label: "Vegetarian" }, { type: "vegan", label: "Vegan" }, { type: "gluten-free", label: "Gluten-Free" }]
  },
  { 
    id: 46, 
    name: "Fresh juice", 
    description: "Freshly squeezed tropical fruit juice, vibrant and refreshing. Naturally sweet with no added sugar. Perfect for quenching thirst and adding vitamins. A healthy, delicious beverage that celebrates Tanzania's abundant fruit varieties.", 
    category: "drinks", 
    image: "fresh-juice.jpg",
    tags: [{ type: "vegetarian", label: "Vegetarian" }, { type: "vegan", label: "Vegan" }, { type: "gluten-free", label: "Gluten-Free" }]
  },
  { 
    id: 47, 
    name: "Chai ya Maziwa/Milk Tea", 
    description: "Creamy spiced tea brewed with milk and aromatic spices. Mildly spiced with warming notes of cardamom, cinnamon, and ginger. Perfect for any time of day. The national drink of Tanzania, enjoyed in homes and cafes across the country.", 
    category: "drinks", 
    image: "chai-ya-maziwa.jpg",
    tags: [{ type: "vegetarian", label: "Vegetarian" }]
  },
  { 
    id: 48, 
    name: "Chai ya Tangawizi/Ginger tea", 
    description: "Warming ginger tea with a spicy kick that soothes and invigorates. Medium spice with a bold ginger flavor. Perfect for cold days or as a digestive aid. A traditional remedy that's also a delicious, comforting beverage.", 
    category: "drinks", 
    image: "chai-ya-tangawizi.jpg",
    tags: [{ type: "vegetarian", label: "Vegetarian" }, { type: "vegan", label: "Vegan" }, { type: "gluten-free", label: "Gluten-Free" }]
  },
];

// Helper to find dish by name (fuzzy match)
export function findDishByName(name: string) {
  return dishes.find(dish => 
    dish.name.toLowerCase() === name.toLowerCase() ||
    dish.name.toLowerCase().includes(name.toLowerCase()) ||
    name.toLowerCase().includes(dish.name.toLowerCase().split('/')[0])
  );
}

