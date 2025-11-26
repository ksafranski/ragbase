import csv
import random

# Define diverse food categories with unique characteristics
foods_data = [
    # Proteins - Meat
    ("Grilled Chicken Breast", "Protein", "Lean white poultry meat, high in protein and low in fat, perfect for fitness enthusiasts", "American", "Savory", "Grilled", "A staple protein source that's versatile and pairs well with any cuisine"),
    ("Ribeye Steak", "Protein", "Well-marbled beef cut with rich flavor and tender texture from intramuscular fat", "American", "Savory", "Grilled", "Premium beef cut known for its buttery texture and intense beefy flavor"),
    ("Pork Tenderloin", "Protein", "The most tender cut of pork, lean and mild-flavored, often served with fruit sauces", "American", "Savory", "Roasted", "Delicate pork cut that benefits from quick cooking and bold seasonings"),
    ("Lamb Chops", "Protein", "Small, tender cuts from the rib with a distinctive gamey flavor and pink center", "Mediterranean", "Savory", "Grilled", "Elegant protein with herbaceous notes, often paired with mint or rosemary"),
    ("Duck Breast", "Protein", "Rich, dark poultry meat with crispy skin and deep flavor, higher in fat than chicken", "French", "Savory", "Pan-seared", "Luxurious poultry with a steak-like texture and complex flavor profile"),
    
    # Proteins - Seafood
    ("Atlantic Salmon Fillet", "Protein", "Fatty cold-water fish rich in omega-3, with pink flesh and buttery texture", "Scandinavian", "Savory", "Baked", "Popular fish known for heart-healthy fats and versatile cooking methods"),
    ("Jumbo Shrimp", "Protein", "Large sweet crustaceans that turn pink when cooked, mild and slightly briny", "Asian", "Savory", "Sautéed", "Quick-cooking shellfish that absorbs marinades beautifully"),
    ("Yellowfin Tuna Steak", "Protein", "Meaty fish with firm texture and mild flavor, best served rare to medium-rare", "Japanese", "Savory", "Seared", "Premium fish that resembles beef in texture and cooking method"),
    ("Sea Scallops", "Protein", "Sweet, delicate mollusks with a firm texture that caramelizes beautifully", "French", "Sweet", "Pan-seared", "Elegant seafood that develops a golden crust when seared properly"),
    ("Mahi-Mahi", "Protein", "Lean, firm white fish with a sweet, mild flavor and flaky texture", "Hawaiian", "Savory", "Grilled", "Tropical fish that holds up well to bold spices and grilling"),
    
    # Proteins - Plant-based
    ("Firm Tofu", "Protein", "Pressed soybean curd that absorbs flavors and provides complete plant protein", "Asian", "Neutral", "Stir-fried", "Versatile plant protein that takes on any seasoning you add"),
    ("Black Beans", "Protein", "Earthy legumes with creamy texture, high in fiber and folate", "Latin American", "Earthy", "Stewed", "Staple protein in Latin cuisine, rich and satisfying when seasoned properly"),
    ("Red Lentils", "Protein", "Quick-cooking legumes that break down into creamy texture, high in iron", "Indian", "Earthy", "Boiled", "Fast-cooking protein perfect for dal and curries, turns golden when cooked"),
    ("Chickpeas", "Protein", "Nutty legumes with firm texture, foundation of hummus and many Mediterranean dishes", "Mediterranean", "Nutty", "Roasted", "Versatile legume that can be pureed or roasted for crunchy snacks"),
    ("Tempeh", "Protein", "Fermented soybean cake with nutty flavor and firm, chewy texture", "Indonesian", "Nutty", "Pan-fried", "Probiotic-rich protein with more texture and flavor than tofu"),
    
    # Vegetables - Leafy Greens
    ("Baby Spinach", "Vegetable", "Tender dark green leaves packed with iron and vitamins, mild and slightly sweet", "Mediterranean", "Mild", "Raw", "Versatile green that works raw in salads or wilts quickly when cooked"),
    ("Tuscan Kale", "Vegetable", "Dark blue-green leaves with bumpy texture, hearty and slightly bitter flavor", "Italian", "Bitter", "Sautéed", "Robust green that stands up to long cooking and bold flavors"),
    ("Arugula", "Vegetable", "Peppery salad green with delicate leaves and a distinctive spicy bite", "Italian", "Peppery", "Raw", "Sophisticated salad green that adds a peppery kick to any dish"),
    ("Swiss Chard", "Vegetable", "Colorful stems and dark green leaves with earthy, slightly salty flavor", "Mediterranean", "Earthy", "Sautéed", "Beautiful vegetable with edible stems and nutritious leaves"),
    ("Romaine Lettuce", "Vegetable", "Crisp lettuce with sturdy leaves and mild flavor, classic Caesar salad base", "Mediterranean", "Mild", "Raw", "Crunchy lettuce that stays crisp and refreshing in salads"),
    
    # Vegetables - Cruciferous
    ("Broccoli Florets", "Vegetable", "Green tree-like vegetables with mild flavor and crisp-tender texture when cooked properly", "Italian", "Mild", "Steamed", "Nutritious vegetable that's delicious when not overcooked"),
    ("Cauliflower Head", "Vegetable", "Cream-colored vegetable that can be riced, mashed, or roasted, mild and nutty", "Mediterranean", "Nutty", "Roasted", "Versatile vegetable that's trending as a low-carb substitute"),
    ("Brussels Sprouts", "Vegetable", "Mini cabbage-like vegetables that caramelize beautifully, slightly bitter when raw", "Belgian", "Bitter", "Roasted", "Once-maligned vegetable that becomes sweet and crispy when roasted"),
    ("Purple Cabbage", "Vegetable", "Vibrant purple vegetable with crunchy texture and peppery-sweet flavor", "European", "Peppery", "Raw", "Colorful addition to slaws and salads with antioxidant properties"),
    
    # Vegetables - Root & Tubers
    ("Sweet Potato", "Vegetable", "Orange-fleshed tuber that's naturally sweet and loaded with beta-carotene", "American", "Sweet", "Roasted", "Naturally sweet vegetable that caramelizes beautifully when roasted"),
    ("Purple Potatoes", "Vegetable", "Colorful potatoes with nutty flavor and creamy texture, high in antioxidants", "Peruvian", "Nutty", "Roasted", "Eye-catching potatoes that retain their color when cooked"),
    ("Beets", "Vegetable", "Deep red root vegetable with earthy-sweet flavor, stains everything beautifully", "European", "Sweet", "Roasted", "Earthy vegetable that becomes candy-like when roasted"),
    ("Parsnips", "Vegetable", "Cream-colored root vegetable similar to carrots but sweeter and nuttier", "European", "Sweet", "Roasted", "Underrated root vegetable with a unique spiced sweetness"),
    ("Carrots", "Vegetable", "Orange root vegetable naturally sweet and crunchy, high in vitamin A", "Global", "Sweet", "Raw", "Classic vegetable that's perfect raw or cooked in countless ways"),
    
    # Vegetables - Nightshades
    ("Heirloom Tomatoes", "Vegetable", "Colorful, juicy tomatoes with complex sweet-tart flavor and thin skin", "Italian", "Sweet", "Raw", "Premium tomatoes in rainbow colors with outstanding flavor"),
    ("Bell Peppers", "Vegetable", "Sweet, crisp peppers in red, yellow, orange, and green with no heat", "Mediterranean", "Sweet", "Roasted", "Colorful peppers that add crunch and sweetness to any dish"),
    ("Japanese Eggplant", "Vegetable", "Long, slender eggplant with tender skin and sweet, creamy flesh", "Asian", "Mild", "Grilled", "Delicate eggplant that cooks quickly and has fewer seeds"),
    ("Jalapeño Peppers", "Vegetable", "Medium-hot green chilies with grassy flavor and manageable heat", "Mexican", "Spicy", "Raw", "Versatile chili that adds heat without overwhelming other flavors"),
    
    # Vegetables - Squash
    ("Butternut Squash", "Vegetable", "Sweet orange squash with smooth texture and nutty undertones when roasted", "American", "Sweet", "Roasted", "Fall favorite that becomes velvety and sweet when cooked"),
    ("Zucchini", "Vegetable", "Mild summer squash with high water content that cooks quickly", "Italian", "Mild", "Grilled", "Versatile summer vegetable that can be spiralized into noodles"),
    ("Acorn Squash", "Vegetable", "Small winter squash with ribbed skin, sweet orange flesh and nutty flavor", "American", "Sweet", "Baked", "Individual-sized squash perfect for stuffing and baking"),
    ("Spaghetti Squash", "Vegetable", "Unique squash whose cooked flesh separates into pasta-like strands", "American", "Mild", "Roasted", "Low-carb pasta alternative with a unique stringy texture"),
    
    # Fruits - Citrus
    ("Meyer Lemon", "Fruit", "Sweeter, less acidic lemon with thin skin and floral aroma", "Chinese", "Sweet", "Raw", "Gourmet citrus that's both sweet and tart with an elegant flavor"),
    ("Blood Orange", "Fruit", "Deep red citrus with berry-like undertones and beautiful crimson flesh", "Italian", "Sweet", "Raw", "Dramatic citrus with raspberry notes and stunning color"),
    ("Key Lime", "Fruit", "Small, tart limes with distinctive aromatic flavor, classic for pie", "Caribbean", "Tart", "Raw", "Intensely flavored tiny limes that make the famous Florida pie"),
    ("Ruby Red Grapefruit", "Fruit", "Pink-fleshed citrus that balances sweet and bitter flavors", "American", "Bitter", "Raw", "Breakfast citrus that's less bitter than traditional grapefruit"),
    
    # Fruits - Berries
    ("Blueberries", "Fruit", "Small, deep blue berries with sweet-tart flavor and high antioxidants", "American", "Sweet", "Raw", "Superfood berries that are perfect fresh or in baked goods"),
    ("Strawberries", "Fruit", "Bright red berries with sweet flavor and tiny seeds on the outside", "American", "Sweet", "Raw", "Classic summer berry that's aromatic and juicy when ripe"),
    ("Blackberries", "Fruit", "Dark purple berries with complex sweet-tart flavor and tiny edible seeds", "American", "Tart", "Raw", "Wild-growing berries with an intense, complex flavor"),
    ("Raspberries", "Fruit", "Delicate red berries with hollow centers and sweet-tart flavor", "European", "Tart", "Raw", "Fragile berries with an intense fruity flavor and velvety texture"),
    
    # Fruits - Stone Fruits
    ("White Peaches", "Fruit", "Pale-fleshed peaches with lower acidity and honey-sweet flavor", "Asian", "Sweet", "Raw", "Premium peaches with a floral sweetness and juicy texture"),
    ("Black Plums", "Fruit", "Dark purple stone fruits with sweet flesh and tart skin", "European", "Sweet", "Raw", "Late-summer fruits that are perfect for eating fresh or baking"),
    ("Apricots", "Fruit", "Orange stone fruits with velvety skin and sweet-tart flavor", "Mediterranean", "Sweet", "Raw", "Delicate fruits that dry beautifully and have a unique flavor"),
    ("Cherries", "Fruit", "Deep red stone fruits with sweet flavor and firm texture", "American", "Sweet", "Raw", "Summer treats that are best eaten fresh off the stem"),
    
    # Fruits - Tropical
    ("Mango", "Fruit", "Tropical stone fruit with fibrous orange flesh and sweet, peachy flavor", "Indian", "Sweet", "Raw", "Fragrant tropical fruit that's messy but worth the effort"),
    ("Pineapple", "Fruit", "Spiky tropical fruit with juicy yellow flesh that's both sweet and acidic", "Hawaiian", "Sweet", "Raw", "Refreshing fruit that contains enzymes to tenderize meat"),
    ("Papaya", "Fruit", "Large tropical fruit with orange flesh, black seeds, and melon-like sweetness", "Mexican", "Sweet", "Raw", "Tropical fruit rich in enzymes that aid digestion"),
    ("Dragon Fruit", "Fruit", "Vibrant pink fruit with white flesh speckled with black seeds, mildly sweet", "Vietnamese", "Mild", "Raw", "Instagram-worthy fruit with a subtle, refreshing flavor"),
    ("Passion Fruit", "Fruit", "Purple wrinkled fruit with aromatic seeds and intensely tart-sweet pulp", "Brazilian", "Tart", "Raw", "Concentrated tropical flavor in a small package"),
    
    # Fruits - Tree Fruits
    ("Honeycrisp Apple", "Fruit", "Large, crisp apple with explosively juicy texture and sweet-tart balance", "American", "Sweet", "Raw", "Modern apple variety prized for its exceptional crunch"),
    ("Bartlett Pear", "Fruit", "Bell-shaped pear with buttery texture and sweet, floral aroma when ripe", "European", "Sweet", "Raw", "Classic pear that's perfect for eating fresh or poaching"),
    ("Fuji Apple", "Fruit", "Super-sweet Japanese apple with dense, crisp texture and low acidity", "Japanese", "Sweet", "Raw", "Dessert apple that stays crisp and sweet for months in storage"),
    ("Asian Pear", "Fruit", "Round pear with apple-like crunch and mild, sweet flavor", "Asian", "Sweet", "Raw", "Unique fruit that combines pear flavor with apple texture"),
    
    # Grains - Whole
    ("Quinoa", "Grain", "Complete protein grain from South America with nutty flavor and fluffy texture", "Peruvian", "Nutty", "Boiled", "Ancient grain that cooks quickly and provides all essential amino acids"),
    ("Farro", "Grain", "Chewy ancient wheat grain with nutty flavor, popular in Italian cooking", "Italian", "Nutty", "Boiled", "Hearty grain with a satisfying chew and rich, complex flavor"),
    ("Wild Rice", "Grain", "Not actually rice but aquatic grass seeds with earthy flavor and chewy texture", "American", "Earthy", "Boiled", "Nutritious grain with a distinctive texture and woodsy flavor"),
    ("Steel Cut Oats", "Grain", "Coarsely chopped oat groats with chewy texture and nutty flavor", "Scottish", "Nutty", "Simmered", "Hearty breakfast grain that's more nutritious than rolled oats"),
    ("Brown Rice", "Grain", "Whole grain rice with bran intact, chewy texture and nutty flavor", "Asian", "Nutty", "Steamed", "Nutritious alternative to white rice with more fiber and minerals"),
    
    # Grains - Refined
    ("Arborio Rice", "Grain", "Short-grain Italian rice that releases starch for creamy risotto texture", "Italian", "Neutral", "Stirred", "Specialty rice that creates the signature creaminess of risotto"),
    ("Basmati Rice", "Grain", "Long-grain aromatic rice with floral scent and fluffy, separate grains", "Indian", "Fragrant", "Steamed", "Premium rice with a distinctive aroma and light, fluffy texture"),
    ("Jasmine Rice", "Grain", "Fragrant Thai rice with subtle floral aroma and slightly sticky texture", "Thai", "Fragrant", "Steamed", "Aromatic rice that pairs perfectly with Asian cuisines"),
    
    # Dairy
    ("Greek Yogurt", "Dairy", "Thick, strained yogurt with tangy flavor and double the protein of regular yogurt", "Greek", "Tangy", "Fermented", "Protein-rich dairy that works in both sweet and savory dishes"),
    ("Aged Cheddar", "Dairy", "Sharp, crumbly cheese aged for months with intense, complex flavor", "English", "Sharp", "Aged", "Classic cheese that develops crystals and deep flavor with age"),
    ("Fresh Mozzarella", "Dairy", "Soft, milky cheese with mild flavor and bouncy texture", "Italian", "Mild", "Fresh", "Delicate cheese that's best eaten fresh with tomatoes and basil"),
    ("Parmigiano-Reggiano", "Dairy", "Hard Italian cheese aged for years with nutty, umami-rich flavor and granular texture", "Italian", "Umami", "Aged", "King of cheeses with complex flavor that improves with age"),
    ("Goat Cheese", "Dairy", "Tangy, creamy cheese from goat's milk with distinctive barnyard notes", "French", "Tangy", "Fresh", "Sophisticated cheese with a unique tang and creamy texture"),
    ("Heavy Cream", "Dairy", "High-fat cream that whips beautifully and adds richness to sauces", "European", "Rich", "Raw", "Luxurious dairy that transforms both sweet and savory dishes"),
    
    # Nuts & Seeds
    ("Raw Almonds", "Nuts", "Crunchy tree nuts with mild, buttery flavor and heart-healthy fats", "Mediterranean", "Buttery", "Raw", "Versatile nut perfect for snacking or making almond butter"),
    ("Walnuts", "Nuts", "Brain-shaped nuts with slight bitterness and high omega-3 content", "American", "Bitter", "Raw", "Nutrient-dense nuts that add earthy flavor to salads and baked goods"),
    ("Cashews", "Nuts", "Creamy, kidney-shaped nuts with subtle sweetness, actually seeds", "Asian", "Sweet", "Roasted", "Buttery nuts that blend into creamy sauces and cheese alternatives"),
    ("Pistachios", "Nuts", "Green nuts with distinctive flavor, often eaten as a snack in shells", "Middle Eastern", "Sweet", "Roasted", "Unique nuts that add color and crunch to both sweet and savory dishes"),
    ("Chia Seeds", "Seeds", "Tiny seeds that form gel when wet, packed with omega-3 and fiber", "Mexican", "Neutral", "Raw", "Superfood seeds that create pudding texture when soaked"),
    ("Pumpkin Seeds", "Seeds", "Green seeds with nutty flavor, crunchy shell optional", "Mexican", "Nutty", "Roasted", "Nutritious seeds that make a great snack when roasted with spices"),
    
    # Herbs & Spices
    ("Fresh Basil", "Herb", "Aromatic green herb with sweet, peppery flavor and licorice notes", "Italian", "Sweet", "Fresh", "Essential herb for Italian cooking with a distinctive aroma"),
    ("Cilantro", "Herb", "Bright green herb with citrusy, soapy flavor that people love or hate", "Mexican", "Citrus", "Fresh", "Controversial herb that's essential in many cuisines"),
    ("Rosemary", "Herb", "Woody herb with pine-like aroma and strong, earthy flavor", "Mediterranean", "Earthy", "Fresh", "Robust herb that stands up to long cooking and bold flavors"),
    ("Thyme", "Herb", "Tiny-leaved herb with subtle earthy and minty notes", "Mediterranean", "Earthy", "Fresh", "Delicate herb that adds depth without overwhelming dishes"),
    ("Turmeric Root", "Spice", "Bright orange root with earthy, slightly bitter flavor and anti-inflammatory properties", "Indian", "Earthy", "Fresh", "Golden spice that stains everything but adds amazing color and health benefits"),
    ("Cumin Seeds", "Spice", "Warm, earthy spice with slightly bitter undertones used in many cuisines", "Middle Eastern", "Earthy", "Toasted", "Essential spice for Mexican, Indian, and Middle Eastern cooking"),
    ("Smoked Paprika", "Spice", "Spanish pepper powder with sweet, smoky flavor and deep red color", "Spanish", "Smoky", "Dried", "Spice that adds depth and a hint of smokiness without heat"),
]

# Write to CSV
with open('test_foods_unique.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    
    # Write header
    writer.writerow(['name', 'category', 'description', 'cuisine', 'taste', 'cooking_method', 'text'])
    
    # Write data
    for name, category, description, cuisine, taste, cooking_method, full_description in foods_data:
        # Create comprehensive text column
        text = f"{name}. Category: {category}. {full_description}. Cuisine: {cuisine}. Taste profile: {taste}. Cooking method: {cooking_method}."
        writer.writerow([name, category, description, cuisine, taste, cooking_method, text])

print(f"Created test_foods_unique.csv with {len(foods_data)} unique, realistic food entries")
