import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// お問い合わせの受け口。トップとお問い合わせページのフォームが送ってくる。
// 1) Supabase の contact_submissions に保存し、2) 公式LINE（Messaging API）で代表に通知する。
//
// LINE 通知に使う環境変数（Vercel の Environment Variables に設定。コードやリポジトリには書かない）:
//   LINE_CHANNEL_ACCESS_TOKEN … Messaging API チャネルの「チャネルアクセストークン（長期）」
//   LINE_NOTIFY_TO            … 通知を受け取る人の User ID（U から始まる）またはグループ ID
// 未設定なら通知はせず、保存だけ行う。

export const runtime = 'nodejs';

const SOURCES = ['home', 'contact'] as const;
type Source = (typeof SOURCES)[number];

type Body = {
  source?: string;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  estimate?: string;
  website?: string; // ボット除け（人には見えない欄）。入っていたら保存しない
};

const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[0-9０-９\-－ー()（）+＋\s]{8,20}$/;

function jstNow() {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());
}

async function notifyLine(text: string): Promise<boolean> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const to = process.env.LINE_NOTIFY_TO;
  if (!token || !to) return false;
  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ to, messages: [{ type: 'text', text: text.slice(0, 4900) }] }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error('LINE push failed', res.status, await res.text().catch(() => ''));
    return res.ok;
  } catch (e) {
    console.error('LINE push error', e);
    return false;
  }
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }

  // ボットが隠し欄を埋めてきたら、成功したふりをして何もしない
  if (clip(body.website, 200)) return NextResponse.json({ ok: true });

  const source: Source = SOURCES.includes(body.source as Source) ? (body.source as Source) : 'contact';
  const name = clip(body.name, 100);
  const email = clip(body.email, 254);
  const phone = clip(body.phone, 30);
  const message = clip(body.message, 2000);
  const estimate = clip(body.estimate, 200);

  if (!name) return NextResponse.json({ ok: false, error: 'name_required' }, { status: 400 });
  if (!email && !phone) return NextResponse.json({ ok: false, error: 'contact_required' }, { status: 400 });
  if (email && !EMAIL.test(email)) return NextResponse.json({ ok: false, error: 'email_invalid' }, { status: 400 });
  if (phone && !PHONE.test(phone)) return NextResponse.json({ ok: false, error: 'phone_invalid' }, { status: 400 });

  const { error: insertError } = await supabase.from('contact_submissions').insert({
    source,
    name,
    email: email || null,
    message: message || null,
    payload: { phone, estimate },
  });
  if (insertError) console.error('contact insert failed', insertError);

  const lines = [
    '【ホームページからお問い合わせ】',
    `お名前：${name}`,
    phone && `電話：${phone}`,
    email && `メール：${email}`,
    estimate && `概算：${estimate}`,
    message && `\n${message}`,
    `\n受付：${jstNow()}（${source === 'home' ? 'トップページ' : 'お問い合わせページ'}）`,
  ].filter(Boolean);
  const notified = await notifyLine(lines.join('\n'));

  // 保存か通知のどちらかができていれば、お客様には「送信できた」と返す
  if (insertError && !notified) {
    return NextResponse.json({ ok: false, error: 'save_failed' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
