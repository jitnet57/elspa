'use client';

import { useState, useEffect } from 'react';
import { useAdminGate } from '@/lib/store/admin-gate-store';

// ============================================================
// 📌 컴포넌트명: AdminLoginScreen
// 📋 목적: 시네마틱 보안 게이트 로그인 화면
// 🔧 기능: 애니메이션 입자, 타이핑 서브텍스트, CAPS LOCK 감지
// 📅 작성일: 2026-05-28
// ============================================================

export default function AdminLoginScreen() {
  const { login } = useAdminGate();

  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [typedText, setTypedText] = useState('');

  useEffect(() => {
    const fullText = 'SECURITY ACCESS TERMINAL';
    if (typedText.length < fullText.length) {
      const timer = setTimeout(() => {
        setTypedText(fullText.slice(0, typedText.length + 1));
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [typedText]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsAuthenticating(true);
    await new Promise(r => setTimeout(r, 700));

    if (login(password)) {
      setLoginError(false);
    } else {
      setLoginError(true);
      setPassword('');
    }
    setIsAuthenticating(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isAuthenticating) {
      handleLogin();
    }
    if (e.key === 'CapsLock') {
      setCapsLockOn(!capsLockOn);
    }
  };

  const detectCapsLock = (e: React.KeyboardEvent) => {
    setCapsLockOn(e.getModifierState('CapsLock'));
  };

  return (
    <div className="min-h-screen bg-[#0c1324] bg-[radial-gradient(circle_at_top_right,_#1e1b4b,_#0c1324_60%)] flex items-center justify-center px-4 relative overflow-hidden">

      {/* 애니메이팅 입자장 - 30개 반짝이는 별 */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.6 + 0.2,
              animation: `twinkle ${2 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* 배경 네블라 */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-indigo-600 top-[-200px] right-[-100px] filter blur-[120px] opacity-15 -z-10 pointer-events-none"></div>
      <div className="absolute w-[600px] h-[600px] rounded-full bg-cyan-600 bottom-[-200px] left-[-100px] filter blur-[120px] opacity-15 -z-10 pointer-events-none"></div>

      {/* 스캔라인 애니메이션 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-b from-cyan-400/50 to-transparent animate-[scanline_4s_linear_infinite]"></div>
      </div>

      {/* 네온 보더 펄스 카드 */}
      <div className={`bg-white/3 backdrop-blur-md border max-w-md w-full p-8 rounded-2xl shadow-2xl relative z-10 transition-all duration-300 ${
        loginError ? 'animate-[shake_0.4s_ease-in-out]' : ''
      } animate-[borderGlow_2s_ease-in-out_infinite]`} style={{borderColor: '#8aebff'}}>

        <div className="text-center space-y-6">
          {/* 로고 엔트런스 애니메이션 */}
          <div className="animate-[slideUp_0.6s_ease-out_forwards] opacity-0 [animation-fill-mode:forwards] space-y-3">
            <div className="flex justify-center">
              <span className="material-symbols-outlined text-[#8aebff] text-[64px] drop-shadow-[0_0_20px_rgba(138,235,255,0.5)]">lock</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter drop-shadow-[0_0_10px_rgba(138,235,255,0.2)]">ELSPA</h1>
          </div>

          {/* 타이핑 애니메이션 서브텍스트 */}
          <div className="min-h-6">
            <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-black drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
              {typedText}
              {typedText.length < 'SECURITY ACCESS TERMINAL'.length && <span className="animate-pulse">▊</span>}
            </p>
          </div>

          {/* 비밀번호 입력 폼 */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <div className="group relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onKeyDown={detectCapsLock}
                  placeholder="••••••••••••••••"
                  disabled={isAuthenticating}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 pr-12 focus:border-[#8aebff]/60 focus:ring-1 font-mono tracking-widest text-center transition-all placeholder-indigo-300/35 disabled:opacity-50"
                />

                {/* 비밀번호 보기/숨기기 토글 */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isAuthenticating}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-300/60 hover:text-cyan-400 transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>

                {/* 네온 언더라인 */}
                <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-[#8aebff] to-transparent scale-x-0 group-focus-within:scale-x-100 transition-all duration-700"></div>
              </div>

              {/* CAPS LOCK 경고 */}
              {capsLockOn && (
                <div className="text-[9px] text-orange-400 font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">warning</span>
                  CAPS LOCK ON
                </div>
              )}
            </div>

            {/* 인증 버튼 + 로딩 스피너 */}
            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full bg-[#8aebff] hover:bg-[#2fd9f4] disabled:bg-slate-700 text-slate-950 disabled:text-slate-400 font-black py-4 rounded-xl hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] active:scale-95 transition-all text-xs tracking-widest flex items-center justify-center gap-2"
            >
              {isAuthenticating ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></span>
                  AUTHENTICATING...
                </>
              ) : (
                'AUTHENTICATE'
              )}
            </button>
          </form>

          {/* 에러 메시지 */}
          {loginError && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-rose-400 text-[10px] font-black uppercase tracking-wider animate-pulse">
              ⚠️ Authentication Failed — Try Again
            </div>
          )}

          {/* 시스템 정보 */}
          <div className="pt-4 space-y-1 text-[9px] font-mono text-indigo-300/40 uppercase tracking-wider">
            <p>Admin Console v2.0.4</p>
            <p>Cipher: AES-256 ACTIVE</p>
          </div>
        </div>
      </div>

      {/* 구글 폰트 및 아이콘 리소스 */}
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Hanken+Grotesk:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
    </div>
  );
}
