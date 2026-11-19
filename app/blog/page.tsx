import type { Metadata } from 'next';
import Link from 'next/link';
import { getPosts } from '@/lib/content';
import { PageHero } from '@/components/site/PageHero';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'お役立ちコラム',
  description: '外壁塗装の時期の見分け方、火災保険の使い方、塗料グレードの選び方など、塗り替え前に知っておきたい情報をお届けします。',
  alternates: { canonical: '/blog' },
};

// 構成：PageHero → 記事のカード一覧（準備中はカードで案内）
export default async function BlogPage() {
  const posts = await getPosts().catch(() => []);
  return (
    <main className="relative">
      <PageHero eyebrow="Column" title="塗り替え前に、知っておきたいこと。" />
      <section className="bg-paper pb-[var(--section-gap)]">
        <div className="container">
          {posts.length === 0 ? (
            <div className="rounded-card bg-paper-2 border border-paper-3 p-6 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8">
                <span className="grid place-items-center w-12 h-12 rounded-full bg-plate border border-paper-3 text-accent" aria-hidden="true">
                  <i className="ri-book-open-line text-2xl"></i>
                </span>
                <h2 className="mt-4 text-[clamp(1.5rem,1.4vw+1rem,2.125rem)]">コラムは、ただいま準備中です。</h2>
                <p className="mt-3 text-base text-ink-2 max-w-[38em]">
                  塗り替えの時期の見分け方や、塗料の選び方などを順次お届けします。それまでは、よくある質問や料金ページをご覧ください。
                </p>
              </div>
              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3">
                <Link href="/faq" className="btn btn--secondary"><i className="ri-question-line text-xl" aria-hidden="true"></i>よくある質問</Link>
                <Link href="/price" className="btn btn--secondary"><i className="ri-price-tag-3-line text-xl" aria-hidden="true"></i>料金を見る</Link>
              </div>
            </div>
          ) : (
            <ul className="grid gap-4">
              {posts.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/blog/${p.slug}`}
                    className="group grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-2 rounded-card bg-plate border border-paper-3 p-6 text-ink no-underline hover:border-ink"
                  >
                    <time
                      dateTime={p.published_at}
                      className="md:col-span-2 self-start inline-flex w-fit rounded-control bg-paper-2 px-2.5 py-1 font-figure text-sm font-bold text-ink-2 tabular-nums"
                    >
                      {new Date(p.published_at).toLocaleDateString('ja-JP')}
                    </time>
                    <div className="md:col-span-8">
                      <h2 className="text-title decoration-1 underline-offset-[0.2em] group-hover:underline group-hover:text-accent">{p.title}</h2>
                      {p.excerpt && <p className="mt-2 text-base text-ink-2 max-w-[38em]">{p.excerpt}</p>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
