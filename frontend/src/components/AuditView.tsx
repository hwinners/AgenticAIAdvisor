// import React from'react';type Props={audit:any[]|null};export default function AuditView({audit}:Props){if(!audit)return null;return(<div className='card'><h3>2) Degree Audit</h3>{audit.map((r,i)=>(<div key={i}><strong>{r.id}</strong> — {r.met?'✅ Met':'❌ Missing'}<pre>{JSON.stringify(r.details,null,2)}</pre></div>))}</div>);}

import React, { useEffect, useState } from "react";
import { loadCatalog } from "../data/catalogLoader";

type AuditRequirement = {
  id: string;
  met: boolean;
  details?: {
    missing?: string[];
    courses?: string[];
  };
};

type Props = {
  audit: AuditRequirement[] | null;
  selectedMajor?: string;
};

export default function AuditView({ audit, selectedMajor = "BSComputerScience" }: Props) {
  const [catalogCourses, setCatalogCourses] = useState<any[]>([]);
  const [takenSet, setTakenSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const catalog = await loadCatalog(selectedMajor);
        const courses = catalog.default || catalog;
        setCatalogCourses(Array.isArray(courses) ? courses : []);
      } catch (err) {
        console.error("Failed to load catalog:", err);
        setCatalogCourses([]);
      }
    };

    if (audit) {
      // Build set of taken courses from audit
      const taken = new Set<string>();
      audit.forEach((req) => {
        if (Array.isArray(req.details?.courses)) {
          req.details.courses.forEach((c) => taken.add(c.trim()));
        }
      });
      setTakenSet(taken);
    }

    fetchCatalog();
  }, [audit, selectedMajor]);

  if (!audit || !Array.isArray(audit)) return null;

  // Get all course codes from catalog (skip header row)
  const allCourses = catalogCourses
    .slice(1)
    .map((course) => ({
      code: course.Key || "",
      name: course["Don't know what to put/ not explicit in flowchart"] || "",
      credits: course["Unnamed: 2"] || "",
      category: course["Unnamed: 8"] || "Other", // Category from column "Unnamed: 8"
    }))
    .filter((c) => c.code);

  // Group courses by category
  const coursesByCategory = allCourses.reduce((acc, course) => {
    const cat = course.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(course);
    return acc;
  }, {} as Record<string, typeof allCourses>);

  // Sort categories with common ones first
  const categoryOrder = ["Math", "CS Core", "Theory/Algorithms", "Tech Electives", "Science", "General Education", "Other"];
  const sortedCategories = Object.keys(coursesByCategory).sort((a, b) => {
    const aIdx = categoryOrder.indexOf(a);
    const bIdx = categoryOrder.indexOf(b);
    return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
  });

  return (
    <div className="card bg-gray-900 text-white p-6 rounded-lg shadow-lg mt-6">
      <h3 className="text-2xl font-bold mb-4">Degree Audit - {selectedMajor}</h3>

      <div className="space-y-6">
        {audit.map((req, i) => 
          req.met ? <AuditRequirementView key={i} req={req} /> : null
        )}
      </div>

      {/* All Courses Section */}
      <div className="mt-8 bg-gray-800 p-4 rounded-lg shadow border border-gray-700">
        <h4 className="text-lg font-semibold mb-4">All Courses in {selectedMajor} Catalog</h4>
        
        {sortedCategories.map((category) => (
          <div key={category} className="mb-6">
            <h5 className="text-sm font-bold text-blue-300 mb-2 border-b border-blue-500 pb-1">
              {category}
            </h5>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {coursesByCategory[category].map((course) => {
                const isTaken = takenSet.has(course.code);
                return (
                  <div
                    key={course.code}
                    className={`p-2 rounded border ${
                      isTaken
                        ? "bg-green-900 border-green-700 text-green-100"
                        : "bg-gray-700 border-gray-600 text-gray-200"
                    }`}
                  >
                    <span className="font-semibold">{course.code}</span>
                    {course.credits && <span className="text-gray-400"> ({course.credits}cr)</span>}
                    <div className="text-gray-300">{course.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditRequirementView({ req }: { req: AuditRequirement }) {
  const statusColor = req.met ? "text-green-400" : "text-red-400";

  return (
    <div className={`bg-gray-800 p-4 rounded-lg shadow border ${req.met ? "border-green-700" : "border-red-700"}`}>
      <span className={`text-lg font-bold ${statusColor}`}>
        {req.met ? "✅ Requirement Met" : "❌ Requirement Not Met"}
      </span>
    </div>
  );
}


// import React, { useState } from "react";

// type Props = {
//   audit: any[] | null;
// };

// export default function AuditView({ audit }: Props) {
//   if (!audit) return null;

//   return (
//     <div className="card bg-gray-900 text-white p-6 rounded-lg shadow-lg mt-6">
//       <h3 className="text-2xl font-bold mb-4">2) Degree Audit</h3>

//       <div className="space-y-6">
//         {audit.map((req, i) => (
//           <AuditRequirement key={i} req={req} />
//         ))}
//       </div>
//     </div>
//   );
// }

// function AuditRequirement({ req }: any) {
//   const [showCourses, setShowCourses] = useState(false);

//   const missing = req.details?.missing || [];
//   const taken = req.details?.courses || [];

//   const statusColor = req.met ? "text-green-400" : "text-red-400";

//   return (
//     <div className="bg-gray-800 p-4 rounded-lg shadow border border-gray-700">
//       <div className="flex items-center justify-between mb-2">
//         <h4 className="text-xl font-semibold capitalize">{req.id}</h4>
//         <span className={`text-lg font-bold ${statusColor}`}>
//           {req.met ? "✅ Met" : "❌ Missing"}
//         </span>
//       </div>

//       {/* Missing Courses */}
//       {!req.met && (
//         <div className="mb-3">
//           <p className="text-red-300 font-semibold">Missing Courses:</p>
//           <ul className="list-disc ml-6 text-red-400">
//             {missing.map((c: string) => (
//               <li key={c}>{c}</li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {/* Toggle Completed Courses */}
//       <button
//         onClick={() => setShowCourses(!showCourses)}
//         className="text-blue-400 hover:underline text-sm mt-2"
//       >
//         {showCourses ? "Hide completed courses ▲" : "Show completed courses ▼"}
//       </button>

//       {showCourses && (
//         <ul className="list-disc ml-6 mt-2 text-green-300">
//           {taken.map((c: string) => (
//             <li key={c}>{c}</li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// }
