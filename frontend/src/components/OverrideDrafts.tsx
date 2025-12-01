import React, { useState } from 'react';
import { explain } from '../api';

type Props = {
  planned_terms: any[] | null;
  requirements: any[] | null;
};

export default function OverrideDrafts({
  planned_terms,
  requirements,
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
        {next.courses.map((c: string) => (
          <div key={c} style={{ height: '100%', boxSizing: 'border-box', display: 'flex' }}>
            <div className="card" style={{ minWidth: 220, height: '100%', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
              <strong>{c}</strong>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn" onClick={() => why(c)}>
                  Why this course?
                </button>
              </div>
            </div>
          </div>
        ))}
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
