document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const themeToggle = document.querySelector('.theme-toggle');
    const THEME_STORAGE_KEY = 'dulces-theme-preference';

    function updateThemeToggle(theme) {
        if (!themeToggle) {
            return;
        }
        const sunIcon = themeToggle.querySelector('.icon-sun');
        const moonIcon = themeToggle.querySelector('.icon-moon');
        const label = themeToggle.querySelector('.label');
        const isDark = theme === 'dark';

        if (sunIcon && moonIcon) {
            sunIcon.hidden = isDark;
            moonIcon.hidden = !isDark;
        }
        if (label) {
            label.textContent = isDark ? 'Modo oscuro' : 'Modo claro';
        }

        themeToggle.setAttribute('aria-pressed', String(isDark));
    }

    function applyTheme(theme) {
        body.dataset.theme = theme;
        updateThemeToggle(theme);
    }

    function persistTheme(theme) {
        try {
            localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch (error) {
            console.warn('No se pudo guardar la preferencia de tema.', error);
        }
    }

    function loadThemePreference() {
        try {
            const stored = localStorage.getItem(THEME_STORAGE_KEY);
            if (stored === 'dark' || stored === 'light') {
                return stored;
            }
        } catch (error) {
            // Ignoramos errores de acceso a almacenamiento.
        }
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
    }

    function setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
            anchor.addEventListener('click', (event) => {
                const targetId = anchor.getAttribute('href');
                if (!targetId || targetId === '#') {
                    return;
                }
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    event.preventDefault();
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    const initialTheme = loadThemePreference();
    applyTheme(initialTheme);
    setupSmoothScroll();

    themeToggle?.addEventListener('click', () => {
        const nextTheme = body.dataset.theme === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme);
        persistTheme(nextTheme);
    });

    const addToCartButton = document.getElementById('add-to-cart-btn');
    const cartStatus = document.getElementById('cart-feedback');
    const currentProduct = window.__CURRENT_PRODUCT__;

    if (addToCartButton && currentProduct) {
        addToCartButton.addEventListener('click', () => {
            const cartRef = window.Cart;
            if (!cartRef || typeof cartRef.addItem !== 'function') {
                if (cartStatus) {
                    cartStatus.hidden = false;
                    cartStatus.textContent = 'No se pudo acceder al carrito.';
                    cartStatus.dataset.state = 'error';
                }
                return;
            }

            try {
                cartRef.addItem(currentProduct, 1);
                if (cartStatus) {
                    cartStatus.hidden = false;
                    cartStatus.textContent = 'Producto agregado al carrito.';
                    cartStatus.dataset.state = 'success';
                }
            } catch (error) {
                console.error(error);
                if (cartStatus) {
                    cartStatus.hidden = false;
                    cartStatus.textContent = 'No se pudo agregar el producto.';
                    cartStatus.dataset.state = 'error';
                }
            }
        });
    }
});
