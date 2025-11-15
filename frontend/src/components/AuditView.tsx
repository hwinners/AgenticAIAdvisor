// import React from'react';type Props={audit:any[]|null};export default function AuditView({audit}:Props){if(!audit)return null;return(<div className='card'><h3>2) Degree Audit</h3>{audit.map((r,i)=>(<div key={i}><strong>{r.id}</strong> — {r.met?'✅ Met':'❌ Missing'}<pre>{JSON.stringify(r.details,null,2)}</pre></div>))}</div>);}
import React, { useState } from "react";

type Props = {
  audit: any[] | null;
};

export default function AuditView({ audit }: Props) {
  if (!audit) return null;

  return (
    <div className="card bg-gray-900 text-white p-6 rounded-lg shadow-lg mt-6">
      <h3 className="text-2xl font-bold mb-4">2) Degree Audit</h3>

      <div className="space-y-6">
        {audit.map((req, i) => (
          <AuditRequirement key={i} req={req} />
        ))}
      </div>
    </div>
  );
}

function AuditRequirement({ req }: any) {
  const [showCourses, setShowCourses] = useState(false);

  const missing = req.details?.missing || [];
  const taken = req.details?.courses || [];

  const statusColor = req.met ? "text-green-400" : "text-red-400";

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xl font-semibold capitalize">{req.id}</h4>
        <span className={`text-lg font-bold ${statusColor}`}>
          {req.met ? "✅ Met" : "❌ Missing"}
        </span>
      </div>

      {/* Missing Courses */}
      {!req.met && (
        <div className="mb-3">
          <p className="text-red-300 font-semibold">Missing Courses:</p>
          <ul className="list-disc ml-6 text-red-400">
            {missing.map((c: string) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Toggle Completed Courses */}
      <button
        onClick={() => setShowCourses(!showCourses)}
        className="text-blue-400 hover:underline text-sm mt-2"
      >
        {showCourses ? "Hide completed courses ▲" : "Show completed courses ▼"}
      </button>

      {showCourses && (
        <ul className="list-disc ml-6 mt-2 text-green-300">
          {taken.map((c: string) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
