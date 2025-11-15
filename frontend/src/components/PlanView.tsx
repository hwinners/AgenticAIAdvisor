// import React from'react';type Props={planned_terms:any[]|null};export default function PlanView({planned_terms}:Props){if(!planned_terms)return null;return(<div className='card'><h3>3) Planned Pathway</h3>{planned_terms.map((t,i)=>(<div key={i}><strong>{t.term}</strong> — {t.credits} credits<pre>{JSON.stringify(t.courses,null,2)}</pre></div>))}</div>);}


import React, { useEffect, useState } from "react";
import { loadCatalog } from "../data/catalogLoader";

type Props = {
  planned_terms: any[] | null;
  transcript?: any | null;
  selectedMajor?: string;
};

export default function PlanView({ planned_terms, transcript, selectedMajor }: Props) {
  const [catalogCourses, setCatalogCourses] = useState<string[]>([]);
  const [catalogMap, setCatalogMap] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!selectedMajor) return;
    let mounted = true;
    (async () => {
      try {
        const c: any = await loadCatalog(selectedMajor);
        // some catalog imports return a module object with default
        const catalog = c.default || c;
        // catalog is an array where first row is header; course rows have `Key` and name
        const rows = (catalog || []).slice(1);
        const map: Record<string, any> = {};
        const codes = rows
          .map((r: any) => ({ code: r && r.Key ? String(r.Key) : "", name: r && r["Don't know what to put\/ not explicit in flowchart"] ? String(r["Don't know what to put\/ not explicit in flowchart"]) : '' }))
          .filter((r: any) => r.code && r.code.trim().length > 0)
          .map((r: any) => {
            const n = normalizeCode(r.code);
            map[n] = { code: r.code, name: r.name };
            return n;
          });
        if (mounted) {
          setCatalogCourses(codes);
          setCatalogMap(map);
        }
      } catch (err) {
        console.warn("Failed to load catalog", err);
        if (mounted) setCatalogCourses([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedMajor]);

  if (!planned_terms) return null;

  // normalize taken course codes from transcript
  const takenCodes = new Set<string>();
  if (transcript?.taken && Array.isArray(transcript.taken)) {
    transcript.taken.forEach((t: any) => {
      if (t.code) takenCodes.add(normalizeCode(String(t.code)));
    });
  }

  // required courses from catalog
  const required = new Set(catalogCourses);
  // missing required = required - taken
  const missingRequired = new Set<string>([...required].filter((c) => !takenCodes.has(c)));

  // planned courses codes in the plan
  const plannedCourseCodes = new Set<string>();
  planned_terms.forEach((term: any) => {
    (term.courses || []).forEach((c: any) => {
      if (c.code) plannedCourseCodes.add(normalizeCode(String(c.code)));
    });
  });

  // missing that are already planned
  const missingPlanned = [...missingRequired].filter((c) => plannedCourseCodes.has(c));
  // missing required but not planned
  const missingUnplanned = [...missingRequired].filter((c) => !plannedCourseCodes.has(c));

  // map planned course code -> term name (first occurrence)
  const plannedCourseToTerm: Record<string, string> = {};
  planned_terms.forEach((term: any) => {
    (term.courses || []).forEach((c: any) => {
      const n = normalizeCode(c.code || "");
      if (n && !plannedCourseToTerm[n]) plannedCourseToTerm[n] = term.term;
    });
  });

  const missingAllSorted = [...missingRequired].sort();

  return (
    <div className="card bg-gray-900 text-white p-6 rounded-lg shadow-lg mt-6">
      <h3 className="text-2xl font-bold mb-4">3) Planned Pathway</h3>

      <div className="mb-4">
        <div className="text-sm text-gray-300">Major:</div>
        <div className="text-white font-semibold">{selectedMajor || 'Unknown'}</div>
      </div>

      <div className="space-y-6">
        <div className="mt-2 p-4 bg-gray-800 rounded border border-gray-700">
          <h4 className="text-lg font-semibold mb-3">Missing Required Courses</h4>
          {missingAllSorted.length === 0 ? (
            <div className="text-green-300">All required catalog courses appear satisfied.</div>
          ) : (
            <ul style={{display:'grid',gridTemplateColumns:'repeat(2, minmax(0,1fr))',gap:12,listStyle:'none',padding:0,margin:0}}>
              {missingAllSorted.map((code) => {
                const info = catalogMap[code] || { code };
                const plannedTerm = plannedCourseToTerm[code];
                const plannedFlag = !!plannedTerm;
                return (
                  <li key={code} style={{background:'#0b0b0f',padding:'10px',borderRadius:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{textAlign:'left'}}>
                      <div style={{fontWeight:600,color:'#c7d9ff',fontSize:'0.875rem'}}>{(info.code || code) + ': ' + (info.name || '')}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      {plannedFlag ? (
                        <div style={{color:'#f6d28a'}}>Planned • {plannedTerm}</div>
                      ) : (
                        <div style={{color:'#ff9aa2'}}></div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Planned term cards removed per request */}
      </div>
    </div>
  );
}

function normalizeCode(code: string) {
  return code.replace(/\s+/g, "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}


