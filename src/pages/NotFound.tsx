import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search, Ghost } from "lucide-react";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Logic for site search - could be a redirect to blog with search param or similar
      // For now, let's redirect to blog which usually has search capabilities or list
      navigate(`/blog?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <SEO 
        title="404 — Página não encontrada" 
        noIndex={true} 
      />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative mb-8"
      >
        <div className="absolute -inset-4 rounded-full bg-primary/10 blur-3xl" />
        <Ghost className="relative h-24 w-24 text-primary animate-bounce mx-auto" />
        <h1 className="mt-6 text-8xl font-black tracking-tighter text-primary/20 md:text-9xl">
          404
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="max-w-md w-full"
      >
        <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Ups! Esta página desapareceu...
        </h2>
        <p className="mb-8 text-lg text-muted-foreground leading-relaxed">
          Parece que o caminho que procuras já não existe ou foi movido. Não te preocupes, ainda podes encontrar o que precisas abaixo.
        </p>

        <form onSubmit={handleSearch} className="relative mb-10 group">
          <input
            type="text"
            placeholder="O que procuras?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-input bg-background px-6 py-3 pr-12 text-sm ring-offset-background transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground transition-colors hover:text-primary"
          >
            <Search className="h-5 w-5" />
          </button>
        </form>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Button asChild size="lg" className="rounded-full px-8 gap-2 w-full sm:w-auto">
            <Link to="/">
              <Home className="h-4 w-4" />
              Ir para o Início
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full px-8 gap-2 w-full sm:w-auto">
            <button onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4" />
              Voltar atrás
            </button>
          </Button>
        </div>

        <div className="pt-8 border-t border-border w-full">
          <p className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Links Rápidos</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Link to="/solucoes" className="flex flex-col items-center p-3 rounded-xl hover:bg-accent transition-colors group">
              <span className="text-sm font-medium text-foreground group-hover:text-primary">Serviços</span>
            </Link>
            <Link to="/blog" className="flex flex-col items-center p-3 rounded-xl hover:bg-accent transition-colors group">
              <span className="text-sm font-medium text-foreground group-hover:text-primary">Blog</span>
            </Link>
            <Link to="/resources" className="flex flex-col items-center p-3 rounded-xl hover:bg-accent transition-colors group">
              <span className="text-sm font-medium text-foreground group-hover:text-primary">Recursos</span>
            </Link>
            <Link to="/portfolio" className="flex flex-col items-center p-3 rounded-xl hover:bg-accent transition-colors group">
              <span className="text-sm font-medium text-foreground group-hover:text-primary">Portfolio</span>
            </Link>
            <Link to="/about" className="flex flex-col items-center p-3 rounded-xl hover:bg-accent transition-colors group">
              <span className="text-sm font-medium text-foreground group-hover:text-primary">Sobre</span>
            </Link>
            <Link to="/contact" className="flex flex-col items-center p-3 rounded-xl hover:bg-accent transition-colors group">
              <span className="text-sm font-medium text-foreground group-hover:text-primary">Contacto</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
