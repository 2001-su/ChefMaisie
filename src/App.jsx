

import { useState, useRef, useEffect } from "react";

// ── Constants ────────────────────────────────────────────────────────────────
const API_URL = "/api/chat"; // proxied through Vercel serverless

const STORAGE_KEYS = {
  user:     "cm_user",
  saved:    "cm_saved",
  wishlist: "cm_wishlist",
  diet:     "cm_diet",
  weight:   "cm_weight",
};

const C = {
  brand:      "#b5714a",
  brandLight: "#f5ede4",
  brandMid:   "#d49a72",
  text:       "#3d2210",
  muted:      "#9a7050",
  surface:    "rgba(255,255,255,0.88)",
  border:     "rgba(181,113,74,0.18)",
  dark:       "#1a0a00",
  darkMid:    "#3d1a00",
};

const S = {
  btn: {
    padding: "9px 18px", borderRadius: 10,
    border: `1px solid ${C.border}`, background: C.surface,
    color: C.text, cursor: "pointer", fontFamily: "inherit", fontSize: 14,
  },
  btnP: {
    padding: "10px 22px", borderRadius: 10, border: "none",
    background: C.brand, color: "#fff", cursor: "pointer",
    fontFamily: "inherit", fontSize: 14, fontWeight: 500,
  },
  input: {
    width: "100%", padding: "9px 12px", borderRadius: 9,
    border: `1px solid ${C.border}`, background: C.surface,
    fontFamily: "inherit", fontSize: 14, color: C.text,
    outline: "none", boxSizing: "border-box",
  },
  tag: {
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "4px 10px", borderRadius: 20,
    background: C.brandLight, color: C.brand,
    fontSize: 13, border: `1px solid ${C.border}`,
  },
};

const TABS     = ["Chat","Recipes","Saved","Wishlist","Tracker","Profile"];
const TAB_ICONS = ["🍳","📖","🔖","❤️","📊","👤"];

// ── Helpers ──────────────────────────────────────────────────────────────────
function load(key)      { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; } catch { return null; } }
function persist(key,v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }

function buildSystemPrompt(user) {
  return `You are Chef Maisie, a warm cooking AI with the personality of a beloved grandmother who is also a classically trained chef.

User profile:
- Name: ${user.name || "friend"}
- Allergies: ${user.allergies?.join(", ") || "none"}
- Dislikes: ${user.dislikes?.join(", ") || "none"}
- Diet: ${user.dietType || "none"}
- Goal: ${user.goal || "general wellness"}

RULES:
- NEVER suggest recipes containing the user's allergens or dislikes.
- Always respect their dietary type.
- Give full recipes with ingredient quantities and numbered steps when asked.
- Be warm, encouraging, and conversational. Use occasional food emojis.`;
}

// ── Recipe Data ──────────────────────────────────────────────────────────────
const RECIPE_BOOK = {
  "Breakfast":      ["Classic Pancakes","Masala Omelette","Avocado Toast","Idli Sambar","French Toast","Smoothie Bowl","Poha","Upma","Eggs Benedict","Banana Oat Porridge"],
  "Soups Salads":   ["Tomato Basil Soup","Greek Salad","Lentil Soup","Caesar Salad","Minestrone","Pumpkin Soup","Hot Sour Soup","Corn Chowder","Caprese Salad","Mulligatawny"],
  "Rice Grains":    ["Chicken Biryani","Vegetable Fried Rice","Mushroom Risotto","Lemon Rice","Khichdi","Pulao","Paella","Curd Rice","Pongal","Quinoa Bowl"],
  "Curries":        ["Butter Chicken","Palak Paneer","Dal Makhani","Chana Masala","Thai Green Curry","Fish Curry","Aloo Gobi","Rajma","Methi Chicken","Egg Curry"],
  "Pasta Noodles":  ["Spaghetti Carbonara","Penne Arrabbiata","Pad Thai","Mac Cheese","Pesto Pasta","Ramen","Hakka Noodles","Lasagne","Aglio e Olio","Udon Stir Fry"],
  "Breads Snacks":  ["Garlic Naan","Samosa","Bruschetta","Vada Pav","Stuffed Paratha","Spring Rolls","Onion Bhaji","Pita Hummus","Dhokla","Aloo Tikki"],
  "Grills Mains":   ["Tandoori Chicken","Grilled Salmon","BBQ Ribs","Paneer Tikka","Beef Steak","Stuffed Bell Peppers","Chicken Shawarma","Lamb Chops","Fish Tacos","Seekh Kebab"],
  "Desserts":       ["Gulab Jamun","Chocolate Lava Cake","Mango Kulfi","Tiramisu","Kheer","Cheesecake","Gajar Halwa","Panna Cotta","Rasgulla","Brownie"],
  "Drinks":         ["Mango Lassi","Masala Chai","Green Smoothie","Banana Milkshake","Iced Lemon Tea","Hot Chocolate","Rose Sharbat","Watermelon Juice","Turmeric Latte","Cold Brew Coffee"],
};

const RECIPE_EMOJIS = {
  "Classic Pancakes":"🥞","Masala Omelette":"🍳","Avocado Toast":"🥑","Idli Sambar":"🍚",
  "French Toast":"🍞","Smoothie Bowl":"🍓","Poha":"🌾","Upma":"🥣","Eggs Benedict":"🍳","Banana Oat Porridge":"🍌",
  "Tomato Basil Soup":"🍅","Greek Salad":"🥗","Lentil Soup":"🫘","Caesar Salad":"🥬",
  "Minestrone":"🍲","Pumpkin Soup":"🎃","Hot Sour Soup":"🌶","Corn Chowder":"🌽","Caprese Salad":"🍅","Mulligatawny":"🍲",
  "Chicken Biryani":"🍗","Vegetable Fried Rice":"🍚","Mushroom Risotto":"🍄","Lemon Rice":"🍋",
  "Khichdi":"🌿","Pulao":"🌼","Paella":"🥘","Curd Rice":"🥛","Pongal":"🌾","Quinoa Bowl":"🥙",
  "Butter Chicken":"🧈","Palak Paneer":"🥬","Dal Makhani":"🫘","Chana Masala":"🟡",
  "Thai Green Curry":"🌿","Fish Curry":"🐟","Aloo Gobi":"🥔","Rajma":"🫘","Methi Chicken":"🍗","Egg Curry":"🥚",
  "Spaghetti Carbonara":"🍝","Penne Arrabbiata":"🌶","Pad Thai":"🍜","Mac Cheese":"🧀",
  "Pesto Pasta":"🌱","Ramen":"🍜","Hakka Noodles":"🥢","Lasagne":"🫕","Aglio e Olio":"🧄","Udon Stir Fry":"🥢",
  "Garlic Naan":"🫓","Samosa":"🔺","Bruschetta":"🥖","Vada Pav":"🍔","Stuffed Paratha":"🌯",
  "Spring Rolls":"🥟","Onion Bhaji":"🧅","Pita Hummus":"🧆","Dhokla":"🟡","Aloo Tikki":"🥔",
  "Tandoori Chicken":"🍗","Grilled Salmon":"🐟","BBQ Ribs":"🥩","Paneer Tikka":"🟧",
  "Beef Steak":"🥩","Stuffed Bell Peppers":"🫑","Chicken Shawarma":"🌮","Lamb Chops":"🍖","Fish Tacos":"🌮","Seekh Kebab":"🍢",
  "Gulab Jamun":"🍮","Chocolate Lava Cake":"🍫","Mango Kulfi":"🥭","Tiramisu":"☕",
  "Kheer":"🍚","Cheesecake":"🍰","Gajar Halwa":"🥕","Panna Cotta":"🍮","Rasgulla":"⚪","Brownie":"🍫",
  "Mango Lassi":"🥭","Masala Chai":"☕","Green Smoothie":"🥦","Banana Milkshake":"🍌",
  "Iced Lemon Tea":"🍋","Hot Chocolate":"🍫","Rose Sharbat":"🌹","Watermelon Juice":"🍉","Turmeric Latte":"🌿","Cold Brew Coffee":"☕",
};

// ── Animated SVG Scenes ──────────────────────────────────────────────────────
const SCENES = {
  prep: (p) => (
    <svg viewBox="0 0 220 160" style={{ width:"100%", height:"100%" }}>
      <rect width="220" height="160" fill="#fdf6ec" rx="16"/>
      <rect x="20" y="108" width="180" height="10" rx="4" fill="#c8956c"/>
      {[{x:45,y:95,r:14,fill:"#7bc67e",emoji:"🥬"},{x:85,y:93,r:12,fill:"#f5a623",emoji:"🧅"},{x:123,y:95,r:13,fill:"#e85d3a",emoji:"🍅"},{x:163,y:93,r:11,fill:"#f5e14a",emoji:"🧄"}].map((ing,i)=>(
        <g key={i} opacity={Math.min(1,p*(4/(i+1)))}>
          <circle cx={ing.x} cy={ing.y} r={ing.r} fill={ing.fill}/>
          <text x={ing.x} y={ing.y+5} textAnchor="middle" fontSize="13">{ing.emoji}</text>
        </g>
      ))}
      <ellipse cx="110" cy="44" rx="28" ry="20" fill="white"/>
      <rect x="82" y="44" width="56" height="16" rx="4" fill="white"/>
      <ellipse cx="110" cy="60" rx="28" ry="6" fill="#eee"/>
      <ellipse cx="110" cy="38" rx="10" ry="5" fill="#ddd"/>
      <circle cx="110" cy="75" r="14" fill="#f5c89a"/>
      <circle cx="105" cy="73" r="2" fill="#555"/>
      <circle cx="115" cy="73" r="2" fill="#555"/>
      <path d="M105,79 Q110,83 115,79" stroke="#c0784a" strokeWidth="1.5" fill="none"/>
      <text x="110" y="148" textAnchor="middle" fontSize="12" fill={C.muted} fontFamily="Georgia">Gathering ingredients...</text>
    </svg>
  ),
  chop: (p) => (
    <svg viewBox="0 0 220 160" style={{ width:"100%", height:"100%" }}>
      <rect width="220" height="160" fill="#fdf3e7" rx="16"/>
      <rect x="40" y="92" width="140" height="16" rx="5" fill="#d4a96a"/>
      <rect x="44" y="94" width="132" height="12" rx="4" fill="#e8c084"/>
      <circle cx="110" cy="90" r="12" fill="#7bc67e"/>
      <rect x="107" y="77" width="6" height="10" rx="2" fill="#5a9e5e"/>
      <g transform={`translate(${p*70},0)`}>
        <rect x="55" y="62" width="55" height="8" rx="3" fill="#aaa"/>
        <rect x="106" y="60" width="16" height="12" rx="3" fill="#7a5c3a"/>
        <polygon points="55,62 55,70 28,80" fill="#ccc"/>
      </g>
      {p>0.5 && [1,2,3].map(i=>(
        <line key={i} x1={92+i*10} y1="92" x2={92+i*10} y2="108" stroke="#5a9e5e" strokeWidth="1.5" opacity={p}/>
      ))}
      <text x="110" y="148" textAnchor="middle" fontSize="12" fill={C.muted} fontFamily="Georgia">Chopping ingredients...</text>
    </svg>
  ),
  mix: (p) => (
    <svg viewBox="0 0 220 160" style={{ width:"100%", height:"100%" }}>
      <rect width="220" height="160" fill="#fef9ec" rx="16"/>
      <ellipse cx="110" cy="107" rx="62" ry="14" fill="#c8956c"/>
      <path d="M48,92 Q48,132 110,132 Q172,132 172,92 Z" fill="#e8b87a"/>
      <ellipse cx="110" cy="92" rx="62" ry="14" fill="#f5d09a"/>
      <ellipse cx="110" cy="92" rx="55" ry="11" fill="#f0c882"/>
      <g transform={`rotate(${p*360},110,92)`}>
        <rect x="108" y="57" width="4" height="44" rx="2" fill="#8a6a4a"/>
        <ellipse cx="110" cy="99" rx="7" ry="4" fill="#a07850"/>
      </g>
      {p>0.3 && [0,1,2,3,4].map(i=>(
        <circle key={i} cx={87+i*12} cy={77+Math.sin(i+p*6)*8} r="3" fill="#f0b860" opacity={0.6+p*0.4}/>
      ))}
      <text x="110" y="150" textAnchor="middle" fontSize="12" fill={C.muted} fontFamily="Georgia">Mixing together...</text>
    </svg>
  ),
  fry: (p) => (
    <svg viewBox="0 0 220 160" style={{ width:"100%", height:"100%" }}>
      <rect width="220" height="160" fill="#fff5e6" rx="16"/>
      <ellipse cx="108" cy="107" rx="58" ry="13" fill="#555"/>
      <ellipse cx="108" cy="102" rx="58" ry="13" fill="#666"/>
      <ellipse cx="108" cy="100" rx="52" ry="11" fill="#888"/>
      <rect x="163" y="95" width="42" height="10" rx="5" fill="#555"/>
      <ellipse cx="95" cy="98" rx="18" ry="8" fill="#f5a623" opacity="0.9"/>
      <ellipse cx="125" cy="96" rx="14" ry="7" fill="#e8891a" opacity="0.9"/>
      {p>0.2 && [0,1,2,3,4,5].map(i=>(
        <circle key={i} cx={75+i*14} cy={92+Math.sin(i*1.3+p*8)*5} r={2+Math.sin(i+p*5)} fill="#ffcc44" opacity={0.5+p*0.5}/>
      ))}
      {[0,1].map(i=>(
        <path key={i} d={`M${92+i*22},${90-p*18} q4,-6 0,-12`} stroke="rgba(200,200,200,0.6)" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity={p}/>
      ))}
      {[-1,0,1].map(i=>(
        <ellipse key={i} cx={108+i*20} cy="124" rx="7" ry="5" fill={i===0?"#ff5500":"#ff8800"} opacity="0.8"/>
      ))}
      <text x="110" y="148" textAnchor="middle" fontSize="12" fill={C.muted} fontFamily="Georgia">Frying until golden...</text>
    </svg>
  ),
  boil: (p) => (
    <svg viewBox="0 0 220 160" style={{ width:"100%", height:"100%" }}>
      <rect width="220" height="160" fill="#e8f4fd" rx="16"/>
      <ellipse cx="110" cy="112" rx="55" ry="12" fill="#8a6a4a"/>
      <rect x="55" y="70" width="110" height="44" rx="8" fill="#a07850"/>
      <rect x="58" y="72" width="104" height="40" rx="6" fill="#c89860"/>
      <rect x="35" y="77" width="22" height="10" rx="5" fill="#8a6a4a"/>
      <rect x="163" y="77" width="22" height="10" rx="5" fill="#8a6a4a"/>
      <ellipse cx="110" cy="70" rx="55" ry="10" fill="#8a6a4a"/>
      <ellipse cx="110" cy="68" rx="50" ry="8" fill="#a07850"/>
      <ellipse cx="110" cy="64" rx="10" ry="5" fill="#7a5840"/>
      {[0,1,2].map(i=>(
        <path key={i} d={`M${85+i*18},${62-p*28} q5,-8 0,-16 q-5,-8 0,-16`}
          stroke="rgba(255,255,255,0.65)" strokeWidth="3" fill="none" strokeLinecap="round" opacity={p}/>
      ))}
      {[0,1,2].map(i=>(
        <ellipse key={i} cx={85+i*18} cy="132" rx="8" ry={5+Math.sin(i)*2} fill={i===1?"#ff6b2b":"#ffaa44"} opacity="0.85"/>
      ))}
      <text x="110" y="152" textAnchor="middle" fontSize="12" fill={C.muted} fontFamily="Georgia">Bringing to a boil...</text>
    </svg>
  ),
  bake: (p) => (
    <svg viewBox="0 0 220 160" style={{ width:"100%", height:"100%" }}>
      <rect width="220" height="160" fill="#fef3e2" rx="16"/>
      <rect x="30" y="38" width="160" height="100" rx="10" fill="#888"/>
      <rect x="35" y="43" width="150" height="90" rx="8" fill="#555"/>
      <rect x="55" y="53" width="110" height="65" rx="6" fill="#222"/>
      <rect x="58" y="56" width="104" height="59" rx="4" fill={`rgb(${Math.round(30+p*100)},${Math.round(20+p*40)},20)`}/>
      <rect x="70" y="78" width="80" height="25" rx="4" fill={`rgb(${Math.round(180+p*50)},${Math.round(120+p*30)},${Math.round(60+p*20)})`}/>
      {p>0.3 && <rect x="58" y="56" width="104" height="59" rx="4" fill={`rgba(255,120,0,${p*0.2})`}/>}
      {[0,1,2].map(i=><circle key={i} cx={65+i*40} cy="148" r="7" fill="#777"/>)}
      <text x="110" y="22" textAnchor="middle" fontSize="12" fill={C.muted} fontFamily="Georgia">Baking to perfection...</text>
    </svg>
  ),
  plate: (p) => (
    <svg viewBox="0 0 220 160" style={{ width:"100%", height:"100%" }}>
      <rect width="220" height="160" fill="#f0faf0" rx="16"/>
      <ellipse cx="110" cy="107" rx="72" ry="15" fill="#ddd"/>
      <ellipse cx="110" cy="102" rx="72" ry="15" fill="#f5f5f5"/>
      <ellipse cx="110" cy="100" rx="65" ry="13" fill="white"/>
      <ellipse cx="110" cy="100" rx="48" ry="10" fill="#fafafa"/>
      <g opacity={p}>
        <ellipse cx="100" cy="97" rx="22" ry="10" fill="#f5a623"/>
        <ellipse cx="125" cy="94" rx="16" ry="8" fill="#7bc67e"/>
        <circle cx="108" cy="90" r="8" fill="#e85d3a"/>
      </g>
      {p>0.5 && <>
        <circle cx="90" cy="87" r="4" fill="#5a9e5e" opacity={p}/>
        <circle cx="130" cy="85" r="3" fill="#5a9e5e" opacity={p}/>
        <path d="M105,84 Q110,80 115,84" stroke="#5a9e5e" strokeWidth="2" fill="none" opacity={p}/>
      </>}
      {p>0.75 && [0,1,2,3].map(i=>(
        <text key={i} x={58+i*34} y={62+i*4} fontSize="13" opacity={(p-0.7)*3}>✨</text>
      ))}
      <text x="110" y="148" textAnchor="middle" fontSize="12" fill={C.muted} fontFamily="Georgia">Plating beautifully...</text>
    </svg>
  ),
};

// ── Per-recipe step scripts ──────────────────────────────────────────────────
const RECIPE_STEPS = {
  "Butter Chicken": { color:"#ff8c42", steps:[
    { scene:"prep",  title:"Gather ingredients",    desc:"500g chicken, 1 cup yogurt, 2 tbsp butter, 1 cup tomato puree, ½ cup cream, spices (cumin, garam masala, chili, turmeric, ginger-garlic paste)." },
    { scene:"mix",   title:"Marinate chicken",      desc:"Mix chicken with yogurt, 1 tsp chili, 1 tsp turmeric, 1 tbsp ginger-garlic paste. Marinate 30 minutes (overnight is better)." },
    { scene:"fry",   title:"Cook the chicken",      desc:"Heat 1 tbsp butter in a wide pan on high. Cook marinated chicken 6–8 min until golden and just cooked through. Set aside." },
    { scene:"boil",  title:"Build the sauce",       desc:"Same pan, add 1 tbsp butter. Sauté 1 sliced onion until golden. Add tomato puree, cumin, garam masala. Simmer 10 min." },
    { scene:"mix",   title:"Add cream & chicken",   desc:"Pour ½ cup cream into the sauce. Return chicken. Stir gently and simmer on low for 8 min until rich and glossy." },
    { scene:"plate", title:"Serve & garnish",       desc:"Plate with steamed basmati or naan. Drizzle cream, scatter fresh coriander. Enjoy!" },
  ]},
  "Masala Omelette": { color:"#f5a623", steps:[
    { scene:"prep",  title:"Gather ingredients",    desc:"3 eggs, 1 small onion, 1 green chili, ½ tomato, coriander leaves, salt, black pepper, ½ tsp turmeric, butter." },
    { scene:"chop",  title:"Chop vegetables",       desc:"Finely chop onion, tomato, green chili and coriander. Keep them ready in a small bowl." },
    { scene:"mix",   title:"Beat the eggs",         desc:"Crack 3 eggs. Add salt, pepper, turmeric and all chopped veggies. Whisk vigorously until well combined." },
    { scene:"fry",   title:"Cook the omelette",     desc:"Melt 1 tsp butter in non-stick pan on medium. Pour egg mixture. Let edges set without stirring for 2 min." },
    { scene:"fry",   title:"Fold & finish",         desc:"Fold omelette in half. Cook 1 more minute each side until golden outside, just set inside." },
    { scene:"plate", title:"Serve hot",             desc:"Slide onto a warm plate. Garnish with coriander. Serve with toast or paratha." },
  ]},
  "Palak Paneer": { color:"#3a9a4a", steps:[
    { scene:"prep",  title:"Gather ingredients",    desc:"250g paneer, 300g spinach, 1 onion, 2 tomatoes, ginger-garlic paste, 2 tbsp cream, cumin, garam masala, chili." },
    { scene:"boil",  title:"Blanch the spinach",    desc:"Boil spinach in salted water for 2 min. Immediately transfer to ice water to preserve colour. Drain and blend smooth." },
    { scene:"fry",   title:"Build the base",        desc:"Heat 2 tbsp oil. Add cumin seeds, then onion — fry until golden. Add ginger-garlic paste, then tomatoes. Cook 5 min." },
    { scene:"mix",   title:"Add spinach",           desc:"Pour spinach puree into the pan. Add garam masala, chili, salt. Stir well and simmer 5 min." },
    { scene:"fry",   title:"Add paneer",            desc:"Cube paneer and gently fold into the gravy. Simmer 3–4 min so paneer absorbs flavour." },
    { scene:"plate", title:"Finish & serve",        desc:"Swirl in cream. Serve hot with roti or naan." },
  ]},
  "Chocolate Lava Cake": { color:"#6b3a2a", steps:[
    { scene:"prep",  title:"Gather ingredients",    desc:"100g dark chocolate, 80g butter, 2 whole eggs, 2 yolks, 80g sugar, 40g flour, cocoa for dusting, pinch of salt." },
    { scene:"boil",  title:"Melt chocolate",        desc:"Melt chocolate and butter together in a heatproof bowl over simmering water. Stir until silky. Cool 5 min." },
    { scene:"mix",   title:"Whisk eggs & sugar",    desc:"Beat eggs, yolks and sugar until pale and thick (about 3 min). Fold in the warm chocolate mixture." },
    { scene:"mix",   title:"Fold in flour",         desc:"Sift flour and salt over the batter. Fold gently until just combined — stop as soon as you see no dry flour." },
    { scene:"bake",  title:"Bake",                  desc:"Pour into buttered, cocoa-dusted ramekins. Bake at 200°C for exactly 12 min. Centres should still wobble." },
    { scene:"plate", title:"Serve immediately",     desc:"Run a knife around the edge, invert onto a plate. Dust cocoa. Serve with vanilla ice cream — cut open and watch the lava!" },
  ]},
  "Mango Lassi": { color:"#f0a500", steps:[
    { scene:"prep",  title:"Gather ingredients",    desc:"1 ripe mango (Alphonso or Kesar), 1 cup chilled yogurt, ½ cup cold milk, 2 tbsp sugar, pinch of cardamom, ice cubes." },
    { scene:"chop",  title:"Prepare the mango",     desc:"Peel and cube the mango around the seed. Ripe, fragrant mangoes give the best flavour — taste before adding sugar." },
    { scene:"mix",   title:"Blend",                 desc:"Add mango, yogurt, milk, sugar and cardamom to a blender. Blend on high for 60 seconds until silky smooth." },
    { scene:"mix",   title:"Adjust",                desc:"Taste — add more milk if too thick, more sugar or a squeeze of lime if needed. Blend again briefly." },
    { scene:"plate", title:"Serve chilled",         desc:"Pour over ice into tall glasses. Garnish with a mango slice and cardamom sprinkle. Serve immediately!" },
  ]},
  "Dal Makhani": { color:"#8b3a1a", steps:[
    { scene:"prep",  title:"Gather ingredients",    desc:"1 cup whole black urad dal, ¼ cup kidney beans, 2 tomatoes, 1 onion, ginger-garlic paste, butter, cream, spices." },
    { scene:"boil",  title:"Soak & pressure cook",  desc:"Soak dal and beans overnight. Pressure cook with salt and water for 6–8 whistles until completely soft and mushy." },
    { scene:"fry",   title:"Make the masala",       desc:"Heat 2 tbsp butter. Sauté onion until deep golden. Add ginger-garlic paste, then blended tomatoes. Cook 10 min on medium." },
    { scene:"mix",   title:"Combine dal & masala",  desc:"Add cooked dal to the masala. Mix well, mashing some dal for a creamy texture. Add cumin, garam masala, chili." },
    { scene:"boil",  title:"Slow simmer",           desc:"Simmer on very low heat for 45 min, stirring often. Add water as needed. The longer it cooks, the better the flavour." },
    { scene:"plate", title:"Finish & serve",        desc:"Stir in 3 tbsp cream and 1 tbsp butter. Serve hot with naan or rice, garnished with cream and coriander." },
  ]},
};

const defaultSteps = (name) => [
  { scene:"prep",  title:"Gather ingredients",   desc:`Collect all ingredients needed for ${name}. Wash vegetables and prep your workspace cleanly.` },
  { scene:"chop",  title:"Prep & chop",          desc:"Chop, dice and measure all ingredients as required. Mise en place — everything ready before cooking starts." },
  { scene:"mix",   title:"Combine & season",     desc:"Mix ingredients together as directed. Taste and adjust seasoning — salt, acid, heat — as you go." },
  { scene:"fry",   title:"Apply heat",           desc:"Cook using the required method — fry, sauté or sear. Watch carefully and stir as needed. Don't walk away!" },
  { scene:"boil",  title:"Simmer & finish",      desc:"Allow the dish to simmer or rest until fully cooked. Flavours develop and deepen the longer it simmers." },
  { scene:"plate", title:"Plate & serve",        desc:`Present your ${name} on a warm plate. Add garnish. Serve immediately for best flavour and texture!` },
];

// ── Animated Scene Component ─────────────────────────────────────────────────
function AnimatedScene({ scene, playing }) {
  const [progress, setProgress] = useState(0);
  const rafRef    = useRef(null);
  const startRef  = useRef(null);

  useEffect(() => {
    setProgress(0);
    startRef.current = null;
    if (!playing) return;
    const dur = 2800;
    const tick = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const p = Math.min((ts - startRef.current) / dur, 1);
      setProgress(p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setTimeout(() => { startRef.current = null; rafRef.current = requestAnimationFrame(tick); }, 500);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [scene, playing]);

  const fn = SCENES[scene] || SCENES.prep;
  return (
    <div style={{ width:"100%", height:160, borderRadius:14, overflow:"hidden", border:`1px solid ${C.border}` }}>
      {fn(progress)}
    </div>
  );
}

// ── Cooking Show ─────────────────────────────────────────────────────────────
function CookingShow({ recipe, onClose }) {
  const data   = RECIPE_STEPS[recipe] || { color: C.brand, steps: defaultSteps(recipe) };
  const steps  = data.steps;
  const [step, setStep]     = useState(0);
  const [playing, setPlay]  = useState(true);
  const [timer, setTimer]   = useState(null);
  const [elapsed, setElap]  = useState(0);
  const timerRef = useRef(null);

  const cur = steps[step];

  const startTimer = (secs) => {
    clearInterval(timerRef.current);
    setTimer(secs); setElap(0);
    timerRef.current = setInterval(() => {
      setElap(e => { if (e + 1 >= secs) { clearInterval(timerRef.current); return secs; } return e + 1; });
    }, 1000);
  };
  useEffect(() => () => clearInterval(timerRef.current), []);

  const next = () => { if (step < steps.length - 1) { setStep(s => s + 1); setPlay(true); setTimer(null); setElap(0); } };
  const prev = () => { if (step > 0)                 { setStep(s => s - 1); setPlay(true); setTimer(null); setElap(0); } };

  const pct = Math.round(((step + 1) / steps.length) * 100);

  return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(160deg,${C.dark},${C.darkMid})`, display:"flex", flexDirection:"column", fontFamily:"Georgia,serif" }}>
      {/* header */}
      <div style={{ padding:"14px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.12)", border:"none", color:"#fff", borderRadius:20, padding:"7px 14px", cursor:"pointer", fontSize:13 }}>← Back</button>
        <div style={{ color:"#fff", fontSize:15, fontWeight:600 }}>{RECIPE_EMOJIS[recipe]||"🍽"} {recipe}</div>
        <div style={{ color:"rgba(255,255,255,0.5)", fontSize:13 }}>{step+1}/{steps.length}</div>
      </div>

      {/* progress bar */}
      <div style={{ height:4, background:"rgba(255,255,255,0.1)", margin:"0 16px 4px" }}>
        <div style={{ height:"100%", width:`${pct}%`, background: data.color, borderRadius:2, transition:"width .4s" }}/>
      </div>

      {/* body */}
      <div style={{ flex:1, padding:"16px", display:"flex", flexDirection:"column", gap:14, overflowY:"auto" }}>
        <AnimatedScene scene={cur.scene} playing={playing}/>

        {/* step card */}
        <div style={{ background:"rgba(255,255,255,0.09)", borderRadius:16, padding:"16px 18px", border:"1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <div style={{ background: data.color, borderRadius:"50%", width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:14, flexShrink:0 }}>{step+1}</div>
            <div style={{ color:"#fff", fontWeight:600, fontSize:16 }}>{cur.title}</div>
          </div>
          <p style={{ color:"rgba(255,255,255,0.82)", fontSize:14, lineHeight:1.7, margin:0 }}>{cur.desc}</p>
        </div>

        {/* timer */}
        {timer !== null ? (
          <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:14, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ color:"rgba(255,255,255,0.45)", fontSize:12 }}>Timer</div>
              <div style={{ color:"#fff", fontSize:28, fontWeight:700, letterSpacing:2 }}>
                {String(Math.floor((timer-elapsed)/60)).padStart(2,"0")}:{String((timer-elapsed)%60).padStart(2,"0")}
              </div>
            </div>
            <div style={{ width:56, height:56, borderRadius:"50%", border:`3px solid ${data.color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>
              {elapsed >= timer ? "✅" : "⏱"}
            </div>
          </div>
        ) : (
          <div>
            <div style={{ color:"rgba(255,255,255,0.4)", fontSize:11, marginBottom:6 }}>SET A TIMER</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {[["1m",60],["2m",120],["5m",300],["10m",600],["15m",900],["30m",1800]].map(([lbl,s])=>(
                <button key={s} onClick={()=>startTimer(s)} style={{ padding:"7px 14px", borderRadius:20, border:"1px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.7)", cursor:"pointer", fontFamily:"inherit", fontSize:12 }}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* nav */}
        <div style={{ display:"flex", gap:10, marginTop:"auto" }}>
          <button onClick={prev} disabled={step===0} style={{ ...S.btn, flex:1, opacity:step===0?0.35:1 }}>← Prev</button>
          <button onClick={()=>setPlay(v=>!v)} style={{ width:48, height:44, borderRadius:12, border:"none", background: data.color, color:"#fff", cursor:"pointer", fontSize:18 }}>
            {playing ? "⏸" : "▶"}
          </button>
          {step < steps.length - 1
            ? <button onClick={next} style={{ ...S.btnP, flex:1 }}>Next →</button>
            : <button onClick={onClose} style={{ ...S.btnP, flex:1, background:"#3a8a4a" }}>Done! 🎉</button>
          }
        </div>
      </div>
    </div>
  );
}

// ── Recipe Book ──────────────────────────────────────────────────────────────
function RecipeBook({ onCook, onChat }) {
  const [cat, setCat]       = useState(Object.keys(RECIPE_BOOK)[0]);
  const [search, setSearch] = useState("");

  const all      = Object.entries(RECIPE_BOOK).flatMap(([c,items])=>items.map(n=>({name:n,cat:c})));
  const filtered = search.trim()
    ? all.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
    : RECIPE_BOOK[cat].map(n=>({name:n,cat}));

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"16px 0" }}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search recipes…" style={{ ...S.input, marginBottom:14 }}/>
      {!search.trim() && (
        <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:14 }}>
          {Object.keys(RECIPE_BOOK).map(c=>(
            <button key={c} onClick={()=>setCat(c)} style={{ padding:"6px 13px", borderRadius:20, border:`1px solid ${C.border}`, background: cat===c?C.brand:C.surface, color: cat===c?"#fff":C.muted, fontFamily:"inherit", fontSize:12, cursor:"pointer", fontWeight: cat===c?600:400 }}>{c}</button>
          ))}
        </div>
      )}
      {filtered.length===0 && <p style={{ fontSize:13, color:C.muted, textAlign:"center", marginTop:30 }}>No recipes found.</p>}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {filtered.map((r,i)=>(
          <div key={i} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 10px", textAlign:"center" }}>
            <div style={{ fontSize:28, marginBottom:4 }}>{RECIPE_EMOJIS[r.name]||"🍽"}</div>
            <div style={{ fontSize:13, color:C.text, fontWeight:500, marginBottom:10, lineHeight:1.3 }}>{r.name}</div>
            <div style={{ display:"flex", gap:6, justifyContent:"center" }}>
              <button onClick={()=>onCook(r.name)} style={{ ...S.btnP, padding:"6px 10px", fontSize:12 }}>▶ Cook</button>
              <button onClick={()=>onChat(r.name)} style={{ ...S.btn,  padding:"6px 10px", fontSize:12 }}>💬 Chat</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Chat helpers ─────────────────────────────────────────────────────────────
const TypingDots = () => (
  <div style={{ display:"flex", gap:5, padding:"6px 2px" }}>
    {[0,1,2].map(i=><div key={i} style={{ width:7, height:7, borderRadius:"50%", background:C.brandMid, animation:"bounce 1.2s infinite", animationDelay:`${i*0.2}s` }}/>)}
    <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-6px);opacity:1}}`}</style>
  </div>
);

function formatMsg(text) {
  return text.split("\n").map((line,i)=>{
    if (!line.trim()) return <br key={i}/>;
    if (line.startsWith("### ")) return <h3 key={i} style={{ margin:"10px 0 3px", fontSize:15, color:C.text }}>{line.slice(4)}</h3>;
    if (line.startsWith("## "))  return <h2 key={i} style={{ margin:"12px 0 4px", fontSize:17, color:C.text }}>{line.slice(3)}</h2>;
    if (line.match(/^\d+\.\s/)) return <p key={i} style={{ margin:"3px 0", paddingLeft:4 }}>{line}</p>;
    if (line.startsWith("- "))  return <p key={i} style={{ margin:"3px 0", paddingLeft:8 }}>• {line.slice(2)}</p>;
    const parts = line.split(/\*\*(.*?)\*\*/g);
    if (parts.length > 1) return <p key={i} style={{ margin:"3px 0" }}>{parts.map((p,j)=>j%2===1?<strong key={j} style={{ color:C.text }}>{p}</strong>:p)}</p>;
    return <p key={i} style={{ margin:"3px 0" }}>{line}</p>;
  });
}

// ── Small UI pieces ──────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ fontSize:12, color:C.muted, display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:.5 }}>{label}</label>
      {children}
    </div>
  );
}
function Empty({ icon, msg }) {
  return (
    <div style={{ textAlign:"center", padding:"40px 20px", color:C.muted }}>
      <div style={{ fontSize:32, marginBottom:8 }}>{icon}</div>
      <p style={{ fontSize:13, margin:0 }}>{msg}</p>
    </div>
  );
}
function Section({ title, children }) {
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 16px", marginBottom:14 }}>
      <h3 style={{ margin:"0 0 12px", fontSize:15, color:C.text }}>{title}</h3>
      {children}
    </div>
  );
}
function Modal({ title, children, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:99, padding:20 }}>
      <div style={{ background:"#fdf8f3", borderRadius:16, padding:"24px 20px", maxWidth:360, width:"100%", border:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <span style={{ fontWeight:600, fontSize:15, color:C.text }}>{title}</span>
          <button onClick={onClose} style={{ border:"none", background:"none", cursor:"pointer", fontSize:18, color:C.muted }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function TagInput({ field, values, onChange, placeholder }) {
  const [val, setVal] = useState("");
  const add = () => { const t=val.trim(); if(!t)return; onChange([...values,t]); setVal(""); };
  return <>
    <div style={{ display:"flex", gap:6, marginBottom:6 }}>
      <input value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder={placeholder} style={{ ...S.input }}/>
      <button onClick={add} style={{ ...S.btn, padding:"9px 12px" }}>+</button>
    </div>
    <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
      {values.map((v,i)=><span key={i} style={{ ...S.tag }}>{v} <span onClick={()=>onChange(values.filter((_,j)=>j!==i))} style={{ cursor:"pointer" }}>✕</span></span>)}
    </div>
  </>;
}

// ── Profile Tab ──────────────────────────────────────────────────────────────
function ProfileTab({ user, onSave }) {
  const [form, setForm] = useState({ ...user });
  const [ok,   setOk]   = useState(false);
  return (
    <div style={{ flex:1, overflowY:"auto", padding:"18px 0" }}>
      <Field label="Name">
        <input value={form.name||""} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={{ ...S.input }}/>
      </Field>
      <Field label="Email">
        <input value={form.email||""} disabled style={{ ...S.input, opacity:.6 }}/>
      </Field>
      <Field label="Diet type">
        <select value={form.dietType||""} onChange={e=>setForm(f=>({...f,dietType:e.target.value}))} style={{ ...S.input }}>
          <option value="">No specific diet</option>
          {["Vegetarian","Vegan","Pescatarian","Keto","Gluten-free","Halal","Kosher"].map(d=><option key={d}>{d}</option>)}
        </select>
      </Field>
      <Field label="Health goal">
        <select value={form.goal||""} onChange={e=>setForm(f=>({...f,goal:e.target.value}))} style={{ ...S.input }}>
          <option value="">General wellness</option>
          {["Weight loss","Muscle gain","Maintain weight","Manage diabetes","Heart health"].map(g=><option key={g}>{g}</option>)}
        </select>
      </Field>
      <Field label="Allergies">
        <TagInput values={form.allergies||[]} onChange={v=>setForm(f=>({...f,allergies:v}))} placeholder="e.g. peanuts, shellfish…"/>
      </Field>
      <Field label="Dislikes">
        <TagInput values={form.dislikes||[]} onChange={v=>setForm(f=>({...f,dislikes:v}))} placeholder="e.g. mushrooms, olives…"/>
      </Field>
      <button onClick={()=>{ onSave(form); setOk(true); setTimeout(()=>setOk(false),2200); }} style={{ ...S.btnP, width:"100%" }}>
        {ok ? "✓ Saved!" : "Save profile"}
      </button>
    </div>
  );
}

// ── Login Flow ───────────────────────────────────────────────────────────────
function LoginFlow({ onAuth }) {
  const [step,    setStep]    = useState("email");
  const [email,   setEmail]   = useState("");
  const [otp,     setOtp]     = useState("");
  const [profile, setProfile] = useState({ name:"", dietType:"", goal:"", allergies:[], dislikes:[] });
  const DEMO_OTP = "123456";

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#fdf8f3,#f5ede4,#eedfd0)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Georgia,serif", padding:20 }}>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:"32px 28px", maxWidth:400, width:"100%" }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ fontSize:44, marginBottom:8 }}>🫕</div>
          <h1 style={{ margin:0, fontSize:22, color:C.text, fontWeight:700 }}>Chef Maisie</h1>
          <p style={{ margin:"4px 0 0", fontSize:13, color:C.muted, fontStyle:"italic" }}>Your personal kitchen companion</p>
        </div>

        {step==="email" && <>
          <Field label="Sign in with your email">
            <input value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&email.includes("@")&&setStep("otp")} placeholder="you@example.com" type="email" style={{ ...S.input }}/>
          </Field>
          <button onClick={()=>email.includes("@")&&setStep("otp")} style={{ ...S.btnP, width:"100%" }}>Send OTP →</button>
        </>}

        {step==="otp" && <>
          <p style={{ fontSize:13, color:C.muted, margin:"0 0 10px" }}>Code sent to <strong style={{ color:C.text }}>{email}</strong></p>
          <div style={{ fontSize:12, color:C.brand, padding:"8px 10px", background:C.brandLight, borderRadius:8, marginBottom:12 }}>
            Demo OTP: <strong>123456</strong>
          </div>
          <input value={otp} onChange={e=>setOtp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(otp.trim()===DEMO_OTP?setStep("profile"):alert("Wrong OTP. Use 123456"))}
            placeholder="123456" type="text" inputMode="numeric" style={{ ...S.input, letterSpacing:4, fontSize:20, textAlign:"center", marginBottom:12 }}/>
          <button onClick={()=>otp.trim()===DEMO_OTP?setStep("profile"):alert("Wrong OTP. Use 123456")} style={{ ...S.btnP, width:"100%" }}>Verify →</button>
          <button onClick={()=>setStep("email")} style={{ ...S.btn, width:"100%", marginTop:8 }}>← Back</button>
        </>}

        {step==="profile" && <>
          <p style={{ fontSize:13, color:C.muted, margin:"0 0 14px" }}>Tell Maisie about you 🌿</p>
          <Field label="Your name">
            <input value={profile.name} onChange={e=>setProfile(p=>({...p,name:e.target.value}))} placeholder="e.g. Priya" style={{ ...S.input }}/>
          </Field>
          <Field label="Diet type">
            <select value={profile.dietType} onChange={e=>setProfile(p=>({...p,dietType:e.target.value}))} style={{ ...S.input }}>
              <option value="">No specific diet</option>
              {["Vegetarian","Vegan","Pescatarian","Keto","Gluten-free","Halal","Kosher"].map(d=><option key={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Health goal">
            <select value={profile.goal} onChange={e=>setProfile(p=>({...p,goal:e.target.value}))} style={{ ...S.input }}>
              <option value="">General wellness</option>
              {["Weight loss","Muscle gain","Maintain weight","Manage diabetes","Heart health"].map(g=><option key={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="Allergies (press Enter to add)">
            <TagInput values={profile.allergies} onChange={v=>setProfile(p=>({...p,allergies:v}))} placeholder="e.g. peanuts…"/>
          </Field>
          <Field label="Dislikes (press Enter to add)">
            <TagInput values={profile.dislikes} onChange={v=>setProfile(p=>({...p,dislikes:v}))} placeholder="e.g. mushrooms…"/>
          </Field>
          <button onClick={()=>{ if(!profile.name.trim()) return alert("Please enter your name."); onAuth({...profile,email}); }} style={{ ...S.btnP, width:"100%", marginTop:6 }}>
            Let's cook! 🍳
          </button>
        </>}
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [authed,   setAuthed]   = useState(()=>!!load(STORAGE_KEYS.user));
  const [user,     setUser]     = useState(()=>load(STORAGE_KEYS.user)||{});
  const [tab,      setTab]      = useState("Chat");
  const [cooking,  setCooking]  = useState(null);
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [saved,    setSaved]    = useState(()=>load(STORAGE_KEYS.saved)||[]);
  const [wishlist, setWishlist] = useState(()=>load(STORAGE_KEYS.wishlist)||[]);
  const [dietLog,  setDietLog]  = useState(()=>load(STORAGE_KEYS.diet)||[]);
  const [weightLog,setWeightLog]= useState(()=>load(STORAGE_KEYS.weight)||[]);
  const [showSave, setShowSave] = useState(false);
  const [pendingSave,setPendingSave] = useState(null);
  const [showWish, setShowWish] = useState(false);
  const [pendingWish,setPendingWish] = useState("");
  const [dietEntry,setDietEntry]= useState({meal:"",cal:"",note:""});
  const [wEntry,   setWEntry]   = useState({kg:"",note:""});
  const bottomRef = useRef(null);

  const persistUser  = (u)=>{ setUser(u);       persist(STORAGE_KEYS.user,u); };
  const persistSaved = (s)=>{ setSaved(s);       persist(STORAGE_KEYS.saved,s); };
  const persistWish  = (w)=>{ setWishlist(w);    persist(STORAGE_KEYS.wishlist,w); };
  const persistDiet  = (d)=>{ setDietLog(d);     persist(STORAGE_KEYS.diet,d); };
  const persistWeight= (w)=>{ setWeightLog(w);   persist(STORAGE_KEYS.weight,w); };

  useEffect(()=>{
    if (authed && messages.length===0) {
      setMessages([{ role:"assistant", content:`Welcome back, ${user.name||"friend"}! 🌿 I'm Chef Maisie — your kitchen companion. ${user.allergies?.length ? `I'll always avoid your allergens (${user.allergies.join(", ")}).` : ""} What shall we cook today?` }]);
    }
  },[authed]);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[messages,loading]);

  const sendMessage = async (text) => {
    const t = text || input.trim();
    if (!t || loading) return;
    setInput("");
    const newMsgs = [...messages, { role:"user", content:t }];
    setMessages(newMsgs);
    setLoading(true);
    try {
      const res  = await fetch(API_URL, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:      "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system:     buildSystemPrompt(user),
          messages:   newMsgs.map(m=>({ role:m.role, content:m.content })),
        }),
      });
      const data = await res.json();
      const reply = data.content?.map(b=>b.text||"").join("\n") || "Something went wrong — please try again.";
      setMessages([...newMsgs, { role:"assistant", content:reply }]);
    } catch {
      setMessages([...newMsgs, { role:"assistant", content:"Oops! Couldn't reach the kitchen. Please try again 🙏" }]);
    } finally { setLoading(false); }
  };

  const signOut = () => { setAuthed(false); setUser({}); persist(STORAGE_KEYS.user,null); setMessages([]); };

  if (!authed) return <LoginFlow onAuth={u=>{ persistUser(u); setAuthed(true); }}/>;
  if (cooking)  return <CookingShow recipe={cooking} onClose={()=>setCooking(null)}/>;

  const today = new Date().toLocaleDateString();

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#fdf8f3,#f5ede4,#eedfd0)", fontFamily:"Georgia,serif", display:"flex", flexDirection:"column" }}>
      <div style={{ height:4, background:`linear-gradient(90deg,${C.brand},${C.brandMid},${C.brand})` }}/>

      {/* Header */}
      <div style={{ padding:"13px 18px 10px", display:"flex", alignItems:"center", justifyContent:"space-between", background:C.surface, borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:26 }}>🫕</span>
          <div>
            <div style={{ fontWeight:700, fontSize:17, color:C.text }}>Chef Maisie</div>
            <div style={{ fontSize:12, color:C.muted }}>Hi, {user.name||"friend"} 👋</div>
          </div>
        </div>
        <button onClick={signOut} style={{ ...S.btn, fontSize:12, padding:"6px 12px" }}>Sign out</button>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", overflowX:"auto", background:"rgba(255,255,255,0.5)", borderBottom:`1px solid ${C.border}` }}>
        {TABS.map((t,i)=>(
          <button key={t} onClick={()=>setTab(t)} style={{ flex:"0 0 auto", padding:"11px 14px", border:"none", cursor:"pointer", background:tab===t?"rgba(181,113,74,0.13)":"transparent", color:tab===t?C.brand:C.muted, fontFamily:"inherit", fontSize:13, fontWeight:tab===t?600:400, borderBottom:tab===t?`2px solid ${C.brand}`:"2px solid transparent" }}>
            {TAB_ICONS[i]} {t}
          </button>
        ))}
      </div>

      <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column", maxWidth:680, width:"100%", margin:"0 auto", padding:"0 14px" }}>

        {/* ── CHAT ── */}
        {tab==="Chat" && <>
          <div style={{ flex:1, overflowY:"auto", padding:"18px 0 10px", display:"flex", flexDirection:"column", gap:12 }}>
            {messages.map((m,i)=>(
              <div key={i} style={{ display:"flex", flexDirection:m.role==="user"?"row-reverse":"row", gap:8, alignItems:"flex-start" }}>
                {m.role==="assistant" && <div style={{ width:34, height:34, borderRadius:"50%", background:`linear-gradient(135deg,${C.brandMid},${C.brand})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>🧑‍🍳</div>}
                <div style={{ maxWidth:"80%" }}>
                  <div style={{ padding:"10px 14px", background:m.role==="user"?`linear-gradient(135deg,${C.brand},#8a4d28)`:C.surface, color:m.role==="user"?"#fff":C.text, borderRadius:m.role==="user"?"16px 4px 16px 16px":"4px 16px 16px 16px", border:m.role==="assistant"?`1px solid ${C.border}`:"none", fontSize:14, lineHeight:1.6 }}>
                    {m.role==="assistant" ? formatMsg(m.content) : m.content}
                  </div>
                  {m.role==="assistant" && (
                    <div style={{ display:"flex", gap:6, marginTop:4 }}>
                      <button onClick={()=>{ setPendingSave(m.content); setShowSave(true); }} style={{ fontSize:11, color:C.muted, background:"none", border:"none", cursor:"pointer", padding:"2px 6px" }}>🔖 Save</button>
                      <button onClick={()=>{ const n=[...wishlist,{text:m.content.slice(0,60)+"…",date:today}]; persistWish(n); }} style={{ fontSize:11, color:C.muted, background:"none", border:"none", cursor:"pointer", padding:"2px 6px" }}>❤️ Wishlist</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display:"flex", gap:8 }}>
                <div style={{ width:34, height:34, borderRadius:"50%", background:`linear-gradient(135deg,${C.brandMid},${C.brand})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🧑‍🍳</div>
                <div style={{ padding:"10px 14px", background:C.surface, borderRadius:"4px 16px 16px 16px", border:`1px solid ${C.border}` }}><TypingDots/></div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>
          {/* quick prompts */}
          {messages.length <= 1 && (
            <div style={{ paddingBottom:8 }}>
              {["What can I cook with chicken, garlic and spinach?","Plan me a healthy week of meals","Walk me through making butter chicken","Suggest a quick 20-minute dinner"].map((p,i)=>(
                <button key={i} onClick={()=>sendMessage(p)} style={{ ...S.btn, display:"block", width:"100%", textAlign:"left", marginBottom:6, fontSize:13, color:C.text }}>💬 {p}</button>
              ))}
            </div>
          )}
          {/* input */}
          <div style={{ paddingBottom:18 }}>
            <div style={{ display:"flex", gap:8, alignItems:"flex-end", background:C.surface, borderRadius:14, border:`1px solid ${C.border}`, padding:"8px 8px 8px 14px" }}>
              <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}} placeholder="Ask Chef Maisie anything…" rows={1}
                style={{ flex:1, border:"none", outline:"none", background:"transparent", fontFamily:"inherit", fontSize:14, color:C.text, resize:"none", lineHeight:1.5, maxHeight:90, overflowY:"auto" }}/>
              <button onClick={()=>sendMessage()} disabled={!input.trim()||loading} style={{ width:36, height:36, borderRadius:9, border:"none", cursor:"pointer", background:input.trim()&&!loading?C.brand:"#ddd", color:"#fff", fontSize:17, display:"flex", alignItems:"center", justifyContent:"center" }}>↑</button>
            </div>
          </div>
        </>}

        {/* ── RECIPES ── */}
        {tab==="Recipes" && <RecipeBook onCook={setCooking} onChat={name=>{ setTab("Chat"); setTimeout(()=>sendMessage(`Give me the full recipe for ${name}`),100); }}/>}

        {/* ── SAVED ── */}
        {tab==="Saved" && (
          <div style={{ flex:1, overflowY:"auto", padding:"18px 0" }}>
            {saved.length===0 ? <Empty icon="🔖" msg="No saved recipes yet. Tap 'Save' under any Maisie message!"/> : saved.map((r,i)=>(
              <div key={i} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 14px", marginBottom:10 }}>
                <div style={{ fontWeight:600, color:C.text, fontSize:14, marginBottom:2 }}>{r.title}</div>
                <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>{r.date}</div>
                <div style={{ fontSize:13, color:C.text, lineHeight:1.5, maxHeight:72, overflow:"hidden" }}>{r.preview}</div>
                <div style={{ display:"flex", gap:8, marginTop:10 }}>
                  <button onClick={()=>setCooking(r.title)} style={{ ...S.btnP, fontSize:12, padding:"6px 12px" }}>▶ Animate</button>
                  <button onClick={()=>{ setTab("Chat"); setTimeout(()=>sendMessage(`Show me the full recipe for ${r.title}`),100); }} style={{ ...S.btn, fontSize:12, padding:"6px 12px" }}>💬 Chat</button>
                  <button onClick={()=>persistSaved(saved.filter((_,j)=>j!==i))} style={{ ...S.btn, fontSize:12, padding:"6px 12px", color:"#c0392b" }}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── WISHLIST ── */}
        {tab==="Wishlist" && (
          <div style={{ flex:1, overflowY:"auto", padding:"18px 0" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <p style={{ fontSize:13, color:C.muted, margin:0, fontStyle:"italic" }}>Recipes you want to try</p>
              <button onClick={()=>setShowWish(v=>!v)} style={{ ...S.btn, fontSize:12, padding:"6px 12px" }}>+ Add</button>
            </div>
            {showWish && (
              <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                <input value={pendingWish} onChange={e=>setPendingWish(e.target.value)} placeholder="e.g. Homemade ramen…" style={{ ...S.input }}/>
                <button onClick={()=>{ if(pendingWish.trim()){ persistWish([...wishlist,{text:pendingWish.trim(),date:today}]); setPendingWish(""); setShowWish(false); }}} style={{ ...S.btnP }}>Add</button>
              </div>
            )}
            {wishlist.length===0 ? <Empty icon="❤️" msg="Nothing on your wishlist yet!"/> : wishlist.map((w,i)=>(
              <div key={i} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"11px 14px", marginBottom:8, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <div style={{ fontSize:14, color:C.text }}>{w.text}</div>
                  <div style={{ fontSize:12, color:C.muted }}>{w.date}</div>
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <button onClick={()=>setCooking(w.text.replace("…",""))} style={{ ...S.btnP, fontSize:12, padding:"5px 10px" }}>▶</button>
                  <button onClick={()=>persistWish(wishlist.filter((_,j)=>j!==i))} style={{ ...S.btn, fontSize:12, padding:"5px 10px", color:"#c0392b" }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TRACKER ── */}
        {tab==="Tracker" && (
          <div style={{ flex:1, overflowY:"auto", padding:"18px 0" }}>
            <Section title="🥗 Diet log">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 80px", gap:8, marginBottom:8 }}>
                <input value={dietEntry.meal} onChange={e=>setDietEntry(d=>({...d,meal:e.target.value}))} placeholder="What did you eat?" style={{ ...S.input }}/>
                <input value={dietEntry.cal}  onChange={e=>setDietEntry(d=>({...d,cal:e.target.value}))}  placeholder="kcal" type="number" style={{ ...S.input }}/>
              </div>
              <input value={dietEntry.note} onChange={e=>setDietEntry(d=>({...d,note:e.target.value}))} placeholder="Notes (optional)" style={{ ...S.input, marginBottom:8 }}/>
              <button onClick={()=>{
                if (!dietEntry.meal.trim()) return;
                const e = { ...dietEntry, date:today, time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) };
                persistDiet([e,...dietLog]); setDietEntry({meal:"",cal:"",note:""});
              }} style={{ ...S.btnP, width:"100%" }}>Log meal</button>
              <div style={{ marginTop:12 }}>
                {dietLog.length===0 ? <p style={{ fontSize:13, color:C.muted, textAlign:"center" }}>No meals logged yet</p> : dietLog.slice(0,10).map((e,i)=>(
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${C.border}`, fontSize:13 }}>
                    <div>
                      <span style={{ color:C.text, fontWeight:500 }}>{e.meal}</span>
                      {e.note && <span style={{ color:C.muted }}> · {e.note}</span>}
                      <div style={{ color:C.muted, fontSize:11 }}>{e.date} {e.time}</div>
                    </div>
                    <span style={{ color:C.brand, fontWeight:500 }}>{e.cal?`${e.cal} kcal`:""}</span>
                  </div>
                ))}
                {dietLog.length>0 && (
                  <div style={{ marginTop:8, padding:"8px 10px", background:C.brandLight, borderRadius:8, fontSize:13, color:C.brand }}>
                    Today: <strong>{dietLog.filter(e=>e.date===today).reduce((s,e)=>s+(+e.cal||0),0)} kcal</strong>
                  </div>
                )}
              </div>
            </Section>

            <Section title="⚖️ Weight log">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                <input value={wEntry.kg}   onChange={e=>setWEntry(w=>({...w,kg:e.target.value}))}   placeholder="Weight (kg)" type="number" style={{ ...S.input }}/>
                <input value={wEntry.note} onChange={e=>setWEntry(w=>({...w,note:e.target.value}))} placeholder="Note"        style={{ ...S.input }}/>
              </div>
              <button onClick={()=>{
                if (!wEntry.kg) return;
                persistWeight([{...wEntry,date:today},...weightLog]); setWEntry({kg:"",note:""});
              }} style={{ ...S.btnP, width:"100%" }}>Log weight</button>
              <div style={{ marginTop:12 }}>
                {weightLog.length===0 ? <p style={{ fontSize:13, color:C.muted, textAlign:"center" }}>No entries yet</p> : weightLog.slice(0,8).map((e,i)=>(
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:`1px solid ${C.border}`, fontSize:13 }}>
                    <span style={{ color:C.muted }}>{e.date}{e.note?` · ${e.note}`:""}</span>
                    <span style={{ color:C.text, fontWeight:600 }}>{e.kg} kg</span>
                  </div>
                ))}
                {weightLog.length>=2 && (
                  <div style={{ marginTop:8, padding:"8px 10px", background:C.brandLight, borderRadius:8, fontSize:13, color:C.brand }}>
                    Change: <strong>{(+weightLog[0].kg - +weightLog[weightLog.length-1].kg).toFixed(1)} kg</strong> since you started
                  </div>
                )}
              </div>
            </Section>

            <div style={{ textAlign:"center" }}>
              <button onClick={()=>{ setTab("Chat"); setTimeout(()=>sendMessage("Based on what I've eaten today and my health goals, what should I have for my next meal?"),100); }} style={{ ...S.btnP }}>
                Ask Maisie for meal advice ↗
              </button>
            </div>
          </div>
        )}

        {/* ── PROFILE ── */}
        {tab==="Profile" && <ProfileTab user={user} onSave={u=>{ persistUser(u); }}/>}
      </div>

      {/* Save modal */}
      {showSave && (
        <Modal title="Save recipe" onClose={()=>setShowSave(false)}>
          {(()=>{ const [t,setT]=useState(()=>pendingSave?.split("\n").find(l=>l.trim())?.replace(/^#+\s*/,"").slice(0,50)||"");
            return <>
              <Field label="Recipe title"><input value={t} onChange={e=>setT(e.target.value)} style={{ ...S.input }}/></Field>
              <button onClick={()=>{ persistSaved([{title:t,preview:pendingSave?.slice(0,120)+"…",date:today},...saved]); setShowSave(false); }} style={{ ...S.btnP, width:"100%" }}>Save 🔖</button>
            </>; })()
          }
        </Modal>
      )}
    </div>
  );
}