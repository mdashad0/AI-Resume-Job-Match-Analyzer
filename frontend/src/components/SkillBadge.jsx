import React from 'react';
import { Check, X, Plus, Sparkles } from 'lucide-react';

export default function SkillBadge({ skill, type = 'matched' }) {
  // Types: 'matched' (green/emerald), 'missing' (red/rose), 'bonus' (blue/cyan)
  const isMatched = type === 'matched';
  const isMissing = type === 'missing';
  const isBonus = type === 'bonus';

  let bg = 'rgba(16, 185, 129, 0.12)';
  let border = 'rgba(16, 185, 129, 0.35)';
  let textColor = '#34d399';
  let Icon = Check;

  if (isMissing) {
    bg = 'rgba(244, 63, 94, 0.12)';
    border = 'rgba(244, 63, 94, 0.35)';
    textColor = '#fb7185';
    Icon = X;
  } else if (isBonus) {
    bg = 'rgba(59, 130, 246, 0.12)';
    border = 'rgba(59, 130, 246, 0.35)';
    textColor = '#60a5fa';
    Icon = Plus;
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      borderRadius: '8px',
      backgroundColor: bg,
      border: `1px solid ${border}`,
      color: textColor,
      fontSize: '0.8125rem',
      fontWeight: 500,
      margin: '3px',
      transition: 'transform 0.15s ease, background 0.15s ease'
    }}>
      <Icon size={13} strokeWidth={2.5} />
      <span>{skill.name}</span>
      {skill.category && (
        <span style={{
          fontSize: '0.6875rem',
          opacity: 0.75,
          paddingLeft: '4px',
          borderLeft: `1px solid ${border}`
        }}>
          {skill.category}
        </span>
      )}
    </span>
  );
}
