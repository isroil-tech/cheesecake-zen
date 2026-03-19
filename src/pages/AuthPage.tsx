import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/i18n/useTranslation';

interface AuthPageProps {
  onAuth: () => void;
}

export function AuthPage({ onAuth }: AuthPageProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'phone' | 'otp' | 'register'>('phone');
  const [phone, setPhone] = useState('+998 ');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);

  // Format phone for auth (use as email)
  const phoneToEmail = (ph: string) => {
    const digits = ph.replace(/\D/g, '');
    return `${digits}@77cheesecake.app`;
  };

  const handlePhoneSubmit = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9) {
      setError(t('auth.invalidPhone'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const email = phoneToEmail(phone);
      // Try sign in first
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        setStep('otp');
      }
    } catch (err) {
      setError(t('auth.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (otp.length < 6) {
      setError(t('auth.invalidOtp'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const email = phoneToEmail(phone);
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (verifyError) {
        setError(verifyError.message);
      } else if (data.user) {
        // Check if profile has full_name
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', data.user.id)
          .single();

        if (!profile?.full_name) {
          setIsNewUser(true);
          setStep('register');
        } else {
          onAuth();
        }
      }
    } catch (err) {
      setError(t('auth.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!fullName.trim()) {
      setError(t('auth.nameRequired'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const digits = phone.replace(/\D/g, '');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: `+${digits}`,
        })
        .eq('user_id', user.id);

      if (updateError) {
        setError(updateError.message);
      } else {
        onAuth();
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {t('auth.otpSent')} <span className="font-medium text-foreground">{phone}</span>
              </p>
            </div>

            <div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full py-4 rounded-2xl bg-secondary text-foreground text-2xl font-bold text-center tracking-[0.5em] placeholder:text-muted-foreground/40 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <button
              onClick={handleOtpSubmit}
              disabled={loading || otp.length < 6}
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground text-base font-semibold active-scale transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                t('auth.verify')
              )}
            </button>

            <button
              onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
              className="w-full text-sm text-muted-foreground active-scale"
            >
              {t('auth.changePhone')}
            </button>
          </motion.div>
        )}

        {/* Register step */}
        {step === 'register' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground">{t('auth.welcome')}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t('auth.fillProfile')}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                {t('auth.nameLabel')}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('auth.namePlaceholder')}
                className="w-full px-4 py-4 rounded-2xl bg-secondary text-foreground text-base placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                autoFocus
              />
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
