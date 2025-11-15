import React, { useState } from "react";
export interface CourseRow {
  [key: string]: any; // allow unknown CSV columns safely

  "Unnamed: 0"?: string; 
  "Unnamed: 1"?: string;
  "Unnamed: 2"?: string;
  "Unnamed: 3"?: string | null;
  "Unnamed: 4"?: string | null;
  "Unnamed: 5"?: string | null;
  "Unnamed: 6"?: string | null;
  "Unnamed: 7"?: string | null;
  "Unnamed: 8"?: string;   // CATEGORY
  "Unnamed: 9"?: string | null;
}


// Import JSON catalogs
import BA_CS from "../data/catalog - BAComputerScience.json";
import BS_OCEAN from "../data/catalog - BSCivil.json";
import BS_MECH from "../data/catalog - BSComputerE.json";
import BS_GEO from "../data/catalog - BSComputerScience.json";
import BS_ENV from "../data/catalog - BSDataScience&A.json";
import BS_CIVIL from "../data/catalog - BSElectrical.json";
import BS_EE from "../data/catalog - BSEnvironmental.json";
import BS_CE from "../data/catalog - BSGeomatics.json";
import BS_DS from "../data/catalog - BSMechanical.json";
import BS_CS2 from "../data/catalog - BSOcean.json";

// Combine all courses into one list
const ALL: CourseRow[] = [
  ...(BA_CS as CourseRow[]),
  ...(BS_OCEAN as CourseRow[]),
  ...(BS_MECH as CourseRow[]),
  ...(BS_GEO as CourseRow[]),
  ...(BS_ENV as CourseRow[]),
  ...(BS_CIVIL as CourseRow[]),
  ...(BS_EE as CourseRow[]),
  ...(BS_CE as CourseRow[]),
  ...(BS_DS as CourseRow[]),
  ...(BS_CS2 as CourseRow[])
];


// Filter out header rows (where course code = "Course Code")
const COURSES = ALL.filter(
  (row) => row["Unnamed: 0"] !== "Course Code" && row["Unnamed: 0"] !== ""
);

export default function CourseSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  // Perform search
  function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    const q = query.toLowerCase();

    const matches = COURSES.filter((r) =>
      (r["Unnamed: 8"] || "").toLowerCase().includes(q) // category column
    );

    setResults(matches);
  }

  return (
    <div className="card bg-gray-900 text-white p-6 rounded-lg shadow-lg mt-6">
      <h3 className="text-2xl font-bold mb-4">🔍 Search Courses by Category</h3>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search for 'ai', 'cybersecurity', 'math', etc."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 p-2 bg-gray-800 border border-gray-700 rounded text-white"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded font-semibold"
        >
          Search
        </button>
      </form>

      {/* Search results */}
      {results.length > 0 ? (
        <div>
          <h4 className="text-xl font-semibold mb-2">
            Results ({results.length})
          </h4>
          <ul className="space-y-2">
            {results.map((c, i) => (
              <li
                key={i}
                className="bg-gray-800 p-3 rounded border border-gray-700"
              >
                <strong className="text-blue-300">{c["Unnamed: 0"]}</strong> —{" "}
                {c["Unnamed: 1"]}
                <p className="text-sm text-gray-400">
                  Category: {c["Unnamed: 8"]}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : query.length > 0 ? (
        <p className="text-red-400">No courses found for “{query}”.</p>
      ) : null}
    </div>
  );
}
