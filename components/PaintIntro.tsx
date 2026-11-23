'use client';
import { useEffect, useRef, useState } from 'react';
import { PAINT_FRAG, PAINT_VERT, planStrokes } from './paintShader';

/**
 * 初回表示のオープニング：くすんだ古いモルタル壁を、職人が刷毛で新しい塗料に塗り替える。
 * 1本ずつ太さ・角度・筆圧の違うストロークで塗り、最後に仕上げの一刷毛。塗り終わると社名が現れる。
 * 最後は社名が控えめにズームアウトしながら消え、塗った面が刷毛目に沿って透けてトップページが見えてくる。
 *
 * - 描画は WebGL のシェーダー（paintShader.ts）。WebGL が使えない環境では表示しない
 * - 同一セッションでは2回目以降は表示しない（app/layout.tsx の head スクリプトで描画前に判定）
 * - prefers-reduced-motion では表示しない／JS が動かなくても CSS のフォールバックで自動的に消える
 */
const STORAGE_KEY = 'maruai-intro-seen';

// タイムライン（秒）。塗りの時間配分は paintShader.ts の planStrokes
const LOGO_HOLD = 1.6; // 社名を書き始めてから退場が始まるまで（4文字書き終えて一呼吸）
const OUT_DUR = 2.0; // 塗りが透けきるまで（社名のズームアウトは globals.css の .pi.is-out .pi-name で 2.2s）
const REMOVE_AFTER = 2.3; // 退場開始から取り外すまで
// 社名：手で書いたような揺らぎ（傾き・高さ・大きさを文字ごとにわずかに変える）
const LOGO = [
  { c: '丸', r: -2, y: 2, s: 1.04 },
  { c: '愛', r: 1.2, y: -3, s: 0.98 },
  { c: '装', r: -0.6, y: 1, s: 1.01 },
  { c: '業', r: 1.8, y: -1, s: 1.03 },
];
const PAINT_RGB: [number, number, number] = [0x27 / 255, 0x41 / 255, 0x4f / 255]; // --brand-deep

export function PaintIntro() {
  const [phase, setPhase] = useState<'paint' | 'logo' | 'out' | 'done'>('paint');
  const [js, setJs] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const outAt = useRef<number | null>(null); // 退場を始めた時刻（performance.now）

  useEffect(() => {
    // 表示済み、または読み込みが遅く待たせてしまう場合は出さない
    if (document.documentElement.classList.contains('pi-off') || performance.now() > 3000) {
      setPhase('done');
      return;
    }
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
    // 刷毛目の陰影に画面上の微分を使う（ほぼ全端末で使えるが、無ければ出さない）
    if (!canvas || !gl || !gl.getExtension('OES_standard_derivatives')) {
      setPhase('done');
      return;
    }

    // --- シェーダー準備 ---
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const vs = compile(gl.VERTEX_SHADER, PAINT_VERT);
    const fs = compile(gl.FRAGMENT_SHADER, PAINT_FRAG);
    const prog = gl.createProgram()!;
    if (vs && fs) {
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
    }
    if (!vs || !fs || !gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      setPhase('done');
      return;
    }

    setJs(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* プライベートモード等では毎回表示 */
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // 高解像度端末でも負荷を抑える（塗りの質感は 1.5 倍で十分出る）
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n: string) => gl.getUniformLocation(prog, n);

    // --- ストローク配置：職人の塗り方（太さ・角度・弧・筆圧・間合いが1本ずつ違う） ---
    const plan = planStrokes(vw, vh);
    const paintEnd = plan.paintEnd;
    gl.uniform2f(U('uRes'), vw, vh);
    gl.uniform1f(U('uDpr'), dpr);
    gl.uniform1i(U('uCount'), plan.count);
    gl.uniform4fv(U('uA'), plan.a);
    gl.uniform4fv(U('uB'), plan.b);
    gl.uniform4fv(U('uC'), plan.c);
    gl.uniform3f(U('uPaint'), PAINT_RGB[0] * 1.05, PAINT_RGB[1] * 1.05, PAINT_RGB[2] * 1.05);
    gl.uniform1f(U('uOutDur'), OUT_DUR);
    const uTime = U('uTime');
    const uOut = U('uOut');

    let raf = 0;
    const t0 = performance.now();
    const frame = () => {
      const now = performance.now(); // setTimeout と同じ時計で進める
      const t = (now - t0) / 1000;
      const out = outAt.current === null ? 1e6 : (outAt.current - t0) / 1000;
      gl.uniform1f(uTime, t);
      gl.uniform1f(uOut, out);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (t < out + OUT_DUR) raf = requestAnimationFrame(frame);
    };
    frame(); // 最初の1枚はすぐ描く（下のページが一瞬見えないように）

    const timers = [
      window.setTimeout(() => setPhase((p) => (p === 'paint' ? 'logo' : p)), (paintEnd - 0.1) * 1000),
      window.setTimeout(() => setPhase((p) => (p === 'done' ? p : 'out')), (paintEnd - 0.1 + LOGO_HOLD) * 1000),
    ];
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  // 退場：塗りが透け、社名がズームアウトし終わったら取り外す
  useEffect(() => {
    if (phase !== 'out') return;
    if (outAt.current === null) outAt.current = performance.now();
    const id = window.setTimeout(() => setPhase('done'), REMOVE_AFTER * 1000);
    return () => clearTimeout(id);
  }, [phase]);

  if (phase === 'done') return null;

  return (
    <div className={`pi${js ? ' is-js' : ''} is-${phase}`} aria-hidden="true" onClick={() => setPhase('out')}>
      <canvas ref={canvasRef} className="pi-canvas" />
      <div className="pi-name">
        {LOGO.map(({ c, r, y, s }, i) => (
          <span key={i} style={{ ['--i' as string]: i, ['--r' as string]: `${r}deg`, ['--y' as string]: `${y}px`, ['--s' as string]: s }}>
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}
