'use client';
import { useEffect, useState } from 'react';

/**
 * 初回表示時のオープニング：ローラーで画面を塗りつぶし、刷毛でロゴに線を引いて幕が上がる。
 * - アニメーションはすべて CSS（JS無効でも最後は自動で消える）
 * - 同一セッションでは2回目以降は表示しない（app/layout.tsx の head スクリプトで描画前に判定）
 * - prefers-reduced-motion の環境では表示しない
 */
const STORAGE_KEY = 'maruai-intro-seen';

// ローラーで塗る帯（上から順に、左右交互に往復）
const BANDS = [
  { delay: 0.1, reverse: false },
  { delay: 0.5, reverse: true },
  { delay: 0.9, reverse: false },
];

export function PaintIntro() {
  const [done, setDone] = useState(false);
  const [skip, setSkip] = useState(false);

  useEffect(() => {
    if (document.documentElement.classList.contains('pi-off')) {
      setDone(true);
      return;
    }
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* プライベートモード等では毎回表示 */
    }
  }, []);

  if (done) return null;

  return (
    <div
      className={`pi${skip ? ' pi-skip' : ''}`}
      aria-hidden="true"
      onClick={() => setSkip(true)}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) setDone(true);
      }}
    >
      {BANDS.map((b, i) => (
        <div
          key={i}
          className={`pi-band${b.reverse ? ' pi-rev' : ''}`}
          style={{ top: `${(i * 100) / BANDS.length}%`, ['--d' as string]: `${b.delay}s` }}
        >
          <div className="pi-stroke">
            <Roller />
          </div>
        </div>
      ))}

      <div className="pi-logo">
        <div className="pi-name">丸愛装業</div>
        <svg className="pi-brush" viewBox="0 0 300 40" preserveAspectRatio="none">
          <defs>
            <filter id="pi-rough" x="-5%" y="-40%" width="110%" height="180%">
              <feTurbulence type="fractalNoise" baseFrequency="0.9 0.08" numOctaves="2" seed="4" />
              <feDisplacementMap in="SourceGraphic" scale="7" />
            </filter>
          </defs>
          <path d="M10 24 C 80 14, 170 30, 290 16" pathLength={1} filter="url(#pi-rough)" />
        </svg>
        <div className="pi-sub">MARUAI SOUGYO</div>
      </div>
    </div>
  );
}

function Roller() {
  return (
    <svg className="pi-roller" viewBox="0 0 120 200" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="pi-nap" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#1d3340" />
          <stop offset=".45" stopColor="#3f6178" />
          <stop offset=".6" stopColor="#36546A" />
          <stop offset="1" stopColor="#1d3340" />
        </linearGradient>
      </defs>
      {/* 柄（塗った側に伸びる） */}
      <path d="M70 194 Q70 199 62 196 L40 150" fill="none" stroke="#B8BEC4" strokeWidth="4" strokeLinecap="round" />
      <path d="M41 152 L12 106" stroke="#C8B393" strokeWidth="13" strokeLinecap="round" />
      <path d="M41 152 L12 106" stroke="#a8946f" strokeWidth="13" strokeLinecap="round" strokeDasharray="1 9" />
      {/* ローラー本体 */}
      <rect x="66" y="2" width="8" height="196" rx="3" fill="#9aa2a9" />
      <rect x="52" y="10" width="36" height="180" rx="9" fill="url(#pi-nap)" />
      <path d="M60 18 V182 M67 14 V186 M78 16 V184" stroke="rgba(255,255,255,.12)" strokeWidth="1.5" />
    </svg>
  );
}
