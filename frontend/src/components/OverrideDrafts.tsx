import React, { useState, useEffect } from 'react';
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
  
  // Track if the user has applied the current selection
  const [hasApplied, setHasApplied] = useState(false);

  // Reset the "Applied" state if the term changes
  useEffect(() => {
    setHasApplied(false);
  }, [next?.term]);

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

  const handleApplyClick = () => {
    if (hasApplied) {
      // If already applied, clicking "Change" resets the button state 
      // so the user can edit and click "Apply" again.
      setHasApplied(false);
    } else {
      // If not applied, clicking "Apply" triggers the update and locks the state.
      onApply();
      setHasApplied(true);
    }
  };

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
          onClick={handleApplyClick}
          // Button is disabled only if no courses are selected AND we haven't applied yet.
          // If we HAVE applied, we want the button enabled so we can click "Change".
          disabled={!hasApplied && selectedCourses.length === 0}
        >
          {hasApplied ? 'Change Confirmed Courses' : 'Apply Confirmed Courses'}
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