import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Lock, EyeOff, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import logoBranca from '@/assets/logo-getboost-soft-branca.svg';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) setIsRecovery(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error('As passwords não coincidem.'); return; }
    if (password.length < 6) { toast.error('A password deve ter pelo menos 6 caracteres.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error('Erro ao redefinir a password. Tente novamente.');
    } else {
      toast.success('Password redefinida com sucesso!');
      navigate('/login');
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="w-full max-w-md text-center rounded-2xl overflow-hidden bg-card border border-border p-10">
          <h1 className="text-2xl font-bold text-foreground mb-2">Link inválido</h1>
          <p className="text-muted-foreground">Este link de recuperação é inválido ou expirou.</p>
          <Button asChild className="mt-6 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25">
            <Link to="/login">Voltar ao Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 rounded-2xl overflow-hidden bg-white border border-border transition-all duration-300"
      >
        {/* Left: Branding */}
        <div className="relative flex flex-col items-center justify-center p-12 text-center overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(15 100% 6%) 0%, hsl(0 0% 4%) 45%, hsl(15 90% 10%) 100%)' }}>
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-[-20%] left-[10%] w-[400px] h-[400px] rounded-full blur-[150px] bg-primary/25" />
            <div className="absolute bottom-[-10%] right-[10%] w-[300px] h-[300px] rounded-full blur-[120px] bg-primary/15" />
          </div>
          <div className="absolute bottom-8 left-8 w-32 h-32 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1.5px, transparent 1.5px)', backgroundSize: '10px 10px' }} />
          <svg className="relative z-10 w-48 h-32 mb-6" viewBox="0 0 200 120" fill="none">
            <polyline points="20,80 60,30 100,70 140,20 180,50" stroke="hsl(var(--primary))" strokeWidth="2.5" fill="none" />
            <circle cx="20" cy="80" r="5" fill="hsl(var(--primary))" />
            <circle cx="60" cy="30" r="5" fill="hsl(var(--primary))" />
            <circle cx="100" cy="70" r="5" fill="hsl(var(--primary))" />
            <circle cx="140" cy="20" r="5" fill="hsl(var(--primary))" />
            <circle cx="180" cy="50" r="5" fill="hsl(var(--primary))" />
          </svg>
          <img src={logoBranca} alt="Getboost Digital" className="relative z-10 h-16 md:h-20 w-auto" />
          <p className="relative z-10 text-sm text-white/60 mt-4 max-w-[240px]">
            Redefine a tua password para voltar a aceder à tua conta.
          </p>
        </div>

        {/* Right: Form */}
        <div className="bg-card p-10 md:p-12 flex flex-col justify-center">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 w-fit">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Login
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Redefinir Password</h1>
          <p className="text-muted-foreground text-sm mt-1">Introduz a tua nova password</p>

          <form onSubmit={handleReset} className="mt-8 space-y-5">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Nova Password <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Confirmar Password <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repete a password"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-full h-12 text-base font-medium gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
            >
              {loading ? 'A redefinir...' : 'Redefinir Password'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
