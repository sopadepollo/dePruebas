document.addEventListener('DOMContentLoaded', () => {
    const productList = document.querySelector('.product-list');
    const viewToggleButtons = document.querySelectorAll('.view-toggle button');
    const categoryContainer = document.querySelector('.category-filters');
    const API_PRODUCTS_URL = 'api/products.php';
    const products = Array.isArray(window.__INITIAL_PRODUCTS__)
        ? window.__INITIAL_PRODUCTS__
        : [];

    const CATEGORY_KEYWORDS = [
        'Alegrías', 'Cocadas', 'Cajeta', 'Chocolate',
        'Obleas', 'Glorias', 'Jamoncillo', 'Muéganos', 'Tamarindo',
        'Mazapán', 'Palanqueta', 'Polvorones', 'Galletas', 'Pepitorias',
        'Gaznates', 'Calaveras'
    ];

    function formatCurrency(value) {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
        }).format(value ?? 0);
    }

    function showFeedback(target, message, type = 'info') {
        if (!target) {
            return;
        }
        target.textContent = message;
        target.dataset.state = type;
        target.hidden = false;
        window.clearTimeout(Number(target.dataset.timeoutId) || 0);
        const timeoutId = window.setTimeout(() => {
            target.hidden = true;
            target.textContent = '';
        }, 3000);
        target.dataset.timeoutId = String(timeoutId);
    }

    function createProductCard(product) {
        const card = document.createElement('article');
        card.className = 'product-card';

        if (product.image) {
            const figure = document.createElement('figure');
            const image = document.createElement('img');
            image.src =  product.image;
            image.alt = product.name;
            image.loading = 'lazy';
            figure.appendChild(image);
            card.appendChild(figure);
        }

        const header = document.createElement('header');
        const title = document.createElement('h3');
        title.textContent = product.name;
        const price = document.createElement('span');
        price.className = 'price';
        price.textContent = formatCurrency(product.price);
        header.append(title, price);
        card.appendChild(header);

        if (product.description) {
            const description = document.createElement('p');
            description.textContent = product.description;
            card.appendChild(description);
        }

        const footer = document.createElement('footer');

        const feedback = document.createElement('span');
        feedback.className = 'cart-feedback';
        feedback.hidden = true;

        const addButton = document.createElement('button');
        addButton.type = 'button';
        addButton.className = 'primary';
        addButton.textContent = 'Agregar al carrito';
        addButton.addEventListener('click', () => {
            const cart = window.Cart;
            if (!cart || typeof cart.addItem !== 'function') {
                window.location.href = `vista_producto.php?id_producto=${encodeURIComponent(product.id)}`;
                return;
            }

            try {
                cart.addItem(product, 1);
                showFeedback(feedback, 'Producto agregado.', 'success');
            } catch (error) {
                console.error(error);
                showFeedback(feedback, 'No se pudo agregar el producto.', 'error');
            }
        });

        const moreLink = document.createElement('a');
        moreLink.href = `vista_producto.php?id_producto=${encodeURIComponent(product.id)}`;
        moreLink.textContent = 'Ver detalle';
        moreLink.setAttribute('aria-label', `Ver detalles de ${product.name}`);

        footer.append(addButton, moreLink);
        card.append(feedback, footer);

        return card;
    }

    //-- Función para extraer categorías de los productos ---
    function extractCategories(products) {
        const foundCategories = new Set();
        products.forEach(product => {
            const productNameLower = product.name.toLowerCase();
            for (const keyword of CATEGORY_KEYWORDS) {
                if (productNameLower.includes(keyword.toLowerCase())) {
                    foundCategories.add(keyword); // Añade la palabra clave (ej. "Chocolate")
                    break; // Pasa al siguiente producto una vez que encuentra una categoría
                }
            }
        });
        // Devuelve un array ordenado con "Todos" al principio
        return ['Todos', ...Array.from(foundCategories).sort()];
    }

    // --- Función para renderizar los botones de filtro ---
    function renderCategories(categories) {
        if (!categoryContainer) return;
        categoryContainer.innerHTML = ''; // Limpiar por si acaso

        const label = document.createElement('span');
        label.className = 'control-label';
        label.textContent = 'Categoría:';
        categoryContainer.appendChild(label);

        // Usamos una clase similar a 'view-toggle' para reutilizar estilos
        const group = document.createElement('div');
        group.className = 'toggle-group'; 
        group.setAttribute('role', 'group');
        group.setAttribute('aria-label', 'Filtrar por categoría');

        categories.forEach((category, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = category;
            button.dataset.category = category;
            if (index === 0) { // 'Todos' es el activo por defecto
                button.classList.add('active');
            }
            
            button.addEventListener('click', () => {
                // Actualizar el botón activo
                categoryContainer.querySelectorAll('button').forEach(btn => {
                    btn.classList.toggle('active', btn === button);
                });
                // Volver a renderizar los productos con el filtro
                renderProducts(category); 
            });
            group.appendChild(button);
        });
        categoryContainer.appendChild(group);
    }

    // --- Funcion: Render Products, muestra tantos los productos como filtrados por categoria ---
    function renderProducts(filterCategory = 'Todos') {
        if (!productList) {
            return;
        }
        productList.innerHTML = '';

        // --- Lógica de filtrado ---
        const filteredProducts = (filterCategory === 'Todos')
            ? products // Si es 'Todos', usa la lista completa
            : products.filter(p => // Si no, filtra
                p.name.toLowerCase().includes(filterCategory.toLowerCase())
              );
        // --- Fin lógica de filtrado ---

        if (!filteredProducts.length) { // Comprueba la lista filtrada
            const empty = document.createElement('p');
            empty.className = 'lead';
            // Mensaje contextual
            empty.textContent = (filterCategory === 'Todos')
                ? 'Pronto agregaremos nuevos productos a nuestro catalogo.'
                : `No se encontraron productos en la categoría "${filterCategory}".`;
            productList.appendChild(empty);
            return;
        }
        const fragment = document.createDocumentFragment();
        // Itera sobre la lista filtrada
        filteredProducts.forEach((product) => { 
            fragment.appendChild(createProductCard(product));
        });
        productList.appendChild(fragment);
    }


    function setupViewToggle() {
        if (!productList || viewToggleButtons.length === 0) {
            return;
        }

        viewToggleButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const view = button.dataset.view;
                productList.dataset.view = view;
                viewToggleButtons.forEach((btn) => {
                    btn.classList.toggle('active', btn === button);
                });
            });
        });
    }

    setupViewToggle();
    
    // Si tenemos productos, los renderizamos
    if (products.length > 0) {
        const categories = extractCategories(products);
        renderCategories(categories);
        renderProducts(); // Renderiza 'Todos' por defecto
    } else {
        // Opcional: manejar el caso de que no haya productos
        renderProducts(); 
    }
});
