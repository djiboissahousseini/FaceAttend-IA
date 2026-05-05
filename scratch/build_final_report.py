import zipfile, os, shutil
from lxml import etree
from copy import deepcopy

SRC = '/home/usain/Téléchargements/FaceAttend_RAPPORT_FINAL_V2.docx'
DST = '/home/usain/Téléchargements/PCF_FaceAttend_COMPLET.docx'

W   = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
WP  = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing'
XSP = '{http://www.w3.org/XML/1998/namespace}space'
def w(t): return f'{{{W}}}{t}'
def wp(t): return f'{{{WP}}}{t}'

with zipfile.ZipFile(SRC,'r') as z:
    data = {n: z.read(n) for n in z.namelist()}

root = etree.fromstring(data['word/document.xml'])
body = root.find(f'.//{w("body")}')

def get_text(p): return ''.join(t.text for t in p.findall(f'.//{w("t")}') if t.text)
def has_img(p): return bool(p.findall(f'.//{wp("inline")}') + p.findall(f'.//{wp("anchor")}'))

# ═══════════════════════════════════════════════════════════════════════════
# HELPERS DE CRÉATION
# ═══════════════════════════════════════════════════════════════════════════

def make_pagebreak():
    p=etree.Element(w('p'))
    r=etree.SubElement(p,w('r'))
    br=etree.SubElement(r,w('br')); br.set(w('type'),'page'); return p

def bp(text, sz=24, bold=False, italic=False, color='000000', jc='both', line=360, before=0, after=160, indent=0, font='Calibri'):
    p=etree.Element(w('p')); pPr=etree.SubElement(p,w('pPr'))
    jc_el=etree.SubElement(pPr,w('jc')); jc_el.set(w('val'),jc)
    sp=etree.SubElement(pPr,w('spacing'))
    sp.set(w('line'),str(line)); sp.set(w('lineRule'),'auto')
    sp.set(w('before'),str(before)); sp.set(w('after'),str(after))
    if indent: ind=etree.SubElement(pPr,w('ind')); ind.set(w('left'),str(indent))
    r=etree.SubElement(p,w('r')); rPr=etree.SubElement(r,w('rPr'))
    rf=etree.SubElement(rPr,w('rFonts'))
    rf.set(w('ascii'),font); rf.set(w('hAnsi'),font); rf.set(w('cs'),font)
    if bold: etree.SubElement(rPr,w('b')); etree.SubElement(rPr,w('bCs'))
    if italic: etree.SubElement(rPr,w('i')); etree.SubElement(rPr,w('iCs'))
    clr=etree.SubElement(rPr,w('color')); clr.set(w('val'),color)
    for st in [w('sz'),w('szCs')]: s=etree.SubElement(rPr,st); s.set(w('val'),str(sz))
    t_el=etree.SubElement(r,w('t')); t_el.text=text; t_el.set(XSP,'preserve'); return p

def heading(text, level=1, sz=None, font='Calibri', color='1F3864'):
    sizes = {1:32, 2:28, 3:26}
    if sz is None: sz = sizes.get(level, 26)
    p=etree.Element(w('p')); pPr=etree.SubElement(p,w('pPr'))
    ps=etree.SubElement(pPr,w('pStyle')); ps.set(w('val'),f'Heading{level}')
    sp=etree.SubElement(pPr,w('spacing'))
    sp.set(w('before'),'280' if level==1 else '200'); sp.set(w('after'),'120')
    r=etree.SubElement(p,w('r')); rPr=etree.SubElement(r,w('rPr'))
    etree.SubElement(rPr,w('b')); etree.SubElement(rPr,w('bCs'))
    rf=etree.SubElement(rPr,w('rFonts')); rf.set(w('ascii'),font); rf.set(w('hAnsi'),font); rf.set(w('cs'),font)
    clr=etree.SubElement(rPr,w('color')); clr.set(w('val'),color)
    for st in [w('sz'),w('szCs')]: s=etree.SubElement(rPr,st); s.set(w('val'),str(sz))
    t_el=etree.SubElement(r,w('t')); t_el.text=text; t_el.set(XSP,'preserve'); return p

def bullet(text, sz=24, font='Calibri', indent=400):
    return bp(f'•  {text}', sz=sz, font=font, indent=indent, after=80)

def bullet2(label, text, sz=24):
    """Bullet avec label gras."""
    p=etree.Element(w('p')); pPr=etree.SubElement(p,w('pPr'))
    jc=etree.SubElement(pPr,w('jc')); jc.set(w('val'),'both')
    sp=etree.SubElement(pPr,w('spacing')); sp.set(w('line'),'360'); sp.set(w('lineRule'),'auto')
    sp.set(w('before'),'0'); sp.set(w('after'),'80')
    ind=etree.SubElement(pPr,w('ind')); ind.set(w('left'),'400')
    # Run gras
    r1=etree.SubElement(p,w('r')); rPr1=etree.SubElement(r1,w('rPr'))
    etree.SubElement(rPr1,w('b')); etree.SubElement(rPr1,w('bCs'))
    rf=etree.SubElement(rPr1,w('rFonts')); rf.set(w('ascii'),'Calibri'); rf.set(w('hAnsi'),'Calibri'); rf.set(w('cs'),'Calibri')
    for st in [w('sz'),w('szCs')]: s=etree.SubElement(rPr1,st); s.set(w('val'),str(sz))
    t1=etree.SubElement(r1,w('t')); t1.text=f'•  {label}'; t1.set(XSP,'preserve')
    # Run normal
    r2=etree.SubElement(p,w('r')); rPr2=etree.SubElement(r2,w('rPr'))
    rf2=etree.SubElement(rPr2,w('rFonts')); rf2.set(w('ascii'),'Calibri'); rf2.set(w('hAnsi'),'Calibri'); rf2.set(w('cs'),'Calibri')
    for st in [w('sz'),w('szCs')]: s=etree.SubElement(rPr2,st); s.set(w('val'),str(sz))
    t2=etree.SubElement(r2,w('t')); t2.text=f' : {text}'; t2.set(XSP,'preserve'); return p

def spacer(before=0, after=120):
    p=etree.Element(w('p')); pPr=etree.SubElement(p,w('pPr'))
    sp=etree.SubElement(pPr,w('spacing')); sp.set(w('before'),str(before)); sp.set(w('after'),str(after)); return p

# ═══════════════════════════════════════════════════════════════════════════
# ÉTAPE 1 : Lire et garder les éléments originaux utiles
# ═══════════════════════════════════════════════════════════════════════════
children = list(body)
plist = [ch for ch in children if ch.tag == w('p')]

# Repérer les blocs clés
GARDE_START = 0
REMERCIEMENTS_START = None
LOF_START = None
INTRO_START = None
ETUDE_START = None
CHAP3_START = None

for i, p in enumerate(plist):
    t = get_text(p)
    if 'REMERCIEMENTS' in t and REMERCIEMENTS_START is None:
        REMERCIEMENTS_START = i
    if 'Liste des figures' in t and LOF_START is None:
        LOF_START = i
    if 'Introduction générale' in t and INTRO_START is None:
        INTRO_START = i
    if 'ÉTUDE DU DOMAINE' in t and ETUDE_START is None:
        ETUDE_START = i
    if 'PRESENTATION DE L' in t and CHAP3_START is None:
        CHAP3_START = i

print(f"Page de garde: 0-{REMERCIEMENTS_START}")
print(f"Remerciements: {REMERCIEMENTS_START}-{LOF_START}")
print(f"Liste des figures: {LOF_START}-{INTRO_START}")
print(f"Introduction: {INTRO_START}-{ETUDE_START}")
print(f"Etude du domaine: {ETUDE_START}-{CHAP3_START}")
print(f"Chapitre III+: {CHAP3_START}-fin")
