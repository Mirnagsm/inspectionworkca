/* ==========================================================================
   MAIN.JS - INSPECTION WORK C.A.
   Interactividad, validaciones inteligentes, tracking y cookies.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar componentes
    initHeaderScroll();
    initMobileMenu();
    initServicesTabs();
    initFaqAccordion();
    initContactForm();
    initCookiesBanner();
    initWhatsAppTracking();
    initImageCarousels();
    initLightbox();
    initStatsCounter();
});

/**
 * 0. Contador Ascendente de Estadísticas y Acreditaciones con Efecto Glow Verde
 */
function initStatsCounter() {
    const counterElements = document.querySelectorAll('.stat-number[data-count], .accred-badge-number[data-count], .counter-green[data-count]');
    if (counterElements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                entry.target.classList.add('counted');
                animateCount(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    counterElements.forEach(el => observer.observe(el));

    function animateCount(el) {
        const target = parseInt(el.getAttribute('data-count'), 10);
        const suffix = el.getAttribute('data-suffix') || '';
        const prefix = el.getAttribute('data-prefix') || '';
        const duration = 2000; // ms
        const startTime = performance.now();

        function easeOutQuart(t) {
            return 1 - Math.pow(1 - t, 4);
        }

        function step(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutQuart(progress);
            const currentValue = Math.round(easedProgress * target);
            el.textContent = prefix + currentValue.toLocaleString('es-ES') + suffix;

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                el.textContent = prefix + target.toLocaleString('es-ES') + suffix;
            }
        }

        requestAnimationFrame(step);
    }
}

/**
 * 1. Control de Scroll del Header (Efecto Sticky Glassmorphism)
 */
function initHeaderScroll() {
    const header = document.getElementById('header');
    
    // Ejecutar al cargar por si la página ya está escroleada
    checkScroll();
    
    window.addEventListener('scroll', checkScroll);
    
    function checkScroll() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            // No quitar la clase scrolled si estamos en páginas secundarias (políticas/gracias)
            // que tienen la clase legal-page activa en el body
            if (!document.body.classList.contains('legal-page')) {
                header.classList.remove('scrolled');
            }
        }
    }
}

/**
 * 2. Menú de Navegación Móvil (Hamburguesa)
 */
function initMobileMenu() {
    const hamburger = document.getElementById('hamburger-menu');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    if (!hamburger || !navMenu) return;
    
    hamburger.addEventListener('click', () => {
        const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
        hamburger.setAttribute('aria-expanded', !isExpanded);
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    
    // Cerrar el menú al hacer clic en cualquier enlace
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.setAttribute('aria-expanded', 'false');
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
}

/**
 * 3. Sistema de Pestañas de Servicios
 */
function initServicesTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.services-tab-content');
    
    if (tabButtons.length === 0) return;
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Desactivar todos los botones y contenidos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Activar botón seleccionado y su contenido correspondiente
            button.classList.add('active');
            const activeContent = document.getElementById(`linea-${targetTab}`);
            if (activeContent) {
                activeContent.classList.add('active');
            }
        });
        
        // Soporte para accesibilidad con teclado (Enter o Espacio)
        button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                button.click();
            }
        });
    });
}

/**
 * 4. Acordeón de Preguntas Frecuentes (FAQ)
 */
function initFaqAccordion() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    if (faqQuestions.length === 0) return;
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const faqItem = question.parentElement;
            const isActive = faqItem.classList.contains('active');
            
            // Cerrar todos los demás elementos
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Si no estaba activo, abrir el actual
            if (!isActive) {
                faqItem.classList.add('active');
            }
        });
        
        question.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                question.click();
            }
        });
    });
}

/**
 * 5. Formulario de Cotización Inteligente con Validación AJAX
 */
function initContactForm() {
    const form = document.getElementById('quotation-form');
    const formStatus = document.getElementById('form-status-msg');
    
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Limpiar estados de error previos
        clearErrors();
        
        // Validar formulario en el cliente
        const isValid = validateForm();
        
        if (!isValid) {
            // Aplicar efecto visual de vibración en caso de error
            form.classList.add('form-shake');
            setTimeout(() => {
                form.classList.remove('form-shake');
            }, 400);
            
            showStatus('Por favor, corrija los campos marcados en rojo antes de enviar.', 'error');
            return;
        }
        
        // Estado de carga en el botón
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Procesando...</span>';
        
        // Obtener datos
        const formData = new FormData(form);
        
        try {
            const response = await fetch('send_contact.php', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.status === 'success') {
                // Registrar conversión localmente para estadísticas sencillas
                trackConversion('formulario_enviado', {
                    servicio: formData.get('servicio'),
                    empresa: formData.get('empresa')
                });
                
                // Redirigir a la página de agradecimiento
                window.location.href = 'gracias.html';
            } else {
                showStatus(result.message || 'Ocurrió un error al procesar su solicitud. Intente nuevamente.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        } catch (error) {
            console.error('Error de red:', error);
            showStatus('Fallo en la comunicación con el servidor. Por favor, intente contactarnos directamente vía correo o WhatsApp.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });
    
    // Quitar estados de error al escribir en los campos
    const inputs = form.querySelectorAll('.form-control');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            const group = input.parentElement;
            if (group.classList.contains('error')) {
                group.classList.remove('error');
            }
        });
    });
    
    // Función para validar campos en cliente
    function validateForm() {
        let valid = true;
        
        const empresa = document.getElementById('empresa');
        const contacto = document.getElementById('contacto');
        const servicio = document.getElementById('servicio');
        const ubicacion = document.getElementById('ubicacion');
        const telefono = document.getElementById('telefono');
        const email = document.getElementById('email');
        
        // Validación obligatoria simple
        if (!empresa.value.trim()) { setError(empresa, 'El nombre de la empresa es obligatorio.'); valid = false; }
        if (!contacto.value.trim()) { setError(contacto, 'El nombre de contacto es obligatorio.'); valid = false; }
        if (!servicio.value) { setError(servicio, 'Debe seleccionar un servicio.'); valid = false; }
        if (!ubicacion.value.trim()) { setError(ubicacion, 'La ubicación es obligatoria para planificar la inspección.'); valid = false; }
        
        // Validación de Teléfono (mínimo 7 caracteres)
        if (!telefono.value.trim()) {
            setError(telefono, 'El teléfono es obligatorio.');
            valid = false;
        } else if (telefono.value.trim().length < 7) {
            setError(telefono, 'Ingrese un formato de teléfono válido.');
            valid = false;
        }
        
        // Validación de Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.value.trim()) {
            setError(email, 'El correo electrónico es obligatorio.');
            valid = false;
        } else if (!emailRegex.test(email.value.trim())) {
            setError(email, 'Ingrese una dirección de correo válida.');
            valid = false;
        }
        
        return valid;
    }
    
    function setError(input, msg) {
        const group = input.parentElement;
        group.classList.add('error');
        const errorMsgSpan = group.querySelector('.form-error-msg');
        if (errorMsgSpan) {
            errorMsgSpan.textContent = msg;
        }
    }
    
    function clearErrors() {
        const groups = form.querySelectorAll('.form-group');
        groups.forEach(group => group.classList.remove('error'));
        if (formStatus) {
            formStatus.style.display = 'none';
            formStatus.className = 'form-status';
        }
    }
    
    function showStatus(msg, type) {
        if (!formStatus) return;
        formStatus.textContent = msg;
        formStatus.style.display = 'block';
        formStatus.className = `form-status ${type}`;
    }
}

/**
 * 6. Banner de Consentimiento de Cookies
 */
function initCookiesBanner() {
    const banner = document.getElementById('cookies-banner');
    const acceptBtn = document.getElementById('cookies-accept-btn');
    
    if (!banner || !acceptBtn) return;
    
    // Verificar si ya ha sido aceptado
    const isAccepted = localStorage.getItem('cookies_accepted');
    
    if (!isAccepted) {
        // Mostrar el banner tras un pequeño retardo para optimizar carga inicial
        setTimeout(() => {
            banner.classList.add('show');
        }, 2000);
    }
    
    acceptBtn.addEventListener('click', () => {
        localStorage.setItem('cookies_accepted', 'true');
        banner.classList.remove('show');
    });
}

/**
 * 7. Enlaces Dinámicos y Registro de Conversión de WhatsApp Business
 */
function initWhatsAppTracking() {
    const whatsappButtons = document.querySelectorAll('[data-whatsapp-service]');
    const generalWhatsAppLinks = document.querySelectorAll('.whatsapp-link');
    
    // Para botones en las tarjetas de servicio
    whatsappButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const serviceName = btn.getAttribute('data-whatsapp-service');
            const phoneNumber = '584129268997'; // Ventas corporativas por defecto
            
            // Crear mensaje personalizado
            const msg = `Hola, vengo del sitio web inworkca.com y me gustaría solicitar información técnica y cotización sobre el servicio de: *${serviceName}*.`;
            const encodedMsg = encodeURIComponent(msg);
            
            trackConversion('whatsapp_servicio_click', { servicio: serviceName });
            
            // Abrir WhatsApp en nueva pestaña
            window.open(`https://wa.me/${phoneNumber}?text=${encodedMsg}`, '_blank', 'noopener,noreferrer');
        });
    });
    
    // Enlaces generales de WhatsApp (flotante, footer, etc)
    generalWhatsAppLinks.forEach(link => {
        link.addEventListener('click', () => {
            const context = link.getAttribute('data-context') || 'contacto_general';
            trackConversion('whatsapp_general_click', { contexto: context });
        });
    });
    
    // Enlaces de correo y llamadas
    const mailLinks = document.querySelectorAll('a[href^="mailto:"]');
    mailLinks.forEach(link => {
        link.addEventListener('click', () => {
            trackConversion('email_click', { email: link.getAttribute('href').replace('mailto:', '') });
        });
    });
    
    const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
    phoneLinks.forEach(link => {
        link.addEventListener('click', () => {
            trackConversion('telefono_click', { tel: link.getAttribute('href').replace('tel:', '') });
        });
    });
}

/**
 * Función de Utilidad para Tracking Local de Conversiones
 */
function trackConversion(eventName, eventData) {
    try {
        // Registrar en localStorage para estadísticas del cliente si las requiere posteriormente
        let history = JSON.parse(localStorage.getItem('iw_conversion_history') || '[]');
        history.push({
            event: eventName,
            timestamp: new Date().toISOString(),
            data: eventData
        });
        localStorage.setItem('iw_conversion_history', JSON.stringify(history));
        
        // Registrar conversión analítica para el cliente (ej. si implementa Google Analytics en el futuro)
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, eventData);
        }
        
        console.log(`[Analytics Tracked] ${eventName}:`, eventData);
    } catch (e) {
        console.error('Error tracking conversion:', e);
    }
}

/**
 * Función Externa para enlazar el formulario con el servicio clickeado en la tarjeta
 */
function selectServiceInForm(serviceValue) {
    const serviceSelect = document.getElementById('servicio');
    const contactSection = document.getElementById('contacto');
    
    if (serviceSelect && contactSection) {
        serviceSelect.value = serviceValue;
        
        // Scroll suave al formulario
        contactSection.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * 8. Carrusel Interactivo de Múltiples Imágenes en Tarjetas de Servicios
 */
function initImageCarousels() {
    const carousels = document.querySelectorAll('.service-card-media[data-carousel]');
    
    carousels.forEach(media => {
        const slides = media.querySelectorAll('.service-card-img');
        const prevBtn = media.querySelector('.carousel-btn.prev');
        const nextBtn = media.querySelector('.carousel-btn.next');
        const dots = media.querySelectorAll('.carousel-indicators .dot');
        
        if (slides.length <= 1) return;
        
        let currentIndex = 0;
        
        function showSlide(index) {
            if (index < 0) index = slides.length - 1;
            if (index >= slides.length) index = 0;
            currentIndex = index;
            
            slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === currentIndex);
            });
            
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === currentIndex);
            });
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showSlide(currentIndex - 1);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showSlide(currentIndex + 1);
            });
        }
        
        dots.forEach((dot, i) => {
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                showSlide(i);
            });
        });
        
        // Soporte Swipe para dispositivos táctiles
        let touchStartX = 0;
        media.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        media.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].screenX;
            if (touchStartX - touchEndX > 40) showSlide(currentIndex + 1);
            if (touchEndX - touchStartX > 40) showSlide(currentIndex - 1);
        }, { passive: true });
    });
}

/**
 * 9. Modal Lightbox de Alta Resolución y Visor de Galería
 */
function initLightbox() {
    let lightbox = document.getElementById('image-lightbox');
    if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.id = 'image-lightbox';
        lightbox.className = 'image-lightbox';
        lightbox.innerHTML = `
            <div class="lightbox-content">
                <button class="lightbox-close" aria-label="Cerrar">&times;</button>
                <img src="" alt="" class="lightbox-img">
                <div class="lightbox-caption"></div>
                <div class="lightbox-nav">
                    <button class="lightbox-prev" aria-label="Anterior">&lsaquo;</button>
                    <button class="lightbox-next" aria-label="Siguiente">&rsaquo;</button>
                </div>
            </div>
        `;
        document.body.appendChild(lightbox);
    }
    
    const lightboxImg = lightbox.querySelector('.lightbox-img');
    const lightboxCaption = lightbox.querySelector('.lightbox-caption');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');
    
    let currentGallery = [];
    let currentIndex = 0;
    
    function openLightbox(images, index) {
        currentGallery = images;
        currentIndex = index;
        updateLightboxContent();
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function updateLightboxContent() {
        if (!currentGallery[currentIndex]) return;
        lightboxImg.src = currentGallery[currentIndex].src;
        lightboxCaption.textContent = currentGallery[currentIndex].alt || 'Inspection Work C.A.';
    }
    
    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });
    
    prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length;
        updateLightboxContent();
    });
    
    nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % currentGallery.length;
        updateLightboxContent();
    });
    
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') prevBtn.click();
        if (e.key === 'ArrowRight') nextBtn.click();
    });
    
    document.querySelectorAll('.service-card-media').forEach(media => {
        const slides = Array.from(media.querySelectorAll('.service-card-img'));
        slides.forEach((img, index) => {
            img.addEventListener('click', () => {
                openLightbox(slides.map(s => ({ src: s.src, alt: s.alt })), index);
            });
        });
    });
}
