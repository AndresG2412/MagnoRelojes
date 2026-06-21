/* ==========================================================================
   MAGNO Alta Relojería - Lógica Principal (GSAP + Precarga de Alta Gama)
   ========================================================================== */

import './style.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Registrar ScrollTrigger con GSAP
gsap.registerPlugin(ScrollTrigger);

// URLs de los Assets de Reloj (Confirmados en formato .jpg y .png)
const frameUrls = [];
for (let i = 1; i <= 51; i++) {
  const frameStr = String(i).padStart(3, '0');
  frameUrls.push(`/assets/reloj_images/ezgif-frame-${frameStr}.jpg`);
}

const catalogUrls = [
  '/assets/relojes/reloj_antiguo.png',
  '/assets/relojes/reloj_clasico.png',
  '/assets/relojes/reloj_moderno.png',
  '/assets/relojes/reloj_semiclasico.png'
];

// Mapas para almacenar las imágenes cargadas en memoria
const loadedFramesMap = {};
const loadedCatalogMap = {};

// Inicialización de la Precarga de Alta Gama
function startPreload() {
  const bar = document.getElementById('preloader-bar');
  const status = document.getElementById('preloader-status');
  const preloader = document.getElementById('preloader');
  const mainContent = document.getElementById('main-content');
  
  let totalLoaded = 0;
  const totalAssets = frameUrls.length + catalogUrls.length;
  
  const updateLoader = () => {
    totalLoaded++;
    const pct = Math.round((totalLoaded / totalAssets) * 100);
    bar.style.width = `${pct}%`;
    status.textContent = `CALIBRANDO COMPONENTES DE PRECISIÓN... ${pct}%`;
    
    if (totalLoaded === totalAssets) {
      // Pequeña pausa de lujo para la transición
      setTimeout(() => {
        // Desvanecer preloader
        preloader.style.opacity = '0';
        preloader.style.visibility = 'hidden';
        
        // Mostrar contenido principal
        mainContent.classList.remove('content-hidden');
        mainContent.style.opacity = '0';
        
        gsap.to(mainContent, {
          opacity: 1,
          duration: 1.2,
          ease: 'power2.out',
          onComplete: () => {
            // Eliminar preloader del DOM para ahorrar memoria
            preloader.remove();
            // Inicializar toda la interactividad y animaciones
            initializeSite();
          }
        });
      }, 800);
    }
  };
  
  // Precargar secuencias del hero (.jpg)
  frameUrls.forEach((url, index) => {
    const img = new Image();
    img.src = url;
    
    // Elevación de la prioridad para el primer frame (LCP Candidate)
    if (index === 0) {
      img.setAttribute('fetchpriority', 'high');
    } else {
      img.setAttribute('fetchpriority', 'low'); // Depriorizar el resto de frames ocultos
    }
    
    const onLoad = () => {
      loadedFramesMap[index] = img;
      updateLoader();
    };
    const onError = () => {
      console.warn(`Error al precargar el frame: ${url}`);
      updateLoader(); // Continuar de todos modos para no congelar la carga
    };
    
    if (img.complete) onLoad();
    else {
      img.onload = onLoad;
      img.onerror = onError;
    }
  });
  
  // Precargar imágenes del catálogo (.png)
  catalogUrls.forEach((url, index) => {
    const img = new Image();
    img.src = url;
    img.setAttribute('fetchpriority', 'low'); // Fuera del fold inicial, depriorizadas
    
    const onLoad = () => {
      loadedCatalogMap[index] = img;
      updateLoader();
    };
    const onError = () => {
      console.warn(`Error al precargar imagen del catálogo: ${url}`);
      updateLoader();
    };
    
    if (img.complete) onLoad();
    else {
      img.onload = onLoad;
      img.onerror = onError;
    }
  });
}

// Inicializar la Lógica y Animaciones del Sitio
function initializeSite() {
  initNavbar();
  prepareTypewriterTexts();
  initCanvas();
  initHeroTimeline();
  initScrollAnimations();
  initContactForm();
}

// 1. Gestión del Navbar y Menú Móvil
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  
  // Cambiar opacidad de fondo del Navbar en scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('navbar-scrolled');
    } else {
      navbar.classList.remove('navbar-scrolled');
    }
  });
  
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
  
  menuToggle.addEventListener('click', () => {
    const isOpened = menuToggle.classList.toggle('active');
    mobileNav.classList.toggle('active');
    document.body.style.overflow = isOpened ? 'hidden' : 'auto';
  });
  
  mobileNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('active');
      mobileNav.classList.remove('active');
      document.body.style.overflow = 'auto';
    });
  });
}

// 2. Preparar textos del Hero envolviendo caracteres para efecto tipado fluido
function prepareTypewriterTexts() {
  document.querySelectorAll('.hero-step').forEach(step => {
    const titleEl = step.querySelector('.hero-step-title');
    const descEl = step.querySelector('.hero-step-desc');
    
    const wrapElementText = (el) => {
      const originalText = el.textContent.trim();
      el.textContent = '';
      
      const chars = [...originalText].map(char => {
        const span = document.createElement('span');
        if (char === ' ') {
          // Usar espacio normal (no &nbsp;) para que el navegador pueda hacer saltos de línea
          span.textContent = ' ';
          span.className = 'char char-space';
        } else {
          span.textContent = char;
          span.className = 'char';
        }
        el.appendChild(span);
        return span;
      });
      return chars;
    };
    
    const titleChars = wrapElementText(titleEl);
    const descChars = wrapElementText(descEl);
    
    // Guardar referencia en el nodo DOM para actualización rápida
    step._typewriterData = {
      titleChars,
      descChars,
      totalChars: titleChars.length + descChars.length
    };
  });
}

// Actualizar caracteres activos según progreso (0.0 a 1.0)
function updateTypewriterProgress(stepEl, progress) {
  const data = stepEl._typewriterData;
  if (!data) return;
  
  const activeCount = Math.floor(progress * data.totalChars);
  
  // Actualizar título
  data.titleChars.forEach((span, idx) => {
    if (idx <= activeCount) {
      span.classList.add('active');
    } else {
      span.classList.remove('active');
    }
  });
  
  // Actualizar descripción (después del título)
  const titleLen = data.titleChars.length;
  data.descChars.forEach((span, idx) => {
    if ((idx + titleLen) <= activeCount) {
      span.classList.add('active');
    } else {
      span.classList.remove('active');
    }
  });
}

// 3. Control de Lienzo Canvas (Sizing & Contain Aspect Ratio)
let canvas, ctx;
let currentFrameIndex = 0;

function initCanvas() {
  canvas = document.getElementById('watch-canvas');
  ctx = canvas.getContext('2d');
  
  // Ajustar tamaño del canvas por primera vez
  resizeCanvas();
  
  // Escuchar redimensionamiento de pantalla
  window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
  if (!canvas) return;
  
  const container = canvas.parentElement;
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  // Escalado para pantallas de Alta Densidad (Retina) para máxima nitidez del reloj de lujo
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  
  ctx.scale(dpr, dpr);
  
  // Redibujar frame actual con el nuevo tamaño
  drawFrame(currentFrameIndex);
}

function drawFrame(index) {
  currentFrameIndex = index;
  const img = loadedFramesMap[index];
  if (!img || !ctx) return;
  
  const w = parseFloat(canvas.style.width);
  const h = parseFloat(canvas.style.height);
  
  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;
  const imgRatio = imgW / imgH;
  const canvasRatio = w / h;
  
  let dW, dH, dX, dY;
  
  // Algoritmo "contain" para mantener la imagen visible completa y centrada siempre
  if (imgRatio > canvasRatio) {
    dW = w;
    dH = w / imgRatio;
  } else {
    dH = h;
    dW = h * imgRatio;
  }
  
  dX = (w - dW) / 2;
  dY = (h - dH) / 2;
  
  // Dibujar en el lienzo
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, dX, dY, dW, dH);
}

// 4. Línea de Tiempo de GSAP + ScrollTrigger para el Hero
function initHeroTimeline() {
  const steps = document.querySelectorAll('.hero-step');
  
  // Objeto de estado animado por GSAP (4 pasos)
  const animState = {
    frame: 0,
    p0: 0,
    p1: 0,
    p2: 0,
    p3: 0
  };
  
  // ─── DURACIONES EXPLÍCITAS ────────────────────────────────────────────────
  // fade: tiempo de aparición / desaparición de cada bloque de texto
  // type: tiempo dedicado al efecto de tipado de ese paso
  // gap : espacio muerto entre la salida de un paso y la entrada del siguiente
  //
  //  Paso 0:  [0.00────type────0.14] [fade-out 0.15→0.21]
  //  Gap
  //  Paso 1:  [fade-in 0.27→0.33] [────type────0.34→0.50] [fade-out 0.51→0.57]
  //  Gap
  //  Paso 2:  [fade-in 0.63→0.69] [────type────0.70→0.80] [fade-out 0.81→0.87]
  //  Gap
  //  Paso 3:  [fade-in 0.90→0.96] [────type────0.97→1.10]   (se mantiene visible)
  // ─────────────────────────────────────────────────────────────────────────
  const FADE_DUR = 0.06;
  const TYPE_DUR = 0.14;
  
  // Crear línea de tiempo que controla el pin de la sección entera
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.hero-section',
      start: 'top top',
      end: '+=400%',
      pin: true,
      scrub: 0.5,
      invalidateOnRefresh: true
    }
  });
  
  // 4a. Secuencia de frames del canvas vinculada al scroll completo
  tl.to(animState, {
    frame: 50,
    duration: 1.16, // cubre hasta el fin del último tipo (0.97 + 0.14 + holgura)
    ease: 'none',
    onUpdate: () => {
      drawFrame(Math.round(animState.frame));
    }
  }, 0);
  
  // ── PASO 1 ────────────────────────────────────────────────────────────────
  steps[0].classList.add('active-step');
  gsap.set(steps[0], { opacity: 1, y: 0 });
  
  // Typewriter paso 1
  tl.to(animState, {
    p0: 1,
    duration: TYPE_DUR,
    ease: 'none',
    onUpdate: () => updateTypewriterProgress(steps[0], animState.p0)
  }, 0);
  
  // Fade-out paso 1 (empieza DESPUÉS de que termina el tipado)
  tl.to(steps[0], {
    opacity: 0,
    y: -40,
    duration: FADE_DUR,
    ease: 'power2.in',
    onStart: () => steps[0].classList.remove('active-step'),
    onReverseComplete: () => steps[0].classList.add('active-step')
  }, 0.15);
  
  // ── PASO 2 ────────────────────────────────────────────────────────────────
  // Fade-in paso 2 (empieza DESPUÉS de que termina el fade-out del paso 1)
  tl.fromTo(steps[1], { opacity: 0, y: 40 }, {
    opacity: 1,
    y: 0,
    duration: FADE_DUR,
    ease: 'power2.out',
    onStart: () => steps[1].classList.add('active-step'),
    onReverseComplete: () => steps[1].classList.remove('active-step')
  }, 0.27);
  
  // Typewriter paso 2
  tl.to(animState, {
    p1: 1,
    duration: TYPE_DUR,
    ease: 'none',
    onUpdate: () => updateTypewriterProgress(steps[1], animState.p1)
  }, 0.34);
  
  // Fade-out paso 2
  tl.to(steps[1], {
    opacity: 0,
    y: -40,
    duration: FADE_DUR,
    ease: 'power2.in',
    onStart: () => steps[1].classList.remove('active-step'),
    onReverseComplete: () => steps[1].classList.add('active-step')
  }, 0.51);
  
  // ── PASO 3 ────────────────────────────────────────────────────────────────
  tl.fromTo(steps[2], { opacity: 0, y: 40 }, {
    opacity: 1,
    y: 0,
    duration: FADE_DUR,
    ease: 'power2.out',
    onStart: () => steps[2].classList.add('active-step'),
    onReverseComplete: () => steps[2].classList.remove('active-step')
  }, 0.63);
  
  // Typewriter paso 3
  tl.to(animState, {
    p2: 1,
    duration: TYPE_DUR,
    ease: 'none',
    onUpdate: () => updateTypewriterProgress(steps[2], animState.p2)
  }, 0.70);
  
  // Fade-out paso 3
  tl.to(steps[2], {
    opacity: 0,
    y: -40,
    duration: FADE_DUR,
    ease: 'power2.in',
    onStart: () => steps[2].classList.remove('active-step'),
    onReverseComplete: () => steps[2].classList.add('active-step')
  }, 0.87);

  // ── PASO 4 (último — sin fade-out, se mantiene visible) ──────────────────
  tl.fromTo(steps[3], { opacity: 0, y: 40 }, {
    opacity: 1,
    y: 0,
    duration: FADE_DUR,
    ease: 'power2.out',
    onStart: () => steps[3].classList.add('active-step'),
    onReverseComplete: () => steps[3].classList.remove('active-step')
  }, 0.97);

  tl.to(animState, {
    p3: 1,
    duration: TYPE_DUR,
    ease: 'none',
    onUpdate: () => updateTypewriterProgress(steps[3], animState.p3)
  }, 1.04);
}

// 5. Animaciones de Entrada al Hacer Scroll en Otras Secciones
function initScrollAnimations() {
  // 5a. Animación del Catálogo (Cards escalonadas)
  gsap.from('.catalog-card', {
    scrollTrigger: {
      trigger: '.catalog-section',
      start: 'top 75%',
      toggleActions: 'play none none none'
    },
    opacity: 0,
    y: 50,
    duration: 1,
    stagger: 0.2, // Retraso escalonado de 0.2s entre cada card
    ease: 'power3.out'
  });
  
  // 5b. Animación "Sobre Nosotros" (Estilo Editorial)
  gsap.from('.about-text-side > *', {
    scrollTrigger: {
      trigger: '.about-section',
      start: 'top 75%'
    },
    opacity: 0,
    y: 30,
    duration: 0.8,
    stagger: 0.15,
    ease: 'power2.out'
  });
  
  gsap.from('.about-image-side', {
    scrollTrigger: {
      trigger: '.about-section',
      start: 'top 70%'
    },
    scale: 0.95,
    opacity: 0,
    duration: 1.4,
    ease: 'power2.out'
  });
  
  gsap.from('.about-image-overlay-card', {
    scrollTrigger: {
      trigger: '.about-section',
      start: 'top 60%'
    },
    x: -40,
    opacity: 0,
    duration: 1.2,
    delay: 0.4,
    ease: 'power2.out'
  });
  
  // 5c. Animación "El Estándar MAGNO" — header, manifiesto y cards
  gsap.from('.values-section .section-header > *', {
    scrollTrigger: {
      trigger: '.values-section',
      start: 'top 80%',
      toggleActions: 'play none none none'
    },
    opacity: 0,
    y: 20,
    duration: 0.7,
    stagger: 0.12,
    ease: 'power2.out'
  });

  gsap.from('.values-manifesto-p', {
    scrollTrigger: {
      trigger: '.values-manifesto',
      start: 'top 85%',
      toggleActions: 'play none none none'
    },
    opacity: 0,
    y: 24,
    duration: 0.9,
    stagger: 0.18,
    ease: 'power2.out'
  });

  gsap.from('.value-card', {
    scrollTrigger: {
      trigger: '.values-grid',
      start: 'top 85%',
      toggleActions: 'play none none none'
    },
    opacity: 0,
    y: 40,
    duration: 0.8,
    stagger: 0.15,
    ease: 'power2.out'
  });
  
  // 5d. Animación "Contacto"
  gsap.from('.contact-info > *', {
    scrollTrigger: {
      trigger: '.contact-section',
      start: 'top 80%'
    },
    opacity: 0,
    y: 30,
    duration: 0.8,
    stagger: 0.15,
    ease: 'power2.out'
  });
  
  gsap.from('.contact-form-side', {
    scrollTrigger: {
      trigger: '.contact-section',
      start: 'top 75%'
    },
    opacity: 0,
    x: 40,
    duration: 1.2,
    ease: 'power3.out'
  });
}

// 6. Formulario de Contacto Exclusivo (Boutique concierge feedback)
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const submitBtn = form.querySelector('.btn-submit');
    const originalText = submitBtn.innerHTML;
    
    // Cambiar texto a procesando con estilo premium
    submitBtn.innerHTML = '<span>PROCESANDO SU SOLICITUD...</span>';
    submitBtn.disabled = true;
    
    // Simular el registro y desvanecimiento elegante del formulario
    setTimeout(() => {
      const formContainer = form.parentElement;
      
      gsap.to(form, {
        opacity: 0,
        y: -20,
        duration: 0.5,
        onComplete: () => {
          formContainer.innerHTML = `
            <div class="form-success-overlay" style="opacity:0; transform:translateY(20px);">
              <div class="success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h3 class="success-title">SOLICITUD REGISTRADA</h3>
              <p class="success-desc">Le agradecemos su cortesía al contactarnos. Un especialista de nuestro departamento de Concierge privado de la Casa MAGNO ha sido asignado a su solicitud y se comunicará con usted en menos de 24 horas laborables para agendar su cita privada.</p>
            </div>
          `;
          
          const overlay = formContainer.querySelector('.form-success-overlay');
          gsap.to(overlay, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out'
          });
        }
      });
    }, 1500);
  });
}

// Iniciar precarga de inmediato al cargar el script
startPreload();
