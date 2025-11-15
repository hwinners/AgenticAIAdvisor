// import React from'react';type Props={planned_terms:any[]|null};export default function PlanView({planned_terms}:Props){if(!planned_terms)return null;return(<div className='card'><h3>3) Planned Pathway</h3>{planned_terms.map((t,i)=>(<div key={i}><strong>{t.term}</strong> — {t.credits} credits<pre>{JSON.stringify(t.courses,null,2)}</pre></div>))}</div>);}


import React from "react";

type Props = {
  planned_terms: any[] | null;
};

export default function PlanView({ planned_terms }: Props) {
  if (!planned_terms) return null;

  return (
    <div className="card bg-gray-900 text-white p-6 rounded-lg shadow-lg mt-6">
      <h3 className="text-2xl font-bold mb-4">3) Planned Pathway</h3>

      <div className="space-y-6">
        {planned_terms.map((term, i) => (
          <PlannedTerm key={i} term={term} />
        ))}
      </div>
    </div>
  );
}

function PlannedTerm({ term }: any) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xl font-semibold">{term.term}</h4>

        <span className="text-blue-300 font-semibold">
          {term.credits} credits
        </span>
      </div>

      {/* Course list */}
      <ul className="list-disc ml-6 text-blue-200">
        {term.courses?.map((course: any, idx: number) => (
          <li key={idx} className="mb-1">
            <span className="font-semibold text-blue-300">
              {course.code}
            </span>
            {course.name ? ` — ${course.name}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
