document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'sevillanas_cart';
    const cartToggle = document.getElementById('cart-toggle');
    const cartDropdown = document.getElementById('cart-dropdown');
    const cartCount = document.querySelector('[data-cart-count]');
    const cartItemsList = document.querySelector('[data-cart-items]');
    const cartTotal = document.querySelector('[data-cart-total]');
    const cartClose = document.querySelector('.cart-close');
    const cartClearButton = document.querySelector('[data-cart-clear]');

    let items = loadItems();

    function loadItems() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) {
                return [];
            }
            const parsed = JSON.parse(stored);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.warn('No se pudo leer el carrito almacenado.', error);
            return [];
        }
    }

    function persist() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch (error) {
            console.warn('No se pudo guardar el carrito.', error);
        }
        render();
        notify();
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
        }).format(value ?? 0);
    }

    function getTotalQuantity() {
        return items.reduce((acc, item) => acc + item.quantity, 0);
    }

    function getSubtotal() {
        return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    }

    function render() {
        if (cartCount) {
            cartCount.textContent = String(getTotalQuantity());
        }

        if (!cartItemsList) {
            return;
        }

        cartItemsList.innerHTML = '';

        if (items.length === 0) {
            const empty = document.createElement('li');
            empty.className = 'cart-empty';
            empty.textContent = 'Aun no has agregado productos.';
            cartItemsList.appendChild(empty);
        } else {
            const fragment = document.createDocumentFragment();
            items.forEach((item) => {
                const row = document.createElement('li');
                row.className = 'cart-item';
                row.dataset.id = item.id;

                const image = document.createElement('img');
                image.src = item.image || 'placeholder.jpg';
                image.alt = item.name;

                const info = document.createElement('div');
                info.className = 'cart-item-info';

                const title = document.createElement('h3');
                title.textContent = item.name;

                const meta = document.createElement('div');
                meta.className = 'cart-item-meta';
                meta.textContent = `${item.quantity} x ${formatCurrency(item.price)}`;

                info.append(title, meta);

                const removeButton = document.createElement('button');
                removeButton.type = 'button';
                removeButton.setAttribute('data-cart-remove', item.id);
                removeButton.textContent = 'Quitar';

                row.append(image, info, removeButton);
                fragment.appendChild(row);
            });
            cartItemsList.appendChild(fragment);
        }

        if (cartTotal) {
            cartTotal.textContent = formatCurrency(getSubtotal());
        }
    }

    function notify() {
        const detail = {
            items: items.map((item) => ({ ...item })),
            quantity: getTotalQuantity(),
            total: getSubtotal(),
        };
        document.dispatchEvent(new CustomEvent('cart:updated', { detail }));
    }

    function findItemIndex(id) {
        return items.findIndex((item) => item.id === id);
    }

    function addItem(product, quantity = 1) {
        if (!product || product.id === undefined || product.id === null) {
            throw new Error('Producto invalido.');
        }

        const id = String(product.id);
        const price = Number(product.price) || 0;
        const parsedQuantity = Math.max(1, Number(quantity) || 1);

        const index = findItemIndex(id);
        if (index >= 0) {
        // Si existe, SUMA la cantidad
            items[index].quantity = Math.min(items[index].quantity + parsedQuantity, 99);
        } else {
            items.push({
                id,
                name: product.name || 'Producto',
                price,
                quantity: parsedQuantity,
                image: product.image || 'placeholder.jpg',
            });
        }

        persist();
    }

    function removeItem(id) {
        const index = findItemIndex(id);
        if (index >= 0) {
            items.splice(index, 1);
            persist();
        }
    }

    
    function updateItemQuantity(id, quantity) {
        const parsedQuantity = Math.max(1, Number(quantity) || 1);
        const index = findItemIndex(String(id));

        if (index >= 0) {
            items[index].quantity = Math.min(parsedQuantity, 99); // Simplemente la reemplaza
            persist();
        }
    }

    function clearCart() {
        items = [];
        persist();
    }

    function toggleCart(force) {
        if (!cartDropdown || !cartToggle) {
            return;
        }

        const isOpen = force ?? cartDropdown.hidden;
        cartDropdown.hidden = !isOpen;
        cartToggle.setAttribute('aria-expanded', String(isOpen));
    }

    cartToggle?.addEventListener('click', () => {
        toggleCart();
    });

    cartClose?.addEventListener('click', () => toggleCart(false));

    cartClearButton?.addEventListener('click', () => {
        clearCart();
        toggleCart(false);
    });

    cartItemsList?.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }
        const id = target.getAttribute('data-cart-remove');
        if (id) {
            removeItem(id);
        }
    });

    document.addEventListener('click', (event) => {
        if (!cartDropdown || cartDropdown.hidden) {
            return;
        }
        const target = event.target;
        if (!(target instanceof Node)) {
            return;
        }
        if (cartDropdown.contains(target) || cartToggle?.contains(target)) {
            return;
        }
        toggleCart(false);
    });

    window.Cart = {
        getItems: () => items.map((item) => ({ ...item })),
        getSubtotal,
        getTotalQuantity,
        addItem,
        removeItem,
        updateItemQuantity,
        clear: clearCart,
    };

    render();
    notify();
});
