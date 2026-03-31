/**
 * Neighborhood Data — Rich hyperlocal content for SEO/AEO.
 *
 * Each neighborhood has detailed local recommendations tailored to our
 * target avatars: tech founders, health/biohacking executives, ambitious
 * families, and investors.
 */

export interface Recommendation {
  name: string;
  type: string; // "gym", "restaurant", "coffee", "school", etc.
  description: string;
  address?: string;
  avatarFit?: string[]; // which avatars this appeals to
}

export interface SchoolInfo {
  name: string;
  type: "elementary" | "middle" | "high" | "charter" | "private";
  rating: string; // e.g., "9/10" or "A+"
  district: string;
  notes?: string;
}

export interface NeighborhoodData {
  slug: string;
  name: string;
  zips: string[];
  searchQuery: string;
  heroTagline: string;
  overview: string;
  vibe: string;
  whyEntrepreneurs: string;
  whyFamilies: string;
  whyHealth: string;
  whyInvestors: string;
  medianPrice: string;
  priceRange: string;
  avgSqft: string;
  walkScore: number;
  commuteDowntown: string;
  schools: SchoolInfo[];
  fitness: Recommendation[];
  restaurants: Recommendation[];
  coffee: Recommendation[];
  wellness: Recommendation[];
  coworking: Recommendation[];
  outdoors: Recommendation[];
  grocery: Recommendation[];
  familyFriendly: Recommendation[];
  localSecrets: string[];
  avatarScores: Record<string, number>;
}

export const NEIGHBORHOODS: NeighborhoodData[] = [
  {
    slug: "downtown",
    name: "Downtown Austin",
    zips: ["78701"],
    searchQuery: "78701",
    heroTagline: "Where Austin's energy converges. Tech, culture, and ambition on every block.",
    overview:
      "Downtown Austin is the city's beating heart — a dense, walkable core where tech companies, world-class restaurants, live music venues, and luxury high-rises coexist within a few square miles. Lady Bird Lake runs along the southern edge, offering 10+ miles of hike-and-bike trails. Congress Avenue anchors the district with everything from the Texas Capitol to Michelin-recognized dining. If you want to be in the center of everything Austin offers — professionally, socially, and culturally — this is it.",
    vibe: "High-energy, urban, ambitious. The kind of place where you run into three people you know at the coffee shop and accidentally end up at a pitch event. Skews younger (25-40), tech-heavy, and lifestyle-forward.",
    whyEntrepreneurs:
      "Downtown is Austin's startup nerve center. Capital Factory, WeWork, and dozens of coworking spaces are within walking distance. The density of founders per square block is probably the highest in Texas. Investors take meetings at Houndstooth Coffee. Deals get done at Uchi. If you're building something and need to be where the action is, downtown is non-negotiable.",
    whyFamilies:
      "Honest take: downtown isn't the top choice for families with young kids. Schools in 78701 are limited, green space requires Lady Bird Lake access (which is excellent, but not a backyard), and the nightlife scene can be loud on weekends. That said, a small number of families make it work in the quieter residential pockets west of Congress — especially those with older kids who thrive in urban environments.",
    whyHealth:
      "Downtown is surprisingly strong for the health-obsessed. The trail system along Lady Bird Lake is world-class for running and cycling. Equinox is opening. Multiple boutique fitness studios (SoulCycle, Barry's, [solidcore]) are within walking distance. Cold plunge and sauna access at select fitness clubs. Whole Foods flagship is right on Lamar. The density makes it easy to walk everywhere, which adds up to 8,000+ steps without trying.",
    whyInvestors:
      "High entry price but strong appreciation history. Condo market is liquid with steady demand from tech workers relocating. Short-term rental regulations are strict in 78701 — long-term rental demand is high. Cap rates are compressed (3-4%) but value holds. Best for appreciation plays, not cash flow.",
    medianPrice: "$650K",
    priceRange: "$350K (studio condo) — $5M+ (penthouse)",
    avgSqft: "1,100",
    walkScore: 92,
    commuteDowntown: "You're already here",
    schools: [
      { name: "Austin ISD Various", type: "elementary", rating: "6/10", district: "Austin ISD", notes: "Limited options in the immediate 78701 area" },
      { name: "KIPP Austin", type: "charter", rating: "8/10", district: "KIPP", notes: "Charter option with strong academics" },
    ],
    fitness: [
      { name: "Castle Hill Fitness", type: "gym", description: "Austin's premier independent gym. Full facility with pool, classes, personal training, and a rooftop deck. The gym where founders and execs train.", address: "1112 N Lamar Blvd", avatarFit: ["tech-founder", "biohacker-exec"] },
      { name: "Barry's Bootcamp", type: "gym", description: "High-intensity interval training. Red-lit rooms, loud music, and a cult following. Perfect for type-A personalities who want to be destroyed in 50 minutes.", address: "2nd Street District", avatarFit: ["tech-founder", "biohacker-exec"] },
      { name: "[solidcore]", type: "gym", description: "Pilates on a Megaformer. Deceptively hard. The shaking-on-a-reformer-at-8am crowd.", address: "2nd Street District", avatarFit: ["biohacker-exec"] },
      { name: "Lady Bird Lake Trail", type: "outdoor", description: "10.1-mile hike-and-bike trail loop around the lake. Austin's most used outdoor fitness facility. Free. Run, bike, paddleboard, or just walk and think.", avatarFit: ["tech-founder", "biohacker-exec", "young-family"] },
      { name: "Town Lake YMCA", type: "gym", description: "Full gym with pool right on the trail. Surprisingly solid facility for the price. Family memberships available.", avatarFit: ["young-family"] },
    ],
    restaurants: [
      { name: "Uchi", type: "restaurant", description: "James Beard Award-winning Japanese farmhouse dining. Where deals get closed and celebrations happen. The hot rock wagyu is non-negotiable.", avatarFit: ["tech-founder", "biohacker-exec"] },
      { name: "Emmer & Rye", type: "restaurant", description: "Farm-to-table with a dim sum cart concept. Inventive, seasonal, and one of Austin's best. The kind of place food-obsessed entrepreneurs love.", avatarFit: ["tech-founder", "biohacker-exec"] },
      { name: "Odd Duck", type: "restaurant", description: "Shared plates, hyper-local sourcing. The menu changes constantly based on what farms deliver. Great for adventurous eaters.", avatarFit: ["tech-founder", "biohacker-exec"] },
      { name: "True Food Kitchen", type: "restaurant", description: "Dr. Andrew Weil's anti-inflammatory menu concept. Clean eating without sacrificing flavor. The biohacker's business lunch spot.", avatarFit: ["biohacker-exec"] },
      { name: "Salty Sow", type: "restaurant", description: "Gastropub with a serious kitchen. Great brunch with kids, serious dinner without them.", avatarFit: ["young-family"] },
    ],
    coffee: [
      { name: "Houndstooth Coffee", type: "coffee", description: "Third-wave coffee in a clean, minimal space. Where founders take investor meetings. The cortado is perfect.", avatarFit: ["tech-founder"] },
      { name: "Merit Coffee", type: "coffee", description: "Texas-roasted specialty coffee. Multiple downtown locations. Fast wifi, good seating, excellent pour-overs.", avatarFit: ["tech-founder"] },
      { name: "Fleet Coffee", type: "coffee", description: "Tiny, impeccable coffee bar. No wifi, no laptops — just really good coffee. For when you need to actually think instead of work.", avatarFit: ["tech-founder", "biohacker-exec"] },
    ],
    wellness: [
      { name: "Kryolife", type: "wellness", description: "Cryotherapy, infrared sauna, compression boots, red light therapy. Full biohacking menu. Walk in or membership.", avatarFit: ["biohacker-exec"] },
      { name: "Restore Hyper Wellness", type: "wellness", description: "IV drips, cryotherapy, hyperbaric oxygen, red light therapy. The biohacker's pit stop. Multiple Austin locations.", avatarFit: ["biohacker-exec"] },
      { name: "Zero Gravity Float Center", type: "wellness", description: "Sensory deprivation float tanks. 60-90 minute sessions in complete darkness and silence. Surprisingly popular with founders for creative problem-solving.", avatarFit: ["biohacker-exec", "tech-founder"] },
    ],
    coworking: [
      { name: "Capital Factory", type: "coworking", description: "Austin's startup epicenter. Not just coworking — it's a startup accelerator, event space, and investor network. If you're building a tech company, you need to be here at least part-time.", avatarFit: ["tech-founder"] },
      { name: "WeWork Congress", type: "coworking", description: "Reliable coworking with private offices and meeting rooms. Good for established companies that need space flexibility.", avatarFit: ["tech-founder"] },
      { name: "Industrious", type: "coworking", description: "Premium coworking. Quieter, more polished than WeWork. Good for execs who need focus time and occasional meeting space.", avatarFit: ["tech-founder", "biohacker-exec"] },
    ],
    outdoors: [
      { name: "Lady Bird Lake", type: "park", description: "Paddleboard, kayak, run the trail, or just sit on the dock at The Hive and watch the bats. Austin's crown jewel.", avatarFit: ["tech-founder", "biohacker-exec", "young-family"] },
      { name: "Zilker Park", type: "park", description: "Technically just south of downtown, but it's part of the lifestyle. 350 acres, Barton Springs Pool, ACL Festival grounds, and the Zilker Botanical Garden.", avatarFit: ["young-family"] },
      { name: "Republic Square Park", type: "park", description: "Downtown's main green space. Farmers market on Saturdays. Good for a quick outdoor lunch break.", avatarFit: ["tech-founder"] },
    ],
    grocery: [
      { name: "Whole Foods Lamar", type: "grocery", description: "The flagship store. Not just groceries — it's a food hall, bar, and social scene. The rooftop is where Austin happens on Sunday afternoons.", avatarFit: ["biohacker-exec", "tech-founder"] },
      { name: "Trader Joe's Seaholm", type: "grocery", description: "Standard TJ's in the Seaholm District. Walkable from most downtown residences.", avatarFit: ["tech-founder", "young-family"] },
    ],
    familyFriendly: [
      { name: "Austin Children's Museum (Thinkery)", type: "activity", description: "Interactive STEM museum for kids. Actually engaging — not just a play area with a gift shop.", avatarFit: ["young-family"] },
      { name: "Zilker Botanical Garden", type: "park", description: "Beautiful gardens with paths kids love to explore. Koi pond is the highlight for under-5s.", avatarFit: ["young-family"] },
    ],
    localSecrets: [
      "The bats emerge from Congress Avenue Bridge at sunset from March to November. 1.5 million Mexican free-tailed bats. Bring a date or a client — it never gets old.",
      "The trail under MoPac bridge is the best swimming hole downtown that most people don't know about.",
      "Scholz Garten is the oldest restaurant in Texas (1866) and still serves cheap beer in a biergarten. Hidden in plain sight.",
      "The Pfluger Pedestrian Bridge at golden hour is the most photographed spot in Austin — and it's still worth it.",
    ],
    avatarScores: { "tech-founder": 5, "biohacker-exec": 3, "young-family": 1, investor: 3 },
  },

  {
    slug: "78704",
    name: "78704 — South Austin",
    zips: ["78704"],
    searchQuery: "78704",
    heroTagline: "The soul of Austin. Where local isn't a marketing word — it's a way of life.",
    overview:
      "78704 is Austin's most iconic zip code — a sprawling South Austin territory that encompasses South Congress (SoCo), South Lamar, Zilker, Barton Hills, and Bouldin Creek. This is where Austin's weird reputation was born and still lives. Independent restaurants, vintage shops, food trucks, live music, and fiercely local businesses define the area. Zilker Park and Barton Springs Pool are the neighborhood's backyard. The homes range from charming 1950s bungalows to modern new builds, and the price reflects the demand — 78704 is one of the most competitive zip codes in Texas.",
    vibe: "Eclectic, creative, fiercely local. The kind of place where your neighbor is a musician, a startup founder, and a yoga instructor — sometimes all three. Strong community identity. Anti-corporate without being anti-success.",
    whyEntrepreneurs:
      "78704 is where Austin's creative class lives. The density of independent businesses, artists, and founders creates a vibe that's simultaneously relaxed and ambitious. South Congress is walkable, the food scene is unmatched, and the community actively supports local makers and builders. If you want to live somewhere that feels like a movement, not just a neighborhood, this is it. Multiple coworking options on South Lamar.",
    whyFamilies:
      "Strong family presence, especially in Zilker and Barton Hills. Zilker Elementary is a sought-after campus. The parks are incredible — Zilker, Barton Springs, Barton Creek Greenbelt — and kids grow up swimming in natural springs and hiking limestone trails. The SoCo vibe is family-friendly during the day (strollers on South Congress are a common sight). Downside: homes with 4+ bedrooms in 78704 are rare and expensive.",
    whyHealth:
      "This is arguably Austin's best neighborhood for outdoor fitness. Barton Creek Greenbelt offers miles of trail running, rock climbing, and swimming holes. Barton Springs Pool is a 68-degree spring-fed pool that's basically a year-round cold plunge. Multiple yoga studios, CrossFit boxes, and boutique gyms. Whole Foods and local organic markets nearby. The lifestyle here naturally aligns with health optimization.",
    whyInvestors:
      "78704 has been one of Austin's strongest appreciation stories for the past decade. Limited supply (older housing stock on large lots), massive demand, and a cultural cachet that isn't going away. ADU potential on many lots. Short-term rentals are regulated but some areas still allow. Value-add opportunities exist in original bungalows that can be renovated. Expect to pay a premium — this zip code earns it.",
    medianPrice: "$825K",
    priceRange: "$400K (condo) — $3M+ (new build on large lot)",
    avgSqft: "1,600",
    walkScore: 72,
    commuteDowntown: "5-15 min (depending on which part of 78704)",
    schools: [
      { name: "Zilker Elementary", type: "elementary", rating: "8/10", district: "Austin ISD", notes: "One of AISD's most sought-after campuses. Strong parent involvement." },
      { name: "Becker Elementary", type: "elementary", rating: "7/10", district: "Austin ISD" },
      { name: "Casis Elementary", type: "elementary", rating: "9/10", district: "Austin ISD", notes: "Near the Zilker/Barton Hills border. Excellent ratings." },
      { name: "O. Henry Middle School", type: "middle", rating: "7/10", district: "Austin ISD" },
      { name: "Austin High School", type: "high", rating: "7/10", district: "Austin ISD", notes: "Large campus, strong athletics, good college placement." },
    ],
    fitness: [
      { name: "Barton Springs Pool", type: "outdoor", description: "68-degree spring-fed pool, open year-round. Three acres of natural swimming. Austin's original cold plunge — decades before it was trendy. $9 entry or free before 8am.", address: "2131 William Barton Dr", avatarFit: ["biohacker-exec", "tech-founder"] },
      { name: "CrossFit Central", type: "gym", description: "One of the original CrossFit affiliates in Austin. Strong community, serious programming. The 6am class is where you'll find half the founders in 78704.", address: "1309 S Lamar Blvd", avatarFit: ["biohacker-exec", "tech-founder"] },
      { name: "Black Swan Yoga", type: "gym", description: "Donation-based hot yoga in a warehouse. Dark room, loud music, intense heat. Not your gentle stretching class. Community-driven.", address: "1417 S 1st St", avatarFit: ["biohacker-exec", "tech-founder"] },
      { name: "Barton Creek Greenbelt", type: "outdoor", description: "7.9 miles of limestone trails through Austin's Hill Country. Trail running, rock climbing, swimming holes. The Sculpture Falls trail is the locals' favorite.", avatarFit: ["biohacker-exec", "tech-founder", "young-family"] },
      { name: "Austin Bouldering Project", type: "gym", description: "World's largest climbing gym (in the ABP North location, but the culture starts here). Bouldering, fitness, yoga, and a strong social community.", address: "979 Springdale Rd (East)", avatarFit: ["tech-founder", "biohacker-exec"] },
    ],
    restaurants: [
      { name: "Loro", type: "restaurant", description: "Asian smokehouse from the Uchi and Franklin Barbecue teams. Brisket fried rice, smoked salmon dip, and Thai-inspired cocktails. The best patio in 78704.", avatarFit: ["tech-founder", "biohacker-exec"] },
      { name: "Elizabeth Street Café", type: "restaurant", description: "French-Vietnamese bakery and restaurant. Pastel interiors, excellent pho, and the best pastry case in South Austin. Great for a client breakfast.", avatarFit: ["tech-founder"] },
      { name: "Perla's", type: "restaurant", description: "Oyster bar and seafood on South Congress. See and be seen. Great wine list and the cedar-plank salmon is a go-to for the health-conscious.", avatarFit: ["biohacker-exec", "tech-founder"] },
      { name: "Matt's El Rancho", type: "restaurant", description: "Austin's oldest Tex-Mex institution (since 1952). Not trendy, not trying to be. Just honest, excellent Tex-Mex with generations of family history. The Bob Armstrong dip is legendary.", avatarFit: ["young-family"] },
      { name: "Sway", type: "restaurant", description: "Northern Thai. Fresh, bright, and absolutely delicious. The papaya salad and whole fish are standouts. Great for a health-conscious date night.", avatarFit: ["biohacker-exec"] },
    ],
    coffee: [
      { name: "Jo's Coffee", type: "coffee", description: "The original SoCo coffee shop. Home of the 'I love you so much' mural. Tourist-famous but still genuinely great coffee and the best people-watching patio in Austin.", avatarFit: ["tech-founder"] },
      { name: "Radio Coffee & Beer", type: "coffee", description: "Outdoor coffee and beer garden with food trucks. Spacious, shaded, and perfect for working outside. Live music some evenings.", address: "4204 Manchaca Rd", avatarFit: ["tech-founder"] },
      { name: "Patika", type: "coffee", description: "Specialty coffee and light food. Clean, modern space. Good wifi, good drinks, good vibes. The avocado toast is actually worth it.", address: "2159 S Lamar Blvd", avatarFit: ["tech-founder", "biohacker-exec"] },
    ],
    wellness: [
      { name: "Barton Springs (as cold plunge)", type: "wellness", description: "68°F year-round. A natural cold plunge that predates Wim Hof by a century. Regulars go daily at dawn. It's not just exercise — it's a spiritual practice for some.", avatarFit: ["biohacker-exec"] },
      { name: "Restore Hyper Wellness South Lamar", type: "wellness", description: "Cryo, IV drips, red light therapy, compression boots. The full biohacking menu south of the river.", address: "South Lamar", avatarFit: ["biohacker-exec"] },
      { name: "Mantis Massage", type: "wellness", description: "Deep tissue and sports massage. Popular with CrossFit and trail-running crowd. Book ahead.", avatarFit: ["biohacker-exec"] },
    ],
    coworking: [
      { name: "Createscape", type: "coworking", description: "Quiet, productivity-focused coworking. No phone calls, no meetings — just deep work. Pomodoro method built into the space. Perfect for founders who need focus time.", address: "701 Tillery St (East — but popular with 78704 residents)", avatarFit: ["tech-founder"] },
      { name: "Parachute Coworking", type: "coworking", description: "Community-driven coworking on South 1st. Monthly memberships, day passes, and private offices.", avatarFit: ["tech-founder"] },
    ],
    outdoors: [
      { name: "Zilker Park", type: "park", description: "350 acres of Austin's most beloved green space. Kite festival, ACL, Zilker Hillside Theater, botanical garden, and the Barton Springs entry point. If you have kids, this is your backyard.", avatarFit: ["young-family", "tech-founder", "biohacker-exec"] },
      { name: "Barton Creek Greenbelt", type: "park", description: "Miles of trails, swimming holes, and rock climbing. Twin Falls and Sculpture Falls are the must-hit spots. Bring water shoes.", avatarFit: ["biohacker-exec", "tech-founder", "young-family"] },
      { name: "South Congress Walking", type: "outdoor", description: "SoCo itself is a walking experience — boutiques, murals, food trucks, and people-watching from 1st to Oltorf. Best on a Saturday morning.", avatarFit: ["tech-founder", "young-family"] },
    ],
    grocery: [
      { name: "Wheatsville Co-op", type: "grocery", description: "Austin's only cooperatively-owned grocery. Local, organic, and unapologetically Austin. The deli and hot bar are excellent.", address: "South Lamar", avatarFit: ["biohacker-exec"] },
      { name: "Natural Grocers", type: "grocery", description: "Organic focus, supplement wall, and competitive pricing on clean-label products. No loyalty card games.", avatarFit: ["biohacker-exec"] },
      { name: "H-E-B South Congress", type: "grocery", description: "Texas's beloved grocery chain. This location has a solid organic section and is walkable from much of 78704.", avatarFit: ["young-family", "tech-founder"] },
    ],
    familyFriendly: [
      { name: "Zilker Nature Preserve", type: "park", description: "Trails, dinosaur tracks, and wildlife. Educational and free. Kids love the boardwalk through the wetlands.", avatarFit: ["young-family"] },
      { name: "Peter Pan Mini-Golf", type: "activity", description: "Vintage mini-golf since 1948. Two courses, BYOB, and a vibe that hasn't changed in decades. Austin institution.", avatarFit: ["young-family"] },
      { name: "Zilker Zephyr (replaced by trail)", type: "activity", description: "The train is gone but the trail around Zilker is perfect for family bike rides. Rent bikes at Barton Springs Bike Rental.", avatarFit: ["young-family"] },
    ],
    localSecrets: [
      "The sunrise swim at Barton Springs (before 8am, it's free) is the best-kept morning routine in Austin. 68 degrees, steam rising off the water, almost nobody there.",
      "Twin Falls on the Greenbelt is the locals' swimming hole. Skip Sculpture Falls on weekends (crowded) and hit Twin Falls midweek.",
      "South 1st Street is becoming the new South Congress — same vibe, lower rents, more interesting shops. Watch this corridor.",
      "The food truck lot at South Lamar and Barton Springs Road has some of Austin's best hidden gems. Veracruz All Natural started as a food truck here.",
    ],
    avatarScores: { "tech-founder": 5, "biohacker-exec": 4, "young-family": 3, investor: 4 },
  },

  {
    slug: "westlake",
    name: "Westlake",
    zips: ["78746", "78733"],
    searchQuery: "Westlake",
    heroTagline: "Austin's premier address. Top schools, Hill Country views, and quiet ambition.",
    overview:
      "Westlake Hills and Rollingwood sit just west of downtown Austin, tucked into the rolling limestone hills above Lake Austin and the Colorado River. This is Austin's most established luxury enclave — where CEOs, fund managers, and senior tech executives raise their families behind the gates of Eanes ISD, consistently one of the top-rated school districts in Texas. The homes are larger, the lots are bigger, the trees are taller, and the streets are quieter. It's suburbs, but with a Hill Country backdrop that makes it feel like you're living in a resort.",
    vibe: "Polished, family-oriented, quietly affluent. Not flashy — Westlake wealth is understated. You'll see Range Rovers and Teslas in school pickup lines, but the vibe is community-driven, not status-driven. Friday night football at Westlake High is genuinely a thing the whole community shows up for.",
    whyEntrepreneurs:
      "Many of Austin's most successful founders and tech execs live in Westlake — not because it's hip, but because Eanes ISD is non-negotiable when you have kids and the commute to downtown is 15 minutes. The trade-off is less walkability and nightlife, but the homes have office space, the internet is fast, and the quiet streets are ideal for deep work. You'll find your people at Westlake Pickleball Club or the hill country trail runs.",
    whyFamilies:
      "This is the #1 neighborhood in Austin for families, full stop. Eanes ISD is routinely ranked in the top 10 districts in Texas. Westlake High School has nationally recognized academics and athletics. The community is deeply invested in schools — parent involvement is extraordinary. Parks, sports leagues, and family activities are abundant. The downside: prices reflect the school district premium. You're paying for Eanes ISD, and it's worth it.",
    whyHealth:
      "Westlake is quietly one of Austin's best neighborhoods for the health-conscious. The Hill Country terrain is perfect for trail running (Wild Basin, St. Edwards Park). Lake Austin offers paddleboarding and kayaking. Multiple premium gyms and yoga studios. The homes have space for garage gyms, pools, and cold plunge setups. Clean air, low traffic, and lots of natural green space. It's the opposite of downtown's gym culture — out here, fitness is outdoor and private.",
    whyInvestors:
      "Westlake is a hold-and-appreciate market, not a cash-flow play. Values are high but stable, driven by the school district premium. Properties rarely sit on the market. Teardown lots can make sense for custom builds. Not ideal for rental income — best for personal residence with long-term appreciation as the wealth engine.",
    medianPrice: "$1.8M",
    priceRange: "$650K (condo/smaller home) — $12M+ (estate)",
    avgSqft: "3,200",
    walkScore: 25,
    commuteDowntown: "12-20 min",
    schools: [
      { name: "Eanes Elementary", type: "elementary", rating: "10/10", district: "Eanes ISD", notes: "Top-rated campus in a top-rated district." },
      { name: "Bridge Point Elementary", type: "elementary", rating: "10/10", district: "Eanes ISD" },
      { name: "Cedar Creek Elementary", type: "elementary", rating: "10/10", district: "Eanes ISD" },
      { name: "Hill Country Middle School", type: "middle", rating: "9/10", district: "Eanes ISD" },
      { name: "Westlake High School", type: "high", rating: "10/10", district: "Eanes ISD", notes: "One of the top public high schools in Texas. Strong academics, nationally ranked athletics (especially football), and excellent college placement." },
      { name: "The Emery/Weiss School", type: "private", rating: "A+", district: "Private", notes: "Progressive private school for gifted students." },
    ],
    fitness: [
      { name: "Westlake Pickleball Club", type: "gym", description: "If you haven't noticed, pickleball has taken over Westlake. Dedicated courts, leagues, and a surprisingly intense competitive scene. Great networking opportunity.", avatarFit: ["biohacker-exec", "tech-founder"] },
      { name: "Lifetime Fitness", type: "gym", description: "Full-service athletic club with pool, tennis, basketball, climbing wall, spa, and kids' activities. The suburban answer to Equinox. Family memberships.", address: "Bee Cave Rd", avatarFit: ["biohacker-exec", "young-family"] },
      { name: "Wild Basin Wilderness Preserve", type: "outdoor", description: "2.5 miles of Hill Country trails minutes from home. Moderate difficulty, limestone terrain, and Hill Country views. Morning runs here are meditative.", avatarFit: ["biohacker-exec"] },
      { name: "St. Edwards Park", type: "outdoor", description: "Overlooking Bull Creek. Trails, waterfalls, and swimming holes. Less crowded than the Greenbelt. A local secret for trail runners.", avatarFit: ["biohacker-exec", "young-family"] },
      { name: "Bee Cave CrossFit", type: "gym", description: "Strong CrossFit community on the west side. 5:30am class is the exec crowd.", avatarFit: ["biohacker-exec"] },
    ],
    restaurants: [
      { name: "Trattoria Lisina", type: "restaurant", description: "Italian farmhouse dining in Driftwood, just south of Westlake. Weekend cooking classes, wine cave, and a bocce court. Special occasion spot.", avatarFit: ["tech-founder", "biohacker-exec"] },
      { name: "Bartlett's", type: "restaurant", description: "Farm-to-table in the heart of Westlake. Seasonal menu, excellent wine list. Where Westlake families celebrate. Great brunch.", address: "2408 W Anderson Ln", avatarFit: ["young-family", "tech-founder"] },
      { name: "County Line BBQ", type: "restaurant", description: "Hill Country BBQ with a view. Not a brisket snob spot — a family-friendly, classic Texas BBQ experience with the best outdoor deck west of downtown.", avatarFit: ["young-family"] },
      { name: "Café Blue", type: "restaurant", description: "Upscale Mediterranean seafood. Consistently excellent. Popular for business dinners and anniversaries.", address: "Bee Cave", avatarFit: ["tech-founder", "biohacker-exec"] },
    ],
    coffee: [
      { name: "Summer Moon Coffee", type: "coffee", description: "Wood-fired coffee roasting. Their Moon Milk is a cult favorite. Multiple West Austin locations.", avatarFit: ["tech-founder", "young-family"] },
      { name: "Merit Coffee Bee Cave", type: "coffee", description: "Texas-roasted specialty coffee. Clean space, fast wifi, and excellent espresso.", avatarFit: ["tech-founder"] },
    ],
    wellness: [
      { name: "Onnit Gym", type: "wellness", description: "Founded by Aubrey Marcus. Unconventional training, steel mace, battle ropes, and a strong biohacking philosophy. The gym for people who think about optimization. Has float tanks and sauna.", address: "4401 Freidrich Ln (South Austin, but Westlake residents drive here)", avatarFit: ["biohacker-exec"] },
      { name: "Pure Skin & Wellness", type: "wellness", description: "IV therapy, wellness facials, and functional health services. Popular with the Westlake mom and exec crowd.", avatarFit: ["biohacker-exec"] },
    ],
    coworking: [
      { name: "Roam Workspace", type: "coworking", description: "Premium coworking in the Davenport Village area. Private offices, meeting rooms, and a polished environment. Popular with Westlake-based execs and consultants.", avatarFit: ["tech-founder"] },
    ],
    outdoors: [
      { name: "Lake Austin", type: "park", description: "Paddleboarding, kayaking, and boating on the Colorado River. Several public access points from Westlake. Sunrise paddles are extraordinary.", avatarFit: ["biohacker-exec", "young-family"] },
      { name: "Hamilton Pool Preserve", type: "park", description: "25 minutes from Westlake. A collapsed grotto with a 50-foot waterfall into a jade pool. Reservation required. One of the most beautiful natural spots in Texas.", avatarFit: ["biohacker-exec", "young-family"] },
      { name: "Commons Ford Ranch Metro Park", type: "park", description: "River access, bird watching, and wildflower meadows. Quiet, underrated, and genuinely peaceful.", avatarFit: ["young-family", "biohacker-exec"] },
    ],
    grocery: [
      { name: "Whole Foods Bee Cave", type: "grocery", description: "Large format WF with hot bar, prepared foods, and a solid supplement section. The Westlake grocery run.", avatarFit: ["biohacker-exec", "young-family"] },
      { name: "Randalls (Tom Thumb)", type: "grocery", description: "Convenient, good produce, and the pharmacy is reliable. Not sexy, but functional.", avatarFit: ["young-family"] },
      { name: "H-E-B Bee Cave", type: "grocery", description: "Full-service H-E-B with an excellent organic section. The prepared foods and sushi are surprisingly good.", avatarFit: ["young-family"] },
    ],
    familyFriendly: [
      { name: "Bee Cave Central Park", type: "park", description: "Splash pad, playground, and walking trails. The go-to weekend spot for Westlake families with younger kids.", avatarFit: ["young-family"] },
      { name: "Westlake High School Football", type: "activity", description: "Friday night lights. Westlake Chaparrals football is a state powerhouse and a genuine community bonding experience. Even if you don't have kids at the school, go once.", avatarFit: ["young-family"] },
      { name: "Hill Country Galleria", type: "activity", description: "Outdoor shopping and dining center. Movies, restaurants, and seasonal events. Family-friendly evening outings.", avatarFit: ["young-family"] },
    ],
    localSecrets: [
      "The secret swimming hole at Bull Creek off Old Spicewood Springs Rd is the locals' alternative to Barton Springs — less crowded, equally cold, and free.",
      "Westlake Brewing Company is a new-ish addition that's become the neighborhood's gathering spot for dads who need a beer after soccer practice.",
      "The Pennybacker Bridge (360 Bridge) overlook at sunset is the most dramatic view in Austin. Park at the trailhead and walk 10 minutes to the cliff edge.",
      "Many of Austin's top tech founders live in Westlake but you'd never know it — the culture here is aggressively low-key about money.",
    ],
    avatarScores: { "tech-founder": 3, "biohacker-exec": 5, "young-family": 5, investor: 2 },
  },

  {
    slug: "east-side",
    name: "East Austin",
    zips: ["78702", "78721"],
    searchQuery: "78702",
    heroTagline: "Where Austin reinvents itself every year. Creative, fast-moving, and full of upside.",
    overview:
      "East Austin is the city's most dynamic neighborhood — a former industrial corridor that has transformed into a hotbed of craft breweries, art galleries, restaurants, tech offices, and new residential development. The change has been dramatic and fast: streets that were warehouses a decade ago now have $1M+ modern homes next to original bungalows, taquerias next to tasting menus, and food trucks next to venture-backed startups. The energy here is tangible. East Austin attracts people who want to be early to the next thing — and in Austin real estate, this is the next thing.",
    vibe: "Creative, entrepreneurial, diverse, rapidly evolving. The neighborhood still has grit and character, but the polish is arriving fast. Skews younger, tech-adjacent, and culturally engaged. Not suburban — this is urban Austin.",
    whyEntrepreneurs:
      "East Austin has become Austin's second tech hub. Companies like Indeed and Google have offices east of I-35, and the creative density attracts founders who find downtown too corporate and 78704 too competitive. Rents are lower, the food scene is arguably Austin's best, and the coworking options (WeWork East, Vessel Coworking) are growing. This is where Austin's next generation of companies are being built — in converted warehouses and live/work lofts.",
    whyFamilies:
      "East Austin is family-friendly in spots but not uniformly. Mueller (78723, adjacent) is the family epicenter — master-planned, walkable, great parks. In 78702, families tend to cluster in the quieter residential streets south of 7th Street. Schools in AISD's eastern zone have been improving, and several charter options (KIPP, Harmony) are strong. The diversity of the neighborhood is a genuine draw for families who want their kids to grow up in a culturally rich environment.",
    whyHealth:
      "East Austin's fitness scene is young, scrappy, and growing. CrossFit East Austin is a strong box. Austin Bouldering Project — the world's largest climbing gym — is a destination facility. The trail along the east side of Lady Bird Lake connects to the full loop. Several yoga studios and boutique gyms. The food scene supports clean eating with places like Citizen Eatery (plant-based) and Sour Duck Market. Less polished than Westlake's wellness scene, but more authentic.",
    whyInvestors:
      "East Austin is the single best investment market in Austin right now. Appreciation has been explosive — properties bought in 2015 have 2-3x'd. The development pipeline is massive (East Riverside corridor, South Central Waterfront planned). ADU-friendly zoning on many lots. Strong rental demand from young professionals. Multi-family opportunities exist. STR regulations are evolving — check current rules. The risk: you're paying for anticipated future value, not current fundamentals. But the trajectory is clear.",
    medianPrice: "$625K",
    priceRange: "$350K (condo) — $2M+ (new build)",
    avgSqft: "1,400",
    walkScore: 78,
    commuteDowntown: "5-10 min",
    schools: [
      { name: "Zavala Elementary", type: "elementary", rating: "6/10", district: "Austin ISD", notes: "Dual-language program, improving rapidly" },
      { name: "Blackshear Elementary", type: "elementary", rating: "6/10", district: "Austin ISD", notes: "Fine arts magnet, strong community" },
      { name: "Martin Middle School", type: "middle", rating: "5/10", district: "Austin ISD" },
      { name: "KIPP Austin Obra", type: "charter", rating: "8/10", district: "KIPP", notes: "High-performing charter, strong for college prep" },
      { name: "Eastside Memorial High", type: "high", rating: "5/10", district: "Austin ISD", notes: "Improving — new programs and investment" },
    ],
    fitness: [
      { name: "Austin Bouldering Project", type: "gym", description: "32,000 sq ft of climbing walls, fitness area, yoga studio, and a community-driven atmosphere that feels more like a social club than a gym. World's largest bouldering gym. Date night, networking event, and workout in one.", address: "979 Springdale Rd", avatarFit: ["tech-founder", "biohacker-exec"] },
      { name: "CrossFit East Austin", type: "gym", description: "Solid CrossFit box with a welcoming community. 5:30am crew is small but committed. Good coaching, unpretentious.", avatarFit: ["biohacker-exec"] },
      { name: "Practice Yoga Austin", type: "gym", description: "Community-focused yoga studio. Various styles from restorative to power. The teachers here are among Austin's best.", address: "East Cesar Chavez", avatarFit: ["biohacker-exec"] },
      { name: "Roy G Guerrero Park Trail", type: "outdoor", description: "Riverside trail running with Colorado River views. Less crowded than Lady Bird Lake trail. Connects to the larger trail system.", avatarFit: ["biohacker-exec", "tech-founder"] },
    ],
    restaurants: [
      { name: "Suerte", type: "restaurant", description: "Contemporary Mexican. James Beard semi-finalist. The duck carnitas and bone marrow tostada are transcendent. This is one of the best restaurants in Texas, period.", avatarFit: ["tech-founder", "biohacker-exec"] },
      { name: "Franklin Barbecue", type: "restaurant", description: "The most famous BBQ in America. Yes, the line is real (3+ hours). Yes, the brisket is worth it. Pro tip: order online for pickup or go on a weekday.", avatarFit: ["tech-founder"] },
      { name: "Launderette", type: "restaurant", description: "New American in a converted laundromat. Beautiful space, inventive menu, excellent cocktails. The Gulf fish is always a winner.", avatarFit: ["tech-founder", "biohacker-exec"] },
      { name: "Veracruz All Natural", type: "restaurant", description: "Started as a food truck, now an Austin institution. The migas tacos are arguably the best breakfast in the city. Fast, affordable, genuinely great.", avatarFit: ["tech-founder", "young-family"] },
      { name: "Citizen Eatery", type: "restaurant", description: "100% plant-based restaurant that's actually delicious. Clean eating without sacrificing flavor. The cauliflower wings and mushroom burger convert carnivores.", avatarFit: ["biohacker-exec"] },
    ],
    coffee: [
      { name: "Brew & Brew", type: "coffee", description: "Coffee and craft beer under one roof. Transition seamlessly from morning productivity to afternoon socializing. Good wifi, long tables, eclectic crowd.", address: "500 San Marcos St", avatarFit: ["tech-founder"] },
      { name: "Figure 8 Coffee Purveyors", type: "coffee", description: "Small-batch roaster with a tiny, perfect shop. No frills, just exceptional coffee. The batch brew changes daily.", avatarFit: ["tech-founder", "biohacker-exec"] },
      { name: "Wright Bros. Brew & Brew", type: "coffee", description: "Another coffee-beer hybrid. East Austin loves this concept. Solid espresso, local beers on tap, and a patio.", avatarFit: ["tech-founder"] },
    ],
    wellness: [
      { name: "Kusha Wellness", type: "wellness", description: "Float tanks, infrared sauna, and massage in East Austin. Newer facility, clean, and well-run. Growing biohacker following.", avatarFit: ["biohacker-exec"] },
      { name: "Restore Hyper Wellness East", type: "wellness", description: "Full biohacking menu: cryo, IV drips, red light therapy, compression. Quick sessions between meetings.", avatarFit: ["biohacker-exec"] },
    ],
    coworking: [
      { name: "Vessel Coworking", type: "coworking", description: "East Austin's homegrown coworking space. Converted warehouse, good vibes, and a community of creative entrepreneurs. Less corporate than WeWork.", avatarFit: ["tech-founder"] },
      { name: "Capital Factory East (upcoming)", type: "coworking", description: "Capital Factory is expanding east. When it opens, this will be a major draw for the startup community.", avatarFit: ["tech-founder"] },
    ],
    outdoors: [
      { name: "East Lady Bird Lake Trail", type: "park", description: "The east side of the trail loop is less crowded and equally beautiful. Boardwalk section is stunning. Connects to Roy G Guerrero Park.", avatarFit: ["biohacker-exec", "tech-founder", "young-family"] },
      { name: "Boggy Creek Greenbelt", type: "park", description: "Quiet, neighborhood-scale green space. Good for family walks and casual jogging. Not as dramatic as Barton Creek but more accessible.", avatarFit: ["young-family"] },
      { name: "Festival Beach", type: "park", description: "On Lady Bird Lake. Volleyball courts, open fields, and lake access. Great for weekend picnics and casual sports.", avatarFit: ["young-family", "tech-founder"] },
    ],
    grocery: [
      { name: "Quickie Pickie", type: "grocery", description: "Not a full grocery — a curated corner store/deli with local products, prepared foods, and an excellent beer selection. The East Austin vibe in a shop.", avatarFit: ["tech-founder"] },
      { name: "H-E-B Mueller", type: "grocery", description: "Full H-E-B with great organic selection. Technically in 78723 but serves all of East Austin.", avatarFit: ["young-family", "biohacker-exec"] },
      { name: "Boggy Creek Farm Stand", type: "grocery", description: "One of the oldest urban farms in Texas. Seasonal produce, eggs, and flowers direct from the farm. Wednesday and Saturday mornings.", address: "3414 Lyons Rd", avatarFit: ["biohacker-exec"] },
    ],
    familyFriendly: [
      { name: "Thinkery (Austin Children's Museum)", type: "activity", description: "Interactive STEM museum in Mueller, right next door. Excellent for ages 0-10. Water play, maker space, and rotating exhibits.", avatarFit: ["young-family"] },
      { name: "Mueller Lake Park", type: "park", description: "Playground, splash pad, walking paths around the lake. The social hub for East Austin families. Saturday mornings are bustling.", avatarFit: ["young-family"] },
      { name: "Blue Starlite Mini Urban Drive-In", type: "activity", description: "Tiny drive-in movie theater. Quirky, charming, and uniquely Austin. Great for family movie nights or a date.", avatarFit: ["young-family", "tech-founder"] },
    ],
    localSecrets: [
      "The Weirdos of East Austin mural trail is an unofficial walking tour of street art — start at the corner of E 6th and Chicon and wander east.",
      "The Saturday morning Boggy Creek Farm Stand is where Austin chefs shop. Get there by 9am for the best produce.",
      "Whisler's bar has a mezcal bar called Mezcalería Tobala hidden upstairs. One of the best cocktail bars in the city, and most people walk right past it.",
      "The neighborhood between E 7th and Holly Street, east of I-35, has the highest concentration of new construction in Austin right now. Drive it to understand the pace of change.",
    ],
    avatarScores: { "tech-founder": 5, "biohacker-exec": 3, "young-family": 2, investor: 5 },
  },

  {
    slug: "78723",
    name: "78723 — Mueller / Windsor Park",
    zips: ["78723"],
    searchQuery: "78723",
    heroTagline: "Master-planned meets neighborhood soul. Austin's best-kept family secret.",
    overview:
      "78723 encompasses two distinct but complementary neighborhoods: Mueller — a master-planned community built on the former Robert Mueller Municipal Airport — and Windsor Park, an established mid-century neighborhood experiencing thoughtful revitalization. Mueller is new-urbanist: walkable streets, mixed-use retail, parks, and diverse housing from townhomes to single-family. Windsor Park is older, more affordable, and increasingly popular with young families and investors who recognize its trajectory. Together, they form one of Austin's most balanced neighborhoods — urban convenience without downtown density, community without suburban isolation.",
    vibe: "Community-driven, diverse, intentionally designed. Mueller feels planned (because it is) but in a good way — it works. Windsor Park feels organic and evolving. The combined effect is a neighborhood that's equally comfortable for a family with toddlers and a couple in their 30s who aren't ready for the suburbs.",
    whyEntrepreneurs:
      "Mueller's walkability and mixed-use design make it surprisingly good for work-from-home founders. Walk to coffee, lunch, and the gym without getting in a car. The community is educated and tech-adjacent (UT and downtown are close). Coworking options are limited locally but downtown is 10 minutes. Windsor Park is where founders buy when they want space and value — larger lots, renovation potential, and a fraction of 78704 prices.",
    whyFamilies:
      "This is the family neighborhood that urban parents dream about. Mueller has Thinkery (children's museum), Lake Park with splash pad, Mueller Greenway for bike rides, and a Farmers Market every Sunday. Walkable to restaurants and grocery. The schools are improving — Blanton Elementary is solid, and KIPP and Harmony charter schools are strong alternatives. Windsor Park has larger lots with actual yards, mature trees, and a tight-knit community feel. Families here know their neighbors.",
    whyHealth:
      "Mueller's design encourages active living — you walk everywhere. The Mueller Greenway is a landscaped path connecting parks and green spaces. Big Stacy Pool (nearby) and the Lady Bird Lake trail are accessible. Gyms are limited locally — most residents drive to CrossFit or boutique studios nearby. The H-E-B has a strong organic section. For biohacking specifically, you'd need to drive to East Austin or downtown for cryo/float/IV facilities.",
    whyInvestors:
      "78723 is an investor favorite. Windsor Park properties offer strong value-add potential — original 1950s-60s homes on generous lots that can be renovated or rebuilt. ADU potential is real on many lots. Mueller condos and townhomes have steady rental demand. The neighborhood is in the path of development — the Domain/North Burnet corridor pushes value eastward. Appreciation has been strong (10-15% YoY in some pockets) and the fundamentals support continued growth. Cap rates are better here than in 78704 or downtown.",
    medianPrice: "$525K",
    priceRange: "$300K (Windsor Park fixer) — $1.2M (Mueller new build)",
    avgSqft: "1,500",
    walkScore: 55,
    commuteDowntown: "10-15 min",
    schools: [
      { name: "Blanton Elementary", type: "elementary", rating: "7/10", district: "Austin ISD", notes: "Popular Mueller-area campus, strong community" },
      { name: "Andrews Elementary", type: "elementary", rating: "6/10", district: "Austin ISD" },
      { name: "KIPP Austin Comunidad", type: "charter", rating: "8/10", district: "KIPP", notes: "Bilingual charter, excellent results" },
      { name: "Harmony School of Science", type: "charter", rating: "8/10", district: "Harmony", notes: "STEM-focused charter with strong test scores" },
      { name: "Reagan High School", type: "high", rating: "6/10", district: "Austin ISD", notes: "Improving significantly with new investment" },
    ],
    fitness: [
      { name: "Mueller Greenway", type: "outdoor", description: "1.5+ miles of landscaped walking/running paths connecting Mueller's parks. Perfect for morning runs, stroller walks, and bike rides. The neighborhood's front yard.", avatarFit: ["young-family", "biohacker-exec"] },
      { name: "Big Stacy Pool", type: "outdoor", description: "Neighborhood spring-fed pool nearby (in Travis Heights). Cold water, free, and open seasonally. The locals' alternative to crowded Barton Springs.", avatarFit: ["biohacker-exec"] },
      { name: "Gold's Gym Airport", type: "gym", description: "Full-service gym with the basics done well. Not boutique, not fancy — just solid equipment, good hours, and affordable.", avatarFit: ["biohacker-exec"] },
    ],
    restaurants: [
      { name: "Batch Craft Soda + Kolaches", type: "restaurant", description: "Texas kolaches (savory pastries) and craft sodas made in-house. Mueller's signature casual spot. The jalapeño-cheese kolache is perfect.", avatarFit: ["young-family", "tech-founder"] },
      { name: "Torchy's Tacos (Mueller)", type: "restaurant", description: "Austin's taco chain started here. The Trailer Park taco (fried chicken, green chiles, cheese) is the cult classic. Fast, casual, family-friendly.", avatarFit: ["young-family"] },
      { name: "Intero", type: "restaurant", description: "Italian fine dining that's worth the drive from anywhere in Austin. Hand-made pasta, wood-fired dishes, and an Italian wine list that will ruin other restaurants for you.", avatarFit: ["tech-founder", "biohacker-exec"] },
      { name: "Taco Flats", type: "restaurant", description: "Tacos and frozen margaritas on the patio. Weekend brunch is the Mueller neighborhood social scene.", avatarFit: ["tech-founder", "young-family"] },
    ],
    coffee: [
      { name: "Flitch Coffee", type: "coffee", description: "Tiny specialty coffee trailer in Mueller. Excellent pour-overs and a rotation of single-origin beans. No seating — grab and walk.", avatarFit: ["tech-founder"] },
      { name: "Epoch Coffee (North Loop, nearby)", type: "coffee", description: "24/7 coffee shop 5 minutes away. The late-night study/work culture is strong. Solid espresso, mediocre food, unbeatable hours.", avatarFit: ["tech-founder"] },
    ],
    wellness: [
      { name: "Restore Hyper Wellness (North)", type: "wellness", description: "Closest biohacking facility. Cryo, IV drips, red light, compression. 10-minute drive from Mueller.", avatarFit: ["biohacker-exec"] },
    ],
    coworking: [
      { name: "Home office culture", type: "coworking", description: "Honestly, most Mueller residents work from home. The neighborhood is designed for it — walk to coffee, take a meeting at a café, and be back at your desk in 5 minutes. Dedicated coworking spaces are limited locally.", avatarFit: ["tech-founder"] },
    ],
    outdoors: [
      { name: "Mueller Lake Park", type: "park", description: "The community's centerpiece. 30-acre park with lake, playground, splash pad, and walking paths. Sunday Farmers Market is a weekly social ritual.", avatarFit: ["young-family", "tech-founder"] },
      { name: "Mueller Southwest Greenway", type: "park", description: "Native landscaping, walking paths, and open fields. Connects the residential areas to the retail center. Kids ride bikes here after school.", avatarFit: ["young-family"] },
      { name: "Bartholomew District Park", type: "park", description: "Full-size pool, sports fields, tennis courts, and picnic areas. Windsor Park's main park. Great for youth sports.", avatarFit: ["young-family"] },
    ],
    grocery: [
      { name: "H-E-B Mueller", type: "grocery", description: "Excellent H-E-B with a strong organic section, prepared foods, sushi bar, and curbside pickup. The anchor store for the whole neighborhood.", avatarFit: ["young-family", "biohacker-exec"] },
      { name: "Mueller Farmers Market", type: "grocery", description: "Every Sunday. Local produce, pastured meats, fresh bread, and artisan goods. The social event of the week for Mueller families.", avatarFit: ["biohacker-exec", "young-family"] },
    ],
    familyFriendly: [
      { name: "Thinkery", type: "activity", description: "Austin's premier children's museum. Interactive STEM exhibits, water play, outdoor spaces, and maker labs. Ages 0-10. Annual memberships are worth it if you live nearby.", address: "1830 Simond Ave", avatarFit: ["young-family"] },
      { name: "Mueller Lake Park Playground", type: "park", description: "Large, well-maintained playground with structures for all ages. Shaded seating for parents. Always busy on weekends — which means instant playdates.", avatarFit: ["young-family"] },
      { name: "Mueller Splash Pad", type: "park", description: "Free water play area open seasonally. The summer hangout for Mueller kids. Bring towels and sunscreen.", avatarFit: ["young-family"] },
    ],
    localSecrets: [
      "The Mueller air traffic control tower is still standing — it's been converted into a community landmark and the Sunday Farmers Market happens right at its base.",
      "Windsor Park has some of the best value-add investment opportunities in Austin right now. Original 1950s ranch homes on 7,000+ sqft lots. Buy, renovate, and you're sitting on a property worth 2x what you paid within 3 years.",
      "The North Loop neighborhood (just west of 78723) has a strip of record shops, vintage stores, and casual restaurants that feels like Austin in 2010. It's walking distance from Mueller.",
      "Mueller was designed by the same urban planning firm (McCann Adams) that designed some of the most successful new-urbanist communities in the US. The walkability is intentional, not accidental.",
    ],
    avatarScores: { "tech-founder": 4, "biohacker-exec": 3, "young-family": 4, investor: 5 },
  },
];
