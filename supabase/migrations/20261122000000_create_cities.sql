-- 対応エリア（cities）テーブル — 地域別ページ（/gaiheki-tosou/◯◯ ・ /yane-tosou/◯◯）の元データ
-- Supabase の SQL Editor に貼り付けて実行しても、そのまま動きます。
--
-- 1行 = 1市町。ページは cities の行から自動で作られる（追加すれば、その市町のページが増える）。
--  slug         … URL になる英小文字（例: ami → /gaiheki-tosou/ami）
--  intro        … その市町向けの紹介文。市名だけ差し替えた文の使い回しにしないこと
--  climate_note … 気候・立地による外壁の傷み方のメモ（任意）
--  nearby       … 「近隣の対応エリア」に出す市町の slug

create table if not exists public.cities (
  slug         text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name         text    not null,
  intro        text    not null,
  climate_note text,
  nearby       text[]  not null default '{}',
  sort         integer not null default 0
);

comment on table public.cities is 'Maruai 対応エリア。地域別ページの元データ（誰でも読める・書き込みは管理画面から）';

alter table public.cities enable row level security;

drop policy if exists "public can read cities" on public.cities;
create policy "public can read cities"
  on public.cities for select
  to anon, authenticated
  using (true);

insert into public.cities (slug, name, intro, climate_note, nearby, sort) values
('ami', '阿見町',
 '阿見町は丸愛装業の本拠地です。地元のお家だからこそ、ご相談から施工後のアフターフォローまで、代表の職人が責任を持って対応します。築7〜10年を過ぎると外壁の防水機能が落ち始め、色あせやチョーキング（白い粉）が出てきます。気になるサインがあれば、まずは無料診断にお呼びください。何かあったときも、すぐに駆けつけられる距離です。',
 '霞ヶ浦からの湿気を含む風と、夏の強い日差しが重なる土地です。南面・西面の色あせと、北面のコケ・カビが同時に進みやすい傾向があります。',
 '{ushiku,tsuchiura,ryugasaki,tsukuba}', 1),
('ushiku', '牛久市',
 '牛久市は阿見町のすぐ隣で、日頃からよく伺うエリアです。昭和の終わりから平成にかけて分譲された住宅地が多く、2回目の塗り替えを迎えるお家や、外壁と一緒に屋根やコーキングの傷みが気になり始めたお家からのご相談をいただきます。前回の塗装からの年数がわからない場合も、現地で塗膜の状態を見てお伝えします。',
 '牛久沼の周辺や低い土地では湿気がこもりやすく、日の当たらない面にコケやカビが出やすくなります。',
 '{ami,tsuchiura,ryugasaki,tsukuba}', 2),
('tsuchiura', '土浦市',
 '土浦市は阿見町と隣り合う、霞ヶ浦のほとりの街です。昔ながらの木造のお家から、新しい住宅地のサイディングのお家まで、建物のつくりがさまざまなのが特徴です。外壁材によって合う下塗り材や塗料が違うので、診断ではまず「何でできた外壁か」を確かめてから、お家に合った塗り方をご提案します。',
 '霞ヶ浦から吹く風で湿気を受けやすく、湖に近い地域では北面のコケや、金属部分のサビが早めに出ることがあります。',
 '{ami,tsukuba,ushiku}', 3),
('tsukuba', 'つくば市',
 'つくば市では、つくばエクスプレス開業の前後に建てられたお家が、ちょうど最初の塗り替えの時期を迎えています。新しい住宅地のサイディングの外壁は、塗料より先に目地のコーキングが傷むことが多い部分です。外壁塗装とコーキングの打ち替えを一度に行うと、足場を組むのが1回で済み、費用を抑えられます。',
 '広い平地で日差しや風をさえぎるものが少なく、南面・西面の色あせやチョーキングが早めに出やすい傾向があります。',
 '{tsuchiura,ushiku,ami}', 4),
('toride', '取手市',
 '取手市は茨城県の南の端、利根川沿いの街です。早くから開けた住宅地が多く、築年数の経ったお家の塗り替えや、何度目かの塗り替えのご相談が中心になります。何度も塗り重ねた外壁は、古い塗膜の状態によって下地の処理が変わるので、現地でしっかり確かめてからお見積もりします。',
 '利根川や小貝川に近い地域は朝晩に湿気がたまりやすく、北面や水まわりの外側にカビ・コケが出やすくなります。',
 '{ryugasaki,ushiku}', 5),
('ryugasaki', '龍ケ崎市',
 '龍ケ崎市は、昭和の終わりごろから入居が始まったニュータウンを中心に、築30年を超えるお家が増えている街です。外壁と一緒に、屋根の色あせや塗膜のはがれが気になるというご相談も多くいただきます。外壁と屋根を同時に塗ると足場が1回で済むので、まとめてのご相談もお気軽にどうぞ。',
 '田園と台地が入り混じる地域で、風当たりの強い場所では屋根や外壁の一部だけ傷みが早いこともあります。',
 '{ushiku,ami,toride}', 6)
on conflict (slug) do nothing;
