const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export async function uploadTranscript(file:File){const f=new FormData();f.append('file',file);const r=await fetch(`${BASE}/upload_transcript`,{method:'POST',body:f});return r.json();}
export async function uploadTranscriptPdf(file:File){const f=new FormData();f.append('file',file);const r=await fetch(`${BASE}/upload_transcript_pdf`,{method:'POST',body:f});return r.json();}
export async function audit(transcript:any,program_id:string){const r=await fetch(`${BASE}/audit`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({transcript,program_id})});return r.json();}
export async function plan(transcript:any,program_id:string){const r=await fetch(`${BASE}/plan`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({transcript,program_id})});return r.json();}
export async function schedule(planned_terms:any[]){const r=await fetch(`${BASE}/schedule`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({planned_terms})});return r.json();}
export async function explain(payload:any){const r=await fetch(`${BASE}/explain`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});return r.json();}

// frontend/src/api.ts

// ...existing imports + BASE etc...

export async function chat(payload: any) {
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return res.json()
}
