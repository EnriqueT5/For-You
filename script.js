/* CARTA + CINE + MUNDO DE ANIMACIONES · HTML/CSS/JS
   Edita CONFIG para personalizar la carta y la duración del cine.
   La música se mantiene viva entre las escenas (sin recargar la página).
*/
const CONFIG = {
  firma: 'Alguien que quiso hacerte sonreír ♡',
  carta: [
    'Se me ocurrió que una carta normal no era suficiente para reunir tantas cosas bonitas.',
    'Así que imaginé un pequeño universo hecho de flores, atardeceres, historias románticas, peluches, matcha y todos esos detalles que te gustan.',
    'Porque a veces un gesto sencillo puede decir algo muy grande: <strong>mereces cosas que te hagan sonreír.</strong>'
  ],
  duracionCineSegundos: 32,
  // Si tienes permiso para usar la canción, ponla en esta carpeta con este nombre.
  archivoMusica: 'assets/cosas-que-no-te-dije.mp3',
  volumen: 0.54
};

const $ = id => document.getElementById(id);
const escenas = ['cover','letter','cinema','finale'];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let escenaActual = 'cover';
let timerSobre = null;
let timerCine = null;
let animacionCine = null;
let diapositivas = [];
let diapositivaActual = 0;
let enTransicion = false;
let timerTransicion = null;
let inicioGesto = null;
let ignorarClickHasta = 0;
let ultimoWheel = 0;
let musicaElegida = false;
let musicaBlobURL = null;

function personalizarCarta(){
  $('letter-message').innerHTML = CONFIG.carta.map(p=>`<p>${p}</p>`).join('');
  $('letter-signature').textContent = CONFIG.firma;
}

function crearEstrellasCine(cantidad=140){
  let seed=8372;
  const rand=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  const fragmento=document.createDocumentFragment();
  for(let i=0;i<cantidad;i++){
    const star=document.createElement('span');star.className='cinema-star';
    star.style.left=`${rand()*100}%`;
    star.style.top=`${rand()*100}%`;
    star.style.setProperty('--size',`${.5+rand()*1.7}px`);
    star.style.setProperty('--alpha',`${.3+rand()*.7}`);
    star.style.setProperty('--duration',`${2+rand()*4}s`);
    star.style.setProperty('--delay',`${-rand()*6}s`);
    fragmento.append(star);
  }
  $('cinema-stars').append(fragmento);
}

function destellos(x,y,cantidad=13){
  if(reduceMotion.matches) return;
  const layer=$('sparkles-layer');
  for(let i=0;i<cantidad;i++){
    const part=document.createElement('span');part.className='spark-burst';part.textContent=['✦','✧','♡'][i%3];
    part.style.left=x+'px';part.style.top=y+'px';
    const angle=(i/cantidad)*Math.PI*2;
    const distance=35+Math.random()*80;
    part.style.setProperty('--dx',`${Math.cos(angle)*distance}px`);
    part.style.setProperty('--dy',`${Math.sin(angle)*distance}px`);
    part.addEventListener('animationend',()=>part.remove(),{once:true});
    layer.append(part);
  }
}

function limpiarCine(){
  clearTimeout(timerCine);timerCine=null;
  if(animacionCine){animacionCine.onfinish=null;animacionCine.cancel();animacionCine=null;}
}

function mostrarEscena(nombre){
  if(!escenas.includes(nombre)) return;
  clearTimeout(timerSobre);timerSobre=null;
  limpiarCine();
  escenaActual=nombre;
  document.body.dataset.scene=nombre;
  escenas.forEach(id=>{
    const section=$('scene-'+id),activo=id===nombre;
    section.classList.toggle('is-active',activo);
    section.setAttribute('aria-hidden',String(!activo));
  });
  window.scrollTo({top:0,behavior:'instant'});
  if(nombre==='cover'){
    $('open-envelope').classList.remove('opened');
    $('open-envelope').disabled=false;
    $('open-envelope-text').disabled=false;
  }
  if(nombre==='cinema') iniciarCine();
  if(nombre==='finale') iniciarCarrusel();
}

function abrirSobre(e){
  const b=$('open-envelope');if(b.classList.contains('opened'))return;
  b.classList.add('opened');b.disabled=true;$('open-envelope-text').disabled=true;
  const rect=b.getBoundingClientRect();
  destellos(e?.clientX||rect.left+rect.width/2,e?.clientY||rect.top+rect.height/2);
  // El click es un gesto del usuario y permite comenzar a reproducir audio en móviles.
  iniciarMusicaDesdeGesto();
  timerSobre=setTimeout(()=>mostrarEscena('letter'),reduceMotion.matches?300:1450);
}

function iniciarCine(){
  const crawl=$('crawl-content');
  const screen=document.querySelector('.theater-screen');
  const duracion=(reduceMotion.matches?8500:CONFIG.duracionCineSegundos*1000);
  crawl.style.transform='translate3d(0,0,0)';
  requestAnimationFrame(()=>{
    if(escenaActual!=='cinema')return;
    const pantalla=screen.getBoundingClientRect().height;
    const texto=crawl.getBoundingClientRect().height;
    const desplazamiento=pantalla*.94+texto+pantalla*.02;
    animacionCine=crawl.animate([
      {transform:'translate3d(0,0,0)',opacity:1},
      {transform:`translate3d(0,-${desplazamiento}px,0)`,opacity:1}
    ],{duration:duracion,easing:'linear',fill:'forwards'});
    animacionCine.onfinish=()=>{
      if(escenaActual==='cinema')mostrarEscena('finale');
    };
    timerCine=setTimeout(()=>{
      if(escenaActual==='cinema')mostrarEscena('finale');
    },duracion+600);
  });
}

function crearEscenasVivas(){
  const gallery=$('living-gallery');
  const fragment=document.createDocumentFragment();
  window.ART_SCENES.forEach(({id,tag,title,line,theme,body},i)=>{
    const section=document.createElement('article');
    section.className='moment carousel-slide';
    section.id='momento-'+id;
    section.dataset.theme=theme;
    section.setAttribute('role','group');
    section.setAttribute('aria-roledescription','diapositiva');
    section.setAttribute('aria-label',`${i+1} de ${window.ART_SCENES.length+1}: ${title}`);
    section.innerHTML=`<header class="moment-header"><p class="moment-kicker">${tag}</p><h3>${title}</h3></header><div class="moment-stage">${body}</div><p class="moment-line">${line}</p>`;
    fragment.append(section);
  });
  // Mantener el mensaje final DESPUÉS de todas las ilustraciones.
  gallery.insertBefore(fragment,$('finale-outro'));
  diapositivas=Array.from(gallery.querySelectorAll('.carousel-slide'));
  diapositivas.forEach((slide,i)=>{
    slide.setAttribute('aria-hidden',i===0?'false':'true');
    slide.inert=i!==0;
  });
  $('carousel-count').textContent=`01 / ${String(diapositivas.length).padStart(2,'0')}`;
}

function terminarTransicion(){
  clearTimeout(timerTransicion);
  timerTransicion=null;
  diapositivas.forEach((slide,i)=>{
    const activo=i===diapositivaActual;
    slide.classList.remove('is-entering','is-leaving');
    slide.classList.toggle('is-active',activo);
    slide.classList.toggle('is-visible',activo);
    slide.setAttribute('aria-hidden',String(!activo));
    slide.inert=!activo;
  });
  enTransicion=false;
}

function mostrarDiapositiva(indice,{instantaneo=false}={}){
  if(enTransicion) return;
  if(indice<0||indice>=diapositivas.length) return;
  if(indice===diapositivaActual&&!instantaneo) return;
  const anterior=diapositivas[diapositivaActual];
  const siguiente=diapositivas[indice];
  const derecha=indice>diapositivaActual;
  const animar=!instantaneo&&!reduceMotion.matches&&anterior!==siguiente;
  diapositivaActual=indice;
  $('carousel-count').textContent=`${String(indice+1).padStart(2,'0')} / ${String(diapositivas.length).padStart(2,'0')}`;
  $('carousel-swipe-hint').textContent=indice===diapositivas.length-1?'Has llegado al final ♡':'Desliza o toca los lados para continuar';
  $('carousel-prev').disabled=indice===0;
  $('carousel-next').disabled=indice===diapositivas.length-1;
  $('carousel-prev').setAttribute('aria-disabled',String(indice===0));
  $('carousel-next').setAttribute('aria-disabled',String(indice===diapositivas.length-1));
  if(!animar){terminarTransicion();return;}
  enTransicion=true;
  anterior.classList.remove('is-active');
  anterior.classList.add('is-leaving',derecha?'to-left':'to-right');
  siguiente.classList.add('is-entering','is-visible',derecha?'from-right':'from-left');
  siguiente.inert=false;
  siguiente.setAttribute('aria-hidden','false');
  // Después de la transición, se reinician las animaciones del slide saliente
  // para que vuelvan a florecer o moverse al regresar a él.
  timerTransicion=setTimeout(()=>{
    diapositivas.forEach(slide=>slide.classList.remove('to-left','to-right','from-left','from-right'));
    terminarTransicion();
  },660);
}

function iniciarCarrusel(){
  clearTimeout(timerTransicion);
  enTransicion=false;
  diapositivaActual=0;
  diapositivas.forEach(s=>s.classList.remove('is-active','is-visible','is-entering','is-leaving','to-left','to-right','from-left','from-right'));
  mostrarDiapositiva(0,{instantaneo:true});
  const slider=$('finale-slider');
  try{slider.focus({preventScroll:true});}catch(e){slider.focus();}
}

function enlazarCarrusel(){
  const slider=$('finale-slider');
  $('carousel-prev').addEventListener('click',()=>mostrarDiapositiva(diapositivaActual-1));
  $('carousel-next').addEventListener('click',()=>mostrarDiapositiva(diapositivaActual+1));
  // Tocar la mitad derecha = siguiente, la mitad izquierda = anterior.
  slider.addEventListener('click',e=>{
    if(Date.now()<ignorarClickHasta)return;
    if(e.target.closest('button, a, input, label'))return;
    const rect=slider.getBoundingClientRect();
    mostrarDiapositiva(diapositivaActual+(e.clientX-rect.left>rect.width/2?1:-1));
  });
  slider.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'||e.target.closest('button'))return;
    inicioGesto={x:e.clientX,y:e.clientY,pointerId:e.pointerId};
  });
  slider.addEventListener('pointerup',e=>{
    if(!inicioGesto||inicioGesto.pointerId!==e.pointerId)return;
    const dx=e.clientX-inicioGesto.x,dy=e.clientY-inicioGesto.y;
    inicioGesto=null;
    if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.15){
      ignorarClickHasta=Date.now()+550;
      mostrarDiapositiva(diapositivaActual+(dx<0?1:-1));
    }
  });
  slider.addEventListener('pointercancel',()=>inicioGesto=null);
  // Una rueda de ratón o trackpad también pasa una escena cada vez.
  slider.addEventListener('wheel',e=>{
    if(escenaActual!=='finale')return;
    e.preventDefault();
    const delta=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;
    if(Math.abs(delta)<20||Date.now()-ultimoWheel<850||enTransicion)return;
    ultimoWheel=Date.now();
    mostrarDiapositiva(diapositivaActual+(delta>0?1:-1));
  },{passive:false});
}

/* AUDIO: hay dos maneras de añadir la canción:
   (1) Deja tu MP3 autorizado en assets/cosas-que-no-te-dije.mp3
   (2) Toca el control «Añadir canción» y selecciónalo desde tu dispositivo.
   Ningún audio comercial viene incluido en el ZIP.
*/
const audio=$('background-music');
audio.volume=CONFIG.volumen;
const musicButton=$('music-toggle');
const musicLabel=$('music-label');
function pintarMusica(){
  const playing=musicaElegida&&!audio.paused;
  musicButton.classList.toggle('is-playing',playing);
  musicLabel.textContent=!musicaElegida?'Añadir canción':playing?'Pausar música':'Reproducir música';
  musicButton.setAttribute('aria-label',musicLabel.textContent);
  musicButton.title=musicLabel.textContent;
}
function reproducir(){
  if(!musicaElegida)return;
  const promise=audio.play();
  if(promise&&typeof promise.catch==='function')promise.then(pintarMusica).catch(()=>pintarMusica());
}
function iniciarMusicaDesdeGesto(){
  $('music-widget').hidden=false;
  if(!musicaElegida){
    // Intentar la ruta local sin descargar nada ni depender de internet.
    audio.src=CONFIG.archivoMusica;
    audio.load();
    musicaElegida=true;
    audio.play().then(pintarMusica).catch(()=>{
      // Normal si el MP3 todavía no existe. El control abre el selector local.
      musicaElegida=false;
      pintarMusica();
    });
  } else if(audio.paused){reproducir();}
}
$('music-file').addEventListener('change',event=>{
  const file=event.target.files?.[0];if(!file)return;
  if(musicaBlobURL)URL.revokeObjectURL(musicaBlobURL);
  musicaBlobURL=URL.createObjectURL(file);
  audio.src=musicaBlobURL;
  musicaElegida=true;
  reproducir();
  pintarMusica();
});
musicButton.addEventListener('click',()=>{
  if(!musicaElegida){$('music-file').click();return;}
  if(audio.paused) reproducir(); else audio.pause();
  pintarMusica();
});
audio.addEventListener('play',pintarMusica);
audio.addEventListener('pause',pintarMusica);
audio.addEventListener('error',()=>{
  if(!musicaBlobURL){musicaElegida=false;pintarMusica();}
});

function iniciar(){
  personalizarCarta();
  crearEstrellasCine();
  crearEscenasVivas();
  pintarMusica();
  $('open-envelope').addEventListener('click',abrirSobre);
  $('open-envelope-text').addEventListener('click',abrirSobre);
  $('go-cinema').addEventListener('click',()=>mostrarEscena('cinema'));
  $('restart-story').addEventListener('click',()=>mostrarEscena('cover'));
  enlazarCarrusel();
  document.addEventListener('keydown',e=>{
    if(escenaActual!=='finale'||e.altKey||e.ctrlKey||e.metaKey)return;
    if(['ArrowRight','ArrowLeft','PageDown','PageUp'].includes(e.key)){
      e.preventDefault();
      mostrarDiapositiva(diapositivaActual+(['ArrowRight','PageDown'].includes(e.key)?1:-1));
    } else if(e.key==='Home'){
      e.preventDefault();mostrarDiapositiva(0);
    } else if(e.key==='End'){
      e.preventDefault();mostrarDiapositiva(diapositivas.length-1);
    }
  });
}
iniciar();
