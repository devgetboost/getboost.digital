import socialMediaImg from '@/assets/services/social-media.jpg';
import webDevImg from '@/assets/services/web-dev.jpg';
import softwareDevImg from '@/assets/services/software-dev.jpg';
import googleBusinessImg from '@/assets/services/google-business.jpg';
import adsImg from '@/assets/services/google-meta-ads.jpg';
import consultoriaImg from '@/assets/services/consultoria.jpg';
import customImg from '@/assets/services/solucao-personalizada.jpg';
import droneImg from '@/assets/services/fotografia-aerea.jpg';

export type ServiceData = {
  key: string;
  slug: string;
  image: string;
  price: string;
  icon: string;
  headline: string;
  subheadline: string;
  painPoints: string[];
  benefits: { title: string; desc: string }[];
  process: { step: string; title: string; desc: string }[];
  results: { value: string; label: string }[];
  faq: { q: string; a: string }[];
};

export const servicesData: ServiceData[] = [
  {
    key: 'socialMedia',
    slug: 'gestao-redes-sociais',
    image: socialMediaImg,
    price: '350€/mês',
    icon: '📱',
    headline: 'A tua marca merece ser vista. Todos os dias.',
    subheadline: 'Chega de publicar sem estratégia. Criamos conteúdo que gera engagement real, atrai o público certo e converte seguidores em clientes enquanto tu focas no teu negócio.',
    painPoints: [
      'Não tens tempo para publicar consistentemente?',
      'Os teus posts não geram engagement?',
      'Não sabes o que publicar para atrair clientes?',
      'A concorrência está mais visível que tu nas redes?',
    ],
    benefits: [
      { title: 'Conteúdo Estratégico', desc: 'Planeamento editorial mensal com conteúdos que educam, inspiram e convertem.' },
      { title: 'Design Profissional', desc: 'Criação de visuais que captam atenção e reforçam a identidade da tua marca.' },
      { title: 'Gestão de Comunidade', desc: 'Interação com a tua audiência, respondendo comentários e mensagens.' },
      { title: 'Relatórios Mensais', desc: 'Análise detalhada de métricas com insights acionáveis para crescer.' },
    ],
    process: [
      { step: '01', title: 'Diagnóstico', desc: 'Análise da tua presença atual e definição de objetivos.' },
      { step: '02', title: 'Estratégia', desc: 'Criação do plano editorial e definição de tom de voz.' },
      { step: '03', title: 'Execução', desc: 'Produção de conteúdo, publicação e gestão diária.' },
      { step: '04', title: 'Otimização', desc: 'Análise de resultados e ajustes contínuos para melhorar performance.' },
    ],
    results: [
      { value: '+250%', label: 'Engagement médio' },
      { value: '3x', label: 'Mais seguidores' },
      { value: '+180%', label: 'Alcance orgânico' },
      { value: '45%', label: 'Conversão em leads' },
    ],
    faq: [
      { q: 'Quantas publicações por semana?', a: 'O plano base inclui 4-5 publicações semanais, ajustável conforme a tua necessidade.' },
      { q: 'Em quais plataformas?', a: 'Instagram, Facebook, LinkedIn e TikTok. Escolhemos as mais relevantes para o teu negócio.' },
      { q: 'Posso aprovar o conteúdo antes?', a: 'Sim! Envio o planeamento semanal para aprovação antes da publicação.' },
    ],
  },
  {
    key: 'webDev',
    slug: 'desenvolvimento-web',
    image: webDevImg,
    price: '1200€',
    icon: '🌐',
    headline: 'O teu website é a primeira impressão. Torna-a inesquecível.',
    subheadline: 'Um site lento, desatualizado ou mal desenhado afasta clientes. Criamos websites rápidos, modernos e otimizados para SEO que posicionam o teu negócio como referência e convertem visitantes em contactos qualificados.',
    painPoints: [
      'O teu site atual parece desatualizado?',
      'Os visitantes saem sem converter?',
      'O teu site não aparece no Google?',
      'Não é responsivo em dispositivos móveis?',
    ],
    benefits: [
      { title: 'Design Premium', desc: 'Interface moderna e profissional que transmite credibilidade e confiança.' },
      { title: 'SEO Integrado', desc: 'Otimização técnica e de conteúdo para posicionar no topo do Google.' },
      { title: 'Alta Performance', desc: 'Carregamento rápido, código limpo e experiência fluida em todos os dispositivos.' },
      { title: 'Conversão Otimizada', desc: 'Estrutura pensada para guiar o visitante à ação desejada.' },
    ],
    process: [
      { step: '01', title: 'Briefing', desc: 'Entendemos o teu negócio, público e objetivos do site.' },
      { step: '02', title: 'Design', desc: 'Criação do layout e protótipo interativo para aprovação.' },
      { step: '03', title: 'Desenvolvimento', desc: 'Programação com as melhores tecnologias e práticas do mercado.' },
      { step: '04', title: 'Lançamento', desc: 'Testes finais, otimização e publicação do site.' },
    ],
    results: [
      { value: '+340%', label: 'Tráfego orgânico' },
      { value: '2.5s', label: 'Tempo de carga' },
      { value: '+200%', label: 'Taxa de conversão' },
      { value: '99%', label: 'Uptime garantido' },
    ],
    faq: [
      { q: 'Quanto tempo demora?', a: 'Em média 3-4 semanas, dependendo da complexidade do projeto.' },
      { q: 'Inclui hospedagem?', a: 'Sim, incluímos configuração de hospedagem e domínio no primeiro ano.' },
      { q: 'Posso editar o conteúdo depois?', a: 'Sim! Entrego com um painel de gestão simples para atualizações.' },
    ],
  },
  {
    key: 'softwareDev',
    slug: 'desenvolvimento-software',
    image: softwareDevImg,
    price: 'Sob consulta',
    icon: '⚙️',
    headline: 'Software, automação e IA para PMEs que querem escalar.',
    subheadline: 'A Getboost transforma PMEs em negócios digitais de alta performance — com Marketing, Engenharia de Software e IA integrados. Da estratégia à execução, criamos produtos digitais escaláveis que geram receita real.',
    painPoints: [
      'Processos manuais que consomem tempo e limitam o crescimento?',
      'Ferramentas genéricas que não se adaptam ao teu negócio?',
      'Sistemas isolados sem integração entre si?',
      'Ideia validada mas sem parceiro técnico para escalar?',
    ],
    benefits: [
      { title: 'Auditoria Digital 360º', desc: 'Análise completa de sistemas, processos e presença digital para identificar oportunidades de automação e inovação.' },
      { title: 'UI/UX Design Premium', desc: 'Interfaces intuitivas e visuais consistentes com a tua marca — desenhadas para converter.' },
      { title: 'Arquitetura & SaaS Multi‑tenant', desc: 'Sistemas modulares, seguros e escaláveis — desde web e mobile até plataformas SaaS completas.' },
      { title: 'IA & Automação Integradas', desc: 'Copilots, fluxos automáticos e IA aplicada para reduzir custos e libertar a tua equipa.' },
    ],
    process: [
      { step: '01', title: 'Discover', desc: 'Auditoria digital, validação de ideia e UX research. Identificamos o que trava o crescimento.' },
      { step: '02', title: 'Design & Build', desc: 'Protótipos, service design e desenvolvimento iterativo — do conceito ao produto pronto a lançar.' },
      { step: '03', title: 'Launch & Evolve', desc: 'Deploy, monitorização e melhoria contínua com mentoria técnica à tua equipa.' },
      { step: '04', title: 'Scale', desc: 'Segurança, performance e escalabilidade para o produto crescer sem sobressaltos.' },
    ],
    results: [
      { value: '14+', label: 'Anos a criar produtos' },
      { value: '-60%', label: 'Tempo em processos' },
      { value: '4x', label: 'Mais produtividade' },
      { value: '100%', label: 'À medida do negócio' },
    ],
    faq: [
      { q: 'Que tipo de produtos desenvolvem?', a: 'Websites, apps mobile, plataformas SaaS multi‑tenant e integrações com IA — sempre à medida do teu negócio.' },
      { q: 'Trabalham com a nossa equipa técnica?', a: 'Sim. Fazemos co‑building e mentoria técnica, capacitando a tua equipa para autonomia digital.' },
      { q: 'Qual o prazo médio de um projeto?', a: 'Um MVP típico leva 2‑4 meses. Projetos SaaS completos evoluem em ciclos contínuos de melhoria.' },
      { q: 'Oferecem manutenção depois do lançamento?', a: 'Sim — manutenção, evolução de produto, segurança e escalabilidade estão incluídas nos planos de acompanhamento.' },
    ],
  },
  {
    key: 'googleBusiness',
    slug: 'google-business-profile',
    image: googleBusinessImg,
    price: '199€/mês',
    icon: '📍',
    headline: 'Sê encontrado por quem procura o que ofereces.',
    subheadline: 'Otimização do Google Business Profile para dominar as pesquisas locais e atrair mais clientes.',
    painPoints: [
      'Não apareces nas pesquisas locais?',
      'O teu perfil do Google está incompleto?',
      'Não recebes avaliações dos clientes?',
      'A concorrência aparece antes de ti?',
    ],
    benefits: [
      { title: 'Perfil Otimizado', desc: 'Configuração completa com todas as informações, fotos e categorias corretas.' },
      { title: 'Gestão de Reviews', desc: 'Estratégia para obter mais avaliações positivas e responder profissionalmente.' },
      { title: 'Posts Regulares', desc: 'Publicações no Google Business para manter o perfil ativo e relevante.' },
      { title: 'Relatórios de Visibilidade', desc: 'Monitorização de posições, impressões e ações dos utilizadores.' },
    ],
    process: [
      { step: '01', title: 'Auditoria', desc: 'Análise do perfil atual e oportunidades de melhoria.' },
      { step: '02', title: 'Otimização', desc: 'Configuração completa do perfil com melhores práticas.' },
      { step: '03', title: 'Conteúdo', desc: 'Publicação regular de posts, fotos e atualizações.' },
      { step: '04', title: 'Monitorização', desc: 'Acompanhamento contínuo de performance e ajustes.' },
    ],
    results: [
      { value: '+300%', label: 'Visibilidade local' },
      { value: '4.8★', label: 'Rating médio' },
      { value: '+180%', label: 'Chamadas recebidas' },
      { value: '+220%', label: 'Pedidos de direção' },
    ],
    faq: [
      { q: 'Preciso já ter um perfil?', a: 'Não, posso criar e verificar o perfil do zero para o teu negócio.' },
      { q: 'Funciona para qualquer negócio?', a: 'Sim, especialmente para negócios com atendimento local ou presencial.' },
      { q: 'Quanto tempo para ver resultados?', a: 'Os primeiros resultados aparecem em 2-4 semanas após a otimização.' },
    ],
  },
  {
    key: 'ads',
    slug: 'google-meta-ads',
    image: adsImg,
    price: '450€/mês',
    icon: '🎯',
    headline: 'Investe com inteligência. Converte com resultados.',
    subheadline: 'Pára de desperdiçar orçamento em anúncios que não convertem. Criamos campanhas data-driven no Google e Meta que alcançam o público certo, no momento certo — com ROI mensurável e relatórios transparentes.',
    painPoints: [
      'Gastas em anúncios sem ver retorno?',
      'Não sabes quanto investir em ads?',
      'As campanhas não convertem?',
      'Não tens tempo para gerir anúncios?',
    ],
    benefits: [
      { title: 'Estratégia Data-Driven', desc: 'Decisões baseadas em dados reais, não em suposições.' },
      { title: 'Segmentação Precisa', desc: 'Alcançar o público certo, no momento certo, com a mensagem certa.' },
      { title: 'Otimização Contínua', desc: 'Testes A/B e ajustes diários para maximizar o ROI.' },
      { title: 'Relatórios Transparentes', desc: 'Visibilidade total sobre investimento, resultados e métricas.' },
    ],
    process: [
      { step: '01', title: 'Research', desc: 'Análise de mercado, concorrência e definição de públicos.' },
      { step: '02', title: 'Configuração', desc: 'Criação de campanhas, anúncios e landing pages otimizadas.' },
      { step: '03', title: 'Lançamento', desc: 'Ativação das campanhas com monitorização em tempo real.' },
      { step: '04', title: 'Escala', desc: 'Otimização de performance e escala das campanhas vencedoras.' },
    ],
    results: [
      { value: '5.2x', label: 'ROI médio' },
      { value: '-45%', label: 'Custo por lead' },
      { value: '+320%', label: 'Conversões' },
      { value: '24h', label: 'Tempo de resposta' },
    ],
    faq: [
      { q: 'Qual o investimento mínimo em ads?', a: 'Recomendo a partir de 500€/mês em media spend, além da gestão.' },
      { q: 'Google ou Meta Ads?', a: 'Depende do teu negócio. Analiso e recomendo a melhor estratégia.' },
      { q: 'Criam as landing pages?', a: 'Sim, posso criar landing pages otimizadas para as campanhas.' },
    ],
  },
  {
    key: 'consultoria',
    slug: 'consultoria-estrategica',
    image: consultoriaImg,
    price: '150€/hora',
    icon: '🧠',
    headline: 'Clareza estratégica para decisões que importam.',
    subheadline: 'Tens ideias mas falta-te foco e direção? Numa sessão estratégica, analisamos o teu negócio, identificamos oportunidades e criamos um plano de ação claro para acelerares o crescimento com confiança.',
    painPoints: [
      'Não sabes por onde começar no marketing?',
      'Tens muitas ideias mas sem foco?',
      'Precisas de uma segunda opinião estratégica?',
      'Queres validar o teu plano de marketing?',
    ],
    benefits: [
      { title: 'Visão Externa', desc: 'Perspetiva imparcial e experiente sobre o teu negócio e mercado.' },
      { title: 'Plano de Ação', desc: 'Roadmap claro e prioritizado com os próximos passos concretos.' },
      { title: 'Mentoria', desc: 'Acompanhamento contínuo para garantir a execução da estratégia.' },
      { title: 'Flexibilidade', desc: 'Sessões adaptadas ao teu ritmo, presencial ou online.' },
    ],
    process: [
      { step: '01', title: 'Conversa Inicial', desc: 'Sessão gratuita de 30 min para entender os teus desafios.' },
      { step: '02', title: 'Diagnóstico', desc: 'Análise profunda do negócio, mercado e concorrência.' },
      { step: '03', title: 'Estratégia', desc: 'Desenvolvimento do plano estratégico personalizado.' },
      { step: '04', title: 'Acompanhamento', desc: 'Sessões regulares de follow-up e ajustes.' },
    ],
    results: [
      { value: '+200%', label: 'Crescimento médio' },
      { value: '50+', label: 'Negócios ajudados' },
      { value: '98%', label: 'Satisfação' },
      { value: '10+', label: 'Anos experiência' },
    ],
    faq: [
      { q: 'A primeira sessão é gratuita?', a: 'Sim! Ofereço uma conversa inicial de 30 minutos sem compromisso.' },
      { q: 'É presencial ou online?', a: 'Ambos! Podes escolher conforme a tua preferência e localização.' },
      { q: 'Quantas sessões preciso?', a: 'Depende dos objetivos. Alguns clientes precisam de 1, outros preferem acompanhamento mensal.' },
    ],
  },
  {
    key: 'drone',
    slug: 'fotografia-drone',
    image: droneImg,
    price: 'Desde 100€',
    icon: '🚁',
    headline: 'Perspetivas que elevam a tua marca. Literalmente.',
    subheadline: 'Captação profissional de fotografia e vídeo aéreo com Drone DJI Air 2S. Imagens cinematográficas que dão ao teu negócio, evento ou propriedade uma visão única e impactante que nenhuma câmara terrestre consegue.',
    painPoints: [
      'Precisas de imagens aéreas para o teu negócio?',
      'Queres destacar uma propriedade ou terreno?',
      'O teu evento merece uma cobertura épica?',
      'Precisas de conteúdo diferenciador para as redes?',
    ],
    benefits: [
      { title: 'Qualidade 5.4K', desc: 'Câmara com sensor de 1 polegada e 20MP para imagens nítidas e vídeo cinematográfico.' },
      { title: 'Piloto Certificado', desc: 'Operador com licença e seguro, cumprindo todas as regulamentações da ANAC.' },
      { title: 'Edição Profissional', desc: 'Pós-produção completa com correção de cor, estabilização e montagem.' },
      { title: 'Entrega Rápida', desc: 'Ficheiros editados entregues em 48-72 horas após a captação.' },
    ],
    process: [
      { step: '01', title: 'Planeamento', desc: 'Definição do local, enquadramentos e autorizações de voo necessárias.' },
      { step: '02', title: 'Captação', desc: 'Sessão de voo com múltiplas passagens para garantir as melhores imagens.' },
      { step: '03', title: 'Edição', desc: 'Seleção, tratamento e montagem profissional do material captado.' },
      { step: '04', title: 'Entrega', desc: 'Ficheiros finais em alta resolução, prontos para usar em qualquer plataforma.' },
    ],
    results: [
      { value: '5.4K', label: 'Resolução de vídeo' },
      { value: '20MP', label: 'Fotografias aéreas' },
      { value: '48h', label: 'Entrega rápida' },
      { value: '100%', label: 'Conformidade legal' },
    ],
    faq: [
      { q: 'Onde podem ser feitos os voos?', a: 'Em qualquer zona permitida pela ANAC. Tratamos de todas as autorizações necessárias.' },
      { q: 'Qual é o drone utilizado?', a: 'DJI Air 2S com câmara de 1" e capacidade de vídeo 5.4K.' },
      { q: 'Incluem edição?', a: 'Sim! Todas as sessões incluem edição profissional e entrega dos ficheiros finais.' },
    ],
  },
  {
    key: 'custom',
    slug: 'solucao-personalizada',
    image: customImg,
    price: 'Sob consulta',
    icon: '✨',
    headline: 'O teu desafio é único. A solução também.',
    subheadline: 'Pacotes personalizados que combinam múltiplos serviços para resolver o teu desafio específico.',
    painPoints: [
      'Precisas de mais do que um serviço isolado?',
      'Queres uma solução integrada?',
      'Nenhum pacote standard encaixa?',
      'Tens um desafio complexo e específico?',
    ],
    benefits: [
      { title: 'À Tua Medida', desc: 'Combinação de serviços pensada exclusivamente para o teu caso.' },
      { title: 'Gestão Centralizada', desc: 'Um único ponto de contacto para todos os serviços contratados.' },
      { title: 'Sinergia', desc: 'Serviços integrados que se potenciam mutuamente para melhores resultados.' },
      { title: 'Preço Otimizado', desc: 'Pacote com condições especiais vs. contratação individual.' },
    ],
    process: [
      { step: '01', title: 'Conversa', desc: 'Entendemos o desafio e os objetivos do teu negócio.' },
      { step: '02', title: 'Proposta', desc: 'Criamos uma proposta personalizada com os serviços ideais.' },
      { step: '03', title: 'Execução', desc: 'Implementação coordenada de todos os serviços.' },
      { step: '04', title: 'Evolução', desc: 'Adaptação contínua conforme os resultados e novos objetivos.' },
    ],
    results: [
      { value: '360°', label: 'Solução completa' },
      { value: '-20%', label: 'Vs. serviços avulso' },
      { value: '1', label: 'Ponto de contacto' },
      { value: '∞', label: 'Possibilidades' },
    ],
    faq: [
      { q: 'Como funciona o orçamento?', a: 'Após a conversa inicial, apresento uma proposta detalhada com valores.' },
      { q: 'Posso ajustar o pacote depois?', a: 'Sim! O pacote evolui conforme as tuas necessidades mudam.' },
      { q: 'Qual o contrato mínimo?', a: 'Depende dos serviços, mas normalmente proponho períodos de 3 meses.' },
    ],
  },
];
