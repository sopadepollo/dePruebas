document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const stripe = Stripe(window.STRIPE_PUBLIC_KEY);

    let elements;
    let cardElement;

    
    const form = document.getElementById('payment-form');
    const paymentStatusEl = document.getElementById('payment-status');
    const submitBtn = document.getElementById('submit-payment-btn');
    const cartListEl = document.getElementById('checkout-cart-list');
    
    const cartEmptyEl = document.getElementById('cart-empty-message');
    const subtotalAmountEl = document.getElementById('subtotal-amount');
    const totalAmountEl = document.getElementById('total-amount');
    const discountAmountEl = document.getElementById('discount-amount');

    const couponInput = document.getElementById('coupon-code');
    const couponBtn = document.getElementById('apply-coupon-btn');

    // Referencias al Modal
    const addCardModal = document.getElementById('add-card-modal');
    const addCardBtn = document.getElementById('add-card-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelCardBtn = document.getElementById('cancel-card-btn');
    const submitCardBtn = document.getElementById('submit-card-btn');
    
    const cardHolderNameEl = document.getElementById('cardholder-name');
    const cardErrorsEl = document.getElementById('card-errors');

    // Estado local
    let currentCouponId = null;
    let currentClientSecret = null;
    let isSubmitting = false;


    function formatCurrency(amount) {
        return `$${(amount ?? 0).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
    }

    /**
     * Esta función ya no es necesaria, la dejamos vacía.
     * initializePayment() obtendrá los totales correctos del servidor.
     */
    function updateCheckoutTotals() {
        // (vacía)
    }

    /**
     * Dibuja los items del carrito en la lista del checkout.
     */
    async function renderCheckoutCart() {
    if (!window.Cart || !cartListEl || !cartEmptyEl) return;

    const cart = window.Cart.getItems(); 

    if (cart.length === 0) {
        cartListEl.innerHTML = '';
        cartEmptyEl.style.display = 'block';
        /*
        subtotalAmountEl.textContent = formatCurrency(0);
        totalAmountEl.textContent = formatCurrency(0);
        discountAmountEl.textContent = formatCurrency(0);
        */
        submitBtn.disabled = true;
        addCardBtn.disabled = true;
        couponBtn.disabled = true;
        return;
    }

    cartEmptyEl.style.display = 'none';
    
    // Habilitar botones
    submitBtn.disabled = false;
    addCardBtn.disabled = false;
    couponBtn.disabled = false;
    
    // --- PASO 1: CALCULAR SUBTOTAL AQUÍ ---
    const subtotal = cart.reduce((acc, item) => {
        // Asegurarse de que son números
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 0;
        return acc + (price * quantity);
    }, 0);


    // Recreando la lógica de 'cart.js' para el checkout
    const itemsHtml = cart.map(item => {
        // Asegurarse de que son números para el total del item
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 0;
        const itemTotal = (price * quantity).toFixed(2);
        
        return `
            <div class="checkout-item">
                <div class="checkout-item-image">
                    <img src="${item.image || 'uploads/placeholder.jpg'}" alt="${item.name}">
                    <span class="checkout-item-quantity">${quantity}</span>
                </div>
                <div class="checkout-item-details">
                    <span class="checkout-item-name">${item.name}</span>
                    <div class="checkout-item-controls">
                        <button type="button" class="qty-btn" data-id="${item.id}" data-action="decrease-qty" aria-label="Disminuir cantidad">-</button>
                        <span>${quantity}</span>
                        <button type="button" class="qty-btn" data-id="${item.id}" data-action="increase-qty" aria-label="Aumentar cantidad">+</button>
                    </div>
                </div>
                <div class="checkout-item-price">
                    <span>$${itemTotal}</span>
                    <button type="button" class="remove-btn" data-id="${item.id}" data-action="remove-item" aria-label="Eliminar">&times;</button>
                </div>
            </div>
        `;
    });
    
    cartListEl.innerHTML = itemsHtml.join('');

    // --- PASO 2: MOSTRAR TOTALES TEMPORALES ---
    // (Estos se actualizarán por 'initializePayment' si hay descuentos)
    //subtotalAmountEl.textContent = formatCurrency(subtotal);
    //discountAmountEl.textContent = formatCurrency(0);
    // El total es (subtotal - descuento). Como aún no hay descuento, es igual al subtotal.
    //totalAmountEl.textContent = formatCurrency(subtotal);
}

    
    /**
     * Maneja la interacción del usuario con la lista del carrito (cambiar cantidad, eliminar).
     */
    async function handleCartListInteraction(e) {
        const action = e.target.dataset.action;
        const id = e.target.dataset.id;

        if (!action || !id) return;

        if (action === 'increase-qty') {
            // 'addItem' en cart.js suma la cantidad si el producto ya existe
            window.Cart.addItem({ id: id }, 1); 
        } else if (action === 'decrease-qty') {
            // Necesitamos una función para decrementar que no está en tu cart.js
            // Usaremos updateItemQuantity
            const item = window.Cart.getItems().find(i => i.id === id);
            if (item && item.quantity > 1) {
                window.Cart.updateItemQuantity(id, item.quantity - 1);
            } else {
                window.Cart.removeItem(id); // Elimina si es 1
            }
        } else if (action === 'remove-item') {
            window.Cart.removeItem(id);
        }

        // Volver a dibujar el carrito
        renderCheckoutCart();
        
        // Después de cualquier cambio, recalcular los totales llamando al servidor
        await initializePayment(currentCouponId);
    }


    /**
     * Obtiene el client_secret del backend y prepara los elementos de Stripe.
     * ESTA FUNCIÓN AHORA TAMBIÉN ACTUALIZA LOS TOTALES.
     */
    async function initializePayment(couponId = null) {
        setLoading(true);
        paymentStatusEl.textContent = 'Actualizando totales...';
        
        const cartItems = window.Cart.getItems(); 
        
        try {
            const response = await fetch('./crear_payment_intent.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cartItems: cartItems, // <-- Enviamos el carrito
                    coupon_id: couponId 
                })
            });

            const data = await response.json();

            if (data.error) {
                showError(data.error);
                return;
            }

            // Guardamos el client secret
            currentClientSecret = data.clientSecret;

            // ¡ACTUALIZAMOS TOTALES DESDE EL SERVIDOR!
            totalAmountEl.textContent = formatCurrency(data.total);
            subtotalAmountEl.textContent = formatCurrency(data.subtotal);
            discountAmountEl.textContent = formatCurrency(data.discount); 

            // Manejar pedidos gratis (total 0)
            if (data.total === 0) {
                submitBtn.textContent = 'Completar Pedido (Gratis)';
                addCardBtn.style.display = 'none'; 
            } else {
                // Configurar Stripe Elements si no es gratis
                submitBtn.textContent = 'Procesar Pago';
                addCardBtn.style.display = 'block';

                if (!elements) {
                    elements = stripe.elements({ clientSecret: currentClientSecret });
                    cardElement = elements.create('card', {
                        // Opciones de estilo
                    });
                    cardElement.mount('#card-element');
                    cardElement.on('change', (e) => {
                        cardErrorsEl.textContent = e.error ? e.error.message : '';
                    });
                }
            }
            
            setLoading(false);
            paymentStatusEl.textContent = ''; // Limpiar estado

        } catch (error) {
            showError('No se pudo conectar con el servidor de pagos. ' + error.message);
        }
    }
    
    /**
     * Intenta aplicar un cupón
     */
    async function handleApplyCoupon() {
        const code = couponInput.value.trim();
        if (!code) {
            showError('Ingresa un código de cupón.');
            return;
        }
        
        setLoading(true);
        paymentStatusEl.textContent = 'Validando cupón...';

        try {
            const response = await fetch('./api/cupon.php', { // Asumiendo que esta es tu API
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'apply', code: code })
            });
            const data = await response.json();

            if (data.success) {
                currentCouponId = data.cupon.id_cupon;
                couponInput.disabled = true;
                couponBtn.disabled = true;
                couponBtn.textContent = 'Aplicado';
                
                // Si el cupón es válido, RECALCULAMOS todo el intento de pago
                await initializePayment(currentCouponId);
                
                showSuccess('Cupón aplicado con éxito.');
            } else {
                showError(data.error || 'Cupón no válido.');
            }
        } catch (error) {
            showError('Error al conectar con el servidor de cupones.');
        } finally {
            setLoading(false);
        }
    }

    /**
     * Valida el formulario de dirección/contacto
     */
    function validateForm() {
        form.classList.add('was-validated');
        if (!form.checkValidity()) {
            showError('Por favor, completa todos los campos de contacto y envío.');
            const invalidField = form.querySelector(':invalid');
            if (invalidField) {
                invalidField.focus();
            }
            return false;
        }
        return true;
    }

    /**
     * Muestra el modal de la tarjeta
     */
    function showCardModal() {
        if (validateForm()) {
            addCardModal.style.display = 'flex';
        }
    }

    /**
     * Oculta el modal de la tarjeta
     */
    function hideCardModal() {
        addCardModal.style.display = 'none';
    }

    /**
     * Maneja el flujo de pago principal (botón "Pagar" o "Completar Pedido")
     */
    async function handlePaymentFlow() {
        if (isSubmitting) return;

        // 1. Validar el formulario de contacto/envío
        if (!validateForm()) {
            return;
        }

        // 2. Obtener los datos del formulario
        const formData = new FormData(form);
        const billingDetails = {
            name: formData.get('nom_cliente'),
            email: formData.get('email'),
            phone: formData.get('num_cel'),
            address: {
                line1: formData.get('direccion'),
                city: formData.get('ciudad'),
                postal_code: formData.get('cod_post'),
                country: 'MX', // Asumir México
            },
        };

        // 3. Manejar caso de PEDIDO GRATIS
        if (totalAmountEl.textContent === formatCurrency(0)) {
            setLoading(true);
            showSuccess('Procesando pedido gratuito...');
            await processOrderOnServer(currentClientSecret, billingDetails);
            return;
        }

        // 4. Manejar caso de PEDIDO CON PAGO (Stripe)
        if (!cardElement) {
            showError('El formulario de pago no se ha cargado correctamente.');
            return;
        }
        
        setLoading(true);
        showSuccess('Procesando pago con Stripe...');

        try {
            const { error, paymentIntent } = await stripe.confirmCardPayment(
                currentClientSecret,
                {
                    payment_method: {
                        card: cardElement,
                        billing_details: billingDetails,
                    },
                }
            );

            if (error) {
                showError(error.message || 'Ocurrió un error con el pago.');
                isSubmitting = false;
                setLoading(false);
                return;
            }

            if (paymentIntent.status === 'succeeded') {
                showSuccess('¡Pago exitoso! Guardando tu pedido...');
                // 5. Enviar el pedido al servidor
                await processOrderOnServer(paymentIntent.id, billingDetails);
            }

        } catch (e) {
            showError('Error al confirmar el pago: ' + e.message);
        } finally {
            // setLoading(false) se maneja dentro de processOrderOnServer
        }
    }

    /**
     * Envía los datos finales al servidor para crear el pedido en la BD
     */
    async function processOrderOnServer(paymentIntentId, billingDetails) {
        try {
            const cartItems = window.Cart.getItems(); 

            const response = await fetch('./procesar_pedido.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cartItems: cartItems,
                    formData: {
                        // Aplanar los datos para el backend
                        nom_cliente: billingDetails.name,
                        email: billingDetails.email,
                        num_cel: billingDetails.phone,
                        direccion: billingDetails.address.line1,
                        ciudad: billingDetails.address.city,
                        cod_post: billingDetails.address.postal_code
                    },
                    paymentIntentId: paymentIntentId,
                    cuponId: currentCouponId
                })
            });

            const data = await response.json();

            if (data.success) {
                window.Cart.clear();
                // Redirigir a la página de "gracias" con el ID del pedido
                window.location.href = `./gracias.php?orderId=${data.orderId}`;
            } else {
                showError(data.error || 'Error al guardar el pedido.');
                isSubmitting = false;
                setLoading(false);
            }
        } catch (e) {
            showError('Error de conexión al guardar el pedido: ' + e.message);
            isSubmitting = false;
            setLoading(false);
        }
    }


    // --- Funciones de utilidad (setLoading, showError, showSuccess) ---
    function setLoading(isLoading) {
        isSubmitting = isLoading;
        submitBtn.disabled = isLoading;
        submitCardBtn.disabled = isLoading;
        
        if (isLoading) {
            submitBtn.textContent = 'Procesando...';
            submitCardBtn.textContent = 'Procesando...';
            paymentStatusEl.className = 'status-loading';
        } else {
            if (totalAmountEl.textContent === formatCurrency(0)) {
                submitBtn.textContent = 'Completar Pedido (Gratis)';
            } else {
                submitBtn.textContent = 'Procesar Pago';
            }
            submitCardBtn.textContent = 'Pagar';
            paymentStatusEl.className = '';
        }
    }
    
    function showError(message) {
        setLoading(false);
        paymentStatusEl.textContent = message;
        paymentStatusEl.className = 'error-message';
        cardErrorsEl.textContent = message;
    }
    
    function showSuccess(message) {
        paymentStatusEl.textContent = message;
        paymentStatusEl.className = 'success-message';
    }

    // --- Inicialización ---
    renderCheckoutCart();
    initializePayment(); 
    
    // Listeners
    cartListEl?.addEventListener('change', handleCartListInteraction);
    cartListEl?.addEventListener('click', handleCartListInteraction);
    couponBtn?.addEventListener('click', handleApplyCoupon);
    
    submitBtn?.addEventListener('click', (e) => {
        e.preventDefault(); 
        if (totalAmountEl.textContent === formatCurrency(0)) {
            handlePaymentFlow();
        } else {
            showCardModal();
        }
    });

    submitCardBtn?.addEventListener('click', handlePaymentFlow);

    // Listeners del Modal
    addCardBtn?.addEventListener('click', showCardModal);
    closeModalBtn?.addEventListener('click', hideCardModal);
    cancelCardBtn?.addEventListener('click', hideCardModal);
    
    addCardModal?.addEventListener('click', (e) => {
        if (e.target === addCardModal) {
            hideCardModal();
        }
    });
    
    // Escuchar eventos de 'cart:updated' (por si acaso)
    document.addEventListener('cart:updated', () => {
        renderCheckoutCart();
        initializePayment(currentCouponId); 
    });
    
});