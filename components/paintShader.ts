// オープニング用フラグメントシェーダー：古いモルタル壁に、職人が刷毛で新しい塗料を塗る。
// - ストロークは1本ずつ太さ・角度・弧・筆圧が違う（手仕事のムラ）。塗り始めは塗料が溜まり、抜きは細くかすれる
// - 塗料は高さを持たせてライティング（刷毛目の凹凸、縁の盛り上がり、壁に落ちる厚みの影）
// - かすれは「下地の凹凸 × 毛筋 × 塗料の残り」で決まる
// - 退場時は刷毛目に沿って薄いところから透けていく
export const MAX_STROKES = 8;

export const PAINT_FRAG = `
#extension GL_OES_standard_derivatives : enable
precision highp float;
#define MAX_STROKES ${MAX_STROKES}
uniform vec2 uRes;      // CSS px
uniform float uDpr;
uniform float uTime;
uniform int uCount;
uniform vec4 uA[MAX_STROKES];   // x0, y0, x1, y1（塗り始め → 抜き）
uniform vec4 uB[MAX_STROKES];   // 半幅, 弧の深さ, 開始時刻, 所要時間
uniform vec4 uC[MAX_STROKES];   // 乱数種, 筆圧の揺れ, 画面内で着地するか(0/1), 未使用
uniform vec3 uPaint;
uniform float uOut;      // 透けはじめる時刻（それまでは大きな値）
uniform float uOutDur;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.03; a*=0.5; } return v; }

// 手の動き：出だしは素早く、終わりは少し粘ってから抜く
float easeStroke(float p){ p=clamp(p,0.0,1.0); return mix(p*p, 1.0-pow(1.0-p,2.6), p); }

// ストローク1本：x = 塗れているか（くっきり）, y = 高さ, z = 高さを重ねる重み（なだらか）
vec3 stroke(vec2 q, float sub, vec4 A, vec4 B, vec4 C){
  vec2 P0 = A.xy, P1 = A.zw;
  float hw0 = B.x, bend = B.y, st = B.z, dur = B.w;
  float seed = C.x, press = C.y, landing = C.z;
  vec2 d = P1 - P0;
  float len = length(d);
  d /= len;
  vec2 nrm = vec2(-d.y, d.x);
  vec2 r = q - P0;
  float u = dot(r, d);                       // 塗り始めからの距離
  float t = clamp(u / len, 0.0, 1.0);
  // 腕の弧＋手の小さなブレ
  float off = bend * 4.0 * t * (1.0 - t) + (noise(vec2(u * 0.004, seed)) - 0.5) * hw0 * 0.10;
  float w = dot(r, nrm) - off;
  // 筆圧：1本の中で幅が膨らんだり細ったりする。上下の縁も別々に揺れる
  float pr = 1.0 + press * (noise(vec2(t * 3.2, seed + 1.0)) - 0.5) * 2.0;
  pr *= 1.0 + 0.10 * exp(-t * 10.0) * landing;           // 着地でわずかに広がる
  pr *= mix(1.0, 0.55, smoothstep(0.80, 1.0, t));         // 抜きで細くなる
  float wTop = pr * (1.0 + 0.09 * (noise(vec2(t * 5.0, seed + 3.0)) - 0.5) * 2.0);
  float wBot = pr * (1.0 + 0.09 * (noise(vec2(t * 5.0, seed + 6.0)) - 0.5) * 2.0);
  float hw = hw0 * (w < 0.0 ? wTop : wBot);
  float v = w / hw;
  float av = abs(v);

  // 進み：毛先は束ごとに揃い、端ほど遅れる
  float p = (uTime - st) / dur;
  float head = easeStroke(p) * (len + 120.0);
  float lag = noise(vec2(v*3.0, seed)) * 34.0 + noise(vec2(v*26.0, seed+3.0)) * 6.0 + noise(vec2(v*140.0, seed+5.0)) * 7.0 + v*v*46.0;
  float ahead = head - lag - u;
  float cov = smoothstep(0.0, 1.2, ahead);
  // 着地（画面内で塗り始める場合）：丸みのある不揃いな始まり
  float startEdge = u + (v*v*hw0*1.1 + noise(vec2(v*14.0, seed+8.0)) * hw0*0.2) * landing;
  cov *= smoothstep(0.0, 1.5, startEdge + (1.0 - landing) * 1e4);
  // 抜き：端から先に離れていく
  // 平刷毛の抜き：ほぼ真っ直ぐ離れ、毛筋が尾を引く（丸く抜けない）
  float endEdge = len - u - (v*v*hw0*0.3 + noise(vec2(v*7.0, seed+11.0)) * hw0*0.12 + noise(vec2(v*70.0, seed+12.0)) * hw0*0.06);
  cov *= smoothstep(0.0, 1.5, endEdge);

  float aa = 1.0 / hw;
  float edgeN = (noise(vec2(u*0.006, seed+9.0)) - 0.5) * 0.12 + (noise(vec2(u*0.03, seed+4.0)) - 0.5) * 0.04;
  float e = av + edgeN;
  float edgeT = smoothstep(0.5, 1.06, e);      // 0 = 中央 → 1 = 外縁
  // かすれ：長く細い毛筋＋細かな毛＋下地（モルタル）の凹凸。凸部にだけ塗料が乗り、凹部が抜ける
  float sA = noise(vec2(u*0.0022 + seed, v*48.0));
  float sB = noise(vec2(u*0.009 + seed*1.7, v*150.0));
  float field = (sA*0.5 + sB*0.22 + sub*0.28 - 0.5) * 2.4 + 0.5;
  // 塗料の残り：進むほど減り、抜きの手前で一気にかすれる
  // 仕上げの一刷毛（着地あり・細い刷毛）は塗料が少なめで縁がかすれやすい
  float thr = mix(-0.6, 1.15, edgeT) + t*0.25*edgeT + smoothstep(0.72, 1.0, t) * 0.95 + landing * 0.25 * edgeT;
  float outer = 1.0 - smoothstep(1.03 - aa, 1.03 + aa, e);
  float m = smoothstep(thr - 0.02, thr + 0.02, field) * outer;
  float mSoft = smoothstep(thr - 0.35, thr + 0.35, field) * outer;
  float covSoft = cov * mSoft;
  cov *= m;

  // 高さ：なだらかな刷毛目、縁の盛り上がり、刷毛の先と着地点の塗料溜まり
  float h = 0.5
    + 0.24 * noise(vec2(u*0.0018 + seed*2.0, v*7.0))
    + 0.10 * noise(vec2(u*0.005 + seed, v*17.0))
    + 0.025 * noise(vec2(u*0.015, v*42.0));
  h += 0.22 * exp(-pow((av - 0.80)/0.07, 2.0));
  h += 0.45 * exp(-max(ahead, 0.0)/16.0) * (1.0 - av*0.6);
  h += 0.35 * exp(-max(startEdge, 0.0)/22.0) * landing;
  h += sA * 0.04 * edgeT;
  h *= mix(1.0, 0.62, edgeT);
  h *= mix(1.0, 0.7, smoothstep(0.8, 1.0, t));            // 抜きは塗膜が薄い
  return vec3(cov, h, covSoft);
}

// 全ストロークを重ねた結果：x = coverage, y = height
vec2 paint(vec2 q){
  float sub = noise(q*0.9) * 0.6 + noise(q*2.3) * 0.4;   // 下地の凹凸（壁の砂目と同じ）
  float cov = 0.0, h = 0.0;
  for(int i=0;i<MAX_STROKES;i++){
    if(i >= uCount) break;
    vec3 s = stroke(q, sub, uA[i], uB[i], uC[i]);
    h = mix(h, s.y, s.z);
    cov = max(cov, s.x);
  }
  return vec2(cov, h);
}

void main(){
  vec2 q = vec2(gl_FragCoord.x, uRes.y*uDpr - gl_FragCoord.y) / uDpr;   // CSS px, 上が0
  // ---- 古い外壁（モルタル）：くすみ、ムラ、雨だれ、細かな砂目 ----
  float big = fbm(q*0.004);
  float mid = fbm(q*0.02 + 7.0);
  float sand = noise(q*0.9) * 0.6 + noise(q*2.3) * 0.4;
  float rain = fbm(vec2(q.x*0.018 + big*2.0, q.y*0.003) + 3.0);
  vec3 wall = vec3(0.835, 0.812, 0.766);
  wall *= 0.93 + 0.10*big + 0.05*mid;
  wall *= 1.0 - smoothstep(0.58, 0.9, rain) * 0.035;
  wall += (sand - 0.5) * 0.045;
  float wh = sand*0.6 + mid*0.4;
  wall *= 1.0 - dFdx(wh) * uDpr * 0.25;        // 壁の凹凸に軽く光を

  // ---- 新しい塗料 ----
  vec2 c0 = paint(q);
  // 法線は画面上の微分から（塗りの計算を1回で済ませてスマホの負荷を抑える）
  float hx = dFdx(c0.y) * uDpr, hy = dFdy(c0.y) * uDpr;
  vec3 N = normalize(vec3(-hx*5.0, hy*5.0, 1.0));
  // 光は左上から固定（動かさない）
  vec3 L = normalize(vec3(-0.55, -0.55, 0.75));
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 H = normalize(L + V);
  float diff = clamp(dot(N, L), 0.0, 1.0);
  float nh = clamp(dot(N, H), 0.0, 1.0);
  vec3 pc = uPaint * (0.78 + 0.32*diff);
  pc += vec3(0.80, 0.88, 0.95) * pow(nh, 36.0) * 0.10;
  pc *= 0.97 + 0.06*noise(q*0.01 + 11.0);

  // 塗料の厚みが壁に落とす影
  float shadow = paint(q + vec2(-1.5, -2.5)).x * (1.0 - c0.x) * 0.22;
  wall *= 1.0 - shadow;

  vec3 col = mix(wall, pc, c0.x);
  vec2 uv = q / uRes;
  col *= 1.0 - 0.18 * pow(length((uv - 0.5) * vec2(1.0, 0.8)), 2.2);
  col += (hash(q + fract(uTime)) - 0.5) * 0.012;

  // ---- 退場：全体がじわっと透けていく。刷毛目に沿って薄いところが先に、厚いところが後に ----
  float op = clamp((uTime - uOut) / uOutDur, 0.0, 1.0);
  float g = noise(vec2(q.x*0.006, q.y*0.13)) * 0.40
          + noise(vec2(q.x*0.02, q.y*0.45)) * 0.22
          + clamp((c0.y - 0.3) * 0.5, 0.0, 0.38);
  float opE = pow(op, 1.6);   // 前半はゆっくり（社名が浮き上がって消えるのを待つ）、後半で一気に
  float alpha = 1.0 - smoothstep(0.0, 1.0, opE * 1.28 - g * 0.28);
  gl_FragColor = vec4(col * alpha, alpha);
}`;

export const PAINT_VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

export type StrokePlan = { a: number[]; b: number[]; c: number[]; count: number; paintEnd: number };

/**
 * 職人の塗り方を模したストロークの配置。
 * 段ごとに左右交互だが、太さ・角度・弧・速さ・間合いは1本ずつ違う。最後に細い刷毛で仕上げの一刷毛。
 */
export function planStrokes(vw: number, vh: number, seed = 7): StrokePlan {
  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const range = (a: number, b: number) => a + (b - a) * rnd();
  const rows = Math.min(MAX_STROKES - 1, Math.max(4, Math.round(vh / 190)));
  const pitch = vh / rows;
  const speed = 0.75 + 0.25 * Math.min(1.6, vw / 1000); // 横に長い画面ほど少し時間をかける
  const a: number[] = [];
  const b: number[] = [];
  const c: number[] = [];
  let t = 0.22;
  let paintEnd = 0;
  for (let i = 0; i < rows; i++) {
    const dir = i % 2 === 0 ? 1 : -1;
    const cy = pitch * (i + 0.5) + range(-0.08, 0.08) * pitch;
    const ang = (range(-4.5, 4.5) * Math.PI) / 180;
    const xs = -range(40, 110);
    // 広い画面ではたまに少し手前で抜く（狭い画面で手前に抜くと端に壁が帯状に残るのでしない）
    const xe = vw + (vw > 700 && rnd() < 0.3 ? range(-0.03, 0.02) : range(0.05, 0.16)) * vw;
    const dy = Math.tan(ang) * (xe - xs);
    const [x0, x1] = dir === 1 ? [xs, xe] : [vw - xs, vw - xe];
    a.push(x0, cy - dy / 2, x1, cy + dy / 2);
    const dur = range(0.62, 0.82) * speed;
    b.push(pitch * range(0.98, 1.14), pitch * range(-0.2, 0.2), t, dur);
    c.push(range(0, 100), range(0.08, 0.16), 0, 0);
    paintEnd = Math.max(paintEnd, t + dur);
    t += range(0.2, 0.36);
  }
  // 仕上げの一刷毛：細めの刷毛で、段の継ぎ目あたりを斜めになでる（画面内で着地して抜く）
  const k = Math.floor(range(1, rows));
  const fy = pitch * k + range(-0.15, 0.15) * pitch;
  const fx0 = vw * range(0.08, 0.22);
  const fx1 = vw * range(0.72, 0.92);
  const fdy = Math.tan((range(3, 7) * Math.PI) / 180) * (fx1 - fx0) * (rnd() < 0.5 ? 1 : -1);
  const [gx0, gx1] = rnd() < 0.5 ? [fx0, fx1] : [vw - fx0, vw - fx1];
  a.push(gx0, fy - fdy / 2, gx1, fy + fdy / 2);
  const ft = paintEnd - 0.12;
  const fdur = 0.5 * speed;
  b.push(pitch * range(0.32, 0.42), pitch * range(-0.12, 0.12), ft, fdur);
  c.push(range(0, 100), 0.18, 1, 0);
  paintEnd = Math.max(paintEnd, ft + fdur);
  // 未使用分を埋める（開始時刻を遠い未来にして描かれないように）
  while (a.length < MAX_STROKES * 4) {
    a.push(0, 0, 1, 0);
    b.push(1, 0, 1e6, 1);
    c.push(0, 0, 0, 0);
  }
  return { a, b, c, count: rows + 1, paintEnd };
}
