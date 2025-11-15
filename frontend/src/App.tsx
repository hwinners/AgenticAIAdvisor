import React, { useState } from 'react';
import UploadTranscript from './components/UploadTranscript';
import AuditView from './components/AuditView';
import PlanView from './components/PlanView';
import ScheduleView from './components/ScheduleView';
import OverrideDrafts from './components/OverrideDrafts';
import ChatPanel from './components/ChatPanel';
import CourseSearch from './components/CourseSearch';
import { audit, plan, schedule } from './api';

export default function App() {
  const [transcript, setTranscript] = useState<any | null>(null);
  const [auditRes, setAuditRes] = useState<any[] | null>(null);
  const [planned, setPlanned] = useState<any[] | null>(null);
  const [chosen, setChosen] = useState<any[] | null>(null);
  const [needs, setNeeds] = useState<any[] | null>(null);
  const [selectedMajor, setSelectedMajor] = useState<string>('BSComputerScience');
  const program_id = 'BSCSE';

  async function handleLoaded(t: any, extra?: any) {
    setTranscript(t);
    // Infer major from transcript.student.program when available
    try {
      const programCode = t?.student?.program;
      if (programCode) {
        const map: Record<string, string> = {
          BSCSE: 'BSComputerScience',
          BSCS: 'BSComputerScience',
          BSComputerScience: 'BSComputerScience',
          BSDataScience: 'BSDataScience&A',
          BSDS: 'BSDataScience&A',
          BACs: 'BAComputerScience',
          BAComputerScience: 'BAComputerScience',
          BSMechanical: 'BSMechanical',
          BSCivil: 'BSCivil'
        };
        const inferred = map[programCode] || map[programCode.toUpperCase()] || selectedMajor;
        setSelectedMajor(inferred);
      }
    } catch (err) {
      // ignore
    }
    if (extra?.audit && extra?.planned_terms) {
      setAuditRes(extra.audit);
      setPlanned(extra.planned_terms);
      const s = await schedule(extra.planned_terms);
      setChosen(s.chosen_sections);
      setNeeds(s.needs_overrides);
      return;
    }
    const a = await audit(t, program_id);
    setAuditRes(a.audit);
    const p = await plan(t, program_id);
    setPlanned(p.planned_terms);
    const s = await schedule(p.planned_terms);
    setChosen(s.chosen_sections);
    setNeeds(s.needs_overrides);
  }

  return (
    <div className="container">
      <h1>Agentic Degree Advisor (MVP)</h1>
      <p>Upload transcript → auto-audit → plan → schedule → overrides & explanations → chat</p>

      <CourseSearch />

      
      <UploadTranscript onLoaded={handleLoaded} />
      {auditRes && <AuditView audit={auditRes} />}
      {planned && (
        <PlanView planned_terms={planned} transcript={transcript} selectedMajor={selectedMajor} />
      )}
      {chosen && <ScheduleView chosen={chosen} needs={needs || []} />}
      {planned && auditRes && transcript && (
        <>
          <OverrideDrafts
            student={transcript.student}
            planned_terms={planned}
            requirements={auditRes}
          />
          <ChatPanel
            transcript={transcript}
            audit={auditRes}
            plannedTerms={planned}
            onUpdateAudit={setAuditRes}
            onUpdatePlan={setPlanned}
          />
        </>
      )}
    </div>
  );
}
