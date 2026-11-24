/**
 * Loads demo data (users, vendors, products, RFQs, orders, notices) into an EMPTY database.
 *   npm run db:seed
 *
 * Every demo account uses the password  Himbridge@123 — so this refuses to run when NODE_ENV=production
 * unless ALLOW_DEMO_SEED=true (e.g. for a staging server). Never seed the live site.
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';
import { count, eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { orderCode } from '../src/domain/order-flow';
import { splitPayments } from '../src/domain/payments';
import * as schema from '../src/server/db/schema';

const DEMO_PASSWORD = 'Himbridge@123';
const daysAgo = (n: number) => new Date(Date.now() - n * 864e5);

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_SEED !== 'true') {
    throw new Error('Refusing to seed demo data in production. Set ALLOW_DEMO_SEED=true only on a staging server.');
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });
  const { user, account, vendorProfile, product, rfq, quote, order, milestone, payment, notice } = schema;

  const [existing] = await db.select({ n: count() }).from(user);
  if ((existing?.n ?? 0) > 0) {
    console.log('Database already has users — seed skipped.');
    await client.end();
    return;
  }

  const hash = await hashPassword(DEMO_PASSWORD);
  await db.transaction(async (tx) => {
    const addUser = async (
      role: 'admin' | 'buyer' | 'vendor' | 'logistics',
      name: string,
      email: string,
      company: string,
      country: string,
      phone = '',
    ) => {
      const id = randomUUID();
      await tx.insert(user).values({ id, role, name, email, company, country, phone, emailVerified: true });
      await tx.insert(account).values({ id: randomUUID(), accountId: id, providerId: 'credential', userId: id, password: hash });
      return id;
    };

    await addUser('admin', 'Himbridge Operations', 'admin@himbridge.trade', 'Himbridge Global', 'India', '+91 11 4000 0000');
    const buyer = await addUser('buyer', 'Emily Carter', 'buyer@himbridge.trade', 'Carter Home Co.', 'United States', '+1 415 555 0142');
    const buyer2 = await addUser(
      'buyer',
      'Omar Al Mansoori',
      'omar@gulfliving.ae',
      'Gulf Living Trading LLC',
      'United Arab Emirates',
      '+971 4 555 0199',
    );
    const logi = await addUser(
      'logistics',
      'Rakesh Menon',
      'logistics@himbridge.trade',
      'BlueWave Freight & CHA',
      'India',
      '+91 22 6600 1234',
    );

    const vendors: [string, string, string, 'IN' | 'CN', string, string, string, string, number, string, 'verified' | 'pending'][] = [
      [
        'vendor.in@himbridge.trade',
        'Arjun Sharma',
        'Moradabad Brass Works',
        'IN',
        'Moradabad, UP',
        'handicrafts',
        'IEC, GST, EPCH, SEDEX',
        '40,000 pcs / month',
        18,
        'Third-generation brass & metal décor manufacturer supplying US and EU retailers.',
        'verified',
      ],
      [
        'jodhpur@himbridge.trade',
        'Meera Rathore',
        'Thar Woodcraft Exports',
        'IN',
        'Jodhpur, Rajasthan',
        'wood-furniture',
        'IEC, GST, FSC, VRIKSH',
        '12 containers / month',
        22,
        'Sheesham & mango wood furniture, KD and assembled, for USA and Australia.',
        'verified',
      ],
      [
        'bhadohi@himbridge.trade',
        'Imran Ansari',
        'Ganga Loom Carpets',
        'IN',
        'Bhadohi, UP',
        'rugs',
        'IEC, GST, CEPC, GoodWeave',
        '8,000 sq m / month',
        15,
        'Hand-knotted, hand-tufted and flat-weave rugs in wool, jute and cotton.',
        'verified',
      ],
      [
        'panipat@himbridge.trade',
        'Sunita Goyal',
        'Panipat Home Textiles',
        'IN',
        'Panipat, Haryana',
        'home-textiles',
        'IEC, GST, OEKO-TEX, GOTS',
        '60,000 pcs / month',
        11,
        'Throws, cushion covers, bedding and table linen in cotton and recycled yarn.',
        'verified',
      ],
      [
        'kerala@himbridge.trade',
        'Dr. Anil Nair',
        'Vedic Roots Herbals',
        'IN',
        'Kochi, Kerala',
        'wellness',
        'IEC, AYUSH, GMP, FSSAI',
        '2 tonnes / month',
        9,
        'Ayurvedic oils, herbal powders and wellness blends — private label ready.',
        'pending',
      ],
      [
        'vendor.cn@himbridge.trade',
        'Li Wei',
        'Zhongshan Brightway Lighting',
        'CN',
        'Zhongshan, Guangdong',
        'led-solar',
        'CE, RoHS, ISO 9001, UL',
        '200,000 pcs / month',
        14,
        'LED panels, solar street lights and smart bulbs for Africa, GCC and LATAM.',
        'verified',
      ],
      [
        'foshan@himbridge.trade',
        'Chen Jing',
        'Foshan Linear Furniture',
        'CN',
        'Foshan, Guangdong',
        'modern-furniture',
        'ISO 9001, BIFMA, FSC',
        '30 containers / month',
        16,
        'Office chairs, workstations and aluminium outdoor furniture.',
        'verified',
      ],
      [
        'ningbo@himbridge.trade',
        'Zhang Hao',
        'Ningbo Kitchenpro Appliances',
        'CN',
        'Ningbo, Zhejiang',
        'home-kitchen',
        'CE, CB, GS, BSCI',
        '150,000 pcs / month',
        12,
        'Kettles, air fryers, cookware and kitchen storage — OEM/ODM.',
        'verified',
      ],
      [
        'shenzhen@himbridge.trade',
        'Wang Fang',
        'Shenzhen Nexa Electronics',
        'CN',
        'Shenzhen, Guangdong',
        'electronics',
        'CE, FCC, RoHS, ISO 9001',
        '500,000 pcs / month',
        8,
        'Chargers, power banks, earbuds and smart accessories.',
        'pending',
      ],
    ];
    const vid: Record<string, string> = {};
    for (const [email, name, company, origin, cluster, niche, certifications, capacity, years, about, verification] of vendors) {
      const id = await addUser('vendor', name, email, company, origin === 'IN' ? 'India' : 'China');
      await tx.insert(vendorProfile).values({ userId: id, origin, cluster, niche, certifications, capacity, years, about, verification });
      vid[email] = id;
    }

    const P = (
      email: string,
      niche: string,
      title: string,
      description: string,
      hsCode: string,
      moq: number,
      unit: string,
      priceMin: number,
      priceMax: number,
      leadDays: number,
      material: string,
    ) => ({
      vendorId: vid[email]!,
      niche,
      title,
      description,
      hsCode,
      moq,
      unit,
      priceMin,
      priceMax,
      leadDays,
      material,
    });
    await tx
      .insert(product)
      .values([
        P(
          'vendor.in@himbridge.trade',
          'handicrafts',
          'Hand-hammered Brass Planter Set (3 pcs)',
          'Antique gold finish, lacquer coated, nested set.',
          '8306.29',
          200,
          'sets',
          14,
          22,
          45,
          'Brass',
        ),
        P(
          'vendor.in@himbridge.trade',
          'handicrafts',
          'Engraved Brass Candle Holders',
          'Pair of temple-style candle stands with etched motifs.',
          '8306.29',
          300,
          'pairs',
          6.5,
          11,
          40,
          'Brass',
        ),
        P(
          'vendor.in@himbridge.trade',
          'handicrafts',
          'Aluminium Recycled Décor Bowl',
          'Sand-cast recycled aluminium bowl, nickel finish.',
          '7615.10',
          500,
          'pcs',
          4.2,
          7.8,
          35,
          'Recycled aluminium',
        ),
        P(
          'jodhpur@himbridge.trade',
          'wood-furniture',
          'Sheesham Wood Sideboard 160 cm',
          'Solid sheesham, 4 doors, natural honey finish, KD packing.',
          '9403.60',
          20,
          'pcs',
          210,
          280,
          60,
          'Sheesham wood',
        ),
        P(
          'jodhpur@himbridge.trade',
          'wood-furniture',
          'Mango Wood Dining Table 6-Seater',
          'Live-edge top, iron hairpin legs.',
          '9403.60',
          15,
          'pcs',
          185,
          240,
          55,
          'Mango wood, iron',
        ),
        P(
          'jodhpur@himbridge.trade',
          'wood-furniture',
          'Cane & Teak Lounge Chair',
          'Hand-woven natural cane with solid teak frame.',
          '9401.69',
          30,
          'pcs',
          95,
          130,
          50,
          'Teak, cane',
        ),
        P(
          'bhadohi@himbridge.trade',
          'rugs',
          'Hand-knotted Wool Rug 8x10 ft',
          '100 knots/sq inch, New Zealand wool, custom colours.',
          '5701.10',
          10,
          'pcs',
          320,
          520,
          75,
          'Wool',
        ),
        P(
          'bhadohi@himbridge.trade',
          'rugs',
          'Braided Jute Round Rug 6 ft',
          'Natural jute, eco-friendly, hand-braided.',
          '5702.39',
          50,
          'pcs',
          28,
          42,
          40,
          'Jute',
        ),
        P(
          'bhadohi@himbridge.trade',
          'rugs',
          'Flat-weave Cotton Kilim 5x8 ft',
          'Reversible, machine washable, geometric designs.',
          '5702.99',
          60,
          'pcs',
          34,
          55,
          45,
          'Cotton',
        ),
        P(
          'panipat@himbridge.trade',
          'home-textiles',
          'Recycled Cotton Throw 130x170',
          'Herringbone weave with fringes, GRS certified yarn.',
          '6301.40',
          500,
          'pcs',
          6.8,
          9.5,
          40,
          'Recycled cotton',
        ),
        P(
          'panipat@himbridge.trade',
          'home-textiles',
          'Block-printed Cushion Covers 45x45',
          'Hand block print, natural dyes, envelope closure.',
          '6304.92',
          1000,
          'pcs',
          2.1,
          3.4,
          35,
          'Cotton',
        ),
        P(
          'panipat@himbridge.trade',
          'home-textiles',
          'Organic Cotton Bedding Set (Queen)',
          'GOTS organic percale, duvet + 2 shams.',
          '6302.21',
          300,
          'sets',
          24,
          34,
          50,
          'Organic cotton',
        ),
        P(
          'kerala@himbridge.trade',
          'wellness',
          'Ashwagandha Root Powder — Bulk',
          'Lab tested, organic certified, 25 kg bags.',
          '1211.90',
          100,
          'kg',
          9,
          14,
          21,
          'Herbal',
        ),
        P(
          'vendor.cn@himbridge.trade',
          'led-solar',
          'All-in-One Solar Street Light 100W',
          'LiFePO4 battery, motion sensor, IP65.',
          '9405.42',
          100,
          'pcs',
          38,
          55,
          25,
          'Aluminium',
        ),
        P(
          'vendor.cn@himbridge.trade',
          'led-solar',
          'LED Panel Light 600x600 40W',
          'Backlit, 4000K, flicker-free driver, 5-yr warranty.',
          '9405.11',
          500,
          'pcs',
          7.5,
          11,
          20,
          'Aluminium, PS',
        ),
        P(
          'vendor.cn@himbridge.trade',
          'led-solar',
          'Smart Wi-Fi LED Bulb E27',
          'RGBCW, app + voice control, Tuya platform.',
          '8539.52',
          2000,
          'pcs',
          1.9,
          2.8,
          25,
          'PC',
        ),
        P(
          'foshan@himbridge.trade',
          'modern-furniture',
          'Ergonomic Mesh Office Chair',
          'Adjustable lumbar, 4D arms, class-4 gas lift.',
          '9401.31',
          100,
          'pcs',
          42,
          68,
          30,
          'Mesh, nylon',
        ),
        P(
          'foshan@himbridge.trade',
          'modern-furniture',
          'Aluminium Outdoor Sofa Set (5 seat)',
          'Powder-coated frame, quick-dry cushions.',
          '9401.79',
          10,
          'sets',
          380,
          520,
          40,
          'Aluminium',
        ),
        P(
          'ningbo@himbridge.trade',
          'home-kitchen',
          'Digital Air Fryer 5.5 L',
          '1700W, 8 presets, non-stick basket, CE/GS.',
          '8516.60',
          500,
          'pcs',
          18,
          24,
          35,
          'PP, steel',
        ),
        P(
          'ningbo@himbridge.trade',
          'home-kitchen',
          'Stainless Steel Cookware Set 10 pcs',
          'Tri-ply base, induction ready.',
          '7323.93',
          300,
          'sets',
          28,
          39,
          40,
          'SS 304',
        ),
        P(
          'ningbo@himbridge.trade',
          'home-kitchen',
          'Bamboo Kitchen Storage Jars (set of 4)',
          'Borosilicate glass with bamboo lids.',
          '7013.49',
          1000,
          'sets',
          4.6,
          6.9,
          30,
          'Glass, bamboo',
        ),
        P(
          'shenzhen@himbridge.trade',
          'electronics',
          'GaN Fast Charger 65W',
          'USB-C PD 3.0, foldable plug.',
          '8504.40',
          1000,
          'pcs',
          5.2,
          7.4,
          20,
          'PC',
        ),
      ]);

    const R = async (values: typeof rfq.$inferInsert) => (await tx.insert(rfq).values(values).returning({ id: rfq.id }))[0]!.id;
    const r1 = await R({
      buyerId: buyer,
      niche: 'handicrafts',
      title: 'Brass planters for spring collection',
      details: 'Antique gold & matte black finishes, 3 sizes, private label tags.',
      quantity: 1200,
      unit: 'sets',
      destination: 'Los Angeles, USA',
      targetPrice: 16,
      originPref: 'IN',
      status: 'open',
    });
    const r2 = await R({
      buyerId: buyer,
      niche: 'wood-furniture',
      title: 'Solid wood sideboards — 2 x 40HC',
      details: 'Sheesham or acacia, 150–180 cm, FSC preferred.',
      quantity: 120,
      unit: 'pcs',
      destination: 'Los Angeles, USA',
      targetPrice: 230,
      originPref: 'IN',
      status: 'awarded',
    });
    await R({
      buyerId: buyer2,
      niche: 'led-solar',
      title: 'Solar street lights for municipal project',
      details: '100W–150W all-in-one, 3-night autonomy, IP66.',
      quantity: 2500,
      unit: 'pcs',
      destination: 'Jebel Ali, UAE',
      targetPrice: 45,
      originPref: 'CN',
      status: 'open',
    });
    const r4 = await R({
      buyerId: buyer2,
      niche: 'home-kitchen',
      title: 'Air fryers for Ramadan retail promo',
      details: 'Arabic packaging, GCC plug, SASO certification.',
      quantity: 3000,
      unit: 'pcs',
      destination: 'Jebel Ali, UAE',
      targetPrice: 20,
      originPref: 'ANY',
      status: 'awarded',
    });

    const Q = async (values: typeof quote.$inferInsert) => (await tx.insert(quote).values(values).returning({ id: quote.id }))[0]!.id;
    await Q({
      rfqId: r1,
      vendorId: vid['vendor.in@himbridge.trade']!,
      unitPrice: 15.4,
      leadDays: 45,
      note: 'Includes lacquer coating and hang-tags. Samples in 10 days.',
    });
    const q2 = await Q({
      rfqId: r2,
      vendorId: vid['jodhpur@himbridge.trade']!,
      unitPrice: 226,
      leadDays: 60,
      note: 'FSC sheesham, KD packing, 60 pcs per 40HC.',
      status: 'accepted',
    });
    const q4 = await Q({
      rfqId: r4,
      vendorId: vid['ningbo@himbridge.trade']!,
      unitPrice: 19.2,
      leadDays: 35,
      note: 'SASO + G-Mark included, Arabic gift box.',
      status: 'accepted',
    });

    const O = async (values: typeof order.$inferInsert) => {
      const [row] = await tx.insert(order).values(values).returning({ id: order.id });
      await tx
        .update(order)
        .set({ code: orderCode(row!.id, 2026) })
        .where(eq(order.id, row!.id));
      await tx.insert(payment).values(splitPayments(values.total).map((p) => ({ ...p, orderId: row!.id })));
      return row!.id;
    };
    const o1 = await O({
      rfqId: r2,
      quoteId: q2,
      buyerId: buyer,
      vendorId: vid['jodhpur@himbridge.trade']!,
      logisticsId: logi,
      title: 'Solid wood sideboards — 2 x 40HC',
      quantity: 120,
      unit: 'pcs',
      unitPrice: 226,
      total: 27120,
      destination: 'Los Angeles, USA',
      incoterm: 'FOB',
      mode: 'Sea — 2 x 40HC',
      originPort: 'Mundra, India',
      destPort: 'Los Angeles, USA',
      status: 'shipped',
      createdAt: daysAgo(40),
    });
    const o2 = await O({
      rfqId: r4,
      quoteId: q4,
      buyerId: buyer2,
      vendorId: vid['ningbo@himbridge.trade']!,
      title: 'Air fryers for Ramadan retail promo',
      quantity: 3000,
      unit: 'pcs',
      unitPrice: 19.2,
      total: 57600,
      destination: 'Jebel Ali, UAE',
      incoterm: 'CIF',
      status: 'in_production',
      createdAt: daysAgo(15),
    });

    await tx.insert(milestone).values([
      {
        orderId: o1,
        status: 'confirmed',
        note: 'Buyer accepted quotation. 30% advance received.',
        byUserId: buyer,
        createdAt: daysAgo(40),
      },
      {
        orderId: o1,
        status: 'in_production',
        note: 'Timber seasoning complete, assembly started.',
        byUserId: vid['jodhpur@himbridge.trade'],
        createdAt: daysAgo(34),
      },
      {
        orderId: o1,
        status: 'qc_passed',
        note: 'Pre-shipment inspection AQL 2.5 — passed.',
        byUserId: vid['jodhpur@himbridge.trade'],
        createdAt: daysAgo(12),
      },
      { orderId: o1, status: 'shipped', note: 'Loaded at Mundra. Vessel MSC AURORA, ETA 24 days.', byUserId: logi, createdAt: daysAgo(6) },
      { orderId: o2, status: 'confirmed', note: 'Buyer accepted quotation. LC opened.', byUserId: buyer2, createdAt: daysAgo(15) },
      {
        orderId: o2,
        status: 'in_production',
        note: 'Mass production 40% complete.',
        byUserId: vid['ningbo@himbridge.trade'],
        createdAt: daysAgo(5),
      },
    ]);
    await tx.update(payment).set({ status: 'received', reference: 'SWIFT CHAS0US33 · 41882' }).where(eq(payment.orderId, o1));
    await tx
      .update(payment)
      .set({ status: 'received', reference: 'LC 00921/AE' })
      .where(sql`${payment.orderId} = ${o2} and ${payment.stage} = 'advance'`);

    await tx.insert(notice).values([
      {
        title: 'Founding Vendor Programme open — free Gold tier for first 100 verified manufacturers',
        body: 'Apply from the vendor registration page. Verification within 7 working days.',
        tag: 'Programme',
        createdAt: daysAgo(1),
      },
      {
        title: 'Himbridge pavilion at the spring home & lifestyle fair — buyer meetings open',
        body: 'Book a slot with our sourcing desk to meet verified handicraft and furniture vendors.',
        tag: 'Trade Fair',
        createdAt: daysAgo(3),
      },
      {
        title: 'Factory visit tour for buyers — registrations open',
        body: 'Join a Himbridge-guided tour of audited Engineered-collection factories, timed with the spring trade-fair season.',
        tag: 'Trade Fair',
        createdAt: daysAgo(6),
      },
      {
        title: 'Advisory: verify current import duties before confirming US-bound orders',
        body: 'Tariff schedules change frequently. Use the landed-cost tool and confirm with your customs broker.',
        tag: 'Advisory',
        createdAt: daysAgo(8),
      },
      {
        title: 'New category live: LED Lighting & Solar — 40+ SKUs onboarded',
        body: 'Africa and GCC buyers can now raise RFQs for solar street lights and LED panels.',
        tag: 'Update',
        createdAt: daysAgo(12),
      },
    ]);
  });

  await client.end();
  console.log(`Seeded demo data. All demo passwords: ${DEMO_PASSWORD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
