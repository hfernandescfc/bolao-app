/**
 * Mapeamento FIFA TLA → código de bandeira (ISO 3166-1 alpha-2 ou subdivisão GB-*).
 * Usado pelo componente <Flag /> para resolver a URL do SVG no CDN.
 */
export const FIFA_TO_FLAG_CODE: Record<string, string> = {
  // Grupo A
  MEX: 'mx',
  RSA: 'za', ZAF: 'za',
  KOR: 'kr', SKR: 'kr',
  CZE: 'cz',
  // Grupo B
  CAN: 'ca',
  SUI: 'ch', CHE: 'ch',
  QAT: 'qa',
  BIH: 'ba',
  // Grupo C
  ARG: 'ar',
  CHI: 'cl', CHL: 'cl',
  SRB: 'rs',
  SAU: 'sa', KSA: 'sa',
  // Grupo D
  USA: 'us',
  PAR: 'py', PRY: 'py',
  AUS: 'au',
  TUR: 'tr', TKY: 'tr',
  // Grupo E
  FRA: 'fr',
  BEL: 'be',
  JPN: 'jp',
  SEN: 'sn',
  // Grupo F
  ESP: 'es',
  COL: 'co',
  MAR: 'ma',
  HUN: 'hu',
  // Grupo G
  BRA: 'br',
  ECU: 'ec',
  NGA: 'ng',
  POL: 'pl',
  // Grupo H
  POR: 'pt',
  URU: 'uy',
  IRN: 'ir', IRI: 'ir',
  CIV: 'ci',
  // Grupo I — Inglaterra usa subdivisão GB-ENG
  ENG: 'gb-eng',
  NED: 'nl', NDL: 'nl',
  GHA: 'gh',
  SVK: 'sk',
  // Grupo J — Escócia usa subdivisão GB-SCT
  GER: 'de', DEU: 'de',
  PER: 'pe',
  IDN: 'id',
  SCO: 'gb-sct',
  // Grupo K
  ITA: 'it',
  VEN: 've',
  EGY: 'eg',
  SVN: 'si',
  // Grupo L
  CRO: 'hr',
  TUN: 'tn',
  JAM: 'jm',
  GEO: 'ge',
  // Demais seleções classificadas / em repescagem
  BOL: 'bo',
  CRC: 'cr',
  HON: 'hn',
  PAN: 'pa',
  HAI: 'ht', HTI: 'ht',                    // Haiti
  CUW: 'cw', CUR: 'cw',                    // Curaçao
  SWE: 'se',                               // Suécia
  CPV: 'cv', CAV: 'cv',                    // Cabo Verde
  URY: 'uy',                               // Uruguai (variante ISO alpha-3)
  NOR: 'no',                               // Noruega
  ALG: 'dz', DZA: 'dz',                    // Argélia
  AUT: 'at',                               // Áustria
  COD: 'cd',                               // RD Congo
  COG: 'cg', CGO: 'cg',                    // República do Congo
  CMR: 'cm',
  IRQ: 'iq',
  JOR: 'jo',
  UZB: 'uz',
  KWT: 'kw',
  ROU: 'ro',
  ALB: 'al',
  NZL: 'nz',
  FIJ: 'fj',
  // Outras que podem aparecer
  DEN: 'dk', DNK: 'dk',                    // Dinamarca
  SWZ: 'sz',                               // Essuatíni
  UKR: 'ua',                               // Ucrânia
  IRL: 'ie',                               // Irlanda
  WAL: 'gb-wls',                           // País de Gales
  NIR: 'gb-nir',                           // Irlanda do Norte
  CHN: 'cn',                               // China
  THA: 'th',                               // Tailândia
  VIE: 'vn', VNM: 'vn',                    // Vietnã
  PHI: 'ph', PHL: 'ph',                    // Filipinas
  MAS: 'my', MYS: 'my',                    // Malásia
  ANG: 'ao', AGO: 'ao',                    // Angola
  MOZ: 'mz',                               // Moçambique
  ZAM: 'zm', ZMB: 'zm',                    // Zâmbia
  ZIM: 'zw', ZWE: 'zw',                    // Zimbábue
  KEN: 'ke',                               // Quênia
  UGA: 'ug',                               // Uganda
  MLI: 'ml',                               // Mali
  GUI: 'gn', GIN: 'gn',                    // Guiné
  BFA: 'bf', BUR: 'bf',                    // Burkina Faso
  GAB: 'ga',                               // Gabão
  BEN: 'bj',                               // Benim
  TOG: 'tg',                               // Togo
  RWA: 'rw',                               // Ruanda
}

/**
 * Retorna a URL do SVG da bandeira no CDN, ou null se não houver mapeamento.
 * Usa flag-icons (lipis) via jsDelivr — SVG 4:3, vetorial, com Inglaterra/Escócia.
 */
export function getFlagUrl(fifaCode: string | null | undefined): string | null {
  if (!fifaCode) return null
  const iso = FIFA_TO_FLAG_CODE[fifaCode.toUpperCase()]
  if (!iso) return null
  return `https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.5.0/flags/4x3/${iso}.svg`
}
