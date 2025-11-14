import streamlit as st, json, io, re, pandas as pd, pdfplumber
from pdf2image import convert_from_bytes
import pytesseract
st.set_page_config(page_title='Degree Audit from PDF',layout='wide')
COURSE_ROW=re.compile(r'(?P<code>[A-Z]{2,4}\s*\d{3,4}).{0,80}?(?P<term>\d{4}[FSUW])\s+(?P<grade>(?:A|B|C|D|F|CR|S|U|P|NP|W|I)[\+\-]?)\s+(?P<credits>\d+(?:\.\d)?)')
@st.cache_data
def load_catalog():return json.load(open('../backend/data/catalog.json','r'))
CAT=load_catalog();PROGRAM_ID=list(CAT['programs'].keys())[0];PROGRAM=CAT['programs'][PROGRAM_ID];META=PROGRAM['course_meta'];REQS=PROGRAM['requirements']
st.title('PDF → Audit → What Classes You Still Need')
pdf=st.file_uploader('Upload your uAchieve PDF',type=['pdf'])
def has_text(b:bytes)->bool:
  try:
    with pdfplumber.open(io.BytesIO(b)) as pdf:
      for p in pdf.pages[:3]:
        if (p.extract_text() or '').strip():return True
  except Exception:pass
  return False
def extract_text(b:bytes)->str:
  with pdfplumber.open(io.BytesIO(b)) as pdf:
    return '\n'.join((p.extract_text() or '') for p in pdf.pages)
def extract_ocr(b:bytes)->str:
  pages=convert_from_bytes(b,dpi=200)
  return '\n'.join(pytesseract.image_to_string(im.convert('L')) for im in pages)
def parse_courses(text:str):
  rows=[]
  for m in COURSE_ROW.finditer(text):
    rows.append({'code':m.group('code').replace(' ',''),'term':m.group('term'),'grade':m.group('grade'),'credits':float(m.group('credits'))})
  return rows
if pdf:
  b=pdf.read();text=extract_text(b) if has_text(b) else extract_ocr(b);parsed=parse_courses(text)
  st.subheader('Parsed Courses (you can edit)')
  df=pd.DataFrame(parsed);table=st.data_editor(df,num_rows='dynamic',use_container_width=True);completed=set(table['code'].dropna().tolist())
  st.subheader('Audit Results');missing=[]
  for r in REQS:
    if r['type']=='all_of':
      miss=[c for c in r['courses'] if c not in completed];st.write(f"**{r.get('id','all_of')}** — {'✅ Met' if not miss else '❌ Missing'}")
      if miss:st.write(', '.join(miss));missing.extend(miss)
    elif r['type']=='choose_n':
      done=[c for c in r['from'] if c in completed];need=max(0,r['n']-len(done));st.write(f"**{r.get('id','choose_n')}** — {'✅ Met' if need==0 else f'❌ Need {need} more'}")
      if need>0:
        picks=[c for c in r['from'] if c not in completed][:need];st.caption('Suggestions: '+', '.join(picks));missing.extend(picks)
    elif r['type']=='credits_at_least':
      earned=0
      for c in completed:
        if META.get(c,{}).get('area')==r['area']:earned+=META[c]['credits']
      need=max(0,r['credits']-earned);st.write(f"**{r.get('id','credits')}** — {'✅ Met' if need==0 else f'❌ Need {need} credits in {r['area']}'}")
  st.subheader('➡️ Classes you still need (first pass)');missing=list(dict.fromkeys(missing));st.write(missing if missing else 'Looks like your requirements here are met!')
  st.subheader('🗓 Suggested Next Term (≤ 15 credits)');credit_cap=15;picked,total=[],0
  for c in missing:
    cr=META.get(c,{}).get('credits',3)
    if total+cr<=credit_cap:picked.append(c);total+=cr
  st.write({'term':'Next','courses':picked,'credits':total})
  st.download_button('Download Parsed Transcript JSON',json.dumps({'student':{'id':None,'name':None,'program':PROGRAM_ID},'taken':table.to_dict(orient='records'),'transfer_credits':0},indent=2),file_name='transcript.parsed.json')
