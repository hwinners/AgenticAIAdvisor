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
          req.details.courses.forEach((c: string) => taken.add(c.trim()));
        }
      });
      setTakenSet(taken);
    }

    fetchCatalog();
  }, [audit, selectedMajor]);

  if (!audit || !Array.isArray(audit)) return null;

  // --- UPDATED PARSING LOGIC FOR CLEAN JSON ---
  // 1. Removed .slice(1) because the new file has no header row.
  // 2. Used clean keys (code, name, credits, category).
  const allCourses = catalogCourses
    .map((course) => ({
      code: course.code || "",
      name: course.name || "", 
      credits: course.credits || "",
      category: course.category || "Other",
    }))
    .filter((c) => c.code);

  // Group courses by category
  const coursesByCategory = allCourses.reduce((acc, course) => {
    const cat = course.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(course);
    return acc;
  }, {} as Record<string, typeof allCourses>);

  // --- UPDATED CATEGORY NAMES ---
  // These must match the "category" values in your new catalog.json
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

  // --- SPLIT COLUMNS LOGIC ---
  // Column 1: Math and Core
  const firstColumnCategoriesList = ["Mathematics", "Computer Science Core"];
  
  const column1Categories = sortedCategories.filter(cat => firstColumnCategoriesList.includes(cat));
  const column2Categories = sortedCategories.filter(cat => !firstColumnCategoriesList.includes(cat));

  return (
    <div className="card bg-gray-900 text-white p-6 rounded-lg shadow-lg mt-6">
      <h3 className="text-2xl font-bold mb-4">Degree Audit - {selectedMajor}</h3>

      <div className="space-y-6">
        {audit.map((req, i) => 
          <AuditRequirementView key={i} req={req} />
        )}
      </div>

      {/* All Courses Section */}
      <div className="mt-8 bg-gray-800 p-4 rounded-lg shadow border border-gray-700">
        <h4 className="text-lg font-semibold mb-4">All Courses in {selectedMajor} Catalog</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Column 1 */}
          <div>
            {column1Categories.map((category) => (
              <CategoryBlock 
                key={category} 
                category={category} 
                courses={coursesByCategory[category]} 
                takenSet={takenSet} 
              />
            ))}
          </div>

          {/* Column 2 */}
          <div>
            {column2Categories.map((category) => (
              <CategoryBlock 
                key={category} 
                category={category} 
                courses={coursesByCategory[category]} 
                takenSet={takenSet} 
              />
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

// --- HELPER COMPONENT ---
function CategoryBlock({ category, courses, takenSet }: { category: string, courses: any[], takenSet: Set<string> }) {
  return (
    <div key={category} className="mb-6">
      <h5 className="text-sm font-bold text-blue-300 mb-2 border-b border-blue-500 pb-1">
        {category}
      </h5>
      
      <ul style={{display:'grid',gridTemplateColumns:'repeat(2, minmax(0,1fr))',gap:8,listStyle:'none',padding:0,margin:0, fontSize: '0.75rem'}}> 
        {courses.map((course) => {
          const isTaken = takenSet.has(course.code);
          
          const itemStyle = {
              background: isTaken ? '#064e3b' : '#374151', // Green for taken
              border: `1px solid ${isTaken ? '#047857' : '#4b5563'}`,
              color: isTaken ? '#d1fae5' : '#e5e7eb', 
              padding: '8px',
              borderRadius: '6px',
              minHeight: '40px' 
          };
          
          return (
            <li key={course.code} style={itemStyle}>
              <div style={{fontWeight: 600, display: 'inline'}}>{course.code}</div>
              {course.credits && <div style={{color: '#9ca3af', display: 'inline', marginLeft: '5px'}}> ({course.credits}cr)</div>}
              <div style={{color: '#d1d5db'}}>{course.name}</div>
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
        {req.id} {/* Assuming ID is the readable label like 'Mathematics' */}
      </span>
      {/* Optional: Show missing courses if not met */}
      {!req.met && req.details?.missing && req.details.missing.length > 0 && (
         <div className="mt-2 text-sm text-gray-400">
           Missing: {req.details.missing.join(", ")}
         </div>
      )}
    </div>
  );
}