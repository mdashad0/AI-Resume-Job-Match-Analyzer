import React from 'react';
import { X, Clock, Trash2, ArrowUpRight, Award, Briefcase } from 'lucide-react';

export default function HistoryModal({ isOpen, onClose, history = [], onSelectRecord, onClearHistory }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(3, 7, 18, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '14px',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={20} color="#38bdf8" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#f8fafc' }}>
              Past Analysis History
            </h3>
            <span style={{
              fontSize: '0.75rem',
              backgroundColor: '#334155',
              padding: '2px 8px',
              borderRadius: '9999px',
              color: '#94a3b8'
            }}>
              {history.length} records
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ color: '#94a3b8', padding: '4px', borderRadius: '6px', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              <Clock size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p>No analysis history saved yet.</p>
              <p style={{ fontSize: '0.8125rem', marginTop: '4px' }}>
                Run an analysis to save your match scores to MongoDB / persistent storage.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {history.map((item, idx) => {
                const score = item.overall_score || 0;
                let badgeColor = '#10b981';
                if (score < 50) badgeColor = '#f43f5e';
                else if (score < 70) badgeColor = '#f59e0b';

                const dateStr = item.created_at ? new Date(item.created_at).toLocaleString() : 'Just now';

                return (
                  <div
                    key={item.id || idx}
                    onClick={() => {
                      onSelectRecord(item);
                      onClose();
                    }}
                    style={{
                      padding: '14px 18px',
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid #334155',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s, background 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.9)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#334155';
                      e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.6)';
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.95rem' }}>
                          {item.candidate_name || 'Candidate'}
                        </span>
                        <span style={{ color: '#64748b', fontSize: '0.8125rem' }}>•</span>
                        <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                          {item.job_title || 'Target Role'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                        {dateStr} • {item.matched_skills?.length || 0} skills matched
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        padding: '4px 12px',
                        borderRadius: '6px',
                        backgroundColor: `${badgeColor}18`,
                        border: `1px solid ${badgeColor}40`,
                        color: badgeColor,
                        fontWeight: 700,
                        fontSize: '1rem'
                      }}>
                        {Math.round(score)}%
                      </div>
                      <ArrowUpRight size={18} color="#64748b" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {history.length > 0 && (
          <div style={{
            padding: '14px 24px',
            borderTop: '1px solid #334155',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <button
              onClick={onClearHistory}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#f43f5e',
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
            >
              <Trash2 size={14} /> Clear History
            </button>
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#334155',
                color: '#f8fafc',
                padding: '6px 16px',
                borderRadius: '6px',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
