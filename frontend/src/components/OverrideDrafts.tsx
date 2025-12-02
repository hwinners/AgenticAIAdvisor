import React, { useState } from 'react';
import { explain } from '../api';

type Props = {
  planned_terms: any[] | null;
  requirements: any[] | null;
  selectedCourses: string[];
  onToggleCourse: (course: string) => void;
  onApply: () => void;
};

export default function OverrideDrafts({
  planned_terms,
  requirements,
  selectedCourses,
  onToggleCourse,
  onApply,
}: Props) {

  const next = planned_terms?.[0];
  const [explanation, setExplanation] = useState<string>('');

  if (!next || !requirements) return null;

  async function why(course: string) {
    const res = await explain({
      planned_terms,
      requirements,
      course,
      term: next.term,
    });
    setExplanation(res.explanation);
  }

  return (
    <div className="card">
      <h3>Policy Automation & Explainability</h3>
      <p>
        Next term: <strong>{next.term}</strong>
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 8, alignItems: 'stretch' }}>
        {next.courses.map((c: string) => {
          const isConfirmed = selectedCourses.includes(c);
          return (
            <div key={c} style={{ height: '100%', boxSizing: 'border-box', display: 'flex' }}>
              <div className="card" style={{
                minWidth: 220,
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxSizing: 'border-box',
                background: isConfirmed ? '#1e293b' : undefined,
                border: isConfirmed ? '2px solid #22d3ee' : undefined,
                opacity: isConfirmed ? 1 : 0.85,
              }}>
                <strong>{c}</strong>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn" onClick={() => why(c)}>
                    Why this course?
                  </button>
                  <button
                    className="btn"
                    style={{ background: isConfirmed ? '#f87171' : '#22d3ee', color: '#0f172a' }}
                    onClick={() => onToggleCourse(c)}
                  >
                    {isConfirmed ? 'Unconfirm' : 'Confirm'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <button
          className="btn"
          style={{ background: '#22d3ee', color: '#0f172a', fontWeight: 600 }}
          onClick={onApply}
          disabled={selectedCourses.length === 0}
        >
          Apply Confirmed Courses
        </button>
      </div>
      {explanation && (
        <>
          <h4>Explanation</h4>
          <pre>{explanation}</pre>
        </>
      )}
    </div>
  );
}