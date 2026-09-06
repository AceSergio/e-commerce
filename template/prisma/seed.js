const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SAMPLE_CATEGORIES = [
  {
    id: 'ceramique-objets',
    name: 'Objets & Céramique',
    description: 'Créations artisanales et pièces de caractère façonnées à la main.'
  },
  {
    id: 'maison-ambiance',
    name: 'Maison & Ambiance',
    description: 'Éclairage chaleureux, senteurs botaniques et textiles nobles.'
  }
];

const SAMPLE_PRODUCTS = [
  {
    id: 'prod-vase-sculptural',
    categoryId: 'ceramique-objets',
    name: 'Vase Sculptural Minéral',
    subtitle: 'Grès Brut & Finition Texturée',
    description: 'Pièce sculpturale façonnée en grès fin avec une texture minérale unique. Idéal pour accueillir des fleurs séchées ou comme objet décoratif central.',
    price: 65.00,
    unit: 'Pièce unique (H 28 cm)',
    badge: 'Best-Seller',
    origin: 'Atelier Artisanal',
    spec1Label: 'Matière',
    spec1Value: 'Grès 100% Minéral',
    spec2Label: 'Finition',
    spec2Value: 'Matte texturée',
    image: '/images/vase.jpg',
    isPopular: true,
    stockQuantity: 45
  },
  {
    id: 'prod-bougie-ebene',
    categoryId: 'maison-ambiance',
    name: 'Bougie Botanique Ébène & Ambre',
    subtitle: 'Cire Végétale & Mèche Bois Crépitante',
    description: 'Coulée à la main dans un pot en céramique sombre. Accord subtil de bois précieux, ambre chaud et vanille fumée pour une atmosphère enveloppante.',
    price: 38.00,
    unit: 'Pot céramique 280g (~55h)',
    badge: 'Signature',
    origin: 'Grasse, France',
    spec1Label: 'Cire',
    spec1Value: 'Soja 100% Végétale',
    spec2Label: 'Diffusion',
    spec2Value: '55 heures',
    image: '/images/candle.jpg',
    isPopular: true,
    stockQuantity: 80
  },
  {
    id: 'prod-plaid-lin',
    categoryId: 'maison-ambiance',
    name: 'Plaid en Lin Pur Lavé',
    subtitle: 'Fibre Naturelle & Tissage Texturé',
    description: 'Lin cultivé et adouci selon les traditions textiles. Respirant en été et réconfortant en hiver, sublimé par de délicates franges artisanales.',
    price: 89.00,
    unit: 'Dimensions 140 × 200 cm',
    badge: 'Édition Limitée',
    origin: 'Normandie, France',
    spec1Label: 'Composition',
    spec1Value: '100% Lin Pur Lavé',
    spec2Label: 'Entretien',
    spec2Value: 'Lavable 30°C',
    image: '/images/throw.jpg',
    isPopular: false,
    stockQuantity: 30
  },
  {
    id: 'prod-lampe-laiton',
    categoryId: 'maison-ambiance',
    name: 'Lampe de Table Laiton & Travertin',
    subtitle: 'Design Minimaliste & Variateur Tactile',
    description: 'Alliance noble d\'un socle en travertin naturel et d\'une structure en laiton brossé. Diffuseur opalin pour une lumière douce et tamisée.',
    price: 145.00,
    unit: 'Lampe complète LED 2700K',
    badge: 'Coup de Cœur',
    origin: 'Studio Design',
    spec1Label: 'Matériaux',
    spec1Value: 'Travertin & Laiton',
    spec2Label: 'Éclairage',
    spec2Value: 'LED Chaude (3 intensités)',
    image: '/images/lamp.jpg',
    isPopular: true,
    stockQuantity: 20
  },
  {
    id: 'prod-service-carafe',
    categoryId: 'ceramique-objets',
    name: 'Service Carafe & Verres Fumés',
    subtitle: 'Verre Borosilicate Soufflé Bouche',
    description: 'Ensemble composé d\'une carafe ergonomique 1L et de deux verres teintés dans la masse. Résistance thermique et élégance intemporelle.',
    price: 54.00,
    unit: 'Set Carafe 1L + 2 Verres',
    badge: 'Nouveauté',
    origin: 'Souffleurs Verriers',
    spec1Label: 'Capacité',
    spec1Value: 'Carafe 1000ml / Verres 300ml',
    spec2Label: 'Usage',
    spec2Value: 'Chaud & Froid',
    image: '/images/carafe.jpg',
    isPopular: false,
    stockQuantity: 50
  },
  {
    id: 'prod-diffuseur-basalte',
    categoryId: 'maison-ambiance',
    name: 'Diffuseur Olfactif en Pierre Volcanique',
    subtitle: 'Basalte Brut & Concentré Pur 30ml',
    description: 'Coupelle en pierre de lave naturelle avec son flacon compte-gouttes. Diffusion passive saine et continue sans chaleur ni électricité.',
    price: 42.00,
    unit: 'Pierre de Lave + Huile 30ml',
    badge: 'Éco-Conçu',
    origin: 'Auvergne, France',
    spec1Label: 'Diffusion',
    spec1Value: 'Passive Naturelle',
    spec2Label: 'Recharge',
    spec2Value: 'Huiles Essentielles Pures',
    image: '/images/diffuser.jpg',
    isPopular: false,
    stockQuantity: 65
  }
];

async function main() {
  console.log('🌱 [SEED] Démarrage de l\'initialisation de la base de données template...');

  // 1. Catégories
  for (const cat of SAMPLE_CATEGORIES) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: { name: cat.name, description: cat.description },
      create: cat
    });
  }

  // 2. Supprimer les anciens produits obsolètes
  const validIds = SAMPLE_PRODUCTS.map(p => p.id);
  await prisma.orderItem.deleteMany({
    where: { productId: { notIn: validIds } }
  });
  await prisma.product.deleteMany({
    where: { id: { notIn: validIds } }
  });

  // 3. Produits
  for (const prod of SAMPLE_PRODUCTS) {
    await prisma.product.upsert({
      where: { id: prod.id },
      update: prod,
      create: prod
    });
  }

  console.log('✅ [SEED] Initialisation terminée avec succès ! (6 produits universels seeded)');
}

main()
  .catch((e) => {
    console.error('❌ [SEED] Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
