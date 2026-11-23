// スマホ・タブレット（lg 未満）の画面下に固定する連絡バー：電話・LINE・無料見積もり
// どのページを見ていても、ひと押しで連絡できるようにする。PC はヘッダーとフッターの帯で足りるので出さない。
const ITEMS = [
  { href: 'tel:029-886-7913', icon: 'ri-phone-fill', label: '電話する', tone: 'bg-ink text-plate-ink' },
  { href: 'https://line.me/ti/p/UxXZqXMSWE', icon: 'ri-line-fill', label: 'LINEで相談', tone: 'bg-plate text-ink border border-paper-3', external: true },
  { href: '/contact', icon: 'ri-mail-line', label: '無料見積もり', tone: 'bg-accent text-accent-ink' },
];

export function MobileCtaBar() {
  return (
    <>
      {/* バーの高さぶん、ページの最後に余白をとる（フッターが隠れないように） */}
      <div aria-hidden="true" className="lg:hidden h-[calc(68px+env(safe-area-inset-bottom))] bg-ink"></div>
      <nav
        aria-label="お問い合わせ"
        className="lg:hidden fixed inset-x-0 bottom-0 z-50 border-t border-paper-3 bg-[color-mix(in_oklch,var(--color-paper)_94%,transparent)] backdrop-blur px-2 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] shadow-[0_-4px_16px_-8px_color-mix(in_oklch,var(--color-ink)_25%,transparent)]"
      >
        <ul role="list" className="grid grid-cols-3 gap-2 max-w-[640px] mx-auto">
          {ITEMS.map((it) => (
            <li key={it.label}>
              <a
                href={it.href}
                {...(it.external ? { target: '_blank', rel: 'nofollow noopener noreferrer' } : {})}
                className={`flex flex-col items-center justify-center gap-0.5 h-[52px] rounded-control no-underline font-bold text-[0.8125rem] leading-none whitespace-nowrap ${it.tone}`}
              >
                <i className={`${it.icon} text-xl leading-none`} aria-hidden="true"></i>
                {it.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
