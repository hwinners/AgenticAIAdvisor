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

  if (!audit || !ArrayOfAudit(audit)) return null;

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
  const categoryOrder = ["Math", "CS Core", "Theory/Algorithms", "Tech Electives", "Science", "General Education", "Other", "Statistics", "Electrical", "Data Science"];
  const sortedCategories = Object.keys(coursesByCategory).sort((a, b) => {
    const aIdx = categoryOrder.indexOf(a);
    const bIdx = categoryOrder.indexOf(b);
    return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
  });

  // 🛑 LOGIC TO MANUALLY SPLIT CATEGORIES INTO TWO COLUMNS 🛑
  
  // Categories for the FIRST column based on your request.
  const firstColumnCategoriesList = ["Math", "Theory/Algorithms", "Statistics", "Electrical", "Data Science"];
  
  // Filter categories into the two required groups, maintaining the sorted order.
  const column1Categories = sortedCategories.filter(cat => firstColumnCategoriesList.includes(cat));
  const column2Categories = sortedCategories.filter(cat => !firstColumnCategoriesList.includes(cat));

  // -----------------------------------------------------------

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
        
        {/* Grid container creates the two main columns for categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Column 1: Maps over the manually defined categories */}
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

          {/* Column 2: Maps over all other remaining categories */}
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

// --- HELPER COMPONENT: Renders a single category block ---
function CategoryBlock({ category, courses, takenSet }: { category: string, courses: any[], takenSet: Set<string> }) {
  return (
    <div key={category} className="mb-6">
      <h5 className="text-sm font-bold text-blue-300 mb-2 border-b border-blue-500 pb-1">
        {category}
      </h5>
      
      {/* 🛑 Inline styles used for 2 columns for the COURSES within this category 🛑 */}
      <ul style={{display:'grid',gridTemplateColumns:'repeat(2, minmax(0,1fr))',gap:8,listStyle:'none',padding:0,margin:0, fontSize: '0.75rem'}}> 
        {courses.map((course) => {
          const isTaken = takenSet.has(course.code);
          
          const itemStyle = {
              background: isTaken ? '#064e3b' : '#374151', // bg-green-900 or bg-gray-700
              border: `1px solid ${isTaken ? '#047857' : '#4b5563'}`, // border-green-700 or border-gray-600
              color: isTaken ? '#d1fae5' : '#e5e7eb', // text-green-100 or text-gray-200
              padding: '8px',
              borderRadius: '6px',
              minHeight: '40px' // Ensure some vertical space
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

// --- EXISTING COMPONENTS ---
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

function ArrayOfAudit(audit: AuditRequirement[] | null): audit is AuditRequirement[] {
  return Array.isArray(audit);
}