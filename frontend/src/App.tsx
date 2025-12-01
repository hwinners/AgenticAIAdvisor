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
  const [scheduleTerm, setScheduleTerm] = useState<string | null>(null);
  const program_id = 'BSCSE';

  async function handleLoaded(t: any, extra?: any) {
    setTranscript(t);
    setChosen(null);
    setNeeds(null);
    setScheduleTerm(null);

    // infer major
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
          BSCivil: 'BSCivil',
        };
        const inferred = map[programCode] || map[programCode.toUpperCase()] || selectedMajor;
        setSelectedMajor(inferred);
      }
    } catch {}

    // if extra payload provided
    if (extra?.audit && extra?.planned_terms) {
      setAuditRes(extra.audit);
      setPlanned(extra.planned_terms);
      const s = await schedule(extra.planned_terms);
      setChosen(s.chosen_sections);
      setNeeds(s.needs_overrides);
      setScheduleTerm(s.term || null);
      return;
    }

    // normal flow
    const a = await audit(t, program_id);
    setAuditRes(a.audit);

    const p = await plan(t, program_id);
    setPlanned(p.planned_terms);

    const s = await schedule(p.planned_terms);
    setChosen(s.chosen_sections);
    setNeeds(s.needs_overrides);
    setScheduleTerm(s.term || null);
  }

  return (
    <div
      className="container"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'transparent', // Changed from '#101624' to transparent
        padding: '32px 0',
      }}
    >
      <div style={{ width: '100%', maxWidth: 1200 }}>
        <h1 style={{ textAlign: 'center' }}>SmartPath</h1>

        <p style={{ textAlign: 'center' }}>
          Upload transcript → auto-audit → plan → schedule → explanations → search → chat
        </p>

        <UploadTranscript onLoaded={handleLoaded} />

        {auditRes && (
          <AuditView audit={auditRes} selectedMajor={selectedMajor} transcript={transcript} />
        )}

        {planned && (
          <PlanView
            planned_terms={planned}
            transcript={transcript}
            selectedMajor={selectedMajor}
          />
        )}

        {chosen && (
          <ScheduleView term={scheduleTerm} chosen={chosen} needs={needs || []} />
        )}

        {planned && auditRes && transcript && (
          <>
            <OverrideDrafts planned_terms={planned} requirements={auditRes} />
            <CourseSearch />
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
    </div>
  );
}