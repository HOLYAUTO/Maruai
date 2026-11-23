// フォームの項目名につける札（必須・どちらか必須・任意）
export function FormBadge({ kind = 'optional' }: { kind?: 'required' | 'either' | 'optional' }) {
  if (kind === 'required')
    return <span className="ml-2 rounded-[4px] bg-accent px-1.5 py-0.5 text-[0.6875rem] font-bold text-accent-ink align-middle">必須</span>;
  if (kind === 'either')
    return <span className="ml-2 rounded-[4px] border border-accent px-1.5 py-0.5 text-[0.6875rem] font-bold text-accent align-middle">どちらか必須</span>;
  return <span className="ml-2 rounded-[4px] bg-paper-2 border border-paper-3 px-1.5 py-0.5 text-[0.6875rem] font-bold text-muted align-middle">任意</span>;
}
