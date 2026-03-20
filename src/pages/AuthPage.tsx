import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Phone, ArrowRight, Loader2, User as UserIcon, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/i18n/useTranslation';

interface AuthPageProps {
  onAuth: (phone?: string) => void;
}

export function AuthPage({ onAuth }: AuthPageProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'phone' | 'otp' | 'register'>('phone');
  const [phone, setPhone] = useState('+998 ');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const phoneToEmail = (ph: string) => {
    const digits = ph.replace(/\D/g, '');
    return `user${digits}@77cheesecake.app`;
  };

  const defaultPassword = (ph: string) => {
    const digits = ph.replace(/\D/g, '');
    return `cc77_${digits}_pass`;
  };

  const handlePhoneSubmit = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 12) {
      setError(t('auth.invalidPhone'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const email = phoneToEmail(phone);
      const password = defaultPassword(phone);

      // Try sign in first (existing user)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // User doesn't exist — ask for OTP confirmation before registering
        setStep('otp');
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        // Existing user signed in successfully
        onAuth(phone);
      }
    } catch (err) {
      setError(t('auth.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    if (pasted.length > 0) {
      const focusIndex = Math.min(pasted.length, 5);
      otpRefs.current[focusIndex]?.focus();
    }
  };

  const handleOtpSubmit = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setError(t('auth.invalidOtp'));
      return;
    }

    setLoading(true);
    setError('');

    // For now, accept any 6-digit code and proceed to register
    // In production, verify the OTP code with your SMS service
    setTimeout(() => {
      setLoading(false);
      setStep('register');
    }, 800);
  };

  const handleRegister = async () => {
    if (!fullName.trim()) {
      setError(t('auth.nameRequired'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const email = phoneToEmail(phone);
      const password = defaultPassword(phone);
      const digits = phone.replace(/\D/g, '');

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.user) {
        // Update profile with name and phone
        await supabase
          .from('profiles')
          .update({
            full_name: fullName.trim(),
            phone: `+${digits}`,
          })
          .eq('user_id', data.user.id);

        // Navigate after registration
        onAuth(phone);
      } else {
        setError(t('auth.error'));
      }
    } catch (err) {
      setError(t('auth.error'));
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (value: string) => {
    let digits = value.replace(/\D/g, '');
    if (!digits.startsWith('998')) {
      digits = '998' + digits;
    }
    if (digits.length > 12) digits = digits.slice(0, 12);

    let formatted = '+998';
    if (digits.length > 3) formatted += ' ' + digits.slice(3, 5);
    if (digits.length > 5) formatted += ' ' + digits.slice(5, 8);
    if (digits.length > 8) formatted += ' ' + digits.slice(8, 10);
    if (digits.length > 10) formatted += ' ' + digits.slice(10, 12);
    return formatted;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Brand */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">77Cheesecake</h1>
          <p className="text-sm text-muted-foreground mt-2">{t('tagline')}</p>
        </div>

        {/* Phone step */}
        {step === 'phone' && (
          <motion.div
            key="phone"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                {t('auth.phoneLabel')}
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="+998 90 123 45 67"
                  className="w-full pl-11 pr-4 py-4 rounded-2xl bg-secondary text-foreground text-base font-medium placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all tracking-wide"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <button
              onClick={handlePhoneSubmit}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground text-base font-semibold active-scale transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {t('auth.continue')}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* OTP step */}
        {step === 'otp' && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">{t('auth.otpSent')}</h2>
              <p className="text-sm text-muted-foreground mt-1">{phone}</p>
            </div>

            {/* OTP inputs */}
            <div className="flex justify-center gap-2.5" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-secondary text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              ))}
            </div>

            {/* Phone change link */}
            <div className="text-center">
              <button
                onClick={() => { setStep('phone'); setError(''); setOtp(['', '', '', '', '', '']); }}
                className="text-xs text-primary font-medium"
              >
                {t('auth.changePhone')}
              </button>
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <button
              onClick={handleOtpSubmit}
              disabled={loading || otp.join('').length !== 6}
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground text-base font-semibold active-scale transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {t('auth.verify')}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* Register step */}
        {step === 'register' && (
          <motion.div
            key="register"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground">{t('auth.welcome')}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t('auth.fillProfile')}</p>
            </div>

            {/* Phone display */}
            <div className="bg-secondary rounded-2xl px-4 py-3 flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{phone}</span>
              <button
                onClick={() => { setStep('phone'); setError(''); }}
                className="ml-auto text-xs text-primary font-medium"
              >
                {t('auth.changePhone')}
              </button>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                {t('auth.nameLabel')}
              </label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('auth.namePlaceholder')}
                  className="w-full pl-11 pr-4 py-4 rounded-2xl bg-secondary text-foreground text-base placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <button
              onClick={handleRegister}
              disabled={loading || !fullName.trim()}
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground text-base font-semibold active-scale transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                t('auth.start')
              )}
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
