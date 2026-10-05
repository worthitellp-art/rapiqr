import React from 'react';
import { ArrowLeft } from 'lucide-react';
import AppLogo from '../common/AppLogo';
import { useLanguage } from '../../context/LanguageContext';
import { legalTranslations } from '../../i18n/legalTranslations';

/**
 * Minimal markdown renderer for this page's own content only â€” handles
 * exactly the subset the policy text below uses (#/##, **bold**, * bullets,
 * [text](url) links, --- rules, blank-line paragraph breaks). Not a general
 * markdown engine; adding a real one for one static page would be a much
 * heavier dependency than this page needs.
 */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    if (match[1] !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-b${i++}`} className="font-semibold text-gray-900">{match[1]}</strong>);
    } else {
      const isMail = match[3].startsWith('mailto:');
      nodes.push(
        <a
          key={`${keyPrefix}-a${i++}`}
          href={match[3]}
          target={isMail ? undefined : '_blank'}
          rel={isMail ? undefined : 'noopener noreferrer'}
          className="text-[#111111] underline hover:text-black"
        >
          {match[2]}
        </a>
      );
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

function renderMarkdown(source: string): React.ReactNode {
  const lines = source.split('\n');
  const blocks: React.ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push(
      <ul key={`ul-${key++}`} className="list-disc pl-5 space-y-1.5 text-[15px] text-gray-700 leading-relaxed">
        {listItems.map((item, i) => (
          <li key={i}>{renderInline(item, `li-${key}-${i}`)}</li>
        ))}
      </ul>
    );
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith('* ')) {
      listItems.push(line.slice(2));
      continue;
    }
    flushList();

    if (!line) continue;
    if (line === '---') {
      blocks.push(<hr key={`hr-${key++}`} className="border-gray-200 my-2" />);
      continue;
    }
    if (line.startsWith('### ')) {
      blocks.push(<h3 key={`h3-${key++}`} className="text-base font-bold text-gray-900 mt-2">{renderInline(line.slice(4), `h3-${key}`)}</h3>);
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push(<h2 key={`h2-${key++}`} className="text-xl font-bold text-gray-950 mt-2">{renderInline(line.slice(3), `h2-${key}`)}</h2>);
      continue;
    }
    if (line.startsWith('# ')) {
      blocks.push(<h1 key={`h1-${key++}`} className="text-2xl sm:text-3xl font-black text-gray-950">{renderInline(line.slice(2), `h1-${key}`)}</h1>);
      continue;
    }
    blocks.push(<p key={`p-${key++}`} className="text-[15px] text-gray-700 leading-relaxed">{renderInline(line, `p-${key}`)}</p>);
  }
  flushList();
  return blocks;
}

export default function PrivacyPolicyPage({ onBack }: { onBack: () => void }) {
  const { language } = useLanguage();
  const t = legalTranslations[language];

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <button
            onClick={onBack}
            className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-900"
            aria-label={t.back}
          >
            <ArrowLeft size={16} />
            <span>{t.back}</span>
          </button>
          <AppLogo variant="light" className="h-6 w-auto object-contain sm:h-7" />
          <span className="w-12" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 space-y-4">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-950">{t.title}</h1>
        <div className="space-y-4">{renderMarkdown(t.markdown)}</div>
      </main>
    </div>
  );
}
