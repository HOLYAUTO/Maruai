'use client';
import { useEffect, useRef, useState } from 'react';
import { PAINT_FRAG, PAINT_VERT } from './paintShader';

/**
 * 初回表示のオープニング：くすんだ古いモルタル壁を、刷毛で新しい塗料に塗り替える。
 * 塗り終わると浅い光が一度だけ面を流れて刷毛目が浮かび、社名が現れる。
 * 最後は社名がゆっくり浮き上がりながら、塗った面が刷毛目に沿って透けてトップページが見えてくる。
 *
 * - 描画は WebGL のシェーダー（paintShader.ts）。WebGL が使えない環境では表示しない
 * - 同一セッションでは2回目以降は表示しない（app/layout.tsx の head スクリプトで描画前に判定）
 * - prefers-reduced-motion では表示しない／JS が動かなくても CSS のフォールバックで自動的に消える
 */
const STORAGE_KEY = 'maruai-intro-seen';

// タイムライン（秒）
const FIRST = 0.25; // 壁を一瞬見せてから塗り始める
const GAP = 0.3; // ストロークの間隔（重ねて途切れさせない）
const DUR = 0.72; // 1ストロークの長さ
const LOGO_HOLD = 1.3; // 社名が出てから退場が始まるまで
const OUT_DUR = 2.0; // 塗りが透けきるまで（社名の浮き上がりは globals.css の .pi.is-out .pi-name で 2.2s）
const REMOVE_AFTER = 2.3; // 退場開始から取り外すまで
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
    if (!canvas || !gl) {
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

    // --- ストローク配置：画面の高さに応じて3〜5本、左右交互に ---
    const n = Math.min(5, Math.max(3, Math.round(vh / 250)));
    const pitch = vh / n;
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const s0: number[] = [];
    const s1: number[] = [];
    for (let i = 0; i < 5; i++) {
      // 中心y, 半幅, 向き, 開始時刻（僅かに揺らして機械的なリズムを避ける）
      s0.push(pitch * (i + 0.5), pitch * 0.92, i % 2 === 0 ? 1 : -1, FIRST + i * GAP + (rnd() - 0.5) * 0.06);
      // 傾き, うねり幅, うねり周期, 乱数種
      s1.push((rnd() - 0.5) * 0.03, 3 + rnd() * 5, (Math.PI * 2) / (vw * (0.9 + rnd() * 0.8)), rnd() * 100);
    }
    const paintEnd = FIRST + (n - 1) * GAP + DUR;
    gl.uniform2f(U('uRes'), vw, vh);
    gl.uniform1f(U('uDpr'), dpr);
    gl.uniform1i(U('uCount'), n);
    gl.uniform4fv(U('uS0'), s0);
    gl.uniform4fv(U('uS1'), s1);
    gl.uniform1f(U('uDur'), DUR);
    gl.uniform1f(U('uSheen'), paintEnd - 0.1);
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

  // 退場：塗りが透け、社名が浮き上がり終わったら取り外す
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
        {[...'丸愛装業'].map((c, i) => (
          <span key={i} style={{ ['--i' as string]: i }}>
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}
