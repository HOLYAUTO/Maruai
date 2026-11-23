// 施工内容（写真つきのカード4枚）と施工エリア
const services = [
  {
    title: "外壁塗装",
    href: "/services/gaiheki-tosou",
    image: "/images/stock/roller-wall.jpg",
    alt: "ローラーで外壁を塗っているところ",
    subtitle: "3回塗りで塗膜を回復",
    desc: "下塗り・中塗り・上塗りの3回塗りを基本に、雨風や紫外線から外壁を守る塗膜を回復させます。",
    points: ["遮熱・断熱効果で光熱費削減", "紫外線・酸性雨から建物を保護", "保証は最長10年"],
  },
  {
    title: "屋根塗装",
    href: "/services/yane-tosou",
    image: "/images/stock/roof-tiles-sealing.jpg",
    alt: "瓦屋根の上で補修材を充てんしているところ",
    subtitle: "外壁と一緒なら足場代が一度で済む",
    desc: "一年中、紫外線と雨風をいちばん受けるのが屋根です。遮熱・防水性を高めて、建物を長持ちさせます。",
    points: ["防水性を高めて雨漏りを防ぐ", "遮熱塗料で夏の室温を快適に", "屋根材を長持ちさせる"],
  },
  {
    title: "コーキング",
    href: "/services/caulking",
    image: "/images/stock/caulking-gun.jpg",
    alt: "コーキングガンからシーリング材を出しているところ",
    subtitle: "目地とサッシまわりの打ち替え",
    desc: "外壁の目地やサッシまわりのゴム材を打ち替え・増し打ちして、雨水の入り口をふさぎます。傷んだところだけの補修もできます。",
    points: ["窓枠・目地の劣化を補修", "高い弾性で建物の動きに追随", "塗装と同時に打ち替えると効果的"],
  },
  {
    title: "防水工事",
    href: "/services/bousui",
    image: "/images/stock/roof-waterproofing.jpg",
    alt: "陸屋根に防水シートを張り終えたところ",
    subtitle: "ベランダ・屋上の防水層を再生",
    desc: "ベランダ・屋上・バルコニーの防水層を再生します。雨漏りが起きる前の予防が肝心です。",
    points: ["ベランダ・屋上の水漏れ防止", "FRP・ウレタン防水に対応", "コンクリートの中性化を抑制"],
  },
];


export default function ServiceSection() {
  return (
    <>
      <section id="service" className="bg-paper-2 border-y border-paper-3 py-[var(--section-gap)]">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-6 items-end">
            <div className="lg:col-span-6">
              <p className="eyebrow">Service</p>
              <h2 className="mt-4">外壁も屋根も、防水も頼める？</h2>
            </div>
            <p className="lead lg:col-span-6">
              外壁塗装・屋根塗装・コーキング・防水工事を、どれも自社の職人が施工します。下請けに出さないので、中間マージンはかかりません。
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

    </>
  );
}
