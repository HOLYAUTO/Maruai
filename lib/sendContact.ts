// フォームからお問い合わせを送る（保存と LINE 通知は /api/contact が行う）
export type ContactInput = {
  source: 'home' | 'contact';
  name: string;
  email?: string;
  phone?: string;
  message?: string;
  estimate?: string;
  website?: string; // ボット除けの隠し欄
};

/** 送る前の確認。問題があれば、お客様に見せる文を返す */
export function checkContact(v: ContactInput): string | null {
  if (!v.name.trim()) return 'お名前をご記入ください。';
  if (!v.email?.trim() && !v.phone?.trim()) return 'メールアドレスか電話番号の、どちらかをご記入ください。';
  if (v.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) return 'メールアドレスの形をご確認ください。';
  return null;
}

export async function sendContact(v: ContactInput): Promise<boolean> {
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(v),
    });
    return res.ok;
  } catch {
    return false;
  }
}
