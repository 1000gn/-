import React from 'react';

interface EvidenceBadgeProps {
  label: string;
  className?: string;
}

export const EvidenceBadge: React.FC<EvidenceBadgeProps> = ({ label, className = '' }) => {
  let badgeStyle = 'bg-slate-100 text-black border-slate-400 font-black';

  if (label.includes('확인된 사실')) {
    badgeStyle = 'bg-emerald-100 text-emerald-950 border-emerald-400 shadow-xs font-black';
  } else if (label.includes('자료 근거')) {
    badgeStyle = 'bg-blue-100 text-blue-950 border-blue-400 shadow-xs font-black';
  } else if (label.includes('외부자료 근거')) {
    badgeStyle = 'bg-cyan-100 text-cyan-950 border-cyan-400 shadow-xs font-black';
  } else if (label.includes('AI 분석')) {
    badgeStyle = 'bg-purple-100 text-purple-950 border-purple-400 shadow-xs font-black';
  } else if (label.includes('추정/가정')) {
    badgeStyle = 'bg-amber-100 text-amber-950 border-amber-400 shadow-xs font-black';
  } else if (label.includes('추가 확인 필요')) {
    badgeStyle = 'bg-rose-100 text-rose-950 border-rose-400 shadow-xs font-black';
  } else if (label.includes('권고안')) {
    badgeStyle = 'bg-amber-200 text-amber-950 border-amber-500 shadow-xs font-black';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono tracking-wide border whitespace-nowrap ${badgeStyle} ${className}`}
    >
      {label}
    </span>
  );
};

export const parseWithEvidenceBadges = (text: string): React.ReactNode => {
  const badgeRegex = /(\[(?:확인된 사실|자료 근거|외부자료 근거|AI 분석|추정\/가정|추가 확인 필요|권고안)\])/g;
  const parts = text.split(badgeRegex);

  return parts.map((part, i) => {
    if (badgeRegex.test(part)) {
      return <EvidenceBadge key={i} label={part} className="mr-1.5 align-middle" />;
    }
    return <span key={i}>{part}</span>;
  });
};
