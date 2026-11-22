// オープニング用フラグメントシェーダー：古いモルタル壁に、刷毛で新しい塗料を塗る。
// 塗料は高さを持たせてライティングし、毛筋の凹凸・縁の盛り上がり・濡れたツヤ・壁への影を出す。
export const PAINT_FRAG = `
precision highp float;
uniform vec2 uRes;      // CSS px
uniform float uDpr;
uniform float uTime;
uniform int uCount;
uniform vec4 uS0[5];    // cy, halfW, dir, start
uniform vec4 uS1[5];    // tilt, waveA, waveF, seed
uniform float uDur;
uniform vec3 uPaint;
uniform float uSheen;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=0.5; } return v; }

float easeStroke(float p){ p=clamp(p,0.0,1.0); return mix(p*p, 1.0-pow(1.0-p,3.0), p); }

// ストローク1本：x = coverage, y = height
vec2 stroke(vec2 q, int i){
  vec4 a = uS0[0], b = uS1[0];
  if(i==1){a=uS0[1];b=uS1[1];} else if(i==2){a=uS0[2];b=uS1[2];} else if(i==3){a=uS0[3];b=uS1[3];} else if(i==4){a=uS0[4];b=uS1[4];}
  float cy=a.x, hw=a.y, dir=a.z, st=a.w, tilt=b.x, wA=b.y, wF=b.z, seed=b.w;
  float W = uRes.x;
  float margin = 60.0;
  float len = W + margin*2.0;
  float u = dir > 0.0 ? q.x + margin : (W + margin - q.x);          // 塗り始めからの距離
  float center = cy + sin(q.x*wF + seed) * wA + (q.x - W*0.5) * tilt;
  float v = (q.y - center) / hw;                                    // -1..1
  float av = abs(v);
  float p = (uTime - st) / uDur;
  float head = easeStroke(p) * (len + 140.0);
  // 毛先：束のうねり＋1本ごとのほつれ＋端ほど遅れる
  float lag = noise(vec2(v*3.0, seed)) * 34.0 + noise(vec2(v*26.0, seed+3.0)) * 6.0 + noise(vec2(v*140.0, seed+5.0)) * 7.0 + v*v*46.0;
  float ahead = head - lag - u;                                     // >0 なら塗れている
  float cov = smoothstep(0.0, 1.2, ahead);
  float aa = 1.0 / hw;   // 1px 分の幅（縁をくっきり、透けさせない）
  // 上下の縁：うねり＋端のかすれ（筆の終わりほどかすれる）
  float edgeN = (noise(vec2(u*0.008, seed+9.0)) - 0.5) * 0.10;
  float along = clamp(u / len, 0.0, 1.0);
  float body = 1.0 - smoothstep(0.86 - aa, 0.86 + aa, av + edgeN);
  // 縁のかすれ：毛1本ずつ、塗れているか塗れていないか（半透明にしない）
  float streak = noise(vec2(u*0.006 + seed, v*70.0)) * 0.7 + noise(vec2(u*0.002, v*18.0)) * 0.3;
  float dryZone = smoothstep(0.80, 0.86, av + edgeN);
  float dryT = mix(0.42, 0.68, along) + (av - 0.86) * 2.2;
  float bristleEdge = smoothstep(dryT - 0.015, dryT + 0.015, streak) * (1.0 - smoothstep(1.02 - aa, 1.02 + aa, av));
  float m = max(body, bristleEdge * dryZone);
  cov *= m;
  // 高さ：毛筋の凹凸、縁に寄った塗料の盛り上がり、刷毛の先の溜まり
  // 外壁塗料は流れて平滑になる：刷毛跡はなだらかで幅広く、細かい筋はごく僅か
  float h = 0.5
    + 0.24 * noise(vec2(u*0.0018 + seed*2.0, v*7.0))
    + 0.10 * noise(vec2(u*0.005 + seed, v*17.0))
    + 0.025 * noise(vec2(u*0.015, v*42.0));
  h += 0.22 * exp(-pow((av - 0.80)/0.07, 2.0));
  h += 0.45 * exp(-max(ahead, 0.0)/16.0) * (1.0 - av*0.6);
  h *= mix(1.0, 0.7, dryZone);
  return vec2(cov, h);
}

// 全ストロークを重ねた結果：x = coverage, y = height
vec2 paint(vec2 q){
  float cov = 0.0, h = 0.0;
  for(int i=0;i<5;i++){
    if(i >= uCount) break;
    vec2 s = stroke(q, i);
    h = mix(h, s.y, s.x);
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
  float rain = fbm(vec2(q.x*0.018 + fbm(q*0.003)*2.0, q.y*0.003) + 3.0);
  vec3 wall = vec3(0.835, 0.812, 0.766);
  wall *= 0.93 + 0.10*big + 0.05*mid;
  wall *= 1.0 - smoothstep(0.58, 0.9, rain) * 0.035;
  wall += (sand - 0.5) * 0.045;
  // 壁の凹凸に軽く光を
  float wh = sand*0.6 + mid*0.4;
  float whx = noise((q+vec2(1,0))*0.9)*0.6 + fbm((q+vec2(1,0))*0.02+7.0)*0.4;
  wall *= 1.0 + (wh - whx) * 0.25;

  // ---- 新しい塗料 ----
  vec2 c0 = paint(q);
  vec2 cx = paint(q + vec2(1.0, 0.0));
  vec2 cy = paint(q + vec2(0.0, 1.0));
  vec3 N = normalize(vec3(-(cx.y - c0.y)*3.0, -(cy.y - c0.y)*3.0, 1.0));
  // 光：左上から。社名が出る頃に少しずつ右へ動き、濡れたツヤが流れる
  float sweep = smoothstep(1.2, 2.6, uTime);
  vec3 L = normalize(vec3(mix(-0.55, 0.45, sweep), -0.55, 0.75));
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 H = normalize(L + V);
  float diff = clamp(dot(N, L), 0.0, 1.0);
  float nh = clamp(dot(N, H), 0.0, 1.0);
  float spec = pow(nh, 36.0);
  float glint = pow(nh, 220.0);
  vec3 pc = uPaint * (0.80 + 0.28*diff);
  pc += vec3(0.80, 0.88, 0.95) * (spec*0.16 + glint*0.09);
  pc *= 0.97 + 0.06*noise(q*0.01 + 11.0);
  // 見せ場：社名が出る頃、浅い角度の光が塗りたての面を一度だけ流れ、刷毛目が浮かぶ
  vec2 uvs = q / uRes;
  float band = (uvs.x * 0.85 + uvs.y * 0.35) - mix(-0.45, 1.65, smoothstep(uSheen, uSheen + 1.1, uTime));
  float env = exp(-band*band / 0.035);
  vec3 Lg = normalize(vec3(-0.9, -0.25, 0.35));
  float rake = pow(clamp(dot(N, normalize(Lg + V)), 0.0, 1.0), 10.0);
  pc += vec3(0.78, 0.86, 0.92) * env * (0.035 + rake * 0.16) * c0.x;

  // 塗料の厚みが壁に落とす影
  vec2 sh = paint(q + vec2(-1.5, -2.5));
  float shadow = sh.x * (1.0 - c0.x) * 0.22;
  wall *= 1.0 - shadow;

  vec3 col = mix(wall, pc, c0.x);
  // 周辺減光と粒子（バンディング防止）
  vec2 uv = q / uRes;
  col *= 1.0 - 0.18 * pow(length((uv - 0.5) * vec2(1.0, 0.8)), 2.2);
  col += (hash(q + fract(uTime)) - 0.5) * 0.012;
  gl_FragColor = vec4(col, 1.0);
}`;

export const PAINT_VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
