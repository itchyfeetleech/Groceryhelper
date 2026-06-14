import type { Category } from './categories'
import { normalizeName } from './normalization'

/**
 * Explicit "no aisle" override value stored in the categories map.
 * Distinguishes "user forced uncategorized" from "no manual assignment"
 * (which falls back to the automatic database match).
 */
export const NO_AISLE = 'none'

/**
 * Hand-curated ingredient -> aisle database. Names are matched on the
 * normalized (trimmed, lowercased) form; plurals are handled at lookup time.
 * Multi-word entries take precedence over their last word ("peanut butter"
 * beats "butter"), so use them to encode exceptions.
 */
const DB: Record<Category, string[]> = {
  Produce: [
    // fruit
    'apple', 'banana', 'orange', 'mandarin', 'clementine', 'satsuma', 'tangerine', 'lemon', 'lime',
    'grapefruit', 'pear', 'peach', 'nectarine', 'plum', 'apricot', 'cherry', 'grape', 'strawberry',
    'blueberry', 'raspberry', 'blackberry', 'cranberry', 'currant', 'gooseberry', 'rhubarb', 'melon',
    'watermelon', 'cantaloupe', 'honeydew', 'pineapple', 'mango', 'papaya', 'kiwi', 'passionfruit',
    'pomegranate', 'fig', 'date', 'lychee', 'avocado', 'coconut',
    // vegetables
    'tomato', 'cherry tomato', 'plum tomato', 'vine tomato', 'potato', 'new potato', 'baby potato',
    'sweet potato', 'yam', 'onion', 'red onion', 'spring onion', 'scallion', 'shallot', 'leek',
    'garlic', 'ginger', 'carrot', 'parsnip', 'beetroot', 'beet', 'radish', 'turnip', 'swede',
    'celery', 'celeriac', 'cucumber', 'courgette', 'zucchini', 'aubergine', 'eggplant', 'pepper',
    'bell pepper', 'red pepper', 'green pepper', 'yellow pepper', 'capsicum', 'chilli', 'chili',
    'jalapeno', 'broccoli', 'broccolini', 'cauliflower', 'cabbage', 'red cabbage', 'savoy cabbage',
    'brussels sprout', 'kale', 'spinach', 'lettuce', 'romaine', 'iceberg lettuce', 'rocket',
    'arugula', 'salad', 'salad leaves', 'mixed leaves', 'watercress', 'chard', 'bok choy',
    'pak choi', 'asparagus', 'green bean', 'runner bean', 'broad bean', 'pea', 'sugar snap pea',
    'mangetout', 'sweetcorn', 'corn', 'corn on the cob', 'mushroom', 'portobello', 'shiitake',
    'chestnut mushroom', 'pumpkin', 'butternut squash', 'fennel', 'artichoke', 'okra',
    'bean sprout', 'cress', 'kohlrabi', 'plantain',
    // fresh herbs
    'basil', 'parsley', 'coriander', 'cilantro', 'mint', 'rosemary', 'thyme', 'sage', 'dill',
    'chives', 'tarragon', 'lemongrass', 'fresh herbs',
  ],
  Bakery: [
    'bread', 'loaf', 'sourdough', 'baguette', 'white bread', 'brown bread', 'wholemeal bread',
    'rye bread', 'seeded bread', 'garlic bread', 'roll', 'bread roll', 'bun', 'burger bun',
    'hot dog bun', 'brioche', 'bagel', 'croissant', 'pain au chocolat', 'danish', 'muffin',
    'english muffin', 'crumpet', 'pitta', 'pita', 'naan', 'tortilla', 'wrap', 'flatbread',
    'ciabatta', 'focaccia', 'panettone', 'cake', 'sponge cake', 'birthday cake', 'cupcake',
    'brownie', 'doughnut', 'donut', 'scone', 'pastry', 'tart', 'pie', 'banana bread',
    'fruit loaf', 'teacake', 'waffles',
  ],
  'Meat & Fish': [
    // meat & poultry
    'chicken', 'chicken breast', 'chicken thigh', 'chicken wing', 'chicken drumstick',
    'whole chicken', 'turkey', 'duck', 'beef', 'steak', 'sirloin', 'ribeye', 'fillet steak',
    'mince', 'minced beef', 'beef mince', 'ground beef', 'pork', 'pork chop', 'pork belly',
    'pork loin', 'ham', 'gammon', 'bacon', 'pancetta', 'lardons', 'sausage', 'chipolata',
    'chorizo', 'salami', 'pepperoni', 'prosciutto', 'parma ham', 'lamb', 'lamb chop',
    'lamb shank', 'leg of lamb', 'veal', 'venison', 'rabbit', 'meatball', 'burger',
    'burger patty', 'hot dog', 'frankfurter', 'kebab', 'liver', 'deli meat', 'cold cuts',
    // fish & seafood
    'fish', 'salmon', 'smoked salmon', 'tuna steak', 'cod', 'haddock', 'halibut', 'trout',
    'sea bass', 'bream', 'mackerel', 'sardine', 'herring', 'plaice', 'sole', 'monkfish',
    'swordfish', 'prawn', 'king prawn', 'shrimp', 'crab', 'lobster', 'mussel', 'clam',
    'oyster', 'scallop', 'squid', 'calamari', 'octopus', 'crayfish', 'seafood',
  ],
  'Dairy & Eggs': [
    'milk', 'whole milk', 'semi-skimmed milk', 'skimmed milk', 'buttermilk', 'oat milk',
    'almond milk', 'soy milk', 'soya milk', 'rice milk', 'lactose-free milk', 'cream',
    'double cream', 'single cream', 'whipping cream', 'sour cream', 'soured cream',
    'creme fraiche', 'clotted cream', 'yoghurt', 'yogurt', 'greek yoghurt', 'greek yogurt',
    'natural yoghurt', 'butter', 'margarine', 'spread', 'cheese', 'cheddar', 'mozzarella',
    'parmesan', 'parmigiano', 'pecorino', 'feta', 'halloumi', 'brie', 'camembert', 'gouda',
    'edam', 'gruyere', 'emmental', 'manchego', 'ricotta', 'mascarpone', 'cream cheese',
    'cottage cheese', 'goat cheese', 'goats cheese', 'blue cheese', 'stilton', 'gorgonzola',
    'burrata', 'paneer', 'egg', 'quark', 'custard', 'creme caramel', 'fromage frais',
  ],
  Frozen: [
    'ice cream', 'sorbet', 'gelato', 'ice lolly', 'popsicle', 'ice', 'ice cubes',
    'frozen peas', 'frozen vegetables', 'frozen veg', 'frozen fruit', 'frozen berries',
    'frozen spinach', 'frozen sweetcorn', 'fish finger', 'fish stick', 'frozen pizza',
    'frozen chips', 'oven chips', 'french fries', 'fries', 'hash brown', 'frozen prawns',
    'frozen pastry', 'puff pastry', 'filo pastry', 'shortcrust pastry', 'frozen dumplings',
    'gyoza', 'spring roll', 'frozen yorkshire puddings', 'yorkshire pudding', 'waffle fries',
    'frozen pie', 'frozen dessert',
  ],
  Pantry: [
    // pasta, rice & grains
    'pasta', 'spaghetti', 'penne', 'fusilli', 'macaroni', 'tagliatelle', 'linguine', 'orzo',
    'lasagne sheet', 'lasagna sheet', 'noodle', 'egg noodle', 'rice noodle', 'ramen', 'udon',
    'rice', 'basmati rice', 'jasmine rice', 'long grain rice', 'brown rice', 'risotto rice',
    'arborio rice', 'paella rice', 'couscous', 'quinoa', 'bulgur', 'polenta', 'pearl barley',
    'oat', 'porridge', 'porridge oats', 'oatmeal', 'granola', 'muesli', 'cereal', 'cornflakes',
    'weetabix', 'bran flakes',
    // baking
    'flour', 'plain flour', 'self-raising flour', 'bread flour', 'wholemeal flour', 'cornflour',
    'cornstarch', 'sugar', 'caster sugar', 'granulated sugar', 'brown sugar', 'icing sugar',
    'powdered sugar', 'demerara sugar', 'baking powder', 'baking soda', 'bicarbonate of soda',
    'yeast', 'vanilla', 'vanilla extract', 'vanilla essence', 'cocoa', 'cocoa powder',
    'chocolate chips', 'ground almonds', 'food colouring', 'gelatine', 'condensed milk',
    'evaporated milk', 'breadcrumbs', 'crouton',
    // sweet spreads & syrups
    'honey', 'maple syrup', 'golden syrup', 'treacle', 'agave', 'jam', 'marmalade',
    'peanut butter', 'almond butter', 'nutella', 'chocolate spread', 'lemon curd', 'marmite',
    'vegemite',
    // herbs, spices & seasoning
    'salt', 'sea salt', 'black pepper', 'peppercorns', 'paprika', 'smoked paprika', 'cumin',
    'ground coriander', 'turmeric', 'cinnamon', 'nutmeg', 'ground ginger', 'curry powder',
    'curry paste', 'garam masala', 'chilli powder', 'chilli flakes', 'cayenne', 'oregano',
    'dried oregano', 'dried basil', 'mixed herbs', 'bay leaves', 'five spice', 'za\'atar',
    'saffron', 'mustard seeds', 'fennel seeds', 'cardamom', 'cloves', 'star anise',
    'vanilla pods', 'stock', 'stock cube', 'stock pot', 'bouillon', 'broth', 'gravy',
    'gravy granules', 'seasoning',
    // oils & vinegars
    'oil', 'olive oil', 'extra virgin olive oil', 'vegetable oil', 'sunflower oil',
    'coconut oil', 'sesame oil', 'rapeseed oil', 'canola oil', 'groundnut oil', 'vinegar',
    'balsamic vinegar', 'white wine vinegar', 'red wine vinegar', 'apple cider vinegar',
    'rice vinegar', 'malt vinegar',
    // sauces & condiments
    'soy sauce', 'fish sauce', 'oyster sauce', 'hoisin sauce', 'sriracha', 'hot sauce',
    'tabasco', 'worcestershire sauce', 'ketchup', 'tomato ketchup', 'mayonnaise', 'mayo',
    'mustard', 'dijon mustard', 'wholegrain mustard', 'bbq sauce', 'barbecue sauce',
    'salad dressing', 'salad cream', 'pesto', 'tahini', 'miso', 'harissa', 'pasta sauce',
    'curry sauce', 'sweet chilli sauce', 'mint sauce', 'apple sauce', 'horseradish',
    'pickle', 'gherkin', 'olives', 'capers', 'sun-dried tomatoes', 'sauerkraut', 'kimchi',
    'anchovies', 'salsa',
    // tins, jars & packets
    'passata', 'tomato puree', 'tomato paste', 'canned tomatoes', 'chopped tomatoes',
    'tinned tomatoes', 'coconut milk', 'coconut cream', 'canned beans', 'baked beans',
    'black beans', 'kidney beans', 'cannellini beans', 'butter beans', 'pinto beans',
    'chickpeas', 'lentils', 'red lentils', 'split peas', 'canned tuna', 'tinned tuna',
    'canned sweetcorn', 'tinned sweetcorn', 'canned salmon', 'soup', 'tinned soup',
    'instant noodles', 'pot noodle', 'taco shells', 'taco kit', 'fajita kit', 'tortilla wraps',
    'dried fruit', 'raisins', 'sultanas', 'dried apricots', 'dried cranberries', 'prunes',
    'desiccated coconut', 'sushi rice', 'nori', 'rice paper', 'protein powder',
  ],
  Snacks: [
    'crisps', 'chips', 'tortilla chips', 'corn chips', 'popcorn', 'pretzels', 'crackers',
    'cream crackers', 'rice cakes', 'breadsticks', 'oatcakes', 'chocolate', 'chocolate bar',
    'dark chocolate', 'milk chocolate', 'white chocolate', 'candy', 'sweets', 'gummies',
    'jelly babies', 'wine gums', 'liquorice', 'toffee', 'fudge', 'mints', 'chewing gum',
    'biscuit', 'cookie', 'digestives', 'shortbread', 'oreos', 'wafer', 'jaffa cakes',
    'granola bar', 'cereal bar', 'protein bar', 'energy bar', 'flapjack', 'nut', 'almonds',
    'cashews', 'peanuts', 'pistachios', 'walnuts', 'pecans', 'hazelnuts', 'macadamia',
    'mixed nuts', 'trail mix', 'pumpkin seeds', 'sunflower seeds', 'dried mango',
    'fruit snacks', 'marshmallows', 'hummus', 'houmous', 'dip', 'guacamole', 'tzatziki',
    'taramasalata', 'snack',
  ],
  Drinks: [
    'water', 'sparkling water', 'still water', 'mineral water', 'soda water', 'soda', 'cola',
    'coke', 'pepsi', 'lemonade', 'fanta', 'sprite', 'irn bru', 'tonic', 'tonic water',
    'ginger beer', 'ginger ale', 'juice', 'orange juice', 'apple juice', 'cranberry juice',
    'pineapple juice', 'tomato juice', 'smoothie', 'cordial', 'elderflower cordial',
    'iced tea', 'energy drink', 'red bull', 'lucozade', 'sports drink', 'coffee',
    'ground coffee', 'instant coffee', 'coffee beans', 'coffee pods', 'espresso',
    'decaf coffee', 'tea', 'tea bags', 'green tea', 'herbal tea', 'peppermint tea',
    'chamomile tea', 'earl grey', 'rooibos', 'chai', 'hot chocolate', 'drinking chocolate',
    'malted drink', 'kombucha', 'beer', 'lager', 'ale', 'stout', 'cider', 'wine', 'red wine',
    'white wine', 'rose wine', 'prosecco', 'champagne', 'gin', 'vodka', 'whisky', 'whiskey',
    'rum', 'tequila', 'brandy', 'vermouth', 'aperol', 'baileys',
  ],
  Household: [
    'toilet paper', 'toilet roll', 'kitchen roll', 'paper towels', 'tissues', 'napkins',
    'serviettes', 'bin bags', 'bin liners', 'trash bags', 'garbage bags', 'foil',
    'aluminium foil', 'tin foil', 'cling film', 'plastic wrap', 'baking paper',
    'parchment paper', 'greaseproof paper', 'sandwich bags', 'freezer bags', 'food bags',
    'washing up liquid', 'dish soap', 'dishwasher tablets', 'dishwasher salt', 'rinse aid',
    'sponges', 'scourers', 'cloths', 'microfibre cloths', 'laundry detergent',
    'washing powder', 'laundry pods', 'washing liquid', 'fabric softener', 'stain remover',
    'bleach', 'disinfectant', 'antibacterial spray', 'all-purpose cleaner', 'surface cleaner',
    'glass cleaner', 'window cleaner', 'bathroom cleaner', 'kitchen cleaner', 'oven cleaner',
    'floor cleaner', 'limescale remover', 'drain unblocker', 'air freshener', 'candles',
    'tea lights', 'matches', 'lighter', 'batteries', 'light bulbs', 'rubber gloves',
    'cat food', 'dog food', 'pet food', 'cat litter', 'dog treats', 'bird seed',
  ],
  'Personal care': [
    'shampoo', 'conditioner', 'body wash', 'shower gel', 'soap', 'hand soap', 'hand wash',
    'bubble bath', 'toothpaste', 'toothbrush', 'mouthwash', 'dental floss', 'deodorant',
    'antiperspirant', 'razor', 'razor blades', 'shaving cream', 'shaving foam', 'shaving gel',
    'aftershave', 'moisturiser', 'moisturizer', 'lotion', 'body lotion', 'face cream',
    'sunscreen', 'sun cream', 'spf', 'after sun', 'lip balm', 'makeup remover', 'micellar water',
    'cotton pads', 'cotton wool', 'cotton buds', 'q-tips', 'tampons', 'sanitary pads',
    'sanitary towels', 'panty liners', 'nappies', 'diapers', 'baby wipes', 'wet wipes',
    'plasters', 'band-aids', 'bandages', 'antiseptic cream', 'painkillers', 'paracetamol',
    'ibuprofen', 'aspirin', 'antihistamines', 'vitamins', 'supplements', 'hand sanitiser',
    'hand sanitizer', 'hand cream', 'contact lens solution', 'face wash', 'cleanser',
    'hair gel', 'hairspray', 'hair dye', 'nail polish remover', 'tweezers', 'hair bands',
  ],
}

function singularize(word: string): string {
  if (word.length > 4 && word.endsWith('ies')) return word.slice(0, -3) + 'y'
  if (word.length > 3 && word.endsWith('oes')) return word.slice(0, -2)
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss') && !word.endsWith('us')) {
    return word.slice(0, -1)
  }
  return word
}

const lookup = new Map<string, Category>()
for (const [category, names] of Object.entries(DB) as [Category, string[]][]) {
  for (const raw of names) {
    const norm = normalizeName(raw)
    if (!lookup.has(norm)) lookup.set(norm, category)
    // Index the singular form of multi-word entries by their last word too
    const sing = norm.split(' ').map(singularize).join(' ')
    if (!lookup.has(sing)) lookup.set(sing, category)
  }
}

function lookupPhrase(phrase: string): Category | undefined {
  const hit = lookup.get(phrase)
  if (hit) return hit
  return lookup.get(phrase.split(' ').map(singularize).join(' '))
}

/**
 * Best-effort automatic aisle for an item name.
 * Tries the full normalized name, then progressively shorter trailing phrases
 * ("extra virgin olive oil" -> "virgin olive oil" -> "olive oil"), then the
 * remaining single words from last to first ("chicken thighs" -> "chicken").
 */
export function autoAisle(name: string): Category | undefined {
  const norm = normalizeName(name)
  if (!norm) return undefined
  const words = norm.split(/\s+/)
  for (let i = 0; i < words.length; i++) {
    const hit = lookupPhrase(words.slice(i).join(' '))
    if (hit) return hit
  }
  for (let i = words.length - 2; i >= 0; i--) {
    const hit = lookupPhrase(words[i]!)
    if (hit) return hit
  }
  return undefined
}

/**
 * Effective aisle for an item: the user's manual assignment wins, an explicit
 * NO_AISLE override forces uncategorized, otherwise fall back to the database.
 */
export function resolveAisle(norm: string, overrides: Record<string, string>): string | undefined {
  const manual = overrides[norm]
  if (manual === NO_AISLE) return undefined
  if (manual) return manual
  return autoAisle(norm)
}
