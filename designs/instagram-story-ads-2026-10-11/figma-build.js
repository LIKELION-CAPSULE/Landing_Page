const page=await figma.getNodeByIdAsync('120:125');
await figma.setCurrentPageAsync(page);
const available=await figma.listAvailableFontsAsync();
const styles=['Black','Bold','Medium','Regular'];
for(const style of styles) {
  if(!available.some(f=>f.fontName.family==='Noto Sans KR'&&f.fontName.style===style)) throw new Error('Missing font '+style);
}
await Promise.all(styles.map(style=>figma.loadFontAsync({family:'Noto Sans KR',style})));
const created=[];
const keep=n=>{created.push(n.id);return n;};
const rgb=h=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const paint=(h,opacity=1)=>({type:'SOLID',color:rgb(h),opacity});
function rect(parent,name,x,y,w,h,color,radius=0){
 const n=keep(figma.createRectangle());parent.appendChild(n);
 n.set({name,x,y,width:w,height:h,cornerRadius:radius,fills:[paint(color)]});return n;
}
function text(parent,name,copy,size,color,width,style='Bold',align='LEFT'){
 const n=keep(figma.createText());parent.appendChild(n);
 n.fontName={family:'Noto Sans KR',style};n.fontSize=size;
 n.lineHeight={unit:'PERCENT',value:120};n.letterSpacing={unit:'PERCENT',value:-2};
 n.textAutoResize='NONE';n.resize(width,Math.ceil(size*1.2*copy.split('\n').length+8));n.characters=copy;
 n.fills=[paint(color)];n.textAlignHorizontal=align;n.name=name;return n;
}
function stack(parent,name,x,y,width,gap=12){
 const n=keep(figma.createAutoLayout('VERTICAL'));parent.appendChild(n);
 n.set({name,x,y,width,itemSpacing:gap,fills:[],primaryAxisSizingMode:'AUTO',counterAxisSizingMode:'FIXED'});return n;
}
function grad(parent,name,x,y,w,h,stops){
 const n=rect(parent,name,x,y,w,h,'#171122');
 n.fills=[{type:'GRADIENT_LINEAR',gradientTransform:[[0,1,0],[-1,0,1]],
 gradientStops:stops.map(([position,color,a])=>({position,color:{...rgb(color),a}}))}];return n;
}
function brand(f){
 const row=keep(figma.createAutoLayout('HORIZONTAL'));f.appendChild(row);
 row.set({name:'브랜드와 사전예약 상태',x:76,y:278,itemSpacing:22,fills:[],counterAxisAlignItems:'CENTER'});
 const box=keep(figma.createAutoLayout('HORIZONTAL'));row.appendChild(box);
 box.set({name:'캡슐 원본 로고',paddingLeft:16,paddingRight:16,paddingTop:8,paddingBottom:8,cornerRadius:18,fills:[paint('#FFFFFF',0.96)]});
 const logo=rect(box,'캡슐 로고 · 원본 유지',0,0,155,53,'#FFFFFF');
 logo.fills=[{type:'IMAGE',imageHash:'81cad1b1ff10dccdfa69af84f78cbd22c0487261',scaleMode:'FIT'}];
 text(row,'서비스와 상태','AI 캠스터디 · 사전예약 중',31,'#FFFFFF',570,'Medium');
}
const right=Math.max(...page.children.map(n=>n.x+n.width));
const section=keep(figma.createSection());page.appendChild(section);
section.name='인스타그램 스토리 광고 | 캡슐 3종 | 2026.10.11';
section.x=right+1200;section.y=0;section.resizeWithoutConstraints(3800,2700);
section.fills=[paint('#F2EDF9')];
const header=stack(section,'섹션 제목과 제작 사양',80,66,3640,12);
text(header,'제작 제목','캡슐 · 인스타그램 스토리 광고 3종',64,'#221C33',3640,'Black');
text(header,'제작 사양','9:16 / 1080×1920 / 인물 원본 + rooms 포스터 / 카피 수정 가능',30,'#695D7A',3640,'Medium');
const names=['01 · 관계 후킹 — 나에게만 친절한 갸루','02 · 기능 후킹 — 공부로 여는 다음 이야기','03 · 세계관 후킹 — 최애가 있는 스터디룸'];
const frames=[],arts=[],posters=[];
for(let i=0;i<3;i++){
 const x=80+i*1210;
 const label=text(section,'소재 '+(i+1)+' 안내',names[i],31,'#3A2B53',1080,'Bold');label.x=x;label.y=257;
 const f=keep(figma.createFrame());section.appendChild(f);
 f.set({name:names[i]+' | 1080×1920',x,y:330,width:1080,height:1920,clipsContent:true,fills:[paint('#171122')]});
 f.exportSettings=[{format:'PNG',constraint:{type:'SCALE',value:1}},{format:'PNG',suffix:'@1440',constraint:{type:'SCALE',value:4/3}}];
 f.placeholder=true;frames.push(f);
 arts.push(rect(f,'키아트 '+String.fromCharCode(65+i)+' · 생성 배경',0,0,1080,1920,'#211731'));
}
const A=frames[0];
grad(A,'카피 가독성을 위한 상단 톤',0,0,1080,640,[[0,'#2D1928',0.95],[0.7,'#2D1928',0.7],[1,'#2D1928',0]]);
brand(A);
const ah=stack(A,'A 메인 후킹',76,375,928,0);
text(ah,'관계 설정','쌀쌀맞은 갸루가',87,'#FFFFFF',928,'Black');
text(ah,'나에게만 친절한 반전','나에게만 친절하다!',87,'#FFC9EE',928,'Black');
const quote=keep(figma.createAutoLayout('VERTICAL'));A.appendChild(quote);
quote.set({name:'강채린 대사 · 기존 시연 대사 사용',x:76,y:1015,width:928,
 paddingTop:24,paddingBottom:28,paddingLeft:32,paddingRight:32,itemSpacing:10,
 cornerRadius:26,primaryAxisSizingMode:'AUTO',counterAxisSizingMode:'FIXED',fills:[paint('#FCF5FF',0.94)]});
text(quote,'대사 이름','강채린',27,'#865AB4',864,'Bold');
text(quote,'강채린 대사','아 슬슬 집중 안되네,\n너 때문이잖아.',46,'#2C1D39',864,'Bold');
grad(A,'하단 서비스 설명 가독성',0,1195,1080,725,[[0,'#1C1029',0],[0.3,'#1C1029',0.77],[1,'#1C1029',0.94]]);
const ad=stack(A,'A 서비스 설명',76,1258,928,10);
text(ad,'캡슐의 차별점','공부할수록 가까워지는 AI 캠스터디',38,'#FFFFFF',928,'Bold');
text(ad,'궁금증으로 연결','이 다음, 우리 사이는 어떻게 될까?',33,'#E6D7ED',928,'Medium');
const ac=text(A,'네이티브 CTA로 이어지는 안내','아래 ‘더 알아보기’에서 이어서 만나봐요 ↓',32,'#EFDCEA',928,'Medium','CENTER');ac.x=76;ac.y=1450;
const B=frames[1];
grad(B,'카피 가독성을 위한 상단 톤',0,0,1080,640,[[0,'#150E25',0.92],[0.75,'#150E25',0.6],[1,'#150E25',0]]);
brand(B);
const bh=stack(B,'B 메인 후킹',76,375,928,0);
text(bh,'공부의 트리거','공부했더니,',91,'#FFFFFF',928,'Black');
text(bh,'보상의 예고','다음 이야기가 열렸다.',80,'#DCCAFC',928,'Black');
grad(B,'하단 기능 설명 가독성',0,1000,1080,920,[[0,'#150E25',0],[0.24,'#150E25',0.88],[1,'#150E25',0.99]]);
const stages=keep(figma.createAutoLayout('HORIZONTAL'));B.appendChild(stages);
stages.set({name:'공부 → 호감도 → 다음 에피소드',x:76,y:1110,itemSpacing:16,fills:[]});
[['공부 시간','쌓이고'],['호감도','오르고'],['다음 이야기','열리고']].forEach((labels,i)=>{
 const card=keep(figma.createAutoLayout('VERTICAL'));stages.appendChild(card);
 card.set({name:labels[0]+' 단계',width:298,paddingTop:22,paddingBottom:23,paddingLeft:20,paddingRight:20,itemSpacing:7,cornerRadius:24,
 fills:[paint('#292039',0.93)],counterAxisSizingMode:'FIXED',primaryAxisSizingMode:'AUTO',strokes:[paint('#D8C2FF',0.35)],strokeWeight:1});
 text(card,'단계 제목',labels[0],27,'#C9B7E5',258,'Medium','CENTER');
 text(card,'단계 행동',labels[1],42,i===2?'#E0FFB1':'#FFFFFF',258,'Black','CENTER');
});
const bd=stack(B,'B 서비스 설명',76,1300,928,10);
text(bd,'AI 캠스터디 기능','함께 공부하면 호감도가 올라요.',38,'#FFFFFF',928,'Bold');
text(bd,'에피소드 해금','호감도를 채우면 다음 에피소드 OPEN',33,'#CDBFE1',928,'Medium');
const bc=text(B,'네이티브 CTA로 이어지는 안내','아래 ‘더 알아보기’에서 다음 이야기를 확인해요 ↓',31,'#DDCEEF',928,'Medium','CENTER');bc.x=76;bc.y=1460;
const C=frames[2];brand(C);
const ch=stack(C,'C 메인 후킹',76,375,928,0);
text(ch,'최애 세계관 선택','최애가 있는 세계로',87,'#FFFFFF',928,'Black');
text(ch,'공부와 스토리의 결합','공부하러 갑니다.',87,'#D4B9FF',928,'Black');
const coords=[['비밀연등',85,667,265,348,9],['냥냥이',765,698,265,348,-9],['조선 야간학습',75,833,292,385,8],['페네시스 마법학교',746,843,292,385,-8],['갸루짝꿍',340,665,400,526,0]];
for(const [name,x,y,w,h,rot] of coords){
 const n=rect(C,'rooms 포스터 · '+name,x,y,w,h,'#312349',20);n.rotation=rot;
 n.strokes=[paint('#F0E5FF',0.85)];n.strokeWeight=3;
 n.effects=[{type:'DROP_SHADOW',color:{r:0.05,g:0.02,b:0.1,a:0.6},offset:{x:0,y:18},radius:35,visible:true,blendMode:'NORMAL'}];posters.push(n);
}
grad(C,'하단 서비스 설명 가독성',0,1210,1080,710,[[0,'#170D2B',0],[0.25,'#170D2B',0.7],[1,'#170D2B',0.96]]);
const cd=stack(C,'C 서비스 설명',76,1280,928,10);
text(cd,'세계관 설명','내가 고른 세계에서, AI와 함께 공부.',38,'#FFFFFF',928,'Bold');
text(cd,'사전예약 연결','마음에 드는 스터디룸을 골라 사전예약해요.',32,'#D8CBE8',928,'Medium');
const cc=text(C,'네이티브 CTA로 이어지는 안내','당신의 스터디룸은?  더 알아보기 ↓',33,'#E7D7FF',928,'Medium','CENTER');cc.x=76;cc.y=1450;
const notes=stack(section,'제작 근거와 광고 운영 메모',80,2335,3600,12);
text(notes,'소재 운영 안내','추천 시작 소재: 01 / 관계·기능·세계관 3개를 동일 조건으로 비교하세요.',34,'#3A2B53',3600,'Bold');
text(notes,'편집과 안전영역','원본 로고와 rooms 포스터 유지 · 한국어 카피는 편집 가능 · 하단 20%는 네이티브 CTA 여백',28,'#695D7A',3600,'Medium');
text(notes,'소스 안내','참고: 제타 캐릭터 홍보 소재, 크랙 즉흥서사 광고, 스토브 미연시 캠페인 / 성과 수치는 추정하지 않음',26,'#7A6B89',3600,'Regular');
return {createdNodeIds:created,sectionId:section.id,sectionBounds:{x:section.x,y:section.y,width:section.width,height:section.height},
 frameIds:frames.map(n=>n.id),artIds:arts.map(n=>n.id),posterIds:posters.map(n=>n.id),
 textWidths:frames.map(f=>({id:f.id,textCount:f.findAllWithCriteria({types:['TEXT']}).length})),
 status:'카피와 섹션 구성 완료; 생성 키아트와 원본 포스터 업로드 대기'};
