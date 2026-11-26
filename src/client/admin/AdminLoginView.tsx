import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import {
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, googleProvider, hasFirebaseConfig } from '../../shared/firebase';

interface AdminLoginViewProps {
  currentUser: User | null;
  authStatusMessage?: string | null;
  needsEmailVerification?: boolean;
  isUnauthorized?: boolean;
  onRefreshVerification?: () => Promise<void>;
  onNavigateStorefront?: () => void;
  showStorefrontLink?: boolean;
}

export function AdminLoginView({
  currentUser,
  authStatusMessage,
  needsEmailVerification = false,
  isUnauthorized = false,
  onRefreshVerification,
  onNavigateStorefront,
  showStorefrontLink = false,
}: AdminLoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [showConsoleGuide, setShowConsoleGuide] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    if (!email.trim() || !password) {
      setErrorMsg('Informe seu e-mail e sua senha para entrar.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        setErrorMsg('E-mail ou senha inválidos.');
      } else if (code === 'auth/operation-not-allowed') {
        setErrorMsg(
          'O provedor E-mail/Senha ainda não está ativado no Firebase Console. Veja as instruções abaixo ou entre com Google.'
        );
        setShowConsoleGuide(true);
      } else if (code === 'auth/too-many-requests') {
        setErrorMsg('Muitas tentativas seguidas. Aguarde alguns instantes e tente novamente.');
      } else {
        setErrorMsg('Não foi possível autenticar. Verifique seus dados e tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth) return;
    setSubmitting(true);
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code !== 'auth/popup-closed-by-user') {
        setErrorMsg('Não foi possível concluir o login com Google.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!auth) return;
    if (!email.trim()) {
      setErrorMsg('Digite seu e-mail acima para receber o link de redefinição de senha.');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfoMsg(`Enviamos um e-mail de redefinição de senha para ${email.trim()}.`);
    } catch {
      setErrorMsg('Não foi possível enviar o e-mail de redefinição. Confira o endereço informado.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!currentUser) return;
    setSubmitting(true);
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      await sendEmailVerification(currentUser);
      setInfoMsg(`Link de confirmação reenviado para ${currentUser.email}.`);
    } catch {
      setErrorMsg('Aguarde alguns segundos antes de solicitar outro e-mail de verificação.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-center items-center px-4 py-10">
      <div className="w-full max-w-[440px] space-y-5">
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[#0F172A] text-white mb-1">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h1 className="text-[24px] font-extrabold tracking-[-0.02em] text-[#0F172A]">
            Painel Administrativo
          </h1>
          <p className="text-[14px] text-[#475569]">
            Gerencie cardápio, categorias, logo, taxas e equipe.
          </p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 space-y-5">
          {!hasFirebaseConfig ? (
            <div className="space-y-3 text-[13px] text-[#334155]">
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#FFFBEB] border border-[#F59E0B] text-[#92400E]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Configuração do Firebase pendente</p>
                  <p className="mt-1">
                    Defina a variável de ambiente <code className="font-mono">VITE_FIREBASE_API_KEY</code> no arquivo{' '}
                    <code className="font-mono">.env</code> (ou nas Environment Variables da Vercel) para ativar a autenticação e o salvamento em nuvem.
                  </p>
                </div>
              </div>
              <p className="text-[#475569]">
                Enquanto isso, o cardápio público continua funcionando normalmente com os dados padrão.
              </p>
            </div>
          ) : needsEmailVerification && currentUser ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-[#FFFBEB] border border-[#F59E0B] text-[#92400E] text-[13px] space-y-1">
                <p className="font-bold">Confirme seu e-mail para liberar o acesso</p>
                <p>
                  Enviamos um link de verificação para <strong>{currentUser.email}</strong>. Abra sua caixa de entrada, clique no link e depois clique em atualizar abaixo.
                </p>
              </div>

              {errorMsg && (
                <p className="text-[13px] text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-3">
                  {errorMsg}
                </p>
              )}
              {infoMsg && (
                <p className="text-[13px] text-[#15803D] bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg p-3">
                  {infoMsg}
                </p>
              )}

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => onRefreshVerification?.()}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-[14px] font-semibold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Já confirmei, atualizar acesso</span>
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleResendVerification}
                  className="w-full min-h-[42px] px-4 py-2 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F172A] text-[13px] font-semibold cursor-pointer disabled:opacity-60"
                >
                  Reenviar e-mail de verificação
                </button>
                <button
                  type="button"
                  onClick={() => auth && signOut(auth)}
                  className="w-full min-h-[40px] px-4 py-2 text-[13px] font-semibold text-[#64748B] hover:text-[#0F172A] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Entrar com outra conta</span>
                </button>
              </div>
            </div>
          ) : isUnauthorized && currentUser ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-[13px] space-y-1">
                <p className="font-bold">Acesso não autorizado</p>
                <p>
                  A conta <strong>{currentUser.email}</strong> não possui permissão ativa para acessar este painel administrativo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => auth && signOut(auth)}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-[14px] font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair e tentar outra conta</span>
              </button>
            </div>
          ) : (
            <>
              {authStatusMessage && (
                <div className="p-3 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] text-[13px] text-[#334155]">
                  {authStatusMessage}
                </div>
              )}

              {errorMsg && (
                <div
                  role="alert"
                  className="flex items-start gap-2 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[13px] text-[#B91C1C]"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {infoMsg && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-[13px] text-[#15803D]">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{infoMsg}</span>
                </div>
              )}

              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="admin-email"
                    className="block text-[13px] font-semibold text-[#0F172A]"
                  >
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="admin-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="andreluiscelis@celisapp.com"
                      className="w-full min-h-[44px] pl-10 pr-3.5 py-2 bg-[#FFFFFF] border border-[#CBD5E1] focus:border-[#0F172A] focus:outline-none rounded-lg text-[14px]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="admin-password"
                      className="block text-[13px] font-semibold text-[#0F172A]"
                    >
                      Senha
                    </label>
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      className="text-[12px] font-semibold text-[#475569] hover:text-[#0F172A] cursor-pointer"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full min-h-[44px] pl-10 pr-10 py-2 bg-[#FFFFFF] border border-[#CBD5E1] focus:border-[#0F172A] focus:outline-none rounded-lg text-[14px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white text-[14px] font-semibold transition-colors cursor-pointer disabled:opacity-60"
                >
                  {submitting ? 'Entrando...' : 'Entrar com E-mail e Senha'}
                </button>
              </form>

              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-[#E2E8F0]" />
                <span className="shrink-0 mx-3 text-[12px] font-medium text-[#64748B]">
                  ou
                </span>
                <div className="flex-grow border-t border-[#E2E8F0]" />
              </div>

              <button
                type="button"
                disabled={submitting}
                onClick={handleGoogleLogin}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] text-[14px] font-semibold transition-colors cursor-pointer disabled:opacity-60"
              >
                Entrar com Google
              </button>

              <div className="border-t border-[#E2E8F0] pt-3">
                <button
                  type="button"
                  onClick={() => setShowConsoleGuide((prev) => !prev)}
                  className="w-full flex items-center justify-between text-[12px] font-semibold text-[#475569] hover:text-[#0F172A] cursor-pointer"
                >
                  <span>Como ativar E-mail e Senha no Firebase Console</span>
                  {showConsoleGuide ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {showConsoleGuide && (
                  <ol className="mt-2.5 space-y-1.5 text-[12px] text-[#475569] list-decimal pl-4">
                    <li>
                      Acesse o Firebase Console no projeto{' '}
                      <code className="font-mono text-[#0F172A]">algebraic-flow-mmn89</code>.
                    </li>
                    <li>
                      No menu lateral, clique em <strong>Authentication</strong> &rarr;{' '}
                      <strong>Sign-in method</strong>.
                    </li>
                    <li>
                      Clique em <strong>Adicionar novo provedor</strong> &rarr;{' '}
                      <strong>E-mail/senha</strong>, ative a opção e salve.
                    </li>
                    <li>
                      Para criar sua senha inicial, cadastre seu e-mail na aba{' '}
                      <strong>Users</strong> ou entre primeiro pelo botão{' '}
                      <strong>Entrar com Google</strong>.
                    </li>
                  </ol>
                )}
              </div>
            </>
          )}
        </div>

        {showStorefrontLink && onNavigateStorefront && (
          <div className="text-center">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigateStorefront();
              }}
              className="text-[13px] font-semibold text-[#475569] hover:text-[#0F172A]"
            >
              &larr; Voltar para o cardápio público
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
