'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * 初回表示のオープニング：刷毛で壁を塗るように、数本のストロークで画面を塗りつぶし、
 * 社名を見せてから静かにフェードしてサイトへ。
 *
 * - 道具のイラストは描かず、毛筋・かすれ・ムラを Canvas で描いて「本物の塗り」の質感だけで見せる
 * - 各ストロークは最初に裏で完成形を一度だけ描き、毛先の形で切り抜きながら見せていく（継ぎ目が出ない）
 * - 同一セッションでは2回目以降は表示しない（app/layout.tsx の head スクリプトで描画前に判定）
 * - prefers-reduced-motion では表示しない／JS が動かなくても CSS のフォールバックで自動的に消える
 */
const STORAGE_KEY = 'maruai-intro-seen';

// タイムライン（秒）
const STROKE_DUR = 0.62; // 1ストロークの長さ
const STROKE_GAP = 0.26; // 次のストロークが始まるまで（重ねて途切れさせない）
const LOGO_HOLD = 1.05; // 社名が出てから退場まで（退場の長さは globals.css の .pi.is-out）

const BASE = '#27414F';
// 毛筋：ほぼ同色で、ごく僅かに明暗をつける（コントラストを上げると傷に見える）
const PAINT = ['#27414F', '#27414F', '#2A4555', '#243D4A', '#2D4858'];
const MAX_LAG = 0.075; // 毛先の最大の遅れ（ストローク長に対する比）

type Stroke = {
  cy: number;
  h: number;
  dir: 1 | -1;
  tilt: number;
  waveA: number;
  waveF: number;
  waveP: number;
  start: number;
  seed: number;
  top: number; // 裏キャンバスが受け持つ縦範囲
  bottom: number;
  tex?: HTMLCanvasElement;
};

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// 1次元のなめらかなノイズ
function noise1(x: number, seed: number) {
  const i = Math.floor(x);
  const f = x - i;
  const h = (n: number) => {
    const v = Math.sin((n + seed * 57.3) * 127.1) * 43758.5453;
    return v - Math.floor(v);
  };
  const u = f * f * (3 - 2 * f);
  return h(i) * (1 - u) + h(i + 1) * u;
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function buildStrokes(vw: number, vh: number): Stroke[] {
  const r = rng(20241122);
  const n = Math.max(3, Math.round(vh / 250));
  const pitch = vh / n;
  return Array.from({ length: n }, (_, i) => {
    const h = pitch * 1.6; // 隣と十分に重ねて紙が透けないように
    const tilt = (r() - 0.5) * 0.03;
    const waveA = 3 + r() * 5;
    const cy = pitch * (i + 0.5);
    const reach = h / 2 + waveA + Math.abs(tilt) * vw * 0.5 + 6;
    return {
      cy,
      h,
      dir: i % 2 === 0 ? 1 : -1,
      tilt,
      waveA,
      waveF: (Math.PI * 2) / (vw * (0.9 + r() * 0.8)),
      waveP: r() * Math.PI * 2,
      start: i * STROKE_GAP,
      seed: r() * 1000,
      top: Math.floor(cy - reach),
      bottom: Math.ceil(cy + reach),
    };
  });
}

export function PaintIntro() {
  const [phase, setPhase] = useState<'paint' | 'logo' | 'out' | 'done'>('paint');
  const [js, setJs] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // 表示済み、または読み込みが遅く待たせてしまう場合は出さない
    if (document.documentElement.classList.contains('pi-off') || performance.now() > 3000) {
      setPhase('done');
      return;
    }
    setJs(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* プライベートモード等では毎回表示 */
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) {
      setPhase('out');
      return;
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const strokes = buildStrokes(vw, vh);
    const margin = 60;
    const len = vw + margin * 2;
    const paintEnd = strokes[strokes.length - 1].start + STROKE_DUR;

    const yAt = (st: Stroke, x: number, off: number) =>
      st.cy + off * (st.h / 2) + Math.sin(x * st.waveF + st.waveP) * st.waveA + (x - vw / 2) * st.tilt;
    // 進み具合 s（0→1）を x に。偶数本目は左→右、奇数本目は右→左
    const xAt = (st: Stroke, s: number) => (st.dir === 1 ? -margin + s * len : vw + margin - s * len);
    // 毛先の遅れ：束ごとに揃え、上下の端ほど遅らせて刷毛の丸みを出す
    // 大きな束のうねり＋1本ごとの細かな毛先（ギザギザの紙破れではなく、毛のほつれに見せる）
    const fiber = (k: number, seed: number) => {
      const v = Math.sin((k + seed) * 91.7) * 43758.5453;
      return v - Math.floor(v);
    };
    const lagAt = (st: Stroke, off: number, k: number) =>
      noise1(off * 4, st.seed) * 0.03 + fiber(k, st.seed) * fiber(k + 0.5, st.seed) * 0.014 + off * off * 0.02;

    // --- 各ストロークの完成形を裏キャンバスに一度だけ描く ---
    const renderTexture = (st: Stroke) => {
      const r = rng(Math.floor(st.seed * 1000));
      const tex = document.createElement('canvas');
      tex.width = canvas.width;
      tex.height = Math.round((st.bottom - st.top) * dpr);
      const c = tex.getContext('2d')!;
      c.setTransform(dpr, 0, 0, dpr, 0, -st.top * dpr);

      // 下地：縁をゆるくうねらせて隙間なく
      const edge = (x: number, side: number) => 0.74 + 0.05 * noise1(x * 0.008, st.seed + side * 31);
      c.fillStyle = BASE;
      c.beginPath();
      for (let x = -margin; x <= vw + margin; x += 10) c[x === -margin ? 'moveTo' : 'lineTo'](x, yAt(st, x, -edge(x, -1)));
      for (let x = vw + margin; x >= -margin; x -= 10) c.lineTo(x, yAt(st, x, edge(x, 1)));
      c.closePath();
      c.fill();

      // 毛筋：中央は詰まって塗りムラ程度、端ほど薄く途切れてかすれる
      c.lineCap = 'round';
      const count = Math.round(st.h / 1.8);
      for (let k = 0; k < count; k++) {
        const off = (k / (count - 1)) * 2 - 1;
        const e = Math.abs(off);
        const dry = e < 0.62 ? 0 : ((e - 0.62) / 0.38) * 0.85;
        c.strokeStyle = PAINT[Math.floor(r() * PAINT.length)];
        c.globalAlpha = e < 0.62 ? 0.85 + r() * 0.15 : Math.max(0.15, (1 - e) / 0.38) * (0.5 + r() * 0.5);
        c.lineWidth = 1.8 + r() * 2.6;
        const seed = r() * 1000;
        c.beginPath();
        let pen = false;
        for (let x = -margin; x <= vw + margin; x += 6) {
          // 筆の終わりほど塗料が減ってかすれる
          const along = st.dir === 1 ? (x + margin) / len : (vw + margin - x) / len;
          if (dry > 0 && noise1(x * 0.011, seed) < dry * (1 + 0.6 * along)) {
            pen = false;
            continue;
          }
          const y = yAt(st, x, off);
          if (pen) c.lineTo(x, y);
          else {
            c.moveTo(x, y);
            pen = true;
          }
        }
        c.stroke();
      }
      st.tex = tex;
    };
    strokes.forEach(renderTexture);

    // --- 毛先の形で切り抜きながら見せる ---
    const drawStroke = (st: Stroke, s: number) => {
      const headX = xAt(st, s * (1 + MAX_LAG));
      ctx.save();
      ctx.beginPath();
      const tailX = st.dir === 1 ? -margin - 10 : vw + margin + 10;
      ctx.moveTo(tailX, st.top - 10);
      const steps = 260;
      for (let k = 0; k <= steps; k++) {
        const off = (k / steps) * 2.4 - 1.2;
        const x = headX - st.dir * lagAt(st, Math.max(-1, Math.min(1, off)), k) * len;
        ctx.lineTo(x, k === 0 ? st.top - 10 : k === steps ? st.bottom + 10 : yAt(st, x, off));
      }
      ctx.lineTo(tailX, st.bottom + 10);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(st.tex!, 0, st.top, vw, st.bottom - st.top);
      ctx.restore();
    };

    let raf = 0;
    const t0 = performance.now();
    const frame = (now: number) => {
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, vw, vh);
      for (const st of strokes) {
        const p = (t - st.start) / STROKE_DUR;
        if (p > 0) drawStroke(st, easeInOut(Math.min(1, p)));
      }
      if (t < paintEnd) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const timers = [
      window.setTimeout(() => setPhase((p) => (p === 'paint' ? 'logo' : p)), (paintEnd - 0.1) * 1000),
      window.setTimeout(() => setPhase((p) => (p === 'done' ? p : 'out')), (paintEnd - 0.1 + LOGO_HOLD) * 1000),
    ];
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, []);

  // 退場（CSS の opacity トランジション .6s）が終わったら取り外す
  useEffect(() => {
    if (phase !== 'out') return;
    const id = window.setTimeout(() => setPhase('done'), 650);
    return () => clearTimeout(id);
  }, [phase]);

  if (phase === 'done') return null;

  return (
    <div className={`pi${js ? ' is-js' : ''} is-${phase}`} aria-hidden="true" onClick={() => setPhase('out')}>
      <canvas ref={canvasRef} className="pi-canvas" />
      <div className="pi-name">
        {[...'丸愛装業'].map((c, i) => (
          <span key={i} style={{ ['--i' as string]: i }}>
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}
