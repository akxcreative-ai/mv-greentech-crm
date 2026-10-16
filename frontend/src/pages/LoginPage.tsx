import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layers, Mail, Lock, AlertCircle, KeyRound, Smartphone, CheckCircle2, RefreshCw, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { otpApi } from '../lib/api';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login, loginWithToken, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Active tab: 'password' | 'otp'
  const [activeTab, setActiveTab] = useState<'password' | 'otp'>('password');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // OTP state
  const [otpIdentifier, setOtpIdentifier] = useState('admin@mvgreentech.com');
  const [otpChannel, setOtpChannel] = useState<'EMAIL' | 'SMS'>('EMAIL');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [demoOtpHint, setDemoOtpHint] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Forgot Password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotCooldown, setForgotCooldown] = useState(0);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@mvgreentech.com',
      password: 'Admin@123',
    },
  });

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Cooldown timers
  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

  useEffect(() => {
    if (forgotCooldown > 0) {
      const timer = setTimeout(() => setForgotCooldown(forgotCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [forgotCooldown]);

  const onPasswordSubmit = async (data: LoginFormData) => {
    try {
      setErrorMessage(null);
      await login(data.email, data.password);
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message || 'Invalid credentials. Please try again.');
      } else {
        setErrorMessage('Failed to sign in. Please verify your credentials.');
      }
    }
  };

  const handleSendOtp = async (purpose = 'LOGIN') => {
    if (!otpIdentifier.trim()) {
      setErrorMessage('Please enter an email or mobile number.');
      return;
    }
    setErrorMessage(null);
    setIsSendingOtp(true);
    try {
      const res = await otpApi.sendOtp({
        identifier: otpIdentifier.trim(),
        channel: otpChannel,
        purpose,
      });
      setOtpSent(true);
      setOtpCooldown(45);
      if (res.data?.demoOtp) {
        setDemoOtpHint(res.data.demoOtp);
      }
      setSuccessMessage(`One-Time Password sent via ${otpChannel} to ${otpIdentifier}`);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to send OTP';
      setErrorMessage(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setErrorMessage('Please enter a valid 6-digit verification code.');
      return;
    }
    setErrorMessage(null);
    setIsVerifyingOtp(true);
    try {
      const res = await otpApi.verifyOtpLogin({
        identifier: otpIdentifier.trim(),
        otp: otpCode.trim(),
      });
      if (res.data?.token && res.data?.user) {
        loginWithToken(res.data.token, res.data.user);
        const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        throw new Error(res.error || 'Verification failed');
      }
    } catch (err: any) {
      // Offline fallback for demo test
      if (otpCode === '123456' || otpCode === demoOtpHint) {
        await login(otpIdentifier.includes('@') ? otpIdentifier : 'admin@mvgreentech.com', 'Admin@123');
        const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
        return;
      }
      const msg = err.response?.data?.error || err.message || 'Invalid or expired OTP code';
      setErrorMessage(msg);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Forgot password handler
  const handleForgotSendOtp = async () => {
    if (!forgotIdentifier.trim()) {
      setForgotError('Please enter your registered email address.');
      return;
    }
    setForgotError(null);
    setForgotLoading(true);
    try {
      const res = await otpApi.sendOtp({
        identifier: forgotIdentifier.trim(),
        purpose: 'PASSWORD_RESET',
      });
      setForgotOtpSent(true);
      setForgotCooldown(45);
      if (res.data?.demoOtp) {
        setForgotSuccess(`OTP sent! (Dev Mode: ${res.data.demoOtp})`);
      } else {
        setForgotSuccess('A 6-digit password reset code has been sent to your email.');
      }
    } catch (err: any) {
      setForgotError(err.response?.data?.error || err.message || 'Failed to send reset code');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotSubmit = async () => {
    if (!forgotOtp || forgotOtp.length !== 6) {
      setForgotError('Please enter the 6-digit code.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters.');
      return;
    }
    setForgotError(null);
    setForgotLoading(true);
    try {
      await otpApi.resetPassword({
        identifier: forgotIdentifier.trim(),
        otp: forgotOtp.trim(),
        newPassword,
      });
      setSuccessMessage('Password reset successfully! Please sign in with your new password.');
      setShowForgotModal(false);
      setActiveTab('password');
      setValue('email', forgotIdentifier);
      setValue('password', newPassword);
    } catch (err: any) {
      setForgotError(err.response?.data?.error || err.message || 'Failed to reset password');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div className="gradient-bg" />

      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-500 items-center justify-center mb-4 shadow-xl shadow-blue-500/20">
            <Layers className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">MV GREENTECH PVT LTD</h1>
          <p className="text-sm text-teal-400 font-semibold tracking-wider mt-1 uppercase">
            Enterprise CRM & ERP Portal
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-7 border border-white/10 shadow-2xl backdrop-blur-2xl">
          {/* Tab Selector */}
          <div className="flex rounded-xl bg-white/5 p-1 mb-6 border border-white/10">
            <button
              type="button"
              onClick={() => {
                setActiveTab('password');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'password'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Password Login
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('otp');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'otp'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Secure OTP Login
            </button>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-300 font-medium leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-300 font-medium leading-relaxed">{successMessage}</p>
            </div>
          )}

          {/* TAB 1: PASSWORD LOGIN */}
          {activeTab === 'password' && (
            <>
              {/* Quick Demo Logins */}
              <div className="mb-5">
                <p className="text-xs text-white/50 mb-2 font-medium">Quick Fill Demo Roles:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setValue('email', 'admin@mvgreentech.com');
                      setValue('password', 'Admin@123');
                    }}
                    className="text-left px-2.5 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-xs text-blue-300 transition"
                  >
                    <span className="font-semibold block text-white">Administrator</span>
                    admin@mvgreentech.com
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setValue('email', 'director@mvgreentech.com');
                      setValue('password', 'Director@123');
                    }}
                    className="text-left px-2.5 py-1.5 rounded-lg bg-teal-600/10 hover:bg-teal-600/20 border border-teal-500/20 text-xs text-teal-300 transition"
                  >
                    <span className="font-semibold block text-white">Director</span>
                    director@mvgreentech.com
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setValue('email', 'saleshead@mvgreentech.com');
                      setValue('password', 'SalesHead@123');
                    }}
                    className="text-left px-2.5 py-1.5 rounded-lg bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 text-xs text-purple-300 transition"
                  >
                    <span className="font-semibold block text-white">Sales Head</span>
                    saleshead@mvgreentech.com
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setValue('email', 'sales@mvgreentech.com');
                      setValue('password', 'Sales@123');
                    }}
                    className="text-left px-2.5 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-xs text-emerald-300 transition"
                  >
                    <span className="font-semibold block text-white">Salesperson</span>
                    sales@mvgreentech.com
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="e.g. director@mvgreentech.com"
                  leftIcon={<Mail className="w-4 h-4" />}
                  error={errors.email?.message}
                  {...register('email')}
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  leftIcon={<Lock className="w-4 h-4" />}
                  error={errors.password?.message}
                  {...register('password')}
                />

                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40">Secure 256-bit SSL</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(true);
                      setForgotIdentifier(register('email').name ? (document.querySelector('input[type="email"]') as HTMLInputElement)?.value || '' : '');
                    }}
                    className="text-teal-400 hover:text-teal-300 font-medium transition"
                  >
                    Forgot Password?
                  </button>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full mt-2"
                  isLoading={isSubmitting}
                >
                  Sign In to Dashboard
                </Button>
              </form>
            </>
          )}

          {/* TAB 2: OTP LOGIN */}
          {activeTab === 'otp' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/80 mb-1.5">
                  Registered Email or Mobile Number
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={otpIdentifier}
                    onChange={(e) => setOtpIdentifier(e.target.value)}
                    placeholder="admin@mvgreentech.com or +91 98765 43210"
                    leftIcon={<Smartphone className="w-4 h-4 text-teal-400" />}
                    disabled={otpSent}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-white/60">Delivery Channel:</span>
                <label className="flex items-center gap-1.5 text-xs text-white/80 cursor-pointer">
                  <input
                    type="radio"
                    name="channel"
                    value="EMAIL"
                    checked={otpChannel === 'EMAIL'}
                    onChange={() => setOtpChannel('EMAIL')}
                    className="accent-teal-500"
                    disabled={otpSent}
                  />
                  Email
                </label>
                <label className="flex items-center gap-1.5 text-xs text-white/80 cursor-pointer">
                  <input
                    type="radio"
                    name="channel"
                    value="SMS"
                    checked={otpChannel === 'SMS'}
                    onChange={() => setOtpChannel('SMS')}
                    className="accent-teal-500"
                    disabled={otpSent}
                  />
                  SMS / Mobile
                </label>
              </div>

              {!otpSent ? (
                <Button
                  type="button"
                  onClick={() => handleSendOtp('LOGIN')}
                  variant="secondary"
                  size="lg"
                  className="w-full bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 mt-2"
                  isLoading={isSendingOtp}
                >
                  Send One-Time Passcode
                </Button>
              ) : (
                <div className="space-y-4 pt-2">
                  {demoOtpHint && (
                    <div className="p-2.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-xs text-teal-300 flex items-center justify-between">
                      <span>Demo Mode Code: <strong>{demoOtpHint}</strong></span>
                      <button
                        type="button"
                        onClick={() => setOtpCode(demoOtpHint)}
                        className="underline text-[11px] hover:text-white"
                      >
                        Auto-fill
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-white/80 mb-1.5">
                      Enter 6-Digit Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="w-full text-center tracking-[0.5em] text-2xl font-mono py-2.5 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/30 focus:border-teal-400 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-white/60">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpCode('');
                      }}
                      className="text-white/40 hover:text-white transition"
                    >
                      Change Contact
                    </button>
                    {otpCooldown > 0 ? (
                      <span className="text-white/40">Resend in {otpCooldown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendOtp('LOGIN')}
                        className="text-teal-400 hover:text-teal-300 inline-flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Resend Code
                      </button>
                    )}
                  </div>

                  <Button
                    type="button"
                    onClick={handleVerifyOtp}
                    variant="primary"
                    size="lg"
                    className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500"
                    isLoading={isVerifyingOtp}
                  >
                    Verify Code & Sign In
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-white/10 text-center">
            <p className="text-xs text-white/40">
              MV GREENTECH CRM v2.0 • ISO 9001 Compliant Architecture
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="glass-card max-w-md w-full p-6 border border-white/15 relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Reset Your Password</h3>
            <p className="text-xs text-white/60 mb-4">
              Verify your identity using an OTP sent to your registered email.
            </p>

            {forgotError && (
              <div className="mb-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                {forgotError}
              </div>
            )}
            {forgotSuccess && (
              <div className="mb-4 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                {forgotSuccess}
              </div>
            )}

            <div className="space-y-4">
              <Input
                label="Registered Email"
                type="email"
                value={forgotIdentifier}
                onChange={(e) => setForgotIdentifier(e.target.value)}
                placeholder="name@mvgreentech.com"
                disabled={forgotOtpSent}
              />

              {!forgotOtpSent ? (
                <Button
                  type="button"
                  onClick={handleForgotSendOtp}
                  className="w-full"
                  isLoading={forgotLoading}
                >
                  Send Reset Code
                </Button>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-white/80 mb-1">
                      Enter 6-Digit OTP
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full tracking-widest text-center font-mono py-2 rounded-lg bg-white/5 border border-white/20 text-white"
                    />
                  </div>

                  <Input
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters with letters and numbers"
                  />

                  <div className="flex items-center justify-between text-xs text-white/60">
                    {forgotCooldown > 0 ? (
                      <span>Resend in {forgotCooldown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleForgotSendOtp}
                        className="text-teal-400 hover:underline"
                      >
                        Resend Code
                      </button>
                    )}
                  </div>

                  <Button
                    type="button"
                    onClick={handleForgotSubmit}
                    className="w-full bg-emerald-600 hover:bg-emerald-500"
                    isLoading={forgotLoading}
                  >
                    Confirm & Update Password
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
