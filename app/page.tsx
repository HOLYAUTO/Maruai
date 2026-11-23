import Link from 'next/link';
import { SERVICE_LIST } from '@/lib/services';
import { getRecentWorks } from '@/lib/content';

const LINE = 'https://line.me/ti/p/UxXZqXMSWE';
const TEL = '029-886-7913';

// 外壁塗装の料金の目安（料金ページと同じ値）
const PRICES = [
  { name: 'ウレタン', yen: 65 },
  { name: 'シリコン', yen: 75 },
  { name: 'ラジカル', yen: 85 },
  { name: 'フッ素', yen: 95 },
  { name: '無機', yen: 105 },
];

const AREAS = ['阿見町', '牛久市', '土浦市', 'つくば市', '取手市', '龍ケ崎市'];

export const revalidate = 3600;

export default async function Home() {
  const works = await getRecentWorks(3).catch(() => []);

  return (
    <>
      {/* ヒーロー：誰が・どこで・何を・いくらで */}
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <p className="hero-place">茨城県阿見町の塗装店　丸愛装業</p>
            <h1><span className="nb">見積もりに来た職人が、</span><br /><span className="nb">そのまま塗ります。</span></h1>
            <p className="lead">外壁と屋根の塗装を、下請けに出さず自社の職人だけで行っています。</p>
            <ul className="hero-facts">
              <li>外壁塗装 65万円〜（ウレタン・25坪・足場込・税抜）</li>
              <li>下塗り・中塗り・上塗りの3回塗りが基本</li>
              <li>保証は最長10年</li>
              <li>現地診断とお見積りは無料</li>
            </ul>
            <div className="hero-cta">
              <Link className="btn btn-ember" href="/contact">無料で見積もりを頼む</Link>
              <a className="btn btn-line" href={LINE}>LINEで相談する</a>
            </div>
            <p className="hero-tel">
              お電話は <a href={`tel:${TEL.replace(/-/g, '')}`}>{TEL}</a><span className="nb">（平日 9:00〜18:00）</span>
            </p>
          </div>
          <div className="hero-visual">
            <div className="photo-note">［ 職人の写真 ］<br />刷毛を握る手元、または<br />現場に立つ横顔を</div>
          </div>
        </div>
      </section>

      {/* 相談から完成まで（誰が何をするか） */}
      <section className="alt">
        <div className="wrap">
          <div className="sec-head">
            <h2 className="mincho">ご相談から完成まで、同じ職人が担当します</h2>
          </div>
          <ol className="steps">
            <li>
              <span className="n">1</span>
              <h3>お家を見に伺います</h3>
              <p>工事を担当する職人が、外壁や屋根の状態を見に伺います。工事の前に、塗る本人と顔を合わせていただけます。診断は無料です。</p>
            </li>
            <li>
              <span className="n">2</span>
              <h3>お見積りをお出しします</h3>
              <p>お家を見た職人が、そのまま見積もりを出します。お見積りも無料です。他社と比べていただいて構いません。</p>
            </li>
            <li>
              <span className="n">3</span>
              <h3>自社の職人が塗ります</h3>
              <p>下塗り・中塗り・上塗りの3回塗りが基本です。塗るのは丸愛装業の職人だけで、社員証の提示もいつでもどうぞ。</p>
            </li>
            <li>
              <span className="n">4</span>
              <h3>塗り終わったあとも</h3>
              <p>保証は最長10年です。ご相談から仕上げ、アフターまで、代表が責任を持ちます。</p>
            </li>
          </ol>
          <div className="why">
            <h3>下請けに出さない理由</h3>
            <p>
              営業会社が請けた工事では、職人に渡る材料費や工賃が削られ、どう頑張っても良い仕事ができません。受注した工事を下請けに流すことが、いちばん手抜きにつながると考えています。丸愛装業は自社の職人だけで塗るので、中間マージンもかかりません。
            </p>
          </div>
        </div>
      </section>

      {/* 料金の目安 */}
      <section>
        <div className="wrap price-top">
          <div className="sec-head">
            <h2 className="mincho">外壁塗装の料金の目安</h2>
            <p>塗料によって金額と持ちが変わります。延床面積25坪・足場代込み・税抜の価格で、軒天井・破風板・樋・雨戸を含みます。</p>
          </div>
          <table className="price-table">
            <tbody>
              {PRICES.map((p) => (
                <tr key={p.name}>
                  <th>{p.name}</th>
                  <td>
                    <b>{p.yen}</b>万円〜
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="price-link">
            <Link href="/price">坪数を入れて概算を出す（料金ページ）→</Link>
          </p>
        </div>
      </section>

      {/* 工事の内容 */}
      <section className="alt">
        <div className="wrap">
          <div className="sec-head">
            <h2 className="mincho">工事の内容</h2>
            <p>外壁塗装のほか、屋根塗装・コーキング・防水工事も自社で行っています。</p>
          </div>
          <div className="svc-grid">
            {SERVICE_LIST.map((s) => (
              <Link key={s.slug} className="svc svc-plain" href={`/services/${s.slug}`}>
                <div className="body">
                  <h3 className="mincho">{s.name}</h3>
                  <p>{s.lead}</p>
                  <div className="price-from">{s.priceFrom}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 代表から */}
      <section className="ink-sec">
        <div className="wrap msg-grid">
          <div className="msg-photo">［ 代表・小林力也の写真 ］</div>
          <div>
            <h2 className="msg-title mincho">代表から</h2>
            <div className="msg-body">
              <p>100万円を貯めるのに、3年、5年とかかる方も少なくありません。その大切なお金で行う外壁塗装が、本当に信頼できる業者に任せられているか。私はそこを一番に考えています。</p>
              <p>営業会社が請けた工事では、高い金額を払っていただいても、それに見合う仕事ができない。その悔しさが、独立の原点です。</p>
              <p>小さな会社です。だからこそ、一件一件ていねいに対応します。</p>
            </div>
            <p className="msg-sign">株式会社 丸愛装業　代表取締役<b className="mincho">小林 力也</b></p>
          </div>
        </div>
      </section>

      {/* 施工事例 */}
      <section>
        <div className="wrap">
          <div className="sec-head">
            <h2 className="mincho">施工事例</h2>
          </div>
          {works.length === 0 ? (
            <p style={{ color: 'var(--ink-soft)' }}>施工事例は準備中です。</p>
          ) : (
            <div className="work-grid">
              {works.map((w) => (
                <Link key={w.id} className="work" href={`/works/${w.id}`}>
                  <div className="ba"><div className="b">BEFORE</div><div className="a">AFTER</div></div>
                  <div className="meta"><span className="tag">{w.service}</span><h3 className="mincho">{w.title}</h3><p>{[w.paint, w.built_years ? `築${w.built_years}年` : null].filter(Boolean).join('・')}</p></div>
                </Link>
              ))}
            </div>
          )}
          <div style={{ marginTop: 28 }}><Link className="btn btn-ghost" href="/works">施工事例をもっと見る →</Link></div>
        </div>
      </section>

      {/* 対応エリア・会社 */}
      <section className="alt">
        <div className="wrap">
          <div className="sec-head">
            <h2 className="mincho">対応エリア</h2>
            <p>阿見町の会社から、60分圏内の地域に伺います。</p>
          </div>
          <div className="area-list">
            {AREAS.map((a) => (
              <span key={a}>{a}</span>
            ))}
          </div>
          <dl className="top-corp">
            <dt>所在地</dt>
            <dd>茨城県稲敷郡阿見町上条888</dd>
            <dt>所属</dt>
            <dd>一般社団法人 全国優良リフォーム 会員</dd>
          </dl>
          <div style={{ marginTop: 24 }}><Link className="btn btn-ghost" href="/company">会社概要を見る →</Link></div>
        </div>
      </section>

      {/* お問い合わせ */}
      <section className="cta">
        <div className="wrap">
          <h2 className="mincho">診断もお見積りも無料です</h2>
          <p>他社と比べていただいて構いません。お電話、LINE、フォームのどれからでもどうぞ。</p>
          <div className="cta-row">
            <a className="btn btn-white" href={`tel:${TEL.replace(/-/g, '')}`}>{TEL}（平日 9:00〜18:00）</a>
            <a className="btn btn-line" href={LINE}>LINEで相談する</a>
            <Link className="btn btn-white" href="/contact">お問い合わせフォーム</Link>
          </div>
        </div>
      </section>
    </>
  );
}
