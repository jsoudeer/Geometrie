"""Prépare portraits (256² RGB) + plein-pieds (RGBA, H=560) des personnages 06-12 / br06-br07.
Noms de fichiers explicites (les index par position de proc.py/proc2.py ne sont plus valables)."""
import numpy as np, os
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
from rembg import remove, new_session
W='/home/claude/geometrie/wip/grok-image-'
OUT='/home/claude/geometrie/assets/'
# id: (portrait, plein pied, côté)
M={
 'cat06':('0675ab6d-c601-4be6-b005-86181386f484','e1bd808d-c023-45d1-9553-fc778a945984','cats'),
 'cat07':('8479924c-1c4e-4e2d-8378-0c0207968cf4','0c5c92ca-4c6d-4d71-b846-60670bcebb36','cats'),
 'cat08':('362a9b25-fca6-49c3-bd45-8e8eb3c0df27','6b018c8b-fc90-45b7-8cf7-efed26d7e6e1','cats'),
 'cat09':('7c93d5e6-7c83-4723-9fcb-fb4b858e3a33','93fcd784-e96b-424a-a63f-d8acd9b78984','cats'),
 'cat10':('54ac022e-e707-4cbb-a50b-cb0db9c71aa2','b762b9ce-0f80-401d-b9b1-5d7ed5a5e5c3','cats'),
 'cat11':('de09c255-4c48-4fe3-810d-26b3cc5043d3','57ff36bf-9240-4509-8185-c91fc9d3c4a5','cats'),
 'cat12':('ee7e0686-f73e-4178-95b8-5dd37be271af','a499153e-ce3d-4d5f-9f62-f230e8dcc625','cats'),
 'br06':('41fdc10e-588c-4026-b51f-922f13616bd1','ac25d378-5344-4877-964b-fec926858304','brainrot'),
 'br07':('ae81daeb-260f-4d8b-827b-c34facc39f98','da4b6e50-5484-4868-9284-87828917ac6c','brainrot'),
}
sess=new_session('isnet-general-use')
def cut(im):
    c=remove(im,session=sess); a=np.array(c.getchannel('A')); m=a>40
    lab,k=ndi.label(ndi.binary_closing(m,iterations=6))
    sizes=ndi.sum(m,lab,range(1,k+1)); keep=lab==(1+int(np.argmax(sizes)))
    m=m&ndi.binary_dilation(keep,iterations=3)
    filled=ndi.binary_fill_holes(ndi.binary_closing(m,iterations=4))
    alpha=np.array(Image.fromarray(np.where(filled,255,0).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)))
    return Image.fromarray(np.dstack([np.array(im),alpha]),'RGBA')
def square_crop(rgba, margin=0.08, bg=(255,255,255)):
    bb=rgba.getchannel('A').point(lambda v:255 if v>20 else 0).getbbox()
    x0,y0,x1,y1=bb; s=max(x1-x0,y1-y0)*(1+2*margin); cx,cy=(x0+x1)/2,(y0+y1)/2
    box=(int(cx-s/2),int(cy-s/2),int(cx+s/2),int(cy+s/2))
    base=Image.new('RGBA',rgba.size,bg+(255,)); base.alpha_composite(rgba)
    return base.convert('RGB').crop(box)  # crop hors image => noir ; évité par fond blanc ci-dessous
for id_,(p,f,side) in M.items():
    full=Image.open(W+f+'.jpg').convert('RGB')
    c=cut(full); bb=c.getchannel('A').point(lambda v:255 if v>20 else 0).getbbox()
    c=c.crop(bb); H=560
    c=c.resize((max(1,round(c.width*H/c.height)),H),Image.LANCZOS)
    c.save(OUT+side+'/'+id_+'_full.png')
    pim=Image.open(W+p+'.jpg').convert('RGB')
    # fond blanc élargi pour que le recadrage carré ne sorte jamais de l'image
    pad=Image.new('RGB',(pim.width+800,pim.height+800),(255,255,255)); pad.paste(pim,(400,400))
    if id_=='cat08' or id_=='br06':
        pc=cut(pad)
    else:
        arr=np.array(pad).astype(int); nonwhite=(np.abs(arr-255).sum(2)>40)
        nonwhite=ndi.binary_opening(nonwhite,iterations=3)
        lab,k=ndi.label(ndi.binary_closing(nonwhite,iterations=15)); sizes=ndi.sum(nonwhite,lab,range(1,k+1))
        ys,xs=np.where(lab==(1+int(np.argmax(sizes))))
        pc=Image.fromarray(np.dstack([arr.astype(np.uint8),np.zeros(arr.shape[:2],np.uint8)+255]),'RGBA')
        a=np.zeros(arr.shape[:2],np.uint8); a[ys.min():ys.max()+1,xs.min():xs.max()+1]=255
        pc.putalpha(Image.fromarray(a))
    sq=square_crop(pc, margin=0.06, bg=(255,255,255) if id_!='br06' else (232,208,184))
    sq.resize((256,256),Image.LANCZOS).save(OUT+side+'/'+id_+'.png')
    print(id_,c.size,flush=True)
