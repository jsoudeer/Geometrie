import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from rembg import remove, new_session
S='/tmp/geo_img/'
import glob
fs=sorted(glob.glob('/home/claude/geometrie/wip/*.jpg'))
FULL={'cat01':12,'cat02':15,'cat03':25,'cat04':4,'cat05':3}
sess=new_session('isnet-general-use')
for id_,n in FULL.items():
    full=Image.open(fs[n-1]).convert('RGB')
    cut=remove(full,session=sess)
    a=np.array(cut.getchannel('A'))
    m=a>40
    # garder le plus gros élément (retire coeurs / paillettes flottants)
    lab,k=ndi.label(ndi.binary_closing(m,iterations=6))
    sizes=ndi.sum(m,lab,range(1,k+1)); keep=lab==(1+int(np.argmax(sizes)))
    m=m&ndi.binary_dilation(keep,iterations=3)
    filled=ndi.binary_fill_holes(ndi.binary_closing(m,iterations=4))
    rgb=np.array(full)
    alpha=np.where(filled,255,0).astype(np.uint8)
    # bords : lissage léger
    alpha=np.array(Image.fromarray(alpha).filter(__import__('PIL.ImageFilter').ImageFilter.GaussianBlur(1.2)))
    alpha=np.where(filled,255,np.minimum(alpha,a)).astype(np.uint8) if False else alpha
    out=Image.fromarray(np.dstack([rgb,alpha]),'RGBA')
    bb=out.getchannel('A').point(lambda v:255 if v>20 else 0).getbbox()
    out=out.crop(bb); H=560
    out=out.resize((max(1,round(out.width*H/out.height)),H),Image.LANCZOS)
    out.save(S+id_+'_full.png'); print(id_,out.size)
ids=list(FULL)
W=Image.new('RGB',(5*250,330),(120,180,120))
for i,id_ in enumerate(ids):
    f=Image.open(S+id_+'_full.png'); f.thumbnail((240,320)); W.paste(f,(i*250+5,0),f)
W.save(S+'../full_sheet2.png')
