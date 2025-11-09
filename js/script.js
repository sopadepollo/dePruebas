document.addEventListener('DOMContentLoaded', () => {
    const products = Array.isArray(window.__INITIAL_PRODUCTS__)
        ? window.__INITIAL_PRODUCTS__
        : [];

    const heroCarousel = document.querySelector('.hero-carousel');
    const carouselTrack = heroCarousel?.querySelector('.carousel-track');
    const carouselIndicator = document.querySelector('.carousel-indicator');
    const carouselStatus = document.querySelector('[data-carousel-status]');
    const prevButton = heroCarousel?.querySelector('.carousel-control.prev');
    const nextButton = heroCarousel?.querySelector('.carousel-control.next');

    const testimonialContainer = document.querySelector('.testimonial-list');
    const testimonials = [
        {
            quote: 'El mejor dulce de leche que he probado, perfecto para regalar y sorprender a la familia.',
            author: 'Maria Gonzalez',
            location: 'CDMX',
        },
        {
            quote: 'La atencion es impecable y los sabores nos transportan directo a nuestra infancia.',
            author: 'Jorge Ramirez',
            location: 'Guadalajara',
        },
        {
            quote: 'La cajeta envinada es mi favorita, siempre la pido para eventos especiales.',
            author: 'Daniela Torres',
            location: 'Queretaro',
        },
    ];

    const fallbackSlides = [
        {
            id: 'fallback-alegrias',
            name: 'Alegria artesanal',
            price: 39,
            image: 'https://images.unsplash.com/photo-1481391032119-d89fee407e44?auto=format&fit=crop&w=800&q=80',
        },
        {
            id: 'fallback-cajeta',
            name: 'Cajeta tradicional',
            price: 85,
            image: 'https://images.unsplash.com/photo-1613477077233-b8d6f6d4b828?auto=format&fit=crop&w=800&q=80',
        },
        {
            id: 'fallback-cocada',
            name: 'Cocadas de coco',
            price: 55,
            image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
        },
        {
            id: 'fallback-chocolate',
            name: 'Chocolate con almendra',
            price: 95,
            image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
        },
    ];

    let carouselIndex = 0;
    let carouselTimer = null;

    function formatCurrency(value) {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
        }).format(value ?? 0);
    }

    function renderTestimonials() {
        if (!testimonialContainer) {
            return;
        }

        const fragment = document.createDocumentFragment();
        testimonials.forEach(({ quote, author, location }) => {
            const card = document.createElement('article');
            card.className = 'testimonial-card';

            const text = document.createElement('p');
            text.textContent = `"${quote}"`;

            const authorLine = document.createElement('p');
            authorLine.className = 'author';
            authorLine.textContent = `${author} - ${location}`;

            card.append(text, authorLine);
            fragment.appendChild(card);
        });

        testimonialContainer.innerHTML = '';
        testimonialContainer.appendChild(fragment);
    }

function buildHeroCarousel() {
    if (!heroCarousel || !carouselTrack) {
        return;
    }

    const featured = products
        .filter((product) => product && product.name)
        .map((product) => {
            const rawImage = typeof product.image === 'string' ? product.image.trim() : '';
            // Construir la ruta completa de la imagen
            let image = null;
            if (rawImage !== '') {
                image = rawImage.startsWith('http')
                    ? rawImage
                    : `${rawImage}`;
            }
            return {
                id: product.id ?? '',
                name: product.name,
                price: product.price ?? 0,
                image,
            };
        })
        .filter((product) => product.name)
        .slice(0, 8);

    const slides = featured.length > 0 ? featured : fallbackSlides;

    slides.forEach((product) => {
        const slide = document.createElement('li');
        slide.className = 'carousel-slide';
        slide.dataset.id = product.id ?? '';

        const image = document.createElement('img');
        const imageSrc = product.image && product.image !== ''
            ? product.image
            : fallbackSlides[Math.floor(Math.random() * fallbackSlides.length)].image;
        image.src = imageSrc;
        image.alt = product.name;
        image.loading = 'lazy';

        const caption = document.createElement('div');
        caption.className = 'carousel-caption';

        const title = document.createElement('h3');
        title.textContent = product.name;

        const price = document.createElement('span');
        price.className = 'carousel-price';
        price.textContent = formatCurrency(product.price);

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'secondary';
        button.textContent = featured.length > 0 ? 'Ver detalle' : 'Ir al catalogo';
        button.addEventListener('click', () => {
            const targetUrl = product.id
                ? `vista_producto.php?id_producto=${encodeURIComponent(product.id)}`
                : 'catalogo.php';
            window.location.href = targetUrl;
        });

        caption.append(title, price, button);
        slide.append(image, caption);
        carouselTrack.appendChild(slide);
    });

    updateCarouselUI();
    startCarouselTimer();
}

    function updateCarouselUI() {
        if (!carouselTrack) {
            return;
        }
        const slides = carouselTrack.children;
        if (!slides.length) {
            return;
        }
        const active = slides[carouselIndex];
        const name = active?.querySelector('h3')?.textContent ?? '';
        if (carouselStatus) {
            carouselStatus.textContent = name !== ''
                ? `Producto destacado: ${name}`
                : 'Descubre nuestros dulces artesanales.';
        }
        carouselTrack.style.transform = `translateX(-${carouselIndex * 100}%)`;

        if (carouselIndicator) {
            const total = slides.length;
            const progress = total > 0 ? ((carouselIndex + 1) / total) * 100 : 0;
            carouselIndicator.style.setProperty('--progress', `${progress}%`);
        }
    }

    function moveCarousel(step) {
        if (!carouselTrack) {
            return;
        }
        const slideCount = carouselTrack.children.length;
        if (slideCount === 0) {
            return;
        }
        carouselIndex = (carouselIndex + step + slideCount) % slideCount;
        updateCarouselUI();
    }

    function startCarouselTimer() {
        stopCarouselTimer();
        carouselTimer = window.setInterval(() => moveCarousel(1), 3000);
    }

    function stopCarouselTimer() {
        if (carouselTimer !== null) {
            window.clearInterval(carouselTimer);
            carouselTimer = null;
        }
    }

    prevButton?.addEventListener('click', () => {
        moveCarousel(-1);
        startCarouselTimer();
    });

    nextButton?.addEventListener('click', () => {
        moveCarousel(1);
        startCarouselTimer();
    });

    heroCarousel?.addEventListener('mouseenter', stopCarouselTimer);
    heroCarousel?.addEventListener('mouseleave', startCarouselTimer);

    renderTestimonials();
    buildHeroCarousel();

    const contactForm = document.getElementById('contact-form');
    const contactSubmitBtn = document.getElementById('contact-submit-btn');
    const contactFeedback = document.getElementById('contact-feedback');

    if (contactForm && contactSubmitBtn && contactFeedback) {
        
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevenir el envío normal

            // 1. Mostrar estado de "cargando"
            contactSubmitBtn.disabled = true;
            contactSubmitBtn.textContent = 'Enviando...';
            contactFeedback.textContent = '';

            // 2. Verificar que reCAPTCHA esté cargado
            if (typeof grecaptcha === 'undefined' || !window.RECAPTCHA_SITE_KEY) {
                contactFeedback.textContent = 'Error: reCAPTCHA no se cargó.';
                contactFeedback.style.color = 'var(--color-error)';
                contactSubmitBtn.disabled = false;
                contactSubmitBtn.textContent = 'Enviar mensaje';
                return;
            }
            
            // 3. ejecutar reCaptcha
            grecaptcha.ready(function() {
                grecaptcha.execute(window.RECAPTCHA_SITE_KEY, {action: 'contact'}).then(async function(token) {
                    
                    // 4. Recolectar datos del formulario
                    const formData = new FormData(contactForm);
                    const data = Object.fromEntries(formData.entries());
                    
                    // 5. Añadir el token de reCAPTCHA
                    data.recaptcha_token = token;
                    
                    try {
                        // 6. Enviar los datos a la API (el fetch va A DENTRO)
                        const response = await fetch('api/contact.php', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            },
                            body: JSON.stringify(data)
                        });
                        
                        const result = await response.json();

                        if (!response.ok) {
                            throw new Error(result.error || 'Ocurrió un error.');
                        }
                        
                        // 7. Éxito
                        contactFeedback.textContent = result.message || '¡Mensaje enviado!';
                        contactFeedback.style.color = 'green';
                        contactForm.reset();

                    } catch (error) {
                        // 8. Error
                        contactFeedback.textContent = error.message;
                        contactFeedback.style.color = 'var(--color-error)';
                    
                    } finally {
                        // 9. Restaurar botón
                        contactSubmitBtn.disabled = false;
                        contactSubmitBtn.textContent = 'Enviar mensaje';
                    }
                });
            });
        });
    }

    (function trackVisit(){
        if(!sessionStorage.getItem('visit_tracked')){
            fetch('api/tracker_visita.php',{
                method: 'POST'
            })
            .then(res=>res.json())
            .then(data=>{
                if(data.success){
                    sessionStorage.setItem('visit_tracked', 'true');
                    console.log('visita registrada');
                }
            }).catch(err=>console.error('error al registrar visitas: ', err));
        }
    })();
});