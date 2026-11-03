import React from 'react';

export default function ScoreGauge({ score, size = 160, strokeWidth = 14, label = "Match Score" }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  let color = "#10b981"; // Emerald (>70%)
  let statusText = "Strong Match";
  if (score < 50) {
    color = "#f43f5e"; // Rose (<50%)
    statusText = "Low Fit";
  } else if (score < 70) {
    color = "#f59e0b"; // Amber (50-69%)
    statusText = "Moderate Match";
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.4s ease'
            }}
          />
        </svg>

        {/* Center Text */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <span style={{ fontSize: '2.25rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1 }}>
            {Math.round(score)}%
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: color, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {statusText}
          </span>
        </div>
      </div>
      <span style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '8px', fontWeight: 500 }}>
        {label}
      </span>
    </div>
  );
}
