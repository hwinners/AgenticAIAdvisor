
import React, { useState } from "react";
import Fuse from "fuse.js";

export interface CourseRow {
  [key: string]: any;

  "Unnamed: 0"?: string;  // Course Code
  "Unnamed: 1"?: string;  // Course Name
  "Unnamed: 2"?: string;  // Credits
  "Unnamed: 3"?: string | null;
  "Unnamed: 4"?: string | null;
  "Unnamed: 5"?: string | null;
  "Unnamed: 6"?: string | null;
  "Unnamed: 7"?: string | null;
  "Unnamed: 8"?: string | null;   // Category
  "Unnamed: 9"?: string | null;
}
 
// IMPORT ALL JSON FILES HERE
import BA_CS from "../data/catalog - BAComputerScience.json";
import BS_CS from "../data/catalog - BSComputerScience.json";
import BS_DS from "../data/catalog - BSDataScience&A.json";
import BS_ME from "../data/catalog - BSMechanical.json";
import BS_OE from "../data/catalog - BSOcean.json";
import BS_CE from "../data/catalog - BSCivil.json";
import BS_EE from "../data/catalog - BSElectrical.json";
import BS_EN from "../data/catalog - BSEnvironmental.json";
import BS_GEO from "../data/catalog - BSGeomatics.json";
import BS_CENG from "../data/catalog - BSComputerE.json";

// Combine & filter header rows
const ALL_RAW = [
  BA_CS,
  BS_CS,
  BS_DS,
  BS_ME,
  BS_OE,
  BS_CE,
  BS_EE,
  BS_EN,
  BS_GEO,
  BS_CENG
].flat() as CourseRow[];

const COURSES = ALL_RAW.filter(
  row => row["Unnamed: 0"] && row["Unnamed: 0"] !== "Course Code"
);

// Fuzzy search configuration
const fuse = new Fuse(COURSES, {
  includeScore: true,
  threshold: 0.35,   // GOOD fuzzy matching (0 = strict, 1 = very loose)
  keys: [
    "Unnamed: 0",   // course code
    "Unnamed: 1",   // course name
    "Unnamed: 8"    // category
  ]
});

export default function CourseSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CourseRow[]>([]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    if (!query.trim()) {
      setResults([]);
      return;
    }

    const found = fuse.search(query).map(r => r.item);
    setResults(found);
  }

  return (
    <div className="card bg-gray-900 text-white p-6 rounded-lg shadow-lg mt-6">
      <h3 className="text-2xl font-bold mb-4">🔍 Smart Course Search </h3>

      <form onSubmit={handleSearch} className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Try: ai, cyber, algorithm, security, calculus…"
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

      {/* Results */}
      {results.length > 0 ? (
        <div>
          <h4 className="text-xl font-semibold mb-2">Results ({results.length})</h4>
          <ul className="space-y-2">
            {results.map((c, i) => (
              <li
                key={i}
                className="bg-gray-800 p-3 rounded border border-gray-700"
              >
                <strong className="text-blue-300">{c["Unnamed: 0"]}</strong> —{" "}
                {c["Unnamed: 1"]}
                <p className="text-sm text-gray-400">
                  Category: {c["Unnamed: 8"] || "None"}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        query.length > 0 && <p className="text-red-400">No matches for “{query}”.</p>
      )}
    </div>
  );
}
