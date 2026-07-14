import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import SEO from '@/components/SEO';
import logoBranca from '@/assets/logo-getboost-soft-branca.svg';
import loginVideoAsset from '@/assets/login-office-bg.mp4.asset.json';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ACCENT = '#ff4000';

const VideoBackground = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 min-w-full min-h-full w-auto h-auto object-cover [object-position:center_bottom]"
        autoPlay
        loop
        muted
        playsInline
        poster=""
      >
        <source src={loginVideoAsset.url} type="video/mp4" />
      </video>
      {/* Layered overlays: brand tint + darkening for legibility */}
      <div className="absolute inset-0 bg-[#0a0603]/70 z-10" />
      <div
        className="absolute inset-0 z-10 mix-blend-overlay opacity-40"
        style={{
          background:
            'radial-gradient(ellipse at 30% 40%, rgba(255,64,0,0.5) 0%, transparent 60%)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 z-10 opacity-[0.12] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,64,0,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,64,0,0.4) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  );
};

const ToggleSwitch = ({ checked, onChange, id }: { checked: boolean; onChange: () => void; id: string }) => (
  <div className="relative inline-block w-10 h-5 cursor-pointer" onClick={onChange}>
    <input type="checkbox" id={id} className="sr-only" checked={checked} onChange={onChange} />
    <div
      className="absolute inset-0 rounded-full transition-colors duration-200"
      style={{ background: checked ? ACCENT : 'rgba(255,255,255,0.2)' }}
    >
      <div
        className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
          checked ? 'translate-x-5' : ''
        }`}
      />
    </div>
  </div>
);

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(t('login.errorCredentials'));
      return;
    }
    toast.success(t('login.successLogin'));
    const userId = data.session?.user?.id;
    if (!userId) { navigate('/cliente'); return; }

    // Use SECURITY DEFINER RPCs to avoid RLS race on freshly-issued session.
    const [{ data: isAdmin }, { data: isCollab }] = await Promise.all([
      supabase.rpc('has_role', { _user_id: userId, _role: 'admin' }),
      supabase.rpc('has_role', { _user_id: userId, _role: 'collaborator' }),
    ]);

    if (isAdmin) navigate('/admin', { replace: true });
    else if (isCollab) navigate('/colaborador', { replace: true });
    else navigate('/cliente', { replace: true });
  };

  const handleForgot = async () => {
    if (!email.trim()) {
      toast.error(t('login.errorEmailFirst'));
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(t('login.errorResetSend'));
    else toast.success(t('login.successReset'));
  };

  return (
    <>
      <SEO title={t('login.seoTitle')} description={t('login.seoDesc')} canonical="/login" noIndex />
      <div className="relative min-h-screen w-full flex items-center justify-center px-4 py-12 overflow-hidden bg-[#0a0603]">
        <VideoBackground />

        {/* Back to site */}
        <Link
          to="/"
          className="absolute top-6 left-6 z-30 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t('login.backToSite')}
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative z-20 w-full max-w-md"
        >
          <div
            className="p-8 md:p-10 rounded-2xl backdrop-blur-xl bg-black/50 border shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}
          >
            {/* Header */}
            <div className="mb-8 text-center">
              <img src={logoBranca} alt="Getboost Digital" className="mx-auto h-12 w-auto mb-6" />
              <div
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em]"
                style={{ borderColor: `${ACCENT}55`, color: '#ffb494' }}
              >
                <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
                Área Reservada
              </div>
              <h1 className="mt-5 text-3xl font-black tracking-tight text-white">
                {t('login.welcomeBack')}
              </h1>
              <p className="mt-2 text-sm text-white/60">{t('login.signInSubtitle')}</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('login.emailPlaceholder')}
                  required
                  className="w-full pl-10 pr-3 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 outline-none focus:border-[#ff4000]/60 focus:bg-white/[0.07] transition-all"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('login.passwordPlaceholder')}
                  required
                  className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 outline-none focus:border-[#ff4000]/60 focus:bg-white/[0.07] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ToggleSwitch checked={remember} onChange={() => setRemember((v) => !v)} id="remember-me" />
                  <label
                    htmlFor="remember-me"
                    onClick={() => setRemember((v) => !v)}
                    className="text-sm text-white/70 cursor-pointer hover:text-white transition-colors"
                  >
                    {t('login.rememberMe', 'Manter sessão')}
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleForgot}
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  {t('login.forgotPassword')}
                </button>
              </div>

              {/* Submit — Getboost brand button */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full inline-flex items-center justify-center gap-3 border-2 py-3.5 font-mono text-[11px] uppercase tracking-[0.28em] transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:!text-white"
                style={{ borderColor: ACCENT, color: ACCENT }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.background = ACCENT)}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {loading ? t('login.signingIn') : t('login.signIn')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </form>

            <p className="mt-8 text-center text-xs font-mono uppercase tracking-[0.2em] text-white/40">
              Getboost Digital · Portugal
            </p>
          </div>
        </motion.div>

        <footer className="absolute bottom-4 left-0 right-0 text-center text-white/50 text-xs z-20">
          © {new Date().getFullYear()} Getboost Digital. All rights reserved.
        </footer>
      </div>
    </>
  );
};

export default Login;
