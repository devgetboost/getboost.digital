// SEO Local - Cidades servidas pela Getboost
// HQ: Figueira da Foz. Restantes cidades = areaServed.

export type LocalCity = {
  slug: string;              // usado em /agencia-marketing-digital-{slug}
  name: string;              // Display name
  district: string;
  postalRegion: string;      // ex: "PT-06"
  lat: number;
  lng: number;
  isHQ: boolean;
  distanceFromHQ: string;    // texto amigável
  economyIntro: string;      // 2-3 frases sobre o tecido económico local
  targetSectors: string[];   // sectores fortes na cidade
  landmarks: string[];       // referências geográficas conhecidas
};

export const CITIES: Record<string, LocalCity> = {
  'figueira-da-foz': {
    slug: 'figueira-da-foz',
    name: 'Figueira da Foz',
    district: 'Coimbra',
    postalRegion: 'PT-06',
    lat: 40.1508,
    lng: -8.8618,
    isHQ: true,
    distanceFromHQ: 'Sede — atendimento presencial',
    economyIntro:
      'A Figueira da Foz combina um dos maiores portos comerciais de Portugal, indústria pesada (Celbi, Soporcel) e um sector de turismo, hotelaria e restauração em forte crescimento sazonal. As PMEs locais competem num mercado exigente onde a presença digital deixou de ser opcional.',
    targetSectors: ['Turismo & Hotelaria', 'Restauração', 'Comércio local', 'Indústria', 'Serviços profissionais'],
    landmarks: ['Buarcos', 'Serra da Boa Viagem', 'Marina', 'Casino', 'Cabo Mondego'],
  },
  'coimbra': {
    slug: 'coimbra',
    name: 'Coimbra',
    district: 'Coimbra',
    postalRegion: 'PT-06',
    lat: 40.2033,
    lng: -8.4103,
    isHQ: false,
    distanceFromHQ: '~40 min por A14',
    economyIntro:
      'Coimbra é um dos maiores hubs de conhecimento do país, com a Universidade, o IPN e um ecossistema robusto de startups tecnológicas e biomédicas. O tecido empresarial vai da inovação de base científica ao comércio tradicional da Baixa e ao sector da saúde ligado ao CHUC.',
    targetSectors: ['Tecnologia & Startups', 'Saúde', 'Educação', 'Comércio', 'Serviços jurídicos e financeiros'],
    landmarks: ['Universidade de Coimbra', 'Baixa', 'Instituto Pedro Nunes', 'Alta', 'Solum'],
  },
  'leiria': {
    slug: 'leiria',
    name: 'Leiria',
    district: 'Leiria',
    postalRegion: 'PT-10',
    lat: 39.7444,
    lng: -8.8072,
    isHQ: false,
    distanceFromHQ: '~50 min por A17',
    economyIntro:
      'Leiria lidera o cluster nacional de moldes, plásticos e metalomecânica, com uma forte cultura industrial exportadora e um Politécnico que alimenta talento qualificado. As PMEs da região procuram diferenciação digital para atacar mercados internacionais.',
    targetSectors: ['Indústria de moldes', 'Plásticos', 'Metalomecânica', 'Vidro', 'Exportação'],
    landmarks: ['Castelo de Leiria', 'IPL', 'Marinha Grande', 'Batalha', 'Fátima'],
  },
  'pombal': {
    slug: 'pombal',
    name: 'Pombal',
    district: 'Leiria',
    postalRegion: 'PT-10',
    lat: 39.9163,
    lng: -8.6289,
    isHQ: false,
    distanceFromHQ: '~35 min por A1',
    economyIntro:
      'Pombal é um cruzamento estratégico entre o Centro e o Litoral, com forte presença de indústria transformadora, logística, agroindústria e comércio local dinâmico. Empresas familiares centenárias convivem com uma nova geração de negócios digitais.',
    targetSectors: ['Logística', 'Agroindústria', 'Indústria transformadora', 'Comércio local', 'Restauração'],
    landmarks: ['Castelo de Pombal', 'Zona Industrial', 'Ansião', 'Soure', 'A1'],
  },
};

export const CITY_LIST = Object.values(CITIES);
