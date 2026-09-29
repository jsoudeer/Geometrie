import glob, os, sys
from PIL import Image
from rembg import remove, new_session
S='/tmp/geo_img/'
fs=sorted(glob.glob('/home/claude/geometrie/wip/*.jpg'))
def F(n): return fs[n-1]
# id: (face image n, full image n, face crop box or None)
M={
 'cat01':(18,12,None),'cat02':(20,15,None),'cat03':(None,25,(140,90,1060,1010)),
 'cat04':(1,4,None),'cat05':(13,3,None),
 'br01':(2,21,None),'br02':(26,6,None),'br03':(19,7,None),'br04':(10,24,None),'br05':(14,11,None),
 'br21':(16,8,None),'br22':(23,22,None),
}
sess=new_session('isnet-general-use')
for id_,(fn,un,box) in M.items():
    # face
    src=F(fn) if fn else F(un)
    im=Image.open(src).convert('RGB')
    if box: im=im.crop(box)
    w,h=im.size
    if w!=h:  # centre-crop carré
        s=min(w,h); im=im.crop(((w-s)//2,(h-s)//2,(w-s)//2+s,(h-s)//2+s))
    im.resize((256,256),Image.LANCZOS).save(S+id_+'_face.png')
    # full : détourage
    full=Image.open(F(un)).convert('RGB')
    cut=remove(full,session=sess)
    bb=cut.getchannel('A').point(lambda v:255 if v>20 else 0).getbbox()
    cut=cut.crop(bb)
    H=560
    cut=cut.resize((max(1,round(cut.width*H/cut.height)),H),Image.LANCZOS)
    cut.save(S+id_+'_full.png')
    print(id_,cut.size,flush=True)
