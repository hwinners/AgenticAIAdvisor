import React from 'react';

type Section = {
  course: string;
  crn?: string;
  days?: string;
  start?: string;
  end?: string;
  cap?: number;
  enrolled?: number;
  note?: string;
};

type Props = {
  term?: string | null;
  chosen: Section[] | null;
  needs: Section[] | null;
};

const DAY_LABEL: Record<string, string> = {
  M: 'Mon',
  T: 'Tue',
  W: 'Wed',
  R: 'Thu',
  F: 'Fri',
  S: 'Sat',
  U: 'Sun',
};

function formatDays(days?: string) {
  if (!days) return 'TBA';
  return days
    .split('')
    .map((d) => DAY_LABEL[d] || d)
    .join(' / ');
}

function formatTimeRange(start?: string, end?: string) {
  if (!start && !end) return 'Time TBA';
  if (start && end) return `${start} – ${end}`;
  return start || end || 'Time TBA';
}

function sectionStatus(section: Section) {
  if (section.note) return section.note;
  if (typeof section.cap === 'number' && typeof section.enrolled === 'number') {
    const openSeats = section.cap - section.enrolled;
    return openSeats > 0 ? `${openSeats} seats open` : 'Full section';
  }
  return 'Status unknown';
}

export default function ScheduleView({ term, chosen, needs }: Props) {
  const sections = Array.isArray(chosen) ? chosen : [];
  if (sections.length === 0) return null;

  const overrides = (needs || []).filter((n) => n && n.note);

  return (
    <div className="card">
      <h3>Proposed Schedule</h3>
      {term && (
        <p>
          Term: <strong>{term}</strong>
        </p>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
          marginTop: 12,
        }}
      >
        {sections.map((section, idx) => (
          <div
            key={`${section.course}-${section.crn || idx}`}
            className="card"
            style={{
              border: section.note ? '1px solid #f99' : '1px solid #1f2937',
              padding: '12px 14px',
              background: '#0d1117',
              color: '#f8fafc',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 16 }}>{section.course}</div>
            <div style={{ fontSize: 13, color: '#cbd5f5', marginTop: 4 }}>
              CRN {section.crn || 'TBA'}
            </div>
            <div style={{ marginTop: 10, fontSize: 14 }}>
              <div>{formatDays(section.days)}</div>
              <div>{formatTimeRange(section.start, section.end)}</div>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: '#94a3b8' }}>
              {typeof section.enrolled === 'number' && typeof section.cap === 'number'
                ? `${section.enrolled}/${section.cap} enrolled`
                : null}
            </div>
            <div
              style={{
                marginTop: 10,
                fontSize: 12,
                color: section.note ? '#ff9aa2' : '#34d399',
              }}
            >
              {sectionStatus(section)}
            </div>
          </div>
        ))}
      </div>
      {overrides.length > 0 && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: '#2f1d20',
            borderRadius: 8,
            border: '1px solid #be123c',
            color: '#fecdd3',
          }}
        >
          <strong>Overrides needed:</strong>{' '}
          {overrides.map((n) => n.course).join(', ') || 'See notes'}
        </div>
      )}
    </div>
  );
}
