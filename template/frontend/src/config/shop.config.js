/**
 * 🌟 Universal E-Commerce Starter Kit - Frontend Store Configuration
 */

const shopConfig = {
  brand: {
    name: "LUMEN",
    tagline: "Objets & Essentiels de Vie Contemporains",
    heroTitle: "L'Élégance du Design Durable & Intemporel",
    heroSubtitle: "Découvrez une collection soignée d'objets du quotidien, pièces artisanales et créations minimalistes conçues pour durer.",
    logoEmoji: "✦",
    currency: "EUR",
    currencySymbol: "€",
    countryOrigin: "France",
    ratingScore: "4.98/5",
    ratingReviewsCount: "1 250+ avis vérifiés"
  },
  theme: {
    primaryColor: "#c49b66",
    primaryGlow: "rgba(196, 155, 102, 0.4)",
    bgDark: "#0c0d0e",
    bgCard: "#141619",
    bgCardHover: "#1b1e23",
    borderSubtle: "rgba(255, 255, 255, 0.08)",
    borderMedium: "rgba(255, 255, 255, 0.16)",
    textBright: "#ffffff",
    textLight: "#f1f5f9",
    textMuted: "#94a3b8",
    fontHeading: "'Cormorant Garamond', Georgia, serif",
    fontBody: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
  },
  shipping: {
    freeShippingThreshold: 60.00,
    standardCost: 4.90,
    expressCost: 9.90,
    standardName: "Colissimo Suivi Domicile (48h)",
    expressName: "Chronopost Express 24h Domicile",
    standardDelay: "24h à 48h ouvrées",
    carrierTrackingUrl: "https://www.laposte.fr/outils/suivre-vos-envois?code="
  },
  legal: {
    companyName: "Lumen Atelier SAS",
    capital: "50 000 €",
    rcs: "Paris B 912 345 678",
    siret: "912 345 678 00014",
    tva: "FR 32 912345678",
    address: "14 Rue du Faubourg Saint-Honoré, 75008 Paris, France",
    contactEmail: "contact@atelier-lumen.com",
    supportPhone: "+33 (0)1 42 68 55 00",
    returnPeriodDays: 30
  },
  promotions: [
    { code: "BIENVENUE10", rate: 0.10, label: "10% de remise de bienvenue" },
    { code: "LUMEN20", rate: 0.20, minAmount: 120, label: "20% dès 120€ d'achat" }
  ]
};

export default shopConfig;
