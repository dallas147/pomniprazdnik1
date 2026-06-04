import { auth,db,provider,signInWithPopup,signOut,onAuthStateChanged,browserLocalPersistence,setPersistence,createUserWithEmailAndPassword,signInWithEmailAndPassword,sendPasswordResetEmail,collection,doc,addDoc,setDoc,getDocs,deleteDoc,onSnapshot,query,orderBy } from "./firebase-config.js";

let currentUser=null,people=[],couples=[],personPhotoBase64=null,couplePhotoBase64=null;
const $=id=>document.getElementById(id);

// SETTINGS
function saveNotifSettings(){
  const s={remind7:$('remind-7').checked,remind3:$('remind-3').checked,remind1:$('remind-1').checked,remind0:$('remind-0').checked,time:$('remind-time').value};
  localStorage.setItem('notif_settings',JSON.stringify(s));
}
function loadNotifSettings(){
  try{const s=JSON.parse(localStorage.getItem('notif_settings')||'{}');
    if('remind7'in s)$('remind-7').checked=s.remind7;
    if('remind3'in s)$('remind-3').checked=s.remind3;
    if('remind1'in s)$('remind-1').checked=s.remind1;
    if('remind0'in s)$('remind-0').checked=s.remind0;
    if(s.time)$('remind-time').value=s.time;
  }catch(e){}
}
document.querySelectorAll('#remind-7,#remind-3,#remind-1,#remind-0').forEach(el=>el.addEventListener('change',saveNotifSettings));
$('remind-time').addEventListener('change',saveNotifSettings);

// UTILS
function getInitials(n){return(n||'').trim().split(/\s+/).map(w=>w[0]?.toUpperCase()||'').join('').slice(0,2)}
function avatarColor(n){let h=0;for(const c of(n||''))h=(h*31+c.charCodeAt(0))&0xffffffff;return`av-${Math.abs(h)%8}`}
function avatarHtml(name,photo,cls,size='46px',fs='16px'){
  if(photo)return`<img src="${photo}" class="avatar-photo" style="width:${size};height:${size}" alt="">`;
  return`<div class="avatar-circle ${cls}" style="width:${size};height:${size};font-size:${fs}">${getInitials(name)}</div>`;
}
function formatDate(d){if(!d)return'';const[,m,day]=d.split('-');const mo=['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];return`${parseInt(day)} ${mo[parseInt(m)-1]}`}
function daysUntil(d){if(!d)return 999;const now=new Date();now.setHours(0,0,0,0);const[,m,day]=d.split('-');const next=new Date(now.getFullYear(),parseInt(m)-1,parseInt(day));if(next<now)next.setFullYear(now.getFullYear()+1);return Math.round((next-now)/86400000)}
function ageOn(d){if(!d)return null;const y=parseInt(d.split('-')[0]);const age=new Date().getFullYear()-y;return age>0?age:null}
function yearsMarried(d){if(!d)return'';return new Date().getFullYear()-parseInt(d.split('-')[0])}
function daysBadge(days){
  if(days===0)return`<span class="days-badge days-today">Сегодня 🎉</span>`;
  if(days===1)return`<span class="days-badge days-soon">Завтра</span>`;
  if(days<=7)return`<span class="days-badge days-soon">${days} дн.</span>`;
  if(days<=30)return`<span class="days-badge days-near">${days} дн.</span>`;
  return`<span class="days-badge days-far">${formatDate(null)||days+' дн.'}</span>`;
}
function daysText(days){
  if(days===0)return'Сегодня';
  if(days===1)return'Завтра';
  if(days<=30)return`Через ${days} дня`;
  return formatDate(null);
}
function showToast(msg){const t=$('toast');t.textContent=msg;t.classList.remove('hidden');t.classList.add('show');setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.classList.add('hidden'),300)},2500)}
const MONTHS_FULL=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

function getZodiac(d){if(!d)return'';const[,m,day]=d.split('-').map(Number);const s=[[1,20,'Козерог','♑'],[2,19,'Водолей','♒'],[3,21,'Рыбы','♓'],[4,20,'Овен','♈'],[5,21,'Телец','♉'],[6,21,'Близнецы','♊'],[7,23,'Рак','♋'],[8,23,'Лев','♌'],[9,23,'Дева','♍'],[10,23,'Весы','♎'],[11,22,'Скорпион','♏'],[12,22,'Стрелец','♐']];for(const[mo,dy,name,sym]of s)if(m===mo&&day<dy)return sym+' '+name;const next=s.find(x=>x[0]===(m%12)+1);return next?next[3]+' '+next[2]:''}

function getCongratKey(id){return`congrat_${currentUser?.uid}_${new Date().getFullYear()}_${id}`}
function isCongratulated(id){return localStorage.getItem(getCongratKey(id))==='1'}
function setCongratulated(id){localStorage.setItem(getCongratKey(id),'1');renderAll()}

// GIFT IDEAS
const GIFT_IDEAS=['Беспроводные наушники','Умная колонка','Портативная зарядка','Электронная книга','Смарт-часы','Подписка на стриминг','Онлайн-курс','Мастер-класс','Сертификат в ресторан','Spa-сертификат','Набор для йоги','Кофемашина','Ароматические свечи','Фотокнига','Именной постер','Корзина с деликатесами','Бутылка хорошего вина','Коробка шоколада','Торт на заказ','Билеты в театр','Билеты на концерт','Квест-комната','Картинг','Фотосессия','Урок живописи','Урок кулинарии','Массаж','Флоатинг','Персональная тренировка','Абонемент в спортзал','Велосипед','Самокат','Рюкзак для путешествий','Чемодан','Кошелёк','Солнечные очки','Шарф из кашемира','Тёплый плед','Ночник','Комнатное растение','Настольная игра','Книга-бестселлер','Набор для рисования','Скетчбук','Умный будильник','Проектор','Мини-принтер для фото','Экшн-камера','Набор специй','Кулинарная книга','Барбекю набор','Пикник набор','Беспроводная зарядка','Набор для чайной церемонии','Кофе в зёрнах премиум','Дегустация вин','Мастер-класс по шоколаду','Экскурсия по городу','Морская прогулка','Набор для медитации','Гамак','Умная лампа','VR-очки','Акварель','Лепка из глины','Мыловарение набор'];
function getDailyGiftIdeas(){const idx=Math.floor(Date.now()/86400000);const offset=idx%GIFT_IDEAS.length;const r=[];for(let i=0;i<5;i++)r.push(GIFT_IDEAS[(offset+i*17)%GIFT_IDEAS.length]);return r}

// GREETING TEMPLATES
const GREETINGS_FRIEND = [
  `Дорогой {name}! 🎉 Сегодня твой особенный день, и я хочу пожелать тебе только самого лучшего. Пусть этот год принесёт тебе море радости, новых открытий и исполнения самых заветных желаний. Ты заслуживаешь всего самого прекрасного! С днём рождения! 🎂`,
  `{name}, с днём рождения! 🥳 Желаю тебе в этот день улыбаться так широко, чтобы все вокруг заряжались твоим настроением. Пусть рядом будут только те, кто по-настоящему ценит тебя, а жизнь дарит только приятные сюрпризы!`,
  `С праздником, {name}! 🎈 Пусть каждый новый год жизни будет ярче и насыщеннее предыдущего. Желаю тебе здоровья, вдохновения и того особенного чувства, когда понимаешь — всё идёт именно так, как надо. Ты молодец!`,
  `{name}, сегодня твой день! ✨ Желаю тебе смелости воплощать мечты, сил двигаться вперёд и людей рядом, которые поддержат в любой момент. Пусть этот год станет одним из лучших в твоей жизни!`,
  `С днём рождения, {name}! 🌟 Ты один из тех людей, рядом с которыми всегда тепло. Желаю тебе ещё больше счастливых моментов, путешествий, открытий и, конечно, здоровья. Пусть всё задуманное сбывается!`
];

const GREETINGS_FAMILY = [
  `Дорогой {name}! 💕 В этот особенный день хочу сказать, как много ты значишь для нашей семьи. Желаю тебе крепкого здоровья, душевного тепла и всего, о чём мечтаешь. Ты наша гордость и опора! С днём рождения!`,
  `{name}, с днём рождения! 🌸 Желаю тебе долгих лет, здоровья и того особенного семейного счастья, когда рядом любимые люди. Пусть каждый день приносит радость, а дом всегда будет полон тепла и смеха!`,
  `С праздником, {name}! 🏡 Ты — особенный человек в нашей жизни, и мы очень рады, что ты есть. Желаю тебе здоровья, долголетия, мира в душе и исполнения всех желаний. Любим и ценим тебя!`,
  `Родной {name}, с днём рождения! ❤️ Пусть этот день будет наполнен теплом и заботой близких. Желаю тебе здоровья — это самое главное, а ещё радости, уюта и всего, что делает тебя счастливым!`
];

const GREETINGS_COLLEAGUE = [
  `{name}, с днём рождения! 🎊 Желаю тебе профессиональных побед, интересных проектов и коллег, с которыми приятно работать. Пусть каждый рабочий день приносит удовольствие, а результаты труда радуют! Успехов во всём!`,
  `С праздником, {name}! 💼 Работать рядом с тобой — одно удовольствие. Желаю тебе карьерных высот, признания твоих заслуг и, конечно, отличного баланса между работой и личной жизнью. С днём рождения!`,
  `{name}, поздравляю с днём рождения! 🌟 Желаю тебе вдохновения в работе, интересных задач и достойного вознаграждения за твой труд. Пусть этот год принесёт новые возможности и приятные перемены!`
];

const GREETINGS_CLIENT = [
  `Уважаемый {name}, от всей души поздравляю вас с днём рождения! 🎉 Желаю вам крепкого здоровья, процветания и исполнения всех деловых и личных планов. Пусть этот год будет полон успехов и радостных событий!`,
  `{name}, с днём рождения! Желаю вам успехов в делах, надёжных партнёров и отличного настроения каждый день. Пусть этот праздничный день зарядит вас энергией на весь год вперёд! 🌟`,
  `Дорогой {name}, поздравляю с днём рождения! 🎂 Желаю вам здоровья, благополучия и достижения всех намеченных целей. Пусть каждый день приносит только хорошие новости!`
];

const GREETINGS_OTHER = [
  `{name}, с днём рождения! 🎉 Желаю тебе всего самого лучшего — здоровья, счастья, любви и исполнения желаний. Пусть этот день будет особенным, а год — удачным во всём!`,
  `С праздником, {name}! ✨ Пусть в этот день тебя окружают только добрые люди и приятные сюрпризы. Желаю тебе энергии, вдохновения и большого личного счастья!`,
  `{name}, сердечно поздравляю с днём рождения! 🌸 Желаю крепкого здоровья, радостных событий и всего, о чём мечтаешь. Пусть каждый день приносит поводы для улыбки!`
];

const GREETINGS_WEDDING = [
  `Дорогие {name}! 💍 Поздравляю вас с годовщиной свадьбы! Пусть ваша любовь становится крепче с каждым годом, а совместная жизнь наполняется новыми радостными моментами. Желаю вам взаимопонимания, нежности и долгих счастливых лет вместе!`,
  `{name}, с годовщиной! 💕 Желаю вам сохранить то тепло и заботу, которые вы дарите друг другу. Пусть в вашем доме всегда царят мир, любовь и смех. С каждым годом пусть вы становитесь ещё ближе!`,
  `С праздником, {name}! 🌹 Ваш союз — это пример настоящей любви и взаимной поддержки. Желаю вам ещё много счастливых годовщин, здоровья и исполнения всех совместных мечтаний!`
];

const GREETINGS_YOUNG = [
  `{name}, с днём рождения! 🎈 Столько всего интересного ещё впереди! Желаю тебе ярких приключений, настоящих друзей и смелости быть собой. Пусть каждый день приносит что-то новое и восхитительное!`,
  `С праздником, {name}! 🚀 Желаю тебе дерзких мечтаний и сил их воплощать. Впереди столько возможностей — лови каждую! Будь счастлив, здоров и окружён людьми, которые верят в тебя!`,
  `{name}, с днём рождения! ⭐ Желаю тебе энергии на все задумки, смелости на новые шаги и удачи во всех начинаниях. Ты в самом начале большого пути — и это здорово!`
];

const GREETINGS_MATURE = [
  `Дорогой {name}, с днём рождения! 🌟 Вы — пример мудрости, опыта и душевной щедрости. Желаю вам крепкого здоровья, душевного покоя и радости от каждого прожитого дня. Пусть рядом будут любящие люди!`,
  `{name}, с праздником! 🌸 Желаю вам здоровья — это главное. А ещё — тепла близких, ярких воспоминаний и поводов радоваться каждый день. Вы заслуживаете всего самого лучшего!`,
  `С днём рождения, {name}! 💫 Мудрость и душевная теплота — ваши лучшие качества. Желаю вам долгих лет, здоровья и счастья рядом с теми, кого любите!`
];

function generateGreeting(person) {
  const age = ageOn(person.birthday);
  const name = person.name.split(' ')[0]; // first name only
  const type = person.type || 'birthday';
  
  let pool;
  if (type === 'wedding') {
    pool = GREETINGS_WEDDING;
  } else if (age && age < 25) {
    pool = GREETINGS_YOUNG;
  } else if (age && age >= 60) {
    pool = GREETINGS_MATURE;
  } else if (person.category === 'family' || person.category === 'relative') {
    pool = GREETINGS_FAMILY;
  } else if (person.category === 'colleague') {
    pool = GREETINGS_COLLEAGUE;
  } else if (person.category === 'client') {
    pool = GREETINGS_CLIENT;
  } else {
    pool = GREETINGS_FRIEND;
  }

  // Pick random, but different each time using date+name seed
  const seed = (person.id || name).split('').reduce((a,c)=>a+c.charCodeAt(0),0);
  const dayOffset = Math.floor(Date.now() / 3600000); // changes hourly = different each regenerate
  const idx = (seed + dayOffset) % pool.length;
  const text = pool[idx].replace(/{name}/g, name);

  // Show in modal
  $('ai-loading').style.display = 'none';
  $('ai-result').textContent = text;
  $('ai-result').style.display = 'block';
  $('ai-actions').style.display = 'flex';
  $('ai-modal').classList.remove('hidden');
  
  $('ai-copy-btn').onclick = () => { navigator.clipboard.writeText(text); showToast('✅ Скопировано!'); };
  $('ai-regenerate-btn').onclick = () => {
    // Force next template
    const nextIdx = (idx + 1) % pool.length;
    const nextText = pool[nextIdx].replace(/{name}/g, name);
    $('ai-result').textContent = nextText;
    $('ai-copy-btn').onclick = () => { navigator.clipboard.writeText(nextText); showToast('✅ Скопировано!'); };
  };
}

// PHOTO
function compressImage(file,maxW,q,cb){const r=new FileReader();r.onload=e=>{const img=new Image();img.onload=()=>{const c=document.createElement('canvas');let w=img.width,h=img.height;if(w>maxW){h=Math.round(h*maxW/w);w=maxW;}c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);cb(c.toDataURL('image/jpeg',q))};img.src=e.target.result};r.readAsDataURL(file)}
function setupPhotoUpload(inId,prevId,clrId,onSet){
  const inp=$(inId),prev=$(prevId),clr=$(clrId);
  inp.addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;if(f.size>10000000){showToast('Фото слишком большое');return}compressImage(f,600,.75,b=>{onSet(b);prev.innerHTML=`<img src="${b}" alt="">`;clr.style.display='block'})});
  clr.addEventListener('click',()=>{onSet(null);prev.innerHTML=`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;clr.style.display='none';inp.value=''});
}

// AUTH
$('google-signin-btn').addEventListener('click',async()=>{try{await setPersistence(auth,browserLocalPersistence);await signInWithPopup(auth,provider)}catch(e){showToast('Ошибка: '+e.message)}});
$('email-signin-btn').addEventListener('click',async()=>{const email=$('auth-email').value.trim(),pass=$('auth-password').value;if(!email||!pass){showToast('Введите email и пароль');return}try{await setPersistence(auth,browserLocalPersistence);await signInWithEmailAndPassword(auth,email,pass)}catch(e){const m={'auth/user-not-found':'Пользователь не найден','auth/wrong-password':'Неверный пароль','auth/invalid-credential':'Неверный email или пароль'};showToast(m[e.code]||'Ошибка: '+e.message)}});
$('email-signup-btn').addEventListener('click',async()=>{const email=$('auth-email').value.trim(),pass=$('auth-password').value;if(!email||!pass){showToast('Введите email и пароль');return}if(pass.length<6){showToast('Пароль минимум 6 символов');return}try{await setPersistence(auth,browserLocalPersistence);await createUserWithEmailAndPassword(auth,email,pass)}catch(e){const m={'auth/email-already-in-use':'Email уже используется','auth/weak-password':'Слишком простой пароль'};showToast(m[e.code]||'Ошибка: '+e.message)}});
$('forgot-btn').addEventListener('click',async()=>{const email=$('auth-email').value.trim();if(!email){showToast('Введите email');return}try{await sendPasswordResetEmail(auth,email);showToast('📧 Письмо отправлено')}catch(e){showToast('Ошибка: '+e.message)}});
$('signout-btn').addEventListener('click',()=>signOut(auth));

onAuthStateChanged(auth,user=>{
  $('splash').classList.add('hidden');
  if(user){currentUser=user;$('auth-screen').classList.add('hidden');$('app').classList.remove('hidden');setupUserAvatar(user);loadData();loadNotifSettings();scheduleNotificationCheck();}
  else{currentUser=null;people=[];couples=[];$('auth-screen').classList.remove('hidden');$('app').classList.add('hidden');}
});
function setupUserAvatar(u){
  if(u.photoURL){$('user-avatar').src=u.photoURL;$('user-avatar').style.display='block';$('user-icon').style.display='none';}
  $('account-info').innerHTML=`${u.photoURL?`<img src="${u.photoURL}" width="32" height="32">`:''}
    <div><div style="font-weight:600;color:var(--text)">${u.displayName||u.email||''}</div><div style="font-size:12px;color:var(--text2)">${u.email||''}</div></div>`;
}

// FIRESTORE
function col(n){return collection(db,'users',currentUser.uid,n)}
function loadData(){
  onSnapshot(query(col('people'),orderBy('name')),snap=>{people=snap.docs.map(d=>({id:d.id,...d.data()}));renderAll()});
  onSnapshot(query(col('couples'),orderBy('name1')),snap=>{couples=snap.docs.map(d=>({id:d.id,...d.data()}));renderAll()});
}
async function savePerson(data){if(data.id){const{id,...r}=data;await setDoc(doc(db,'users',currentUser.uid,'people',id),r)}else await addDoc(col('people'),data)}
async function deletePerson(id){await deleteDoc(doc(db,'users',currentUser.uid,'people',id))}
async function saveCouple(data){if(data.id){const{id,...r}=data;await setDoc(doc(db,'users',currentUser.uid,'couples',id),r)}else await addDoc(col('couples'),data)}
async function deleteCouple(id){await deleteDoc(doc(db,'users',currentUser.uid,'couples',id))}

// RENDER HOME
function renderHome(filter=''){
  renderKPI();
  renderTodayHero();
  renderNearestHero();
  renderUpcomingList(filter);
  renderGiftWidget();
}

function renderKPI(){
  const now=new Date(),month=now.getMonth()+1;
  const allEvents=[...people.map(p=>({date:p.birthday})),...couples.map(c=>({date:c.wedding}))];
  const inMonth=allEvents.filter(e=>{if(!e.date)return false;const[,m]=e.date.split('-');return parseInt(m)===month});
  const today=now.getDate();
  const past=inMonth.filter(e=>{const[,m,d]=e.date.split('-').map(Number);return m===month&&d<today}).length;
  const ahead=inMonth.length-past;
  const strip=$('kpi-strip');
  if(!inMonth.length){strip.classList.add('hidden');return}
  strip.classList.remove('hidden');
  strip.innerHTML=`
    <div class="kpi-box"><div class="kpi-num">${inMonth.length}</div><div class="kpi-label">в ${['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'][month-1]}</div></div>
    <div class="kpi-box"><div class="kpi-num pink">${past}</div><div class="kpi-label">прошло</div></div>
    <div class="kpi-box"><div class="kpi-num green">${ahead}</div><div class="kpi-label">впереди</div></div>`;
}

function renderTodayHero(){
  const todayP=people.filter(p=>daysUntil(p.birthday)===0);
  const todayC=couples.filter(c=>daysUntil(c.wedding)===0);
  const block=$('today-block');
  if(!todayP.length&&!todayC.length){block.classList.add('hidden');return}
  block.classList.remove('hidden');
  let html='';
  [...todayP.map(p=>({type:'birthday',name:p.name,id:p.id})),...todayC.map(c=>({type:'wedding',name:`${c.name1} & ${c.name2}`,id:c.id}))].forEach(ev=>{
    const done=isCongratulated(ev.id);
    const icon=ev.type==='birthday'?'🎂':'💍';
    html+=`<div class="today-hero-label">${icon} ${ev.type==='birthday'?'День рождения сегодня':'Годовщина сегодня'}</div>
    <div class="today-hero-name">${ev.name}</div>
    <div class="today-hero-actions">
      <button class="today-btn ${done?'done':''}" data-id="${ev.id}">${done?'✓ Поздравил':'🎉 Поздравить'}</button>
      ${ev.type==='birthday'?`<button class="today-btn" data-ai="${ev.id}">✨ Текст поздравления</button>`:''}
    </div>`;
  });
  block.innerHTML=html;
  block.querySelectorAll('[data-id]').forEach(btn=>btn.addEventListener('click',()=>setCongratulated(btn.dataset.id)));
  block.querySelectorAll('[data-ai]').forEach(btn=>btn.addEventListener('click',()=>{const p=people.find(x=>x.id===btn.dataset.ai);if(p){$('ai-modal-title').textContent='✨ Поздравление для '+p.name;generateGreeting(p);}}));
}

function renderNearestHero(){
  const allEvents=[
    ...people.filter(p=>p.birthday&&daysUntil(p.birthday)>0).map(p=>({type:'birthday',name:p.name,days:daysUntil(p.birthday),date:p.birthday,data:p})),
    ...couples.filter(c=>c.wedding&&daysUntil(c.wedding)>0).map(c=>({type:'wedding',name:`${c.name1} & ${c.name2}`,days:daysUntil(c.wedding),date:c.wedding,data:c}))
  ].sort((a,b)=>a.days-b.days);
  const hero=$('nearest-hero');
  if(!allEvents.length){hero.classList.add('hidden');return}
  hero.classList.remove('hidden');
  const ev=allEvents[0];
  const color=avatarColor(ev.name);
  const ava=ev.data.photo?`<img src="${ev.data.photo}" class="nearest-avatar" alt="">`:`<div class="nearest-avatar circle ${color}">${getInitials(ev.name)}</div>`;
  const progressPct=Math.max(5,Math.min(95,Math.round((1-ev.days/365)*100)));
  const done=isCongratulated(ev.data.id);
  const icon=ev.type==='birthday'?'🎂':'💍';
  hero.innerHTML=`
    <div class="nearest-label">⭐ Ближайший праздник</div>
    <div class="nearest-content">
      ${ava}
      <div class="nearest-info">
        <div class="nearest-name">${ev.name}</div>
        <div class="nearest-date">${icon} ${formatDate(ev.date)}${ev.type==='birthday'&&ageOn(ev.date)?' · '+ageOn(ev.date)+' лет':''}</div>
      </div>
      <div class="nearest-badge">${ev.days===1?'Завтра':'через '+ev.days+' дн.'}</div>
    </div>
    <div class="nearest-progress"><div class="nearest-progress-fill" style="width:${progressPct}%"></div></div>
    ${ev.days<=7&&!done?`<button class="nearest-congrat-btn" id="nearest-congrat-btn">🎉 Поздравить</button>`:''}
    ${done?`<div style="margin-top:10px;font-size:13px;color:#22c55e;font-weight:600;text-align:center">✓ Уже поздравил</div>`:''}`;
  hero.querySelector('.nearest-content')?.addEventListener('click',()=>{if(ev.type==='birthday')openViewPerson(ev.data);else openViewCouple(ev.data)});
  $('nearest-congrat-btn')?.addEventListener('click',()=>setCongratulated(ev.data.id));
}

function renderUpcomingList(filter=''){
  const list=$('upcoming-list');if(!list)return;
  let all=[
    ...people.filter(p=>p.birthday&&daysUntil(p.birthday)>=0).map(p=>({type:'birthday',name:p.name,days:daysUntil(p.birthday),date:p.birthday,data:p})),
    ...couples.filter(c=>c.wedding&&daysUntil(c.wedding)>=0).map(c=>({type:'wedding',name:`${c.name1} & ${c.name2}`,days:daysUntil(c.wedding),date:c.wedding,data:c}))
  ].sort((a,b)=>a.days-b.days);
  if(filter)all=all.filter(e=>e.name.toLowerCase().includes(filter.toLowerCase()));
  if(!all.length){list.innerHTML=filter?`<div class="empty-state"><span class="empty-icon">🔍</span><p>Ничего не найдено</p></div>`:`<div class="empty-state"><span class="empty-icon">🎉</span><p>Добавьте первого человека,<br>чтобы видеть предстоящие события</p></div>`;return}
  const groups={today:all.filter(e=>e.days===0),week:all.filter(e=>e.days>0&&e.days<=7),month:all.filter(e=>e.days>7&&e.days<=30),later:all.filter(e=>e.days>30)};
  let html='';
  for(const{key,label}of[{key:'today',label:'Сегодня'},{key:'week',label:'На этой неделе'},{key:'month',label:'В этом месяце'},{key:'later',label:'Позже'}]){
    if(!groups[key].length)continue;
    html+=`<div class="event-section-label">${label}</div>`;
    for(const ev of groups[key]){
      const col=avatarColor(ev.name),ava=avatarHtml(ev.type==='birthday'?ev.data.name:ev.data.name1,ev.data.photo,col);
      const icon=ev.type==='birthday'?'🎂':'💍';
      const age=ev.type==='birthday'&&ageOn(ev.data.birthday)?` · ${ageOn(ev.data.birthday)} лет`:'';
      const done=isCongratulated(ev.data.id);
      const congratBtn=ev.days<=7?`<button class="congrat-btn ${done?'done':'undone'}" data-id="${ev.data.id}">${done?'✓':'Поздравить'}</button>`:'';
      html+=`<div class="event-card" data-type="${ev.type}" data-id="${ev.data.id}">
        ${ava}<div class="event-info"><div class="event-name">${icon} ${ev.name}</div><div class="event-meta">${formatDate(ev.date)}${age}</div></div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0">${daysBadge(ev.days)}${congratBtn}</div>
      </div>`;
    }
  }
  list.innerHTML=html;
  list.querySelectorAll('.event-card').forEach(card=>{
    card.addEventListener('click',e=>{if(e.target.closest('.congrat-btn'))return;const{type,id}=card.dataset;if(type==='birthday')openViewPerson(people.find(p=>p.id===id));else openViewCouple(couples.find(c=>c.id===id))});
  });
  list.querySelectorAll('.congrat-btn').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();setCongratulated(btn.dataset.id)}));
}

function renderGiftWidget(){
  const s=$('gift-ideas-section'),l=$('gift-ideas-list');if(!s||!l)return;
  s.style.display='block';
  const ideas=getDailyGiftIdeas();
  l.innerHTML=`<div class="gift-daily-wrap"><div class="gift-daily-subtitle">Обновляются каждый день</div><div class="gift-daily-grid">${ideas.map(i=>`<div class="gift-daily-chip">🎁 ${i}</div>`).join('')}</div></div>`;
}

// CALENDAR TAB
function renderCalendar(){
  const now=new Date(),year=now.getFullYear(),month=now.getMonth();
  const lbl=$('calendar-month-label');if(lbl)lbl.textContent=MONTHS_FULL[month]+' '+year;
  const birthdayDays=new Map(),weddingDays=new Map();
  people.forEach(p=>{if(!p.birthday)return;const[,m,d]=p.birthday.split('-').map(Number);if(m===month+1){if(!birthdayDays.has(d))birthdayDays.set(d,[]);birthdayDays.get(d).push(p.name)}});
  couples.forEach(c=>{if(!c.wedding)return;const[,m,d]=c.wedding.split('-').map(Number);if(m===month+1){if(!weddingDays.has(d))weddingDays.set(d,[]);weddingDays.get(d).push(`${c.name1} & ${c.name2}`)}});
  const firstDay=new Date(year,month,1).getDay(),startOffset=firstDay===0?6:firstDay-1;
  const daysInMonth=new Date(year,month+1,0).getDate(),today=now.getDate();
  let html='';
  for(let i=0;i<startOffset;i++)html+=`<div class="cal-cell other-month"></div>`;
  for(let d=1;d<=daysInMonth;d++){
    let cls='cal-cell';
    if(d===today)cls+=' today';
    else if(birthdayDays.has(d))cls+=' has-birthday';
    else if(weddingDays.has(d))cls+=' has-wedding';
    html+=`<div class="${cls}" data-day="${d}">${d}</div>`;
  }
  const grid=$('mini-cal-grid');if(!grid)return;
  grid.innerHTML=html;
  grid.querySelectorAll('.cal-cell').forEach(cell=>{
    const d=parseInt(cell.dataset.day);if(!d)return;
    const bnames=birthdayDays.get(d),wnames=weddingDays.get(d);
    if(!bnames&&!wnames)return;
    cell.style.cursor='pointer';
    cell.addEventListener('click',()=>{
      $('cal-popup-title').textContent=`📅 ${d} ${['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'][month]}`;
      let html='';
      (bnames||[]).forEach(name=>{const p=people.find(x=>x.name===name);const col=avatarColor(name);const ava=p?.photo?`<img src="${p.photo}" class="avatar-photo" style="width:40px;height:40px" alt="">` :`<div class="avatar-circle ${col}" style="width:40px;height:40px;font-size:14px">${getInitials(name)}</div>`;html+=`<div class="cal-popup-row" data-id="${p?.id}" data-type="birthday">${ava}<div><div style="font-weight:600;font-size:15px">${name}</div><div style="font-size:13px;color:var(--text2)">🎂 День рождения${p&&ageOn(p.birthday)?' · '+ageOn(p.birthday)+' лет':''}</div></div></div>`});
      (wnames||[]).forEach(name=>{const c=couples.find(x=>`${x.name1} & ${x.name2}`===name);const col=avatarColor(name);html+=`<div class="cal-popup-row" data-id="${c?.id}" data-type="wedding"><div class="avatar-circle ${col}" style="width:40px;height:40px;font-size:14px">${getInitials(name)}</div><div><div style="font-weight:600;font-size:15px">${name}</div><div style="font-size:13px;color:var(--text2)">💍 Годовщина · ${c?yearsMarried(c.wedding)+' лет':''}</div></div></div>`});
      $('cal-popup-body').innerHTML=html;$('cal-popup').classList.remove('hidden');
      $('cal-popup-body').querySelectorAll('.cal-popup-row').forEach(row=>row.addEventListener('click',()=>{$('cal-popup').classList.add('hidden');if(row.dataset.type==='birthday')openViewPerson(people.find(p=>p.id===row.dataset.id));else openViewCouple(couples.find(c=>c.id===row.dataset.id))}));
    });
  });
  // Also render upcoming events list on calendar tab
  const calList=$('cal-events-list');if(calList){
    const all=[...people.filter(p=>p.birthday&&daysUntil(p.birthday)>=0).map(p=>({type:'birthday',name:p.name,days:daysUntil(p.birthday),date:p.birthday,data:p})),...couples.filter(c=>c.wedding&&daysUntil(c.wedding)>=0).map(c=>({type:'wedding',name:`${c.name1} & ${c.name2}`,days:daysUntil(c.wedding),date:c.wedding,data:c}))].sort((a,b)=>a.days-b.days).slice(0,10);
    if(!all.length){calList.innerHTML='';return}
    calList.innerHTML=`<div class="home-section-title" style="margin-top:8px">Ближайшие события</div>`+all.map(ev=>{const col=avatarColor(ev.name),ava=avatarHtml(ev.type==='birthday'?ev.data.name:ev.data.name1,ev.data.photo,col);const icon=ev.type==='birthday'?'🎂':'💍';return`<div class="event-card" style="margin-bottom:8px" data-type="${ev.type}" data-id="${ev.data.id}">${ava}<div class="event-info"><div class="event-name">${icon} ${ev.name}</div><div class="event-meta">${formatDate(ev.date)}</div></div>${daysBadge(ev.days)}</div>`}).join('');
    calList.querySelectorAll('.event-card').forEach(card=>card.addEventListener('click',()=>{const{type,id}=card.dataset;if(type==='birthday')openViewPerson(people.find(p=>p.id===id));else openViewCouple(couples.find(c=>c.id===id))}));
  }
}

// PEOPLE
function renderPeople(filter=''){
  const list=$('people-list');
  const catLabels={friend:'Друг',relative:'Родственник',colleague:'Коллега',client:'Клиент',family:'Семья',other:'Другое'};
  const items=people.filter(p=>!filter||p.name.toLowerCase().includes(filter.toLowerCase()));
  if(!items.length){list.innerHTML=filter?`<div class="empty-state"><span class="empty-icon">🔍</span><p>Ничего не найдено</p></div>`:`<div class="empty-state"><span class="empty-icon">👤</span><p>Нажмите <strong>+</strong> чтобы добавить человека</p></div>`;return}
  list.innerHTML=items.map(p=>{
    const days=daysUntil(p.birthday),col=avatarColor(p.name),ava=avatarHtml(p.name,p.photo,col);
    const age=ageOn(p.birthday);
    const daysStr=days===0?'Сегодня 🎉':days===1?'Завтра':days<=30?`Через ${days} дн.`:formatDate(p.birthday);
    const zodiac=getZodiac(p.birthday);
    return`<div class="person-card" data-id="${p.id}" style="padding-right:44px">
      ${ava}<div class="card-info">
        <div class="card-name">${p.name}</div>
        <div class="card-sub">${catLabels[p.category]||''}${age?' · '+age+' лет':''}${zodiac?` <span class="zodiac-badge">${zodiac}</span>`:''}</div>
        <div style="font-size:12px;color:var(--brand-purple);font-weight:600;margin-top:3px">${daysStr}</div>
      </div>
      <button class="card-menu-btn" data-id="${p.id}">⋯</button>
    </div>`;
  }).join('');
  list.querySelectorAll('.person-card').forEach(card=>{
    card.addEventListener('click',e=>{if(e.target.closest('.card-menu-btn'))return;openViewPerson(people.find(p=>p.id===card.dataset.id))});
    card.querySelector('.card-menu-btn')?.addEventListener('click',e=>{e.stopPropagation();openPersonMenu(people.find(p=>p.id===card.dataset.id))});
  });
}

// COUPLES
function renderCouples(){
  const list=$('couples-list');
  if(!couples.length){list.innerHTML=`<div class="empty-state"><span class="empty-icon">💍</span><p>Нажмите <strong>+</strong> чтобы добавить пару</p></div>`;return}
  list.innerHTML=couples.map(c=>{
    const days=daysUntil(c.wedding),fullName=`${c.name1} & ${c.name2}${c.surname?' '+c.surname:''}`;
    const col1=avatarColor(c.name1),col2=avatarColor(c.name2);
    const ava1=c.photo?`<img src="${c.photo}" class="avatar-photo" style="width:38px;height:38px" alt="">` :`<div class="avatar-circle ${col1}" style="width:38px;height:38px;font-size:13px">${getInitials(c.name1)}</div>`;
    const ava2=`<div class="avatar-circle ${col2}" style="width:38px;height:38px;font-size:13px;margin-left:-12px;border:2px solid #fff">${getInitials(c.name2)}</div>`;
    return`<div class="couple-card-item" data-id="${c.id}" style="padding-right:44px">
      <div class="couple-avatars">${ava1}${ava2}</div>
      <div class="card-info"><div class="card-name">${fullName}</div><div class="card-sub">💍 ${formatDate(c.wedding)} · ${yearsMarried(c.wedding)} лет вместе</div></div>
      ${daysBadge(days)}<button class="card-menu-btn" data-id="${c.id}">⋯</button>
    </div>`;
  }).join('');
  list.querySelectorAll('.couple-card-item').forEach(card=>{
    card.addEventListener('click',e=>{if(e.target.closest('.card-menu-btn'))return;openViewCouple(couples.find(c=>c.id===card.dataset.id))});
    card.querySelector('.card-menu-btn')?.addEventListener('click',e=>{e.stopPropagation();openCoupleMenu(couples.find(c=>c.id===card.dataset.id))});
  });
}

function renderAll(){
  renderHome($('home-search')?.value||'');
  renderPeople($('people-search').value);
  renderCouples();
  if(document.querySelector('[data-tab="calendar"]')?.classList.contains('active')||$('tab-calendar')?.classList.contains('active'))renderCalendar();
}

// ACTION MENUS
function openPersonMenu(p){
  $('action-menu-body').innerHTML=`
    <div class="action-menu-item" id="am-view"><span class="action-menu-icon">👤</span>Открыть карточку</div>
    <div class="action-menu-item" id="am-ai"><span class="action-menu-icon">✨</span>Сгенерировать поздравление</div>
    ${p.phone?`<div class="action-menu-item" id="am-call"><span class="action-menu-icon">📞</span>Позвонить</div>`:''}
    ${p.telegram?`<div class="action-menu-item" id="am-tg"><span class="action-menu-icon">✈️</span>Написать в Telegram</div>`:''}
    <div class="action-menu-item" id="am-edit"><span class="action-menu-icon">✏️</span>Редактировать</div>
    <div class="action-menu-item danger" id="am-del"><span class="action-menu-icon">🗑</span>Удалить</div>`;
  $('action-menu').classList.remove('hidden');
  $('am-view').onclick=()=>{$('action-menu').classList.add('hidden');openViewPerson(p)};
  $('am-ai').onclick=()=>{$('action-menu').classList.add('hidden');$('ai-modal-title').textContent='✨ Поздравление для '+p.name;generateGreeting(p)};
  $('am-call')?.addEventListener('click',()=>{window.location.href='tel:'+p.phone;$('action-menu').classList.add('hidden')});
  $('am-tg')?.addEventListener('click',()=>{window.open('https://t.me/'+p.telegram,'_blank');$('action-menu').classList.add('hidden')});
  $('am-edit').onclick=()=>{$('action-menu').classList.add('hidden');openPersonModal(p)};
  $('am-del').onclick=async()=>{if(!confirm('Удалить '+p.name+'?'))return;await deletePerson(p.id);$('action-menu').classList.add('hidden');showToast('🗑 Удалено')};
}
function openCoupleMenu(c){
  $('action-menu-body').innerHTML=`
    <div class="action-menu-item" id="am-view"><span class="action-menu-icon">💍</span>Открыть карточку</div>
    ${c.phone?`<div class="action-menu-item" id="am-call"><span class="action-menu-icon">📞</span>Позвонить</div>`:''}
    <div class="action-menu-item" id="am-edit"><span class="action-menu-icon">✏️</span>Редактировать</div>
    <div class="action-menu-item danger" id="am-del"><span class="action-menu-icon">🗑</span>Удалить</div>`;
  $('action-menu').classList.remove('hidden');
  $('am-view').onclick=()=>{$('action-menu').classList.add('hidden');openViewCouple(c)};
  $('am-call')?.addEventListener('click',()=>{window.location.href='tel:'+c.phone;$('action-menu').classList.add('hidden')});
  $('am-edit').onclick=()=>{$('action-menu').classList.add('hidden');openCoupleModal(c)};
  $('am-del').onclick=async()=>{if(!confirm('Удалить пару?'))return;await deleteCouple(c.id);$('action-menu').classList.add('hidden');showToast('🗑 Удалено')};
}
$('action-menu-overlay').addEventListener('click',()=>$('action-menu').classList.add('hidden'));

// VIEW MODALS
let viewingPerson=null,viewingCouple=null;
function openViewPerson(person){
  if(!person)return;viewingPerson=person;
  $('view-person-name').textContent=person.name;
  const days=daysUntil(person.birthday),col=avatarColor(person.name);
  const catLabels={friend:'Друг',relative:'Родственник',colleague:'Коллега',client:'Клиент',family:'Семья',other:'Другое'};
  const ava=person.photo?`<img src="${person.photo}" class="avatar-photo" style="width:64px;height:64px" alt="">` :`<div class="avatar-circle ${col}" style="width:64px;height:64px;font-size:22px">${getInitials(person.name)}</div>`;
  const zodiac=getZodiac(person.birthday);const age=ageOn(person.birthday);
  let rows=`<div class="view-row"><div class="view-row-icon">🎂</div><div class="view-row-body"><div class="view-row-label">День рождения</div><div class="view-row-value">${formatDate(person.birthday)}${age?' · '+age+' лет':''}${zodiac?' · <span class="zodiac-badge">'+zodiac+'</span>':''}</div></div></div>`;
  if(person.phone)rows+=`<div class="view-row"><div class="view-row-icon">📞</div><div class="view-row-body"><div class="view-row-label">Телефон</div><div class="view-row-value"><a class="view-row-link" href="tel:${person.phone}">${person.phone}</a></div></div></div>`;
  if(person.city)rows+=`<div class="view-row"><div class="view-row-icon">📍</div><div class="view-row-body"><div class="view-row-label">Город</div><div class="view-row-value">${person.city}</div></div></div>`;
  if(person.vk)rows+=`<div class="view-row"><div class="view-row-icon">💙</div><div class="view-row-body"><div class="view-row-label">ВКонтакте</div><div class="view-row-value"><a class="view-row-link" href="https://vk.com/${person.vk}" target="_blank">vk.com/${person.vk}</a></div></div></div>`;
  if(person.instagram)rows+=`<div class="view-row"><div class="view-row-icon">📸</div><div class="view-row-body"><div class="view-row-label">Instagram</div><div class="view-row-value"><a class="view-row-link" href="https://instagram.com/${person.instagram}" target="_blank">@${person.instagram}</a></div></div></div>`;
  if(person.telegram)rows+=`<div class="view-row"><div class="view-row-icon">✈️</div><div class="view-row-body"><div class="view-row-label">Telegram</div><div class="view-row-value"><a class="view-row-link" href="https://t.me/${person.telegram}" target="_blank">@${person.telegram}</a></div></div></div>`;
  if(person.giftCurrent)rows+=`<div class="view-row"><div class="view-row-icon">🎁</div><div class="view-row-body"><div class="view-row-label">Подарок в этом году</div><div class="view-row-value">${person.giftCurrent}</div></div></div>`;
  if(person.giftPrev)rows+=`<div class="view-row"><div class="view-row-icon">🎀</div><div class="view-row-body"><div class="view-row-label">Подарок в прошлом году</div><div class="view-row-value">${person.giftPrev}</div></div></div>`;
  if(person.lastSeen)rows+=`<div class="view-row"><div class="view-row-icon">👋</div><div class="view-row-body"><div class="view-row-label">Последняя встреча</div><div class="view-row-value">${formatDate(person.lastSeen)}</div></div></div>`;
  if(person.notes)rows+=`<div class="view-row"><div class="view-row-icon">📝</div><div class="view-row-body"><div class="view-row-label">Заметки</div><div class="view-row-value">${person.notes}</div></div></div>`;
  $('view-person-body').innerHTML=`<div class="view-card-hero">${ava}<div class="view-hero-info"><div class="view-hero-name">${person.name}</div><div class="view-hero-sub">${catLabels[person.category]||''}</div><div class="view-hero-days">${daysBadge(days)}</div></div></div>
    <button class="btn-primary" style="width:100%;margin-bottom:12px" onclick="aiForPerson('${person.id}')">✨ Сгенерировать поздравление</button>${rows}`;
  $('view-person-modal').classList.remove('hidden');
}
window.aiForPerson=id=>{const p=people.find(x=>x.id===id);if(p){$('view-person-modal').classList.add('hidden');$('ai-modal-title').textContent='✨ Поздравление для '+p.name;generateGreeting(p)}};

function openViewCouple(couple){
  if(!couple)return;viewingCouple=couple;
  const fullName=`${couple.name1} & ${couple.name2}${couple.surname?' '+couple.surname:''}`;
  $('view-couple-name').textContent=fullName;
  const days=daysUntil(couple.wedding),col=avatarColor(couple.name1);
  const ava=couple.photo?`<img src="${couple.photo}" class="avatar-photo" style="width:64px;height:64px" alt="">` :`<div class="avatar-circle ${col}" style="width:64px;height:64px;font-size:22px">${getInitials(couple.name1)}</div>`;
  let rows=`<div class="view-row"><div class="view-row-icon">💍</div><div class="view-row-body"><div class="view-row-label">Свадьба</div><div class="view-row-value">${formatDate(couple.wedding)} · ${yearsMarried(couple.wedding)} лет вместе</div></div></div>`;
  if(couple.phone)rows+=`<div class="view-row"><div class="view-row-icon">📞</div><div class="view-row-body"><div class="view-row-label">Телефон</div><div class="view-row-value"><a class="view-row-link" href="tel:${couple.phone}">${couple.phone}</a></div></div></div>`;
  if(couple.giftCurrent)rows+=`<div class="view-row"><div class="view-row-icon">🎁</div><div class="view-row-body"><div class="view-row-label">Подарок в этом году</div><div class="view-row-value">${couple.giftCurrent}</div></div></div>`;
  if(couple.giftPrev)rows+=`<div class="view-row"><div class="view-row-icon">🎀</div><div class="view-row-body"><div class="view-row-label">Подарок в прошлом году</div><div class="view-row-value">${couple.giftPrev}</div></div></div>`;
  if(couple.notes)rows+=`<div class="view-row"><div class="view-row-icon">📝</div><div class="view-row-body"><div class="view-row-label">Заметки</div><div class="view-row-value">${couple.notes}</div></div></div>`;
  $('view-couple-body').innerHTML=`<div class="view-card-hero">${ava}<div class="view-hero-info"><div class="view-hero-name">${fullName}</div><div class="view-hero-days">${daysBadge(days)}</div></div></div>${rows}`;
  $('view-couple-modal').classList.remove('hidden');
}

$('view-person-close').addEventListener('click',()=>$('view-person-modal').classList.add('hidden'));
$('view-person-overlay').addEventListener('click',()=>$('view-person-modal').classList.add('hidden'));
$('view-person-edit-btn').addEventListener('click',()=>{$('view-person-modal').classList.add('hidden');openPersonModal(viewingPerson)});
$('view-couple-close').addEventListener('click',()=>$('view-couple-modal').classList.add('hidden'));
$('view-couple-overlay').addEventListener('click',()=>$('view-couple-modal').classList.add('hidden'));
$('view-couple-edit-btn').addEventListener('click',()=>{$('view-couple-modal').classList.add('hidden');openCoupleModal(viewingCouple)});
$('cal-popup-close').addEventListener('click',()=>$('cal-popup').classList.add('hidden'));
$('cal-popup-overlay').addEventListener('click',()=>$('cal-popup').classList.add('hidden'));
$('ai-modal-close').addEventListener('click',()=>$('ai-modal').classList.add('hidden'));
$('ai-modal-overlay').addEventListener('click',()=>$('ai-modal').classList.add('hidden'));

// NAV
document.querySelectorAll('.nav-item').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab-section').forEach(s=>s.classList.remove('active'));
    btn.classList.add('active');$('tab-'+btn.dataset.tab).classList.add('active');
    if(btn.dataset.tab==='calendar')renderCalendar();
  });
});

// ADD
$('add-btn').addEventListener('click',()=>$('add-modal').classList.remove('hidden'));
$('add-modal-close').addEventListener('click',()=>$('add-modal').classList.add('hidden'));
$('add-modal-overlay').addEventListener('click',()=>$('add-modal').classList.add('hidden'));
$('add-person-btn').addEventListener('click',()=>{$('add-modal').classList.add('hidden');openPersonModal(null)});
$('add-couple-btn').addEventListener('click',()=>{$('add-modal').classList.add('hidden');openCoupleModal(null)});

$('home-search').addEventListener('input',e=>renderUpcomingList(e.target.value));
$('people-search').addEventListener('input',e=>renderPeople(e.target.value));

setupPhotoUpload('person-photo-input','person-photo-preview','person-photo-clear',b=>personPhotoBase64=b);
setupPhotoUpload('couple-photo-input','couple-photo-preview','couple-photo-clear',b=>couplePhotoBase64=b);

// PERSON MODAL
function openPersonModal(person){
  const isEdit=!!person;personPhotoBase64=null;window.existingPersonPhoto=person?.photo||null;
  $('person-modal-title').textContent=isEdit?'Редактировать':'Новый человек';
  $('person-id').value=person?.id||'';$('person-name').value=person?.name||'';$('person-birthday').value=person?.birthday||'';
  $('person-category').value=person?.category||'friend';$('person-phone').value=person?.phone||'';$('person-city').value=person?.city||'';
  $('person-last-seen').value=person?.lastSeen||'';$('person-gift-current').value=person?.giftCurrent||'';
  $('person-gift-prev').value=person?.giftPrev||'';$('person-notes').value=person?.notes||'';
  $('person-vk').value=person?.vk||'';$('person-instagram').value=person?.instagram||'';$('person-telegram').value=person?.telegram||'';
  $('person-delete-btn').style.display=isEdit?'block':'none';
  const pp=$('person-photo-preview'),pc=$('person-photo-clear');
  if(person?.photo){pp.innerHTML=`<img src="${person.photo}" alt="">`;pc.style.display='block';}
  else{pp.innerHTML=`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;pc.style.display='none';}
  $('person-photo-input').value='';$('person-modal').classList.remove('hidden');
}
function closePersonModal(){$('person-modal').classList.add('hidden');$('person-form').reset()}
$('person-modal-close').addEventListener('click',closePersonModal);
$('person-modal-overlay').addEventListener('click',closePersonModal);
$('person-form').addEventListener('submit',async e=>{
  e.preventDefault();
  const data={name:$('person-name').value.trim(),birthday:$('person-birthday').value,category:$('person-category').value,phone:$('person-phone').value.trim(),city:$('person-city').value.trim(),lastSeen:$('person-last-seen').value,giftCurrent:$('person-gift-current').value.trim(),giftPrev:$('person-gift-prev').value.trim(),notes:$('person-notes').value.trim(),vk:$('person-vk').value.trim(),instagram:$('person-instagram').value.trim(),telegram:$('person-telegram').value.trim(),photo:personPhotoBase64||window.existingPersonPhoto||null};
  const id=$('person-id').value;if(id)data.id=id;
  try{await savePerson(data);closePersonModal();showToast(id?'✅ Сохранено':'✅ Добавлен')}catch(err){showToast('Ошибка: '+err.message)}
});
$('person-delete-btn').addEventListener('click',async()=>{if(!confirm('Удалить?'))return;await deletePerson($('person-id').value);closePersonModal();showToast('🗑 Удалено')});

// COUPLE MODAL
function openCoupleModal(couple){
  const isEdit=!!couple;couplePhotoBase64=null;window.existingCouplePhoto=couple?.photo||null;
  $('couple-modal-title').textContent=isEdit?'Редактировать пару':'Новая пара';
  $('couple-id').value=couple?.id||'';$('couple-name1').value=couple?.name1||'';$('couple-name2').value=couple?.name2||'';
  $('couple-surname').value=couple?.surname||'';$('couple-wedding').value=couple?.wedding||'';
  $('couple-phone').value=couple?.phone||'';$('couple-gift-current').value=couple?.giftCurrent||'';
  $('couple-gift-prev').value=couple?.giftPrev||'';$('couple-notes').value=couple?.notes||'';
  $('couple-delete-btn').style.display=isEdit?'block':'none';
  const cp=$('couple-photo-preview'),cc=$('couple-photo-clear');
  if(couple?.photo){cp.innerHTML=`<img src="${couple.photo}" alt="">`;cc.style.display='block';}
  else{cp.innerHTML=`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`;cc.style.display='none';}
  $('couple-photo-input').value='';$('couple-modal').classList.remove('hidden');
}
function closeCoupleModal(){$('couple-modal').classList.add('hidden');$('couple-form').reset()}
$('couple-modal-close').addEventListener('click',closeCoupleModal);
$('couple-modal-overlay').addEventListener('click',closeCoupleModal);
$('couple-form').addEventListener('submit',async e=>{
  e.preventDefault();
  const data={name1:$('couple-name1').value.trim(),name2:$('couple-name2').value.trim(),surname:$('couple-surname').value.trim(),wedding:$('couple-wedding').value,phone:$('couple-phone').value.trim(),giftCurrent:$('couple-gift-current').value.trim(),giftPrev:$('couple-gift-prev').value.trim(),notes:$('couple-notes').value.trim(),photo:couplePhotoBase64||window.existingCouplePhoto||null};
  const id=$('couple-id').value;if(id)data.id=id;
  try{await saveCouple(data);closeCoupleModal();showToast(id?'✅ Сохранено':'✅ Добавлена пара')}catch(err){showToast('Ошибка: '+err.message)}
});
$('couple-delete-btn').addEventListener('click',async()=>{if(!confirm('Удалить?'))return;await deleteCouple($('couple-id').value);closeCoupleModal();showToast('🗑 Удалено')});

// NOTIFICATIONS
function updateNotifBtn(){
  const btn=$('enable-notif-btn');
  if(!btn)return;
  if(!('Notification'in window)){btn.textContent='Браузер не поддерживает уведомления';btn.disabled=true;return}
  if(Notification.permission==='granted'){
    btn.textContent='✅ Уведомления включены';
    btn.style.background='rgba(34,197,94,0.1)';
    btn.style.color='#16a34a';
    btn.style.borderColor='rgba(34,197,94,0.3)';
  } else {
    btn.textContent='Включить уведомления';
    btn.style.background='';btn.style.color='';btn.style.borderColor='';
  }
}

$('enable-notif-btn').addEventListener('click',async()=>{
  if(!('Notification'in window)){showToast('Браузер не поддерживает уведомления');return}
  if(Notification.permission==='granted'){showToast('✅ Уведомления уже включены!');return}
  const p=await Notification.requestPermission();
  if(p==='granted'){showToast('🔔 Уведомления включены!');scheduleNotificationCheck();updateNotifBtn();}
  else showToast('Уведомления отклонены');
});
function scheduleNotificationCheck(){if(!('Notification'in window)||Notification.permission!=='granted')return;checkNotifications();setInterval(checkNotifications,3600000)}
function checkNotifications(){
  const s={remind7:$('remind-7').checked,remind3:$('remind-3').checked,remind1:$('remind-1').checked,remind0:$('remind-0').checked};
  const key='lastNotifCheck_'+(currentUser?.uid||'');
  const today=new Date().toDateString();
  if(localStorage.getItem(key)===today)return;
  localStorage.setItem(key,today);
  const thresholds=[];if(s.remind0)thresholds.push(0);if(s.remind1)thresholds.push(1);if(s.remind3)thresholds.push(3);if(s.remind7)thresholds.push(7);
  [...people.map(p=>({name:p.name,date:p.birthday,type:'birthday'})),...couples.map(c=>({name:`${c.name1} & ${c.name2}`,date:c.wedding,type:'wedding'}))].forEach(ev=>{
    const days=daysUntil(ev.date);if(!thresholds.includes(days))return;
    const label=ev.type==='birthday'?'день рождения':'годовщина свадьбы';
    new Notification(days===0?`🎉 Сегодня ${label}!`:`🔔 Скоро ${label}`,{body:days===0?`У ${ev.name} сегодня ${label}!`:`У ${ev.name} через ${days} дн. ${label}`,icon:'/img/icon-192.png'});
  });
}
if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
