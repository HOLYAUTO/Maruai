// 施工内容（写真つきのカード4枚）と施工エリア
const services = [
  {
    title: "外壁塗装",
    href: "/services/gaiheki-tosou",
    image: "/images/stock/roller-wall.jpg",
    alt: "ローラーで外壁を塗っているところ",
    subtitle: "美観と耐久性を両立",
    desc: "お家の美観を保ち、風雨から大切な住まいを守る外壁塗装。適切な塗料選びと丁寧な施工で、10年先も色褪せない仕上がりを実現します。",
    points: ["遮熱・断熱効果で光熱費削減", "紫外線・酸性雨から建物を保護", "10年保証で安心の長期サポート"],
  },
  {
    title: "屋根塗装",
    href: "/services/yane-tosou",
    image: "/images/stock/roof-tiles-sealing.jpg",
    alt: "瓦屋根の上で補修材を充てんしているところ",
    subtitle: "雨漏り防止と断熱性能向上",
    desc: "雨漏り防止と耐久性アップのための屋根塗装。専門的な知識と技術で、お家の一番重要な部分をしっかり守ります。",
    points: ["防水性を高め雨漏りを根本防止", "遮熱塗料で夏の室温を快適に", "屋根材の寿命を最大限に延ばす"],
  },
  {
    title: "コーキング",
    href: "/services/caulking",
    image: "/images/stock/caulking-gun.jpg",
    alt: "コーキングガンからシーリング材を出しているところ",
    subtitle: "気密性を高め建物寿命を延長",
    desc: "窓や壁の隙間を埋め、雨や風の侵入を防ぐコーキング工事。細かな部分まで丁寧に施工し、気密性を高めます。",
    points: ["窓枠・目地の劣化を完全補修", "高い弾性で建物の動きに追随", "外壁塗装前に必須の下地処理"],
  },
  {
    title: "防水工事",
    href: "/services/bousui",
    image: "/images/stock/roof-waterproofing.jpg",
    alt: "陸屋根に防水シートを張り終えたところ",
    subtitle: "水の侵入から建物を完全防御",
    desc: "ベランダや屋上の防水工事。水漏れから建物を守り、住まいの価値を維持する重要な施工です。",
    points: ["ベランダ・屋上の水漏れ防止", "FRP・ウレタン防水で確実施工", "コンクリートの中性化を抑制"],
  },
];


export default function ServiceSection() {
  return (
    <>
      <section id="service" className="bg-paper py-[var(--section-gap)]">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-6 items-end">
            <div className="lg:col-span-6">
              <p className="eyebrow">Service</p>
              <h2 className="mt-4">外壁も屋根も、防水も頼める？</h2>
            </div>
            <p className="lead lg:col-span-6">
              外壁塗装・屋根塗装・コーキング・防水工事。すべて完全自社施工・中間マージンゼロで、適正価格と最高品質を両立します。
            </p>
          </div>

          <ul className="mt-[var(--space-2xl)] grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {services.map((s, i) => (
              <li key={s.title}>
                <a
                  href={s.href}
                  className="group flex flex-col h-full rounded-card bg-plate border border-paper-3 overflow-hidden no-underline text-ink transition-shadow duration-short hover:shadow-card"
                >
                  <div className="relative aspect-[4/3] overflow-hidden" data-slot="service-card" data-alt={s.alt}>
                    <img
                      src={s.image}
                      alt={s.alt}
                      loading="lazy"
                      className="transition-transform duration-long group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="flex flex-col flex-1 p-6">
                    <p className="font-figure text-sm font-bold text-gold tracking-[0.12em]">0{i + 1}</p>
                    <h3 className="mt-1 text-[1.5rem]">{s.title}</h3>
                    <p className="mt-1 text-sm font-bold text-accent">{s.subtitle}</p>
                    <p className="mt-3 text-[0.9375rem] text-ink-2 leading-relaxed">{s.desc}</p>
                    <ul className="mt-4 space-y-1.5 text-sm text-ink">
                      {s.points.map((p) => (
                        <li key={p} className="flex items-start gap-2">
                          <i className="ri-check-line mt-0.5 text-accent" aria-hidden="true"></i>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                    <span className="mt-auto pt-5 inline-flex items-center gap-1 text-sm font-bold text-ink group-hover:text-accent">
                      詳しく見る
                      <i className="ri-arrow-right-line transition-transform group-hover:translate-x-1" aria-hidden="true"></i>
                    </span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-4 label">写真はすべてイメージです。</p>

          <div className="mt-[var(--space-xl)] flex flex-wrap items-center gap-x-6 gap-y-3">
            <p className="text-base text-ink-2">まずはおおよその料金をチェックしてみませんか？</p>
            <a href="#simulation" className="btn btn--secondary">
              <i className="ri-calculator-line" aria-hidden="true"></i>
              料金シミュレーションへ
            </a>
          </div>
        </div>
      </section>

      <section className="bg-paper-2 py-[var(--section-gap-s)]">
        <div className="container grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-10 items-center">
          <div className="lg:col-span-5">
            <p className="eyebrow">Area</p>
            <h2 className="mt-4">どこまで来てくれる？</h2>
            <p className="mt-6 text-base text-ink-2">
              丸愛装業ではお客様のご相談や不安をなるべく早く解決するために、すぐ駆けつけられる60分以内のエリアに限定しています。ご近所だからこそ、完工後のアフターフォローも万全です。
            </p>
            <p className="mt-4 label">※親族の方、お知り合いの方が県外の場合はご相談ください。</p>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <figure className="m-0 rounded-card bg-plate border border-paper-3 shadow-card p-4 md:p-6">
              <figcaption className="flex items-center gap-2 font-display font-bold text-title text-ink">
                <i className="ri-map-pin-2-fill text-accent" aria-hidden="true"></i>
                60分以内に駆けつけられる距離で
              </figcaption>
              {/* 位置関係の模式図（北が上、縮尺はおおよそ） */}
              <svg viewBox="0 0 600 420" className="mt-4 w-full h-auto" role="img" aria-labelledby="area-map-title">
                <title id="area-map-title">阿見町を中心に、土浦市・つくば市・牛久市・龍ケ崎市・取手市が60分圏内にある位置関係の図</title>
                <defs>
                  <radialGradient id="area-fill" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.03" />
                  </radialGradient>
                </defs>
                {/* 60分圏 */}
                <circle cx="330" cy="215" r="175" fill="url(#area-fill)" stroke="var(--color-accent)" strokeWidth="1.5" strokeDasharray="6 6" />
                <text x="330" y="26" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--color-accent)">60分圏（目安）</text>
                {/* 阿見町からの線 */}
                {[
                  [320, 150],
                  [230, 150],
                  [270, 268],
                  [300, 345],
                  [175, 345],
                ].map(([x, y]) => (
                  <line key={`${x}-${y}`} x1="330" y1="215" x2={x} y2={y} stroke="var(--color-paper-3)" strokeWidth="2" />
                ))}
                {/* 各市 */}
                {[
                  ["土浦市", 320, 150, "start"],
                  ["つくば市", 230, 150, "end"],
                  ["牛久市", 270, 268, "end"],
                  ["龍ケ崎市", 300, 345, "start"],
                  ["取手市", 175, 345, "end"],
                ].map(([name, x, y, anchor]) => (
                  <g key={name as string}>
                    <circle cx={x as number} cy={y as number} r="9" fill="var(--color-plate)" stroke="var(--color-ink)" strokeWidth="2.5" />
                    <text
                      x={(x as number) + (anchor === "start" ? 16 : -16)}
                      y={(y as number) + 6}
                      textAnchor={anchor as "start" | "end"}
                      fontSize="19"
                      fontWeight="700"
                      fill="var(--color-ink)"
                    >
                      {name}
                    </text>
                  </g>
                ))}
                {/* 阿見町（本社） */}
                <circle cx="330" cy="215" r="30" fill="var(--color-accent)" opacity="0.18" />
                <circle cx="330" cy="215" r="16" fill="var(--color-accent)" />
                <text x="356" y="211" fontSize="22" fontWeight="700" fill="var(--color-ink)">阿見町</text>
                <text x="356" y="235" fontSize="14" fill="var(--color-muted)">丸愛装業（本社）</text>
                {/* 方位 */}
                <g transform="translate(560 48)" fill="var(--color-muted)">
                  <path d="M0 -20 L7 4 L0 0 L-7 4 Z" />
                  <text y="22" textAnchor="middle" fontSize="13" fontWeight="700">N</text>
                </g>
              </svg>
              <p className="mt-2 text-xs text-muted">位置関係は目安です。上記以外の地域もご相談ください。</p>
            </figure>
          </div>
        </div>
      </section>
    </>
  );
}
