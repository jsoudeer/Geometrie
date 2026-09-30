"""Détourage en pied des 5 chats de départ, version « sans poches de fond » (30/09/2026).

Reprend tools/proc2.py (rembg isnet-general-use + remplissage des trous) MAIS ne comble plus
les poches de fond entourées par le personnage (ex : entre la baguette, le bras et le corps
d'Étoilou, éclats blancs entre les éclairs d'Éclairon) : elles restent transparentes.
Règle : un « trou » rempli est retiré s'il a la couleur du fond de l'image source
(cat04 : rose pâle ; cat03/cat05 : fond clair touchant l'extérieur). Les autres trous
(pelage blanc, yeux...) sont toujours remplis comme avant.

Usage (rembg + onnxruntime requis : pip install rembg onnxruntime) :
    python3 tools/decoupe_poches.py      # écrit /tmp/geo_img/catNN_full_new.png
puis copier dans assets/cats/ et lancer python3 tools/embed.py.
"""
import numpy as np, glob
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
from rembg import remove, new_session
fs=sorted(glob.glob('/home/claude/geometrie/wip/*.jpg'))
FULL={'cat01':12,'cat02':15,'cat03':25,'cat04':4,'cat05':3}
sess=new_session('isnet-general-use')
def remove_pockets(cid, holes_lab, hs, filled, src):
    ext=~filled; kill=np.zeros_like(filled)
    for i,s in enumerate(hs):
        if s<250: continue
        comp=holes_lab==(i+1)
        ring=ndi.binary_dilation(comp,iterations=12)&~comp
        frac=(ring&ext).sum()/max(1,ring.sum())
        col=src[comp].mean(axis=0)
        bright=col.min()>=225            # fond clair (blanc/crème/rose pâle)
        if cid=='cat04' and abs(col-np.array([252,210,208])).max()<=12: kill|=comp      # poches entre la baguette, le bras et le corps
        elif cid in('cat03','cat05') and frac>0.04 and bright: kill|=comp                # éclats de fond près des bords
    return kill
for id_,n in FULL.items():
    full=Image.open(fs[n-1]).convert('RGB'); src=np.array(full).astype(int)
    cut=remove(full,session=sess)
    a=np.array(cut.getchannel('A')); m=a>40
    lab,k=ndi.label(ndi.binary_closing(m,iterations=6))
    sizes=ndi.sum(m,lab,range(1,k+1)); keep=lab==(1+int(np.argmax(sizes)))
    m=m&ndi.binary_dilation(keep,iterations=3)
    closed=ndi.binary_closing(m,iterations=4)
    filled=ndi.binary_fill_holes(closed)
    holes=filled&~closed
    hl,hk=ndi.label(holes); hs=ndi.sum(holes,hl,range(1,hk+1))
    kill=remove_pockets(id_,hl,hs,filled,src)
    if kill.any():
        # on mange aussi la frange de 2 px autour de la poche (reste de fond mêlé au pelage)
        kill=ndi.binary_dilation(kill,iterations=3)
        print(id_,'poches retirées :',int(kill.sum()),'px')
    final=filled&~kill
    rgb=np.array(full)
    alpha=np.where(final,255,0).astype(np.uint8)
    alpha=np.array(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(1.2)))
    out=Image.fromarray(np.dstack([rgb,alpha]),'RGBA')
    bb=out.getchannel('A').point(lambda v:255 if v>20 else 0).getbbox()
    out=out.crop(bb); H=560
    out=out.resize((max(1,round(out.width*H/out.height)),H),Image.LANCZOS)
    out.save(f'/tmp/geo_img/{id_}_full_new.png')
    old=Image.open(f'/home/claude/geometrie/assets/cats/{id_}_full.png').convert('RGBA')
    if old.size==out.size:
        d=np.abs(np.array(old).astype(int)-np.array(out).astype(int)).max(axis=2)
        print(id_,'taille',out.size,'pixels différents :',int((d>8).sum()))
    else: print(id_,'taille',out.size,'ancienne',old.size)
