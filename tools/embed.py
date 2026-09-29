import base64, io, re, shutil, os
from PIL import Image
S='/tmp/geo_img/'
R='/home/claude/geometrie/'
ids=['cat01','cat02','cat03','cat04','cat05','br01','br02','br03','br04','br05','br21','br22']
# ballerine d'origine -> wip
for a,b in (('br02.png','ballerine-cappuccino-face.png'),('br02_full.png','ballerine-cappuccino-full.png')):
    p=R+'assets/brainrot/'+a
    if os.path.exists(p): shutil.move(p,R+'wip/'+b)
def b64(im,**kw):
    bio=io.BytesIO(); im.save(bio,'WEBP',**kw); return 'data:image/webp;base64,'+base64.b64encode(bio.getvalue()).decode()
parts=[]; tot=0
for i in ids:
    side='cats' if i.startswith('cat') else 'brainrot'
    shutil.copy(S+i+'_face.png',R+f'assets/{side}/{i}.png')
    shutil.copy(S+i+'_full.png',R+f'assets/{side}/{i}_full.png')
    f=Image.open(S+i+'_face.png').convert('RGB'); u=Image.open(S+i+'_full.png').convert('RGBA')
    u=u.resize((round(u.width*440/u.height),440),Image.LANCZOS)
    fa=b64(f,quality=82); fu=b64(u,quality=86,method=6)
    tot+=len(fa)+len(fu); parts.append(f'"{i}":{{f:"{fa}",u:"{fu}"}}')
block='/*IMG_DATA_START*/var CUSTOM_IMG={'+',\n'.join(parts)+'};/*IMG_DATA_END*/'
print('taille embarquée ko:',tot//1024)
h=open(R+'index.html',encoding='utf-8').read()
if '/*IMG_DATA_START*/' in h:
    h=re.sub(r'/\*IMG_DATA_START\*/.*?/\*IMG_DATA_END\*/',lambda m:block,h,flags=re.S)
else:
    h=h.replace("  var CAT_SPRITES = [\n","  // Images générées (visage 'f' et plein pied détouré 'u'), embarquées en base64\n  // pour que l'aperçu publié (fichier unique) les affiche aussi.\n  "+block+"\n\n  var CAT_SPRITES = [\n",1)
def rep(a,b):
    global h
    assert a in h,a
    h=h.replace(a,b,1)
rep("mkSprite('cat01','Mochi'","mkSprite('cat01','Lavandou'")
rep("mkSprite('cat02','Fraise'","mkSprite('cat02','Cœurette'")
rep("mkSprite('cat03','Nuage'","mkSprite('cat03','Pétale'")
rep("mkSprite('cat04','Biscuit'","mkSprite('cat04','Étoilou'")
rep("mkSprite('cat05','Praline'","mkSprite('cat05','Éclairon'")
rep("'Tarallino Turbo'","'Baguetto Montone'"); rep("'Fettuccino Furioso'","'Maiale Cuvetto'")
rep("'Broccolino Bang'","'Waffolo Papero'"); rep("'Salamino Sprint'","'Spaghettino Orsetto'")
rep("'Peperoncino Pazzo'","'Televisiogatto'")
rep("['Gelatino Gagà',8,'flame'],['Polpettone Pop',9,'bolt']","['MiaoStation 5',8,'flame'],['Leone Spaghettoni',9,'bolt']")
if 'CUSTOM_IMG[sprite.id]' not in h:
    rep("    var exts = ['png','svg','jpg'];\n    var side = spriteSide(sprite);\n    var i = 0;\n    function attempt(){\n      if(i >= exts.length) return;",
        "    var exts = ['png','svg','jpg'];\n    var side = spriteSide(sprite);\n    var i = 0;\n    var emb = CUSTOM_IMG[sprite.id];\n    if(emb){\n      var im0 = new Image();\n      im0.className = 'sp-custom-img'; im0.alt = sprite.name;\n      im0.onload = function(){ svg.style.display = 'none'; container.insertBefore(im0, svg); };\n      im0.src = emb.f;\n      return;\n    }\n    function attempt(){\n      if(i >= exts.length) return;")
    rep("    var exts = ['png','svg','jpg'];\n    var i = 0;\n    function attempt(){\n      if(i >= exts.length){ onNotFound(); return; }",
        "    var exts = ['png','svg','jpg'];\n    var i = 0;\n    var emb = CUSTOM_IMG[sprite.id];\n    if(emb){\n      var im0 = new Image();\n      im0.className = 'sp-full-img'; im0.alt = sprite.name;\n      im0.onload = function(){ onFound(im0); };\n      im0.onerror = function(){ onNotFound(); };\n      im0.src = emb.u;\n      return;\n    }\n    function attempt(){\n      if(i >= exts.length){ onNotFound(); return; }")
open(R+'index.html','w',encoding='utf-8').write(h)
