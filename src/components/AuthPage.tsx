"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type AuthMode = 'login' | 'signup';

const INVITE_CODE = '2001';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check if already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        window.location.reload();
      }
    };
    checkUser();
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setMessage({ type: 'error', text: 'الرجاء إدخال اسم المستخدم وكلمة المرور' });
      return;
    }

    setIsLoading(true);
    setMessage(null);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: `${username.trim()}@electronics.local`,
      password,
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else if (data.user) {
      window.location.reload();
    }
    setIsLoading(false);
  };

  const handleSignUp = async () => {
    // Signup disabled - contact owner to create account
    setMessage({ type: 'error', text: 'الرجاء التواصل مع المالك لإنشاء حساب' });
    return;

    if (!username.trim() || !password.trim() || !confirmPassword.trim() || !inviteCode.trim()) {
      setMessage({ type: 'error', text: 'الرجاء تعبئة جميع الحقول' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'كلمتا المرور غير متطابقتين' });
      return;
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل' });
      return;
    }

    if (inviteCode !== INVITE_CODE) {
      setMessage({ type: 'error', text: 'رمز الدعوة غير صحيح' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const { data, error } = await supabase.auth.signUp({
      email: `${username.trim()}@electronics.local`,
      password,
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else if (data.user) {
      setMessage({ type: 'success', text: 'تم إنشاء الحساب بنجاح!' });
      setTimeout(() => window.location.reload(), 1500);
    } else if (data.session) {
      window.location.reload();
    } else {
      setMessage({ type: 'success', text: 'تم إرسال رابط التأكيد إلى بريدك الإلكتروني. الرجاء التحقق من صندوق الوارد.' });
      setMode('login');
    }
    setIsLoading(false);
  };

  const handleForgotPassword = async () => {
    // Password reset disabled due to email rate limiting
    setMessage({ type: 'error', text: 'الرجاء التواصل مع المالك لإعادة تعيين كلمة المرور' });
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setInviteCode('');
    setMessage(null);
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative squares */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-28 h-28 md:w-32 md:h-32 rounded-2xl opacity-20 blur-xl"
          style={{
            left: `${15 + (i % 3) * 35}%`,
            top: `${10 + Math.floor(i / 3) * 40}%`,
            backgroundColor: i % 2 === 0 ? '#6366f1' : '#8b5cf6',
            transform: `rotate(${i * 45}deg)`,
          }}
        />
      ))}

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-3xl mb-4 border border-white/20 shadow-2xl">
            <span className="text-4xl">⚡</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-wider text-shadow">
            الكَترونِيات النُّعمان
          </h1>
          <p className="text-indigo-300 mt-2 text-sm md:text-base tracking-widest">
            Al-Nouman Electronics
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/20 shadow-2xl">
          {/* Form Title */}
          <h2 className="text-2xl font-bold text-white text-center mb-6">
            {mode === 'login' && 'تسجيل الدخول'}
            {mode === 'signup' && 'إنشاء حساب جديد'}
          </h2>

          {/* Username Input */}
          <div className="mb-4">
            <label className="block text-indigo-200 text-sm font-medium mb-2 text-right">
              اسم المستخدم
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="hafez"
              className="w-full bg-white/15 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-gray-400 text-right focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
              dir="ltr"
            />
          </div>

          {/* Password Input (Login & Signup) */}
          {(mode === 'login' || mode === 'signup') && (
            <div className="mb-4">
              <label className="block text-indigo-200 text-sm font-medium mb-2 text-right">
                {mode === 'login' ? 'كلمة المرور' : 'كلمة المرور'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'login' ? 'أدخل كلمة المرور' : 'أدخل كلمة المرور'}
                className="w-full bg-white/15 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-gray-400 text-right focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                dir="ltr"
              />
            </div>
          )}

          {/* Confirm Password Input (Signup only) */}
          {mode === 'signup' && (
            <div className="mb-4">
              <label className="block text-indigo-200 text-sm font-medium mb-2 text-right">
                تأكيد كلمة المرور
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أدخل كلمة المرور مرة أخرى"
                className="w-full bg-white/15 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-gray-400 text-right focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                dir="ltr"
              />
            </div>
          )}

          {/* Invite Code Input (Signup only) */}
          {mode === 'signup' && (
            <div className="mb-4">
              <label className="block text-indigo-200 text-sm font-medium mb-2 text-right">
                رمز الدعوة
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="أدخل رمز الدعوة"
                className="w-full bg-white/15 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-gray-400 text-right focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                dir="ltr"
              />
            </div>
          )}

          {/* Forgot Password Link - Disabled */}
          {mode === 'login' && (
            <div className="text-left mb-4">
              <span className="text-indigo-300 text-sm">
                نسيت كلمة المرور؟ تواصل مع المالك
              </span>
            </div>
          )}

          {/* Error/Success Message */}
          {message && (
            <div className={`mb-4 p-3 rounded-xl text-center text-sm ${
              message.type === 'error' 
                ? 'bg-red-500/20 text-red-200 border border-red-500/30' 
                : 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30'
            }`}>
              {message.text}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={
              mode === 'login' ? handleLogin :
              handleSignUp
            }
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                جاري التحميل...
              </span>
            ) : (
              <>
                {mode === 'login' && 'دخول'}
                {mode === 'signup' && 'إنشاء حساب'}
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-white/30"></div>
            <span className="px-4 text-white/60 text-sm">أو</span>
            <div className="flex-1 h-px bg-white/30"></div>
          </div>

          {/* Switch Mode Links */}
          <div className="text-center">
            {mode === 'login' && (
              <p className="text-indigo-200">
                ليس لديك حساب؟{' '}
                <button
                  onClick={() => switchMode('signup')}
                  className="text-indigo-300 font-bold hover:text-white transition-colors"
                >
                  إنشاء حساب جديد
                </button>
              </p>
            )}
            {mode === 'signup' && (
              <p className="text-indigo-200">
                لديك حساب بالفعل؟{' '}
                <button
                  onClick={() => switchMode('login')}
                  className="text-indigo-300 font-bold hover:text-white transition-colors"
                >
                  تسجيل دخول
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
