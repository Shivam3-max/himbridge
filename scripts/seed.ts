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

    const vendors: [string, string, string, string, string, string, string, number, string, 'verified' | 'pending'][] = [
      [
        'vendor.in@himbridge.trade',
        'Arjun Sharma',
        'Moradabad Brass Works',
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
        'Kochi, Kerala',
        'wellness',
        'IEC, AYUSH, GMP, FSSAI',
        '2 tonnes / month',
        9,
        'Ayurvedic oils, herbal powders and wellness blends — private label ready.',
        'pending',
      ],
      [
        'spices@himbridge.trade',
        'Priya Varghese',
        'Malabar Spice Exports',
        'Kochi, Kerala',
        'spices',
        'IEC, Spices Board CRES, FSSAI, ISO 22000',
        '120 tonnes / month',
        16,
        'Whole and ground spices — pepper, cardamom, turmeric, chilli — steam-sterilised and EU-MRL tested.',
        'verified',
      ],
      [
        'karnal@himbridge.trade',
        'Harpreet Singh',
        'Karnal Basmati Mills',
        'Karnal, Haryana',
        'rice-grains',
        'IEC, APEDA RCMC, FSSAI, BRCGS',
        '3,000 tonnes / month',
        20,
        '1121 and 1509 basmati — raw, steam and sella — in retail and bulk packs for GCC, UK and USA.',
        'verified',
      ],
      [
        'varanasi@himbridge.trade',
        'Ravi Maurya',
        'Kashi Handloom Silks',
        'Varanasi, UP',
        'handloom-silk',
        'IEC, HEPC, Silk Mark, GI authorised user',
        '4,000 pieces / month',
        25,
        'Banarasi silk sarees, stoles and yardage woven on handlooms by a 300-weaver cooperative.',
        'verified',
      ],
      [
        'assam@himbridge.trade',
        'Bidisha Baruah',
        'Brahmaputra Tea Estates',
        'Dibrugarh, Assam',
        'tea-coffee',
        'IEC, Tea Board, FSSAI, Rainforest Alliance',
        '400 tonnes / month',
        30,
        'Orthodox and CTC Assam teas, bulk and private-label packs.',
        'pending',
      ],
    ];
    const vid: Record<string, string> = {};
    for (const [email, name, company, cluster, niche, certifications, capacity, years, about, verification] of vendors) {
      const id = await addUser('vendor', name, email, company, 'India');
      await tx.insert(vendorProfile).values({ userId: id, cluster, niche, certifications, capacity, years, about, verification });
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
          'spices@himbridge.trade',
          'spices',
          'Turmeric Fingers — Erode, 3% Curcumin',
          'Double-polished, machine-cleaned, EU-MRL tested. 25 kg PP bags.',
          '0910.30',
          1000,
          'kg',
          2.4,
          3.1,
          21,
          'Turmeric',
        ),
        P(
          'spices@himbridge.trade',
          'spices',
          'Malabar Black Pepper 550 GL',
          'Garbled, steam-sterilised, ETO-free certificate per lot.',
          '0904.11',
          500,
          'kg',
          7.8,
          9.5,
          18,
          'Black pepper',
        ),
        P(
          'spices@himbridge.trade',
          'spices',
          'Green Cardamom 8 mm Bold',
          'Alleppey Green grade, hand-sorted, 10 kg cartons.',
          '0908.31',
          100,
          'kg',
          28,
          34,
          14,
          'Cardamom',
        ),
        P(
          'karnal@himbridge.trade',
          'rice-grains',
          '1121 Basmati Sella Rice',
          'Extra-long grain (8.35 mm avg), aged 12 months, sortexed. 5/10/25 kg bags.',
          '1006.30',
          20000,
          'kg',
          1.15,
          1.45,
          25,
          'Basmati rice',
        ),
        P(
          'karnal@himbridge.trade',
          'rice-grains',
          '1509 Steam Basmati — Retail Pack',
          'Private-label 1 kg and 5 kg pouches, Arabic/English print.',
          '1006.30',
          10000,
          'kg',
          1.05,
          1.3,
          30,
          'Basmati rice',
        ),
        P(
          'varanasi@himbridge.trade',
          'handloom-silk',
          'Banarasi Katan Silk Saree',
          'Pure silk with zari brocade, Silk Mark tagged, gift-boxed.',
          '5007.20',
          50,
          'pcs',
          45,
          120,
          45,
          'Mulberry silk, zari',
        ),
        P(
          'varanasi@himbridge.trade',
          'handloom-silk',
          'Handwoven Silk Stole',
          'Lightweight jamdani-weave stole, 70 x 200 cm, 12 colourways.',
          '6214.10',
          200,
          'pcs',
          9,
          15,
          35,
          'Silk',
        ),
        P(
          'assam@himbridge.trade',
          'tea-coffee',
          'Assam CTC BOP Tea',
          'Strong, malty second-flush CTC, 50 kg paper sacks.',
          '0902.30',
          1000,
          'kg',
          3.2,
          4.1,
          15,
          'Black tea',
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
      status: 'awarded',
    });
    await R({
      buyerId: buyer2,
      niche: 'spices',
      title: 'Turmeric and chilli powder for private label',
      details: 'Steam-sterilised, 200 g and 500 g pouches, Arabic labels, aflatoxin and ETO reports per lot.',
      quantity: 20000,
      unit: 'kg',
      destination: 'Jebel Ali, UAE',
      targetPrice: 2.6,
      status: 'open',
    });
    const r4 = await R({
      buyerId: buyer2,
      niche: 'rice-grains',
      title: 'Basmati rice for Ramadan retail promo',
      details: '1121 sella, 5 kg and 10 kg bags, Arabic/English labels, Halal certificate.',
      quantity: 50000,
      unit: 'kg',
      destination: 'Jebel Ali, UAE',
      targetPrice: 1.3,
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
      vendorId: vid['karnal@himbridge.trade']!,
      unitPrice: 1.28,
      leadDays: 30,
      note: 'APEDA-registered mill, jute-look bags with Arabic print, phytosanitary and EIC certificates included.',
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
      vendorId: vid['karnal@himbridge.trade']!,
      title: 'Basmati rice for Ramadan retail promo',
      quantity: 50000,
      unit: 'kg',
      unitPrice: 1.28,
      total: 64000,
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
        note: 'Milling and sortexing 40% complete; bags printed.',
        byUserId: vid['karnal@himbridge.trade'],
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
        title: 'India cluster tour for buyers — registrations open',
        body: 'Join a Himbridge-guided tour of audited artisan clusters in Moradabad, Jaipur and Bhadohi, timed with the spring trade-fair season.',
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
