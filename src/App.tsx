import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import '@/i18n';
import ScrollToTop from "./components/ScrollToTop";
import { Component, lazy as reactLazy, Suspense, useEffect } from "react";
import type { ComponentType, ErrorInfo, ReactNode } from "react";

// Retry a dynamic import a few times before surfacing the error (handles
// transient network / stale-chunk failures after new deploys).
const retryImport = <T,>(
  factory: () => Promise<T>,
  retries = 3,
  delay = 400,
): Promise<T> =>
  factory().catch((err) => {
    if (retries <= 0) throw err;
    return new Promise<T>((resolve, reject) => {
      setTimeout(() => {
        retryImport(factory, retries - 1, delay * 2).then(resolve, reject);
      }, delay);
    });
  });

const lazy = <T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
) => reactLazy(() => retryImport(factory));
import LanguageManager from "./components/LanguageManager";

// Eagerly load the homepage for best LCP
import Index from "./pages/Index.tsx";

// Lazy load all other routes
const Services = lazy(() => import("./pages/Services.tsx"));
const ServiceDetail = lazy(() => import("./pages/ServiceDetail.tsx"));
const SolucoesSlugRouter = lazy(() => import("./pages/SolucoesSlugRouter.tsx"));
const Portfolio = lazy(() => import("./pages/Portfolio.tsx"));
const PortfolioDetail = lazy(() => import("./pages/PortfolioDetail.tsx"));
const Blog = lazy(() => import("./pages/Blog.tsx"));
const BlogPostPage = lazy(() => import("./pages/BlogPost.tsx"));
const Resources = lazy(() => import("./pages/Resources.tsx"));
const ResourceDetail = lazy(() => import("./pages/ResourceDetail.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const Booking = lazy(() => import("./pages/Booking.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));
const Login = lazy(() => import("./pages/Login.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout.tsx"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard.tsx"));
const AdminAgenda = lazy(() => import("./pages/admin/AdminAgenda.tsx"));
const AdminBookingsFunnel = lazy(() => import("./pages/admin/AdminBookingsFunnel.tsx"));
const AdminBookingDetail = lazy(() => import("./pages/admin/AdminBookingDetail.tsx"));
const AdminPlaceholder = lazy(() => import("./pages/admin/AdminPlaceholder.tsx"));
const AdminResources = lazy(() => import("./pages/admin/AdminResources.tsx"));
const AdminBlog = lazy(() => import("./pages/admin/AdminBlog.tsx"));
const AdminLeads = lazy(() => import("./pages/admin/AdminLeads.tsx"));
const AdminLeadsAnalytics = lazy(() => import("./pages/admin/AdminLeadsAnalytics.tsx"));
const AdminLeadDetail = lazy(() => import("./pages/admin/AdminLeadDetail.tsx"));
const AdminCrmValidationFailures = lazy(() => import("./pages/admin/AdminCrmValidationFailures.tsx"));
const AdminCrmDeliveryStatus = lazy(() => import("./pages/admin/AdminCrmDeliveryStatus.tsx"));


const AdminSolucaoRouting = lazy(() => import("./pages/admin/AdminSolucaoRouting.tsx"));
const AdminAuditLeads = lazy(() => import("./pages/admin/AdminAuditLeads.tsx"));

const AdminProjects = lazy(() => import("./pages/admin/AdminProjects.tsx"));
const AdminServices = lazy(() => import("./pages/admin/AdminServices.tsx"));
const AdminEmailMarketing = lazy(() => import("./pages/admin/AdminEmailMarketing.tsx"));
const AdminCampaigns = lazy(() => import("./pages/admin/AdminCampaigns.tsx"));
const AdminCampaignNew = lazy(() => import("./pages/admin/AdminCampaignNew.tsx"));
const AdminCampaignDetail = lazy(() => import("./pages/admin/AdminCampaignDetail.tsx"));
const AdminCampaignTemplates = lazy(() => import("./pages/admin/AdminCampaignTemplates.tsx"));
const AdminAgenticAI = lazy(() => import("./pages/admin/AdminAgenticAI.tsx"));
const AdminAgenticAINew = lazy(() => import("./pages/admin/AdminAgenticAINew.tsx"));
const AdminAgenticAIDetail = lazy(() => import("./pages/admin/AdminAgenticAIDetail.tsx"));
const AdminAgenticPrompts = lazy(() => import("./pages/admin/AdminAgenticPrompts.tsx"));
const AdminAgenticPromptEditor = lazy(() => import("./pages/admin/AdminAgenticPromptEditor.tsx"));
const AdminAgenticSettings = lazy(() => import("./pages/admin/AdminAgenticSettings.tsx"));
const AdminAgenticAIVersions = lazy(() => import("./pages/admin/AdminAgenticAIVersions.tsx"));
const AdminAgenticMonitoring = lazy(() => import("./pages/admin/AdminAgenticMonitoring.tsx"));
const AdminAgenticAlertThresholds = lazy(() => import("./pages/admin/AdminAgenticAlertThresholds.tsx"));
const AdminAgenticAlertSettings = lazy(() => import("./pages/admin/AdminAgenticAlertSettings.tsx"));
const AdminAgenticApprovals = lazy(() => import("./pages/admin/AdminAgenticApprovals.tsx"));
const AdminSocialMediaDrafts = lazy(() => import("./pages/admin/AdminSocialMediaDrafts.tsx"));
const AdminSocialMediaAuthorLimits = lazy(() => import("./pages/admin/AdminSocialMediaAuthorLimits.tsx"));
const AdminSocialMediaPublisherMonitor = lazy(() => import("./pages/admin/AdminSocialMediaPublisherMonitor.tsx"));
const AdminSocialMediaAuditTrail = lazy(() => import("./pages/admin/AdminSocialMediaAuditTrail.tsx"));
const AdminSocialMediaAccounts = lazy(() => import("./pages/admin/AdminSocialMediaAccounts.tsx"));
const AdminMetaAccounts = lazy(() => import("./pages/admin/AdminMetaAccounts.tsx"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications.tsx"));
const AdminAgenticRunDetail = lazy(() => import("./pages/admin/AdminAgenticRunDetail.tsx"));
const AdminAgenticPlayground = lazy(() => import("./pages/admin/AdminAgenticPlayground.tsx"));
const AdminAgenticScenarios = lazy(() => import("./pages/admin/AdminAgenticScenarios.tsx"));
const AdminAgenticScenarioRuns = lazy(() => import("./pages/admin/AdminAgenticScenarioRuns.tsx"));
const AdminAgenticReport = lazy(() => import("./pages/admin/AdminAgenticReport.tsx"));
const AdminProductKnowledge = lazy(() => import("./pages/admin/AdminProductKnowledge.tsx"));
const RequireRole = lazy(() => import("./components/admin/RequireRole.tsx"));
const RequireAgenticView = lazy(() => import("./components/admin/RequireAgenticView.tsx"));
const AdminEmailAuth = lazy(() => import("./pages/admin/AdminEmailAuth.tsx"));
const AdminInvestidores = lazy(() => import("./pages/admin/AdminInvestidores.tsx"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings.tsx"));
const AdminWhatsApp = lazy(() => import("./pages/admin/AdminWhatsApp.tsx"));
const AdminVipSubscribers = lazy(() => import("./pages/admin/AdminVipSubscribers.tsx"));
const AdminAtendimento = lazy(() => import("./pages/admin/AdminAtendimento.tsx"));
const AdminInbox = lazy(() => import("./pages/admin/AdminInbox.tsx"));
const InboxCalendar = lazy(() => import("./pages/admin/InboxCalendar.tsx"));
const InboxMail = lazy(() => import("./pages/admin/InboxMail.tsx"));
const AdminEmailDeletionAudit = lazy(() => import("./pages/admin/AdminEmailDeletionAudit.tsx"));
const AdminIntegrationDiagnostics = lazy(() => import("./pages/admin/AdminIntegrationDiagnostics.tsx"));
const GmailOAuthCallback = lazy(() => import("./pages/admin/GmailOAuthCallback.tsx"));
const AdminComments = lazy(() => import("./pages/admin/AdminComments.tsx"));
const AdminClients = lazy(() => import("./pages/admin/AdminClients.tsx"));
const AdminHeroSlides = lazy(() => import("./pages/admin/AdminHeroSlides.tsx"));
const ChatWidget = lazy(() => import("./components/ChatWidget.tsx"));
const CookieConsent = lazy(() => import("./components/CookieConsent.tsx"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe.tsx"));
const ROICalculator = lazy(() => import("./pages/ROICalculator.tsx"));
const PriceSimulator = lazy(() => import("./pages/PriceSimulator.tsx"));
const SEOAnalyzer = lazy(() => import("./pages/SEOAnalyzer.tsx"));
const ContentIdeas = lazy(() => import("./pages/ContentIdeas.tsx"));
const DigitalAudit = lazy(() => import("./pages/DigitalAudit.tsx"));
const DigitalAuditResults = lazy(() => import("./pages/DigitalAuditResults.tsx"));
const BrandingGuide = lazy(() => import("./pages/BrandingGuide.tsx"));
const Investidores = lazy(() => import("./pages/Investidores.tsx"));
const ProjetoInvestidor = lazy(() => import("./pages/ProjetoInvestidor.tsx"));
const PoliticaPrivacidade = lazy(() => import("./pages/PoliticaPrivacidade.tsx"));
const PoliticaCookies = lazy(() => import("./pages/PoliticaCookies.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const ClientLayout = lazy(() => import("./components/client/ClientLayout.tsx"));
const ClientDashboard = lazy(() => import("./pages/client/ClientDashboard.tsx"));
const ClientServices = lazy(() => import("./pages/client/ClientServices.tsx"));
const ClientFinances = lazy(() => import("./pages/client/ClientFinances.tsx"));
const ClientSupport = lazy(() => import("./pages/client/ClientSupport.tsx"));
const CollaboratorDashboard = lazy(() => import("./pages/collaborator/CollaboratorDashboard.tsx"));
const HostifyLanding = lazy(() => import("./pages/HostifyLanding.tsx"));
const QookLanding = lazy(() => import("./pages/QookLanding.tsx"));
const MotivaeLanding = lazy(() => import("./pages/MotivaeLanding.tsx"));
const Prosafe360Landing = lazy(() => import("./pages/Prosafe360Landing.tsx"));
const PiktoLanding = lazy(() => import("./pages/PiktoLanding.tsx"));
const TrackfyLanding = lazy(() => import("./pages/TrackfyLanding.tsx"));
const DemoRequest = lazy(() => import("./pages/DemoRequest.tsx"));
const DemoThankYou = lazy(() => import("./pages/DemoThankYou.tsx"));
const AgentesIA = lazy(() => import("./pages/AgentesIA.tsx"));
const CasosSucesso = lazy(() => import("./pages/CasosSucesso.tsx"));
const PodcastBoostTalks = lazy(() => import("./pages/PodcastBoostTalks.tsx"));
const Equipa = lazy(() => import("./pages/Equipa.tsx"));
const SobreNos = lazy(() => import("./pages/SobreNos.tsx"));
const Carreira = lazy(() => import("./pages/Carreira.tsx"));
const Webinars = lazy(() => import("./pages/Webinars.tsx"));
const WebinarDetail = lazy(() => import("./pages/WebinarDetail.tsx"));
const Academy = lazy(() => import("./pages/Academy.tsx"));
const AcademyCourseDetail = lazy(() => import("./pages/AcademyCourseDetail.tsx"));
const AcademyInCompany = lazy(() => import("./pages/AcademyInCompany.tsx"));
const AdminAcademy = lazy(() => import("./pages/admin/AdminAcademy.tsx"));
const AdminPodcast = lazy(() => import("./pages/admin/AdminPodcast.tsx"));
const BotsWhatsApp = lazy(() => import("./pages/BotsWhatsApp.tsx"));
const CrmSalesIntelligence = lazy(() => import("./pages/CrmSalesIntelligence.tsx"));
const GestaoRedesSociais = lazy(() => import("./pages/GestaoRedesSociais.tsx"));
const BrandingIdentidade = lazy(() => import("./pages/BrandingIdentidade.tsx"));
const PaidMedia = lazy(() => import("./pages/PaidMedia.tsx"));
const SeoGeoWebmcp = lazy(() => import("./pages/SeoGeoWebmcp.tsx"));
const CopywritingConteudo = lazy(() => import("./pages/CopywritingConteudo.tsx"));
const VideoFotografia = lazy(() => import("./pages/VideoFotografia.tsx"));
const EmailMarketing = lazy(() => import("./pages/EmailMarketing.tsx"));
const Mvp30Dias = lazy(() => import("./pages/Mvp30Dias.tsx"));
const LandingPages = lazy(() => import("./pages/LandingPages.tsx"));
const DesenvolvimentoWeb = lazy(() => import("./pages/DesenvolvimentoWeb.tsx"));
const DesenvolvimentoMobile = lazy(() => import("./pages/DesenvolvimentoMobile.tsx"));
const DesenvolvimentoSaaS = lazy(() => import("./pages/DesenvolvimentoSaaS.tsx"));
const UxUiDesign = lazy(() => import("./pages/UxUiDesign.tsx"));
const SistemasGestaoPmes = lazy(() => import("./pages/SistemasGestaoPmes.tsx"));
const IntegracoesErpCrm = lazy(() => import("./pages/IntegracoesErpCrm.tsx"));
const FunisVendas = lazy(() => import("./pages/FunisVendas.tsx"));
const MarketingDigital = lazy(() => import("./pages/MarketingDigital.tsx"));
const AgenciaLocal = lazy(() => import("./pages/AgenciaLocal.tsx"));



import { normalizePath } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";
import { analytics } from "@/lib/analytics";

const LAZY_RELOAD_KEY = "__lazy_route_reload__";
const LAZY_RELOAD_MAX = 2;
const isLazyImportError = (error: unknown) =>
  /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError|error loading dynamically imported module/i.test(
    error instanceof Error ? error.message : String(error),
  );

class LazyRouteBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError(error: unknown) {
    return { hasError: isLazyImportError(error) };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    if (!isLazyImportError(error)) {
      console.error(error, errorInfo);
      return;
    }

    const attempts = Number(sessionStorage.getItem(LAZY_RELOAD_KEY) ?? "0");
    if (attempts < LAZY_RELOAD_MAX) {
      sessionStorage.setItem(LAZY_RELOAD_KEY, String(attempts + 1));
      window.location.reload();
    }
  }

  handleRetry = () => {
    sessionStorage.removeItem(LAZY_RELOAD_KEY);
    window.location.reload();
  };

  handleHome = () => {
    sessionStorage.removeItem(LAZY_RELOAD_KEY);
    window.location.assign("/");
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-lg font-semibold">Não foi possível carregar esta secção</h1>
          <p className="text-sm text-muted-foreground">
            Isto costuma acontecer após uma atualização do site. Tenta recarregar — se persistir, volta à página inicial.
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={this.handleRetry}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Recarregar
            </button>
            <button
              type="button"
              onClick={this.handleHome}
              className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
            >
              Ir para o início
            </button>
          </div>
        </div>
      </div>
    );
  }
}

const PageTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Tracking page view on every route change
    // The SEO component handles the title, so we track after it's likely updated
    const title = document.title || 'Getboost Digital';
    analytics.trackPageView(location.pathname, title);
  }, [location.pathname]);

  return null;
};

const ServicesRedirect = () => {
  const location = useLocation();
  const target = location.pathname.replace(/^(\/[a-z]{2})?\/services/, (_m, lang) => `${lang || ''}/solucoes`);
  return <Navigate to={target + location.search + location.hash} replace />;
};



const CanonicalRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const normalized = normalizePath(location.pathname);
    if (location.pathname !== normalized) {
      // Redirect to normalized URL if it differs (e.g. trailing slash or mixed case)
      navigate(normalized + location.search + location.hash, { replace: true });
    }
  }, [location, navigate]);

  return null;
};

const queryClient = new QueryClient();
const FAVICON_VERSION = "20260413b";

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Helmet>
      <link rel="icon" href={`/favicon.ico?v=${FAVICON_VERSION}`} sizes="any" />
      <link rel="shortcut icon" href={`/favicon.ico?v=${FAVICON_VERSION}`} />
      <link rel="icon" type="image/png" sizes="32x32" href={`/favicon-32x32.png?v=${FAVICON_VERSION}`} />
      <link rel="icon" type="image/png" sizes="16x16" href={`/favicon-16x16.png?v=${FAVICON_VERSION}`} />
      <link rel="apple-touch-icon" sizes="180x180" href={`/apple-touch-icon.png?v=${FAVICON_VERSION}`} />
    </Helmet>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CanonicalRedirect />
        <PageTracker />
        <ScrollToTop />
        <LazyRouteBoundary>
        <Suspense fallback={<PageFallback />}>
          <LanguageManager>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/:lang" element={<Index />} />

            {/* SEO Local - Cidades */}
            <Route path="/agencia-marketing-digital-:citySlug" element={<AgenciaLocal />} />
            <Route path="/:lang/agencia-marketing-digital-:citySlug" element={<AgenciaLocal />} />


            
            {/* Canonical /solucoes routes */}
            <Route path="/solucoes" element={<Services />} />
            <Route path="/:lang/solucoes" element={<Services />} />

            <Route path="/hostify" element={<HostifyLanding />} />
            <Route path="/:lang/hostify" element={<HostifyLanding />} />
            <Route path="/solucoes/hostify" element={<Navigate to="/hostify" replace />} />
            <Route path="/:lang/solucoes/hostify" element={<Navigate to="/hostify" replace />} />

            <Route path="/qook" element={<QookLanding />} />
            <Route path="/:lang/qook" element={<QookLanding />} />
            <Route path="/solucoes/qook" element={<Navigate to="/qook" replace />} />
            <Route path="/:lang/solucoes/qook" element={<Navigate to="/qook" replace />} />

            <Route path="/solucoes/bots-whatsapp-ia" element={<BotsWhatsApp />} />
            <Route path="/:lang/solucoes/bots-whatsapp-ia" element={<BotsWhatsApp />} />

            <Route path="/solucoes/gestao-redes-sociais" element={<GestaoRedesSociais />} />
            <Route path="/:lang/solucoes/gestao-redes-sociais" element={<GestaoRedesSociais />} />

            <Route path="/solucoes/branding-identidade" element={<BrandingIdentidade />} />
            <Route path="/:lang/solucoes/branding-identidade" element={<BrandingIdentidade />} />
            <Route path="/solucoes/paid-media" element={<PaidMedia />} />
            <Route path="/:lang/solucoes/paid-media" element={<PaidMedia />} />
            <Route path="/solucoes/seo-geo-webmcp" element={<SeoGeoWebmcp />} />
            <Route path="/:lang/solucoes/seo-geo-webmcp" element={<SeoGeoWebmcp />} />
            {/* Legacy Marketing & Growth slugs → redirect (client-side 301 equivalent) */}
            <Route path="/solucoes/seo-blog" element={<Navigate to="/solucoes/seo-geo-webmcp" replace />} />
            <Route path="/:lang/solucoes/seo-blog" element={<Navigate to="/solucoes/seo-geo-webmcp" replace />} />
            <Route path="/solucoes/seo" element={<Navigate to="/solucoes/seo-geo-webmcp" replace />} />
            <Route path="/:lang/solucoes/seo" element={<Navigate to="/solucoes/seo-geo-webmcp" replace />} />
            <Route path="/solucoes/google-meta-ads" element={<Navigate to="/solucoes/paid-media" replace />} />
            <Route path="/:lang/solucoes/google-meta-ads" element={<Navigate to="/solucoes/paid-media" replace />} />
            <Route path="/solucoes/publicidade-meta-google" element={<Navigate to="/solucoes/paid-media" replace />} />
            <Route path="/:lang/solucoes/publicidade-meta-google" element={<Navigate to="/solucoes/paid-media" replace />} />
            <Route path="/solucoes/publicidade" element={<Navigate to="/solucoes/paid-media" replace />} />
            <Route path="/:lang/solucoes/publicidade" element={<Navigate to="/solucoes/paid-media" replace />} />
            <Route path="/solucoes/branding-identidade-visual" element={<Navigate to="/solucoes/branding-identidade" replace />} />
            <Route path="/:lang/solucoes/branding-identidade-visual" element={<Navigate to="/solucoes/branding-identidade" replace />} />
            <Route path="/solucoes/branding" element={<Navigate to="/solucoes/branding-identidade" replace />} />
            <Route path="/:lang/solucoes/branding" element={<Navigate to="/solucoes/branding-identidade" replace />} />
            <Route path="/solucoes/auditoria-marketing" element={<Navigate to="/solucoes" replace />} />
            <Route path="/:lang/solucoes/auditoria-marketing" element={<Navigate to="/solucoes" replace />} />
            <Route path="/solucoes/copywriting" element={<Navigate to="/solucoes/copywriting-conteudo" replace />} />
            <Route path="/:lang/solucoes/copywriting" element={<Navigate to="/solucoes/copywriting-conteudo" replace />} />
            <Route path="/solucoes/redes-sociais" element={<Navigate to="/solucoes/gestao-redes-sociais" replace />} />
            <Route path="/:lang/solucoes/redes-sociais" element={<Navigate to="/solucoes/gestao-redes-sociais" replace />} />
            <Route path="/solucoes/copywriting-conteudo" element={<CopywritingConteudo />} />
            <Route path="/:lang/solucoes/copywriting-conteudo" element={<CopywritingConteudo />} />
            <Route path="/solucoes/video-fotografia" element={<VideoFotografia />} />
            <Route path="/:lang/solucoes/video-fotografia" element={<VideoFotografia />} />
            <Route path="/solucoes/email-marketing" element={<EmailMarketing />} />
            <Route path="/:lang/solucoes/email-marketing" element={<EmailMarketing />} />
            <Route path="/solucoes/mvp-30-dias" element={<Mvp30Dias />} />
            <Route path="/:lang/solucoes/mvp-30-dias" element={<Mvp30Dias />} />
            <Route path="/solucoes/landing-pages" element={<LandingPages />} />
            <Route path="/:lang/solucoes/landing-pages" element={<LandingPages />} />
            <Route path="/solucoes/desenvolvimento-web" element={<DesenvolvimentoWeb />} />
            <Route path="/:lang/solucoes/desenvolvimento-web" element={<DesenvolvimentoWeb />} />
            <Route path="/solucoes/desenvolvimento-mobile" element={<DesenvolvimentoMobile />} />
            <Route path="/:lang/solucoes/desenvolvimento-mobile" element={<DesenvolvimentoMobile />} />
            <Route path="/solucoes/desenvolvimento-software" element={<DesenvolvimentoSaaS />} />
            <Route path="/:lang/solucoes/desenvolvimento-software" element={<DesenvolvimentoSaaS />} />
            <Route path="/solucoes/desenvolvimento-saas" element={<DesenvolvimentoSaaS />} />
            <Route path="/:lang/solucoes/desenvolvimento-saas" element={<DesenvolvimentoSaaS />} />
            <Route path="/solucoes/ux-ui-design" element={<UxUiDesign />} />
            <Route path="/:lang/solucoes/ux-ui-design" element={<UxUiDesign />} />
            <Route path="/solucoes/sistemas-gestao-pmes" element={<SistemasGestaoPmes />} />
            <Route path="/:lang/solucoes/sistemas-gestao-pmes" element={<SistemasGestaoPmes />} />
            <Route path="/solucoes/integracoes-erp-crm" element={<IntegracoesErpCrm />} />
            <Route path="/:lang/solucoes/integracoes-erp-crm" element={<IntegracoesErpCrm />} />
            <Route path="/solucoes/funis-vendas" element={<FunisVendas />} />
            <Route path="/:lang/solucoes/funis-vendas" element={<FunisVendas />} />
            <Route path="/solucoes/marketing-digital" element={<MarketingDigital />} />
            <Route path="/:lang/solucoes/marketing-digital" element={<MarketingDigital />} />
            <Route path="/solucoes/fotografia-drone" element={<Navigate to="/solucoes/video-fotografia" replace />} />
            <Route path="/:lang/solucoes/fotografia-drone" element={<Navigate to="/solucoes/video-fotografia" replace />} />

            <Route path="/solucoes/:slug" element={<SolucoesSlugRouter />} />
            <Route path="/:lang/solucoes/:slug" element={<SolucoesSlugRouter />} />

            {/* Produtos: sem página índice, redireciona para o primeiro produto */}
            <Route path="/produtos" element={<Navigate to="/qook" replace />} />
            <Route path="/:lang/produtos" element={<Navigate to="/qook" replace />} />

            {/* Legacy /services URLs → redirect to /solucoes */}
            <Route path="/services/*" element={<ServicesRedirect />} />
            <Route path="/:lang/services/*" element={<ServicesRedirect />} />

            <Route path="/motivae" element={<MotivaeLanding />} />
            <Route path="/:lang/motivae" element={<MotivaeLanding />} />

            <Route path="/prosafe360" element={<Prosafe360Landing />} />
            <Route path="/:lang/prosafe360" element={<Prosafe360Landing />} />
            <Route path="/seguranca-trabalho" element={<Navigate to="/prosafe360" replace />} />
            <Route path="/:lang/seguranca-trabalho" element={<Navigate to="/prosafe360" replace />} />

            <Route path="/pikto" element={<PiktoLanding />} />
            <Route path="/:lang/pikto" element={<PiktoLanding />} />

            <Route path="/trackfy" element={<TrackfyLanding />} />
            <Route path="/:lang/trackfy" element={<TrackfyLanding />} />

            <Route path="/demo" element={<DemoRequest />} />
            <Route path="/:lang/demo" element={<DemoRequest />} />
            <Route path="/demo/obrigado" element={<DemoThankYou />} />
            <Route path="/:lang/demo/obrigado" element={<DemoThankYou />} />

            <Route path="/agentes-ia" element={<AgentesIA />} />
            <Route path="/:lang/agentes-ia" element={<AgentesIA />} />
            <Route path="/podcast" element={<PodcastBoostTalks />} />
            <Route path="/:lang/podcast" element={<PodcastBoostTalks />} />
            <Route path="/equipa" element={<Equipa />} />
            <Route path="/:lang/equipa" element={<Equipa />} />
            <Route path="/sobre-nos" element={<SobreNos />} />
            <Route path="/:lang/sobre-nos" element={<SobreNos />} />
            <Route path="/carreira" element={<Carreira />} />
            <Route path="/:lang/carreira" element={<Carreira />} />
            <Route path="/casos-de-sucesso" element={<CasosSucesso />} />
            <Route path="/:lang/casos-de-sucesso" element={<CasosSucesso />} />

            <Route path="/webinars" element={<Webinars />} />
            <Route path="/:lang/webinars" element={<Webinars />} />
            <Route path="/webinars/:slug" element={<WebinarDetail />} />
            <Route path="/:lang/webinars/:slug" element={<WebinarDetail />} />


            <Route path="/academy" element={<Academy />} />
            <Route path="/:lang/academy" element={<Academy />} />
            <Route path="/academy/formacao-empresas" element={<AcademyInCompany />} />
            <Route path="/:lang/academy/formacao-empresas" element={<AcademyInCompany />} />
            <Route path="/academy/:slug" element={<AcademyCourseDetail />} />
            <Route path="/:lang/academy/:slug" element={<AcademyCourseDetail />} />


            <Route path="/crm-sales-intelligence" element={<CrmSalesIntelligence />} />
            <Route path="/:lang/crm-sales-intelligence" element={<CrmSalesIntelligence />} />

            
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/:lang/portfolio" element={<Portfolio />} />
            
            <Route path="/portfolio/:id" element={<PortfolioDetail />} />
            <Route path="/:lang/portfolio/:id" element={<PortfolioDetail />} />
            
            <Route path="/blog" element={<Blog />} />
            <Route path="/:lang/blog" element={<Blog />} />
            
            <Route path="/blog/:id" element={<BlogPostPage />} />
            <Route path="/:lang/blog/:id" element={<BlogPostPage />} />
            
            <Route path="/resources" element={<Resources />} />
            <Route path="/:lang/resources" element={<Resources />} />
            
            <Route path="/resources/:id" element={<ResourceDetail />} />
            <Route path="/:lang/resources/:id" element={<ResourceDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/:lang/about" element={<About />} />
            
            <Route path="/booking" element={<Booking />} />
            <Route path="/:lang/booking" element={<Booking />} />
            
            <Route path="/contact" element={<Contact />} />
            <Route path="/:lang/contact" element={<Contact />} />
            
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="agenda" element={<AdminAgenda />} />
              <Route path="bookings-funnel" element={<AdminBookingsFunnel />} />
              <Route path="bookings-funnel/:id" element={<AdminBookingDetail />} />
              <Route path="blog" element={<AdminBlog />} />
              <Route path="recursos" element={<AdminResources />} />
              <Route path="projetos" element={<AdminProjects />} />
              <Route path="servicos" element={<AdminServices />} />
              <Route path="leads" element={<AdminLeads />} />
              <Route path="leads-analytics" element={<AdminLeadsAnalytics />} />
              <Route path="leads/:id" element={<AdminLeadDetail />} />
              <Route path="crm-validation-failures" element={<AdminCrmValidationFailures />} />
              <Route path="crm-delivery-status" element={<AdminCrmDeliveryStatus />} />


              <Route path="auditorias-crm" element={<AdminAuditLeads />} />
              <Route path="solucoes-routing" element={<AdminSolucaoRouting />} />

              <Route path="email-marketing" element={<AdminEmailMarketing />} />
              <Route path="campanhas" element={<AdminCampaigns />} />
              <Route path="campanhas/nova" element={<AdminCampaignNew />} />
              <Route path="campanhas/modelos" element={<AdminCampaignTemplates />} />
              <Route path="campanhas/:id" element={<AdminCampaignDetail />} />
              <Route path="email-auth" element={<AdminEmailAuth />} />
              <Route path="investidores" element={<AdminInvestidores />} />
              <Route path="definicoes" element={<AdminSettings />} />
              <Route path="agentic-ai" element={<RequireAgenticView><AdminAgenticAI /></RequireAgenticView>} />
              <Route path="agentic-ai/novo" element={<RequireRole><AdminAgenticAINew /></RequireRole>} />
              <Route path="agentic-ai/prompts" element={<RequireAgenticView><AdminAgenticPrompts /></RequireAgenticView>} />
              <Route path="agentic-ai/prompts/novo" element={<RequireRole><AdminAgenticPromptEditor mode="new" /></RequireRole>} />
              <Route path="agentic-ai/prompts/:id" element={<RequireRole><AdminAgenticPromptEditor mode="edit" /></RequireRole>} />
              <Route path="agentic-ai/configuracoes" element={<RequireAgenticView><AdminAgenticSettings /></RequireAgenticView>} />
              <Route path="agentic-ai/monitoring" element={<RequireRole><AdminAgenticMonitoring /></RequireRole>} />
              <Route path="agentic-ai/monitoring/:id" element={<RequireRole><AdminAgenticRunDetail /></RequireRole>} />
              <Route path="agentic-ai/alertas" element={<RequireRole><AdminAgenticAlertThresholds /></RequireRole>} />
              <Route path="agentic-ai/alertas/definicoes" element={<RequireRole><AdminAgenticAlertSettings /></RequireRole>} />
              <Route path="agentic-ai/aprovacoes" element={<RequireRole><AdminAgenticApprovals /></RequireRole>} />
              <Route path="agentic-ai/:id" element={<RequireAgenticView><AdminAgenticAIDetail /></RequireAgenticView>} />
              <Route path="agentic-ai/:id/versoes" element={<RequireRole><AdminAgenticAIVersions /></RequireRole>} />
              <Route path="agentic-ai/:id/playground" element={<RequireRole><AdminAgenticPlayground /></RequireRole>} />
              <Route path="agentic-ai/cenarios" element={<RequireRole><AdminAgenticScenarios /></RequireRole>} />
              <Route path="agentic-ai/cenarios/runs" element={<RequireRole><AdminAgenticScenarioRuns /></RequireRole>} />
              <Route path="agentic-ai/relatorio" element={<RequireRole><AdminAgenticReport /></RequireRole>} />
              <Route path="agentic-ai/product-knowledge" element={<RequireRole><AdminProductKnowledge /></RequireRole>} />
              <Route path="agentic-ai/social-media-drafts" element={<RequireRole><AdminSocialMediaDrafts /></RequireRole>} />
              <Route path="agentic-ai/social-media-author-limits" element={<RequireRole><AdminSocialMediaAuthorLimits /></RequireRole>} />
              <Route path="agentic-ai/social-media-publisher" element={<RequireRole><AdminSocialMediaPublisherMonitor /></RequireRole>} />
              <Route path="agentic-ai/social-media-audit" element={<RequireRole><AdminSocialMediaAuditTrail /></RequireRole>} />
              <Route path="agentic-ai/social-media-accounts" element={<RequireRole><AdminSocialMediaAccounts /></RequireRole>} />
              <Route path="agentic-ai/meta-accounts" element={<RequireRole><AdminMetaAccounts /></RequireRole>} />
              <Route path="notifications" element={<RequireRole><AdminNotifications /></RequireRole>} />

              <Route path="whatsapp" element={<AdminWhatsApp />} />
              <Route path="vip" element={<AdminVipSubscribers />} />
              <Route path="atendimento" element={<AdminAtendimento />} />
              <Route path="inbox" element={<AdminInbox />} />
              <Route path="inbox-calendar" element={<InboxCalendar />} />
              <Route path="inbox-mail" element={<InboxMail />} />
              <Route path="inbox-mail/oauth/callback" element={<GmailOAuthCallback />} />
              <Route path="inbox-mail/auditoria" element={<AdminEmailDeletionAudit />} />
              <Route path="diagnostico-integracoes" element={<AdminIntegrationDiagnostics />} />
              <Route path="comentarios" element={<AdminComments />} />
              <Route path="clientes" element={<AdminClients />} />
              <Route path="hero-banners" element={<AdminHeroSlides />} />
              <Route path="academy" element={<AdminAcademy />} />
              <Route path="podcast" element={<AdminPodcast />} />
            </Route>
            <Route path="/cliente" element={<ClientLayout />}>
              <Route index element={<ClientDashboard />} />
              <Route path="servicos" element={<ClientServices />} />
              <Route path="financeiro" element={<ClientFinances />} />
              <Route path="suporte" element={<ClientSupport />} />
            </Route>
            <Route path="/colaborador" element={<CollaboratorDashboard />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/tools/roi-calculator" element={<ROICalculator />} />
            <Route path="/:lang/tools/roi-calculator" element={<ROICalculator />} />
            
            <Route path="/simulador" element={<PriceSimulator />} />
            <Route path="/:lang/simulador" element={<PriceSimulator />} />
            
            <Route path="/tools/seo-analyzer" element={<SEOAnalyzer />} />
            <Route path="/:lang/tools/seo-analyzer" element={<SEOAnalyzer />} />
            
            <Route path="/tools/content-ideas" element={<ContentIdeas />} />
            <Route path="/:lang/tools/content-ideas" element={<ContentIdeas />} />

            <Route path="/tools/digital-audit" element={<DigitalAudit />} />
            <Route path="/tools/digital-audit/resultados" element={<DigitalAuditResults />} />
            <Route path="/:lang/tools/digital-audit" element={<DigitalAudit />} />
            <Route path="/:lang/tools/digital-audit/resultados" element={<DigitalAuditResults />} />
            
            <Route path="/tools/branding-guide" element={<BrandingGuide />} />
            <Route path="/:lang/tools/branding-guide" element={<BrandingGuide />} />
            
            <Route path="/investidores" element={<Investidores />} />
            <Route path="/:lang/investidores" element={<Investidores />} />
            
            <Route path="/investidores/:slug" element={<ProjetoInvestidor />} />
            <Route path="/:lang/investidores/:slug" element={<ProjetoInvestidor />} />
            
            <Route path="/politica-de-privacidade" element={<PoliticaPrivacidade />} />
            <Route path="/:lang/politica-de-privacidade" element={<PoliticaPrivacidade />} />
            
            <Route path="/politica-de-cookies" element={<PoliticaCookies />} />
            <Route path="/:lang/politica-de-cookies" element={<PoliticaCookies />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          </LanguageManager>
        </Suspense>
        </LazyRouteBoundary>
        <Suspense fallback={null}>
          <ChatWidget />
          <CookieConsent />
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
