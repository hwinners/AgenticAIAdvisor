// import React from'react';type Props={planned_terms:any[]|null};export default function PlanView({planned_terms}:Props){if(!planned_terms)return null;return(<div className='card'><h3>3) Planned Pathway</h3>{planned_terms.map((t,i)=>(<div key={i}><strong>{t.term}</strong> — {t.credits} credits<pre>{JSON.stringify(t.courses,null,2)}</pre></div>))}</div>);}


import React, { useEffect, useState } from "react";
import { loadCatalog } from "../data/catalogLoader";

type Props = {
  planned_terms: any[] | null;
  transcript?: any | null;
  selectedMajor?: string;
};

export default function PlanView({ planned_terms, transcript, selectedMajor }: Props) {
  if (!planned_terms) return null;

  // Commented out Planned Pathway section
  /*
  return (
    <div className="card bg-gray-900 text-white p-6 rounded-lg shadow-lg mt-6">
      <h3 className="text-2xl font-bold mb-4">Planned Pathway</h3>
      {/* Add your planned term roadmap or other content here if desired */}
    //</div>
 // );
 // */
  //return null;
//}

function normalizeCode(code: string) {
  return code.replace(/\s+/g, "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}


