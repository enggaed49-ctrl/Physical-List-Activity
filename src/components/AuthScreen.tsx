import React, { useState } from 'react';
import {
  Activity as ActivityIcon,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  ArrowRight,
  Lock,
  Mail,
  User,
  Moon,
  Sun,
} from 'lucide-react';
import { AuthUser } from '../types';
import { authService } from '../services/authService';
import authFitnessEditorialImg from '../assets/images/auth_fitness_editorial_1795449169011.jpg';

interface AuthScreenProps {
  mode: 'login' | 'signup';
  onSwitchMode: (mode: 'login' | 'signup') => void;
  onAuthSuccess: (user: AuthUser) => void;
  isDarkMode: boolean;
  onToggleDarkMode: (val: boolean) => void;
  redirectNotice?: string | null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const AuthScreen: React.FC<AuthScreenProps> = ({
  mode,
  onSwitchMode,
  onAuthSuccess,
  isDarkMode,
  onToggleDarkMode,
  redirectNotice,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const isSignup = mode === 'signup';

  // Live password strength checks for signup
  const hasMinLen = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const resetErrorsForModeSwitch = (targetMode: 'login' | 'signup') => {
    setFieldErrors({});
    setFormError(null);
    setPassword('');
    setConfirmPassword('');
    onSwitchMode(targetMode);
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (isSignup) {
      if (!trimmedName) {
        errs.name = 'Full name is required.';
      } else if (trimmedName.length > 80) {
        errs.name = 'Full name must be 80 characters or fewer.';
      }
    }

    if (!trimmedEmail) {
      errs.email = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errs.email = 'Please enter a valid email address (e.g. alex@example.com).';
    }

    if (!password) {
      errs.password = 'Password is required.';
    } else if (isSignup) {
      if (password.length < 8) {
        errs.password = 'Password must be at least 8 characters long.';
      } else if (!hasLetter || !hasNumber) {
        errs.password = 'Password is too weak — include at least one letter and one number.';
      }
    }

    if (isSignup) {
      if (!confirmPassword) {
        errs.confirmPassword = 'Please confirm your password.';
      } else if (confirmPassword !== password) {
        errs.confirmPassword = 'Passwords do not match.';
      }
    }

    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setFormError('Please fix the highlighted fields below.');
      return false;
    }
    setFormError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const result = isSignup
        ? await authService.signup(name.trim(), email.trim(), password)
        : await authService.login(email.trim(), password);

      if (result.user) {
        onAuthSuccess(result.user);
      } else {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        setFormError(result.error || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Clean Top Bar */}
      <header className="w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <ActivityIcon className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Physical List
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onToggleDarkMode(!isDarkMode)}
              className="min-h-[44px] min-w-[44px] rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              id="auth-header-switch-btn"
              onClick={() => resetErrorsForModeSwitch(isSignup ? 'login' : 'signup')}
              className="min-h-[44px] px-4 py-2 rounded-lg text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isSignup ? 'Log In' : 'Create Account'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Responsive Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-6 sm:px-6 lg:px-8 lg:py-12">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Desktop Editorial Visual Panel */}
          <div className="hidden lg:flex lg:col-span-5 relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 min-h-[560px]">
            {!imgFailed ? (
              <img
                src={authFitnessEditorialImg}
                alt="Minimalist fitness equipment on concrete bench in morning light"
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-blue-950 flex items-center justify-center">
                <ActivityIcon className="w-20 h-20 text-blue-500/40" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent flex flex-col justify-end p-8">
              <p className="text-xs font-semibold tracking-wide text-blue-300 mb-2">
                Personal Activity Ledger
              </p>
              <h2 className="text-2xl font-bold text-white leading-snug text-balance">
                Every workout recorded in your own private workspace.
              </h2>
              <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                Track daily sessions, measure completion rates, and monitor your fitness consistency across desktop and mobile.
              </p>
            </div>
          </div>

          {/* Auth Form Surface */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
            <div className="max-w-md w-full mx-auto">
              {/* Mobile Mode Segmented Switcher for effortless thumb access */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
                <button
                  type="button"
                  id="auth-tab-login"
                  onClick={() => resetErrorsForModeSwitch('login')}
                  className={`min-h-[44px] rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                    !isSignup
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Log In
                </button>
                <button
                  type="button"
                  id="auth-tab-signup"
                  onClick={() => resetErrorsForModeSwitch('signup')}
                  className={`min-h-[44px] rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                    isSignup
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight text-balance">
                  {isSignup ? 'Create your account' : 'Sign in to your account'}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5">
                  {isSignup
                    ? 'Set up a private account to track your personal activities.'
                    : 'Enter your email and password to view your activities.'}
                </p>
              </div>

              {/* Redirect Notice */}
              {redirectNotice && !formError && (
                <div
                  role="status"
                  className="mb-5 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-200 text-sm flex items-start gap-2.5"
                >
                  <Lock className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{redirectNotice}</span>
                </div>
              )}

              {/* Form-level Error Alert */}
              {formError && (
                <div
                  role="alert"
                  id="auth-form-error"
                  className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm font-medium flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {/* Full Name (Sign Up only) */}
                {isSignup && (
                  <div className="space-y-1.5">
                    <label
                      htmlFor="auth-name-input"
                      className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="auth-name-input"
                        type="text"
                        autoComplete="name"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (fieldErrors.name) {
                            setFieldErrors((prev) => ({ ...prev, name: '' }));
                          }
                        }}
                        placeholder=""
                        className={`w-full h-12 pl-10 pr-4 rounded-xl border text-base sm:text-sm bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                          fieldErrors.name
                            ? 'border-rose-500 focus:ring-rose-500/20'
                            : 'border-slate-200 dark:border-slate-700 focus:border-blue-600 focus:ring-blue-600/20'
                        }`}
                      />
                    </div>
                    {fieldErrors.name && (
                      <p className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{fieldErrors.name}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Email */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="auth-email-input"
                    className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-email-input"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) {
                          setFieldErrors((prev) => ({ ...prev, email: '' }));
                        }
                      }}
                      placeholder="name@example.com"
                      className={`w-full h-12 pl-10 pr-4 rounded-xl border text-base sm:text-sm bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                        fieldErrors.email
                          ? 'border-rose-500 focus:ring-rose-500/20'
                          : 'border-slate-200 dark:border-slate-700 focus:border-blue-600 focus:ring-blue-600/20'
                      }`}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.email}</span>
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="auth-password-input"
                    className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-password-input"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={isSignup ? 'new-password' : 'current-password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) {
                          setFieldErrors((prev) => ({ ...prev, password: '' }));
                        }
                      }}
                      placeholder={isSignup ? 'Minimum 8 characters' : 'Enter your password'}
                      className={`w-full h-12 pl-10 pr-12 rounded-xl border text-base sm:text-sm bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                        fieldErrors.password
                          ? 'border-rose-500 focus:ring-rose-500/20'
                          : 'border-slate-200 dark:border-slate-700 focus:border-blue-600 focus:ring-blue-600/20'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.password}</span>
                    </p>
                  )}

                  {/* Password Strength Checklist for Sign Up */}
                  {isSignup && (
                    <div className="pt-1.5 grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-xs">
                      <div
                        className={`flex items-center gap-1.5 ${
                          hasMinLen ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>8+ characters</span>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 ${
                          hasLetter ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>One letter</span>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 ${
                          hasNumber ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>One number</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password (Sign Up only) */}
                {isSignup && (
                  <div className="space-y-1.5">
                    <label
                      htmlFor="auth-confirm-password-input"
                      className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="auth-confirm-password-input"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (fieldErrors.confirmPassword) {
                            setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                          }
                        }}
                        placeholder="Re-enter your password"
                        className={`w-full h-12 pl-10 pr-12 rounded-xl border text-base sm:text-sm bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                          fieldErrors.confirmPassword
                            ? 'border-rose-500 focus:ring-rose-500/20'
                            : 'border-slate-200 dark:border-slate-700 focus:border-blue-600 focus:ring-blue-600/20'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <p className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{fieldErrors.confirmPassword}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    id="auth-submit-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full min-h-[48px] px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-60 text-white font-semibold text-base sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>
                      {isSubmitting
                        ? isSignup
                          ? 'Creating Account...'
                          : 'Signing In...'
                        : isSignup
                          ? 'Create Account'
                          : 'Sign In'}
                    </span>
                    {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </form>

              <p className="text-sm text-center text-slate-600 dark:text-slate-400 mt-6">
                {isSignup ? 'Already have an account?' : "Don't have an account yet?"}{' '}
                <button
                  type="button"
                  onClick={() => resetErrorsForModeSwitch(isSignup ? 'login' : 'signup')}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer min-h-[44px] px-1"
                >
                  {isSignup ? 'Sign in' : 'Sign up'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
