import React from 'react';
import { Send, ShieldAlert, ExternalLink } from 'lucide-react';

export const TelegramAccessDenied = () => {
  const botUrl = import.meta.env.VITE_TELEGRAM_BOT_URL || 'https://t.me/TGminiApp_bot';

  return (
    <div className="min-h-screen w-full bg-[#0d0d12] text-white flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute w-96 h-96 rounded-full bg-sky-500/10 filter blur-[80px] pointer-events-none -z-10" />
      <div className="absolute w-80 h-80 rounded-full bg-indigo-500/10 filter blur-[60px] pointer-events-none -z-10" />

      {/* Access Denied Card */}
      <div className="w-full max-w-sm glass-panel p-8 rounded-3xl border border-sky-500/30 flex flex-col items-center text-center shadow-[0_0_50px_rgba(14,165,233,0.15)] relative z-10">
        
        {/* Telegram Logo Icon Container */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 p-0.5 shadow-[0_0_30px_rgba(14,165,233,0.5)] flex items-center justify-center mb-6 animate-pulse">
          <div className="w-full h-full rounded-full bg-[#0f172a] flex items-center justify-center">
            <Send className="w-10 h-10 text-sky-400 -translate-x-0.5 translate-y-0.5" />
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-3">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Telegram Access Only</span>
        </div>

        <h1 className="text-2xl font-black text-white tracking-tight mb-2">
          Access Restricted
        </h1>

        <p className="text-sm text-slate-300 mb-8 leading-relaxed">
          This app can only be played inside Telegram.
        </p>

        {/* Primary Telegram Blue Button */}
        <a
          href={botUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-sm tracking-wide shadow-[0_4px_20px_rgba(14,165,233,0.4)] flex items-center justify-center gap-2 active:scale-95 transition-all outline-none"
        >
          <Send className="w-4 h-4 fill-current" />
          <span>Open in Telegram</span>
          <ExternalLink className="w-4 h-4 opacity-70 ml-auto" />
        </a>
      </div>
    </div>
  );
};
