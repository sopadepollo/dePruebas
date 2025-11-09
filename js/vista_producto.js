document.addEventListener('DOMContentLoaded', () => {
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const quantityInput = document.getElementById('quantity');
    const feedbackEl = document.getElementById('cart-feedback');
    const stockErrorEl = document.getElementById('stock-error-message');
    const product = window.__CURRENT_PRODUCT__;

    if (!product || !addToCartBtn) {
        return;
    }

    // Validar stock al cambiar cantidad
    quantityInput?.addEventListener('input', () => {
        const quantity = parseInt(quantityInput.value, 10);
        const maxStock = parseInt(product.stock, 10);
        stockErrorEl.textContent = '';
        
        if (quantity > maxStock) {
            quantityInput.value = maxStock;
            stockErrorEl.textContent = 'Stock máximo alcanzado';
        } else if (quantity < 1) {
            quantityInput.value = 1;
        }
    });

    // Lógica del botón "Agregar al carrito"
    addToCartBtn.addEventListener('click', () => {
        if (!window.Cart) {
            console.error('El módulo Cart no está cargado.');
            return;
        }

        const quantity = parseInt(quantityInput.value, 10) || 1;
        
        // Usamos la API de cart.js
        window.Cart.addItem(product, quantity);

        // Feedback visual
        feedbackEl.textContent = '¡Agregado al carrito!';
        feedbackEl.hidden = false;
        feedbackEl.dataset.state = 'success';

        setTimeout(() => {
            feedbackEl.hidden = true;
        }, 2000);
    });
});