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
type NewProps = Props & { transcript?: any | null };

// --- HELPER: Normalize codes to fix matches ---
const normalizeCode = (code: string) => code.replace(/\s+/g, "").toUpperCase();

export default function AuditView({ audit, selectedMajor = "BSComputerScience", transcript = null }: NewProps) {
  const [catalogCourses, setCatalogCourses] = useState<any[]>([]);
  const [takenSet, setTakenSet] = useState<Set<string>>(new Set());
  const [inProgressSet, setInProgressSet] = useState<Set<string>>(new Set());
  const [completedSet, setCompletedSet] = useState<Set<string>>(new Set());
  const [missingSet, setMissingSet] = useState<Set<string>>(new Set());

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

    // Build sets from transcript (completed vs in-progress) when available
    if (transcript && Array.isArray(transcript.taken)) {
      const inProg = new Set<string>();
      const comp = new Set<string>();
      transcript.taken.forEach((t: any) => {
        const code = normalizeCode(t.code || "");
        const grade = (t.grade || "").toString().toUpperCase();
        if (!code) return;
        if (grade === "IP" || grade === "I" || grade.startsWith("IP")) {
          inProg.add(code);
        } else {
          comp.add(code);
        }
      });
      setInProgressSet(inProg);
      setCompletedSet(comp);
      // unify takenSet for compatibility
      setTakenSet(new Set([...inProg, ...comp]));
    } else if (audit) {
      // fallback: mark any course appearing in requirement lists as taken (best-effort)
      const taken = new Set<string>();
      audit.forEach((req) => {
        if (Array.isArray(req.details?.courses)) {
          req.details.courses.forEach((c: string) => taken.add(normalizeCode(c)));
        }
      });
      setTakenSet(taken);
    }

    // build missing set from audit
    if (audit) {
      const missing = new Set<string>();
      audit.forEach((r) => {
        if (Array.isArray(r.details?.missing)) {
          r.details.missing.forEach((m: string) => missing.add(normalizeCode(m)));
        }
      });
      setMissingSet(missing);
    }

    fetchCatalog();
  }, [audit, selectedMajor]);

  if (!audit || !Array.isArray(audit)) return null;

  const allCourses = catalogCourses
    .map((course) => ({
      code: normalizeCode(course.code || ""),
      name: course.name || "", 
      credits: course.credits || "",
      category: course.category || "Other",
    }))
    .filter((c) => c.code);

  const coursesByCategory = allCourses.reduce((acc, course) => {
    const cat = course.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(course);
    return acc;
  }, {} as Record<string, typeof allCourses>);

  const categoryOrder = [
    "Mathematics", 
    "Computer Science Core", 
    "Semi-Core Group 1 (Data Science/AI)", 
    "Semi-Core Group 2 (Security)", 
    "CS Electives"
  ];

  const sortedCategories = Object.keys(coursesByCategory).sort((a, b) => {
    const aIdx = categoryOrder.indexOf(a);
    const bIdx = categoryOrder.indexOf(b);
    return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
  });

  const firstColumnCategoriesList = ["Mathematics", "Computer Science Core"];
  
  const column1Categories = sortedCategories.filter(cat => firstColumnCategoriesList.includes(cat));
  const column2Categories = sortedCategories.filter(cat => !firstColumnCategoriesList.includes(cat));

  return (
    <div className="card bg-gray-900 text-white p-6 rounded-lg shadow-lg mt-6">
      {/* Debug Panel for Set Contents */}
      <div className="mb-6 p-4 rounded bg-gray-800 border border-gray-700">
        <h4 className="text-yellow-300 font-bold mb-2">Course Status Sets</h4>
        <div style={{fontSize: '0.85em'}}>
          <div><span style={{color:'#22c55e',fontWeight:600}}>CompletedSet</span>: {Array.from(completedSet).join(", ") || <span style={{color:'#888'}}>empty</span>}</div>
          <div><span style={{color:'#eab308',fontWeight:600}}>InProgressSet</span>: {Array.from(inProgressSet).join(", ") || <span style={{color:'#888'}}>empty</span>}</div>
          <div><span style={{color:'#ef4444',fontWeight:600}}>MissingSet</span>: {Array.from(missingSet).join(", ") || <span style={{color:'#888'}}>empty</span>}</div>
        </div>
      </div>
      <h3 className="text-2xl font-bold mb-4">Degree Audit - {selectedMajor}</h3>

      <div className="space-y-6">
        {audit.map((req, i) => 
          <AuditRequirementView key={i} req={req} />
        )}
      </div>

      <div className="mt-8 bg-gray-800 p-4 rounded-lg shadow border border-gray-700">
        <h4 className="text-lg font-semibold mb-4">All Courses in {selectedMajor} Catalog</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div>
            {column1Categories.map((category) => (
              <CategoryBlock 
                  key={category} 
                  category={category} 
                  courses={coursesByCategory[category]} 
                  takenSet={takenSet}
                  inProgressSet={inProgressSet}
                  completedSet={completedSet}
                  missingSet={missingSet}
                />
            ))}
          </div>

          <div>
            {column2Categories.map((category) => (
              <CategoryBlock 
                  key={category} 
                  category={category} 
                  courses={coursesByCategory[category]} 
                  takenSet={takenSet}
                  inProgressSet={inProgressSet}
                  completedSet={completedSet}
                  missingSet={missingSet}
                />
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

function CategoryBlock({
  category,
  courses,
  takenSet,
  inProgressSet,
  completedSet,
  missingSet,
}: {
  category: string;
  courses: any[];
  takenSet: Set<string>;
  inProgressSet: Set<string>;
  completedSet: Set<string>;
  missingSet: Set<string>;
}) {
  // Use backend requirements mapping for correct description
  const reqMap: Record<string, string> = {
    Mathematics: "Take all classes",
    "Computer Science Core": "Take all classes",
    "Semi-Core Group 1 (Data Science/AI)": "Choose 1 class",
    "Semi-Core Group 2 (Security)": "Choose 1 class",
    "CS Electives": "Choose 5 classes",
  };
  const reqText = reqMap[category] || "";

  return (
    <div className="mb-6">
      <h5 className="text-sm font-bold text-blue-300 mb-2 border-b border-blue-500 pb-1">
        {category}
        {reqText && (
          <span className="text-sm font-bold text-blue-300 ml-2">
             {" ("}{reqText}{")"}
          </span>
        )}
      </h5>

      <ul
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0,1fr))",
          gap: 8,
          listStyle: "none",
          padding: 0,
          margin: 0,
          fontSize: "0.75rem",
        }}
      >
        {courses.map((course) => {
          // Normalize the catalog code before checking
          const code = normalizeCode(course.code);
          const isMissing = missingSet.has(code);
          const isInProgress = inProgressSet.has(code);
          const isCompleted = completedSet.has(code);

          // priority: missing (red) > in-progress (yellow) > completed (green) > default
          let bg = "#374151";
          let border = "#4b5563";
          let color = "#e5e7eb";

          if (isMissing) {
            bg = "#3f0f0f"; // dark red
            border = "#991b1b";
            color = "#fee2e2";
          } else if (isInProgress) {
            // in-progress should always be yellow, even if also completed
            bg = "#4d3b00"; // dark yellow
            border = "#b45309";
            color = "#fef3c7";
          } else if (isCompleted) {
            bg = "#064e3b";
            border = "#047857";
            color = "#d1fae5";
          }

          const itemStyle = {
            background: bg,
            border: `1px solid ${border}`,
            color: color,
            padding: "8px",
            borderRadius: "6px",
            minHeight: "40px",
          };

          return (
            <li key={course.code} style={itemStyle}>
              <div style={{ fontWeight: 600, display: "inline" }}>
                {course.code}
              </div>
              {course.credits && (
                <div
                  style={{
                    color: "#9ca3af",
                    display: "inline",
                    marginLeft: "5px",
                  }}
                >
                  {" "}
                  ({course.credits}cr)
                </div>
              )}
              <div style={{ color: "#d1d5db" }}>{course.name}</div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}


function AuditRequirementView({ req }: { req: AuditRequirement }) {
  const statusColor = req.met ? "text-green-400" : "text-red-400";

  return (
    <div className={`bg-gray-800 p-4 rounded-lg shadow border ${req.met ? "border-green-700" : "border-red-700"}`}>
      <span className={`text-lg font-bold ${statusColor}`}>
        {req.met ? "✅ " : "❌ "}
        {req.id}
      </span>
      {!req.met && req.details?.missing && req.details.missing.length > 0 && (
        <div className="mt-2 text-sm text-gray-400">
          Missing:{' '}
          {req.details?.missing?.map((m: string, idx: number) => (
            <span 
              key={m} 
              style={{ color: '#fecaca', fontWeight: 600, marginRight: 6 }}
            >
              {m}{idx < req.details!.missing!.length - 1 ? ',' : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}