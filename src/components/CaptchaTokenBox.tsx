import React, { useRef, useEffect, useCallback } from 'react';
import { RefreshCw, Volume2, ShieldCheck } from 'lucide-react';
import { playSound } from '../services/storageService';

interface CaptchaTokenBoxProps {
  captchaCode: string;
  onRefresh: () => void;
  className?: string;
}

export const CaptchaTokenBox: React.FC<CaptchaTokenBoxProps> = ({
  captchaCode,
  onRefresh,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Draw authentic security CAPTCHA onto canvas
  const drawCaptcha = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#f8fafc');
    grad.addColorStop(0.5, '#eef2f6');
    grad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Random security background lines (noise)
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.bezierCurveTo(
        Math.random() * width,
        Math.random() * height,
        Math.random() * width,
        Math.random() * height,
        Math.random() * width,
        Math.random() * height
      );
      ctx.strokeStyle = ['#cbd5e1', '#94a3b8', '#bfdbfe', '#c7d2fe'][i % 4];
      ctx.lineWidth = 1 + Math.random() * 1.5;
      ctx.stroke();
    }

    // Random noise dots
    for (let i = 0; i < 35; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * width,
        Math.random() * height,
        Math.random() * 2,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = ['#94a3b8', '#64748b', '#3b82f6', '#8b5cf6'][
        Math.floor(Math.random() * 4)
      ];
      ctx.fill();
    }

    // Render each digit with slight angle, scale, and distinct color
    const chars = captchaCode.split('');
    const charSpacing = width / (chars.length + 1);
    const colors = ['#0f172a', '#1e3a8a', '#1e293b', '#0369a1', '#1d4ed8'];

    ctx.textBaseline = 'middle';

    chars.forEach((char, index) => {
      ctx.save();
      const x = charSpacing * (index + 0.85);
      const y = height / 2 + (Math.random() * 6 - 3);
      const angle = (Math.random() * 28 - 14) * (Math.PI / 180);

      ctx.translate(x, y);
      ctx.rotate(angle);

      ctx.font = `bold ${Math.floor(22 + Math.random() * 5)}px "JetBrains Mono", Consolas, monospace`;
      ctx.fillStyle = colors[index % colors.length];
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      ctx.fillText(char, 0, 0);
      ctx.restore();
    });

    // Wavy strike line across characters
    ctx.beginPath();
    ctx.moveTo(10, height / 2 + Math.sin(0) * 8);
    for (let x = 10; x < width - 10; x += 5) {
      ctx.lineTo(x, height / 2 + Math.sin(x * 0.05) * 6 + (Math.random() * 4 - 2));
    }
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Canvas border
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);
  }, [captchaCode]);

  useEffect(() => {
    drawCaptcha();
  }, [drawCaptcha]);

  const handleSpeakCaptcha = () => {
    playSound('click');
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      // Speak each digit clearly in Indonesian
      const spokenText = captchaCode.split('').join(', ');
      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.lang = 'id-ID';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Gambar Verifikasi CAPTCHA</span>
        </span>
        <span className="text-[10px] font-mono text-slate-400">
          6 Angka Keamanan
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Captcha Canvas Box */}
        <div className="relative rounded-xl overflow-hidden border border-slate-300 shadow-inner bg-slate-100 flex-1 flex items-center justify-center p-1">
          <canvas
            ref={canvasRef}
            width={210}
            height={52}
            className="w-full h-13 rounded-lg select-none block"
            title="Kode CAPTCHA Keamanan"
          />
          {/* Subtle security watermark */}
          <span className="absolute bottom-1 right-2 text-[8px] font-mono font-bold tracking-tighter text-slate-400/70 uppercase select-none pointer-events-none">
            KPU SECURE
          </span>
        </div>

        {/* Action Buttons: Refresh & Audio */}
        <div className="flex flex-col gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              playSound('click');
              onRefresh();
            }}
            title="Segarkan / Ganti Gambar CAPTCHA"
            className="p-2 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 rounded-lg transition-colors cursor-pointer group"
          >
            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
          </button>
          <button
            type="button"
            onClick={handleSpeakCaptcha}
            title="Dengarkan Angka CAPTCHA (Audio)"
            className="p-2 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
