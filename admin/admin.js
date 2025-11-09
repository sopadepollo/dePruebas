document.addEventListener('DOMContentLoaded', () => {
const navLinks = document.querySelectorAll('.admin-bar a[href^="#"]');
const views = document.querySelectorAll('.admin-layout .view');
// Función para ocultar todas las vistas
function hideAllViews() {
    views.forEach(view => {
        view.style.display = 'none';
    });
}
// 3. Añade un listener a CADA enlace
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const viewId = link.getAttribute('href').substring(1); // ej: "products-view"

        // Oculta todo
        hideAllViews();

        // Muestra la vista seleccionada
        const activeView = document.getElementById(viewId);
        if (activeView) {
            activeView.style.display = 'block';
        }

        // (marcar el link como activo)
        navLinks.forEach(nav => nav.classList.remove('active'));
        link.classList.add('active');

        // 4. Llama a la función de carga correcta
        switch (viewId) {
            case 'products-view':
                loadProducts(); 
                break;
            case 'orders-view':
                // loadOrders(); 
                break;
            case 'stats-view':
                cargarEstadisticas(); 
                break;
            case 'cupones-view':
                cargarCupones(); 
                break;
            case 'banners-view':
                cargarBanners(); 
                break;
            case 'promociones-view':
                cargarPromociones();
                break;
        }
    });
});

/*
hideAllViews();
document.getElementById('products-view').style.display = 'active';
loadProducts();
document.querySelector('.admin-bar a[href="#products-view"]').classList.add('active');
*/

const apiUrl = '../api/products.php';
let products = [];

const form = document.querySelector('#product-form');
const rowsContainer = document.querySelector('#product-rows');
const idField = document.querySelector('#product-id');
const nameField = document.querySelector('#product-name');
const priceField = document.querySelector('#product-price');
const descriptionField = document.querySelector('#product-description');
const stockField = document.querySelector('#product-stock');
const imageField = document.querySelector('#product-image');

const statsView = document.querySelector('#stats-view');


function formatCurrency(value) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
}

async function loadProducts() {
    const response = await fetch(apiUrl);
    if (!response.ok) {
        throw new Error('No se pudo obtener el catálogo.');
    }

    const payload = await response.json();
    products = payload.data || [];
    renderRows();
}

function renderRows() {
    if (products.length === 0) {
        rowsContainer.innerHTML = '<tr><td colspan="6">No hay productos registrados.</td></tr>';
        return;
    }

    rowsContainer.innerHTML = products.map((product) => {
        const imageCell = product.image
            ? `<img src="../${product.image}" alt="${product.name}">`
            : '<span class="hint">Sin imagen</span>';

        return `
            <tr data-id="${product.id}">
                <td><strong>${product.name}</strong></td>
                <td>${formatCurrency(product.price)}</td>
                <td>${imageCell}</td>
                <td>${product.description}</td>
                <td>${product.stock}</td>
                <td>
                    <div class="table-actions">
                        <button type="button" data-action="edit">Editar</button>
                        <button type="button" data-action="delete">Eliminar</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function resetForm() {
    form.reset();
    idField.value = '';
}

function fillForm(product) {
    idField.value = product.id;
    nameField.value = product.name;
    priceField.value = product.price;
    descriptionField.value = product.description;
    stockField.value = product.stock;
    imageField.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function saveProduct(event) {
    event.preventDefault();
    const formData = new FormData(form);
    const id = idField.value.trim();

    if (id) {
        formData.append('_method', 'PUT');
        formData.append('id', id);
    }

    const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
    });

    const payload = await response.json();
    if (!response.ok) {
        throw new Error(payload.error || 'No se pudo guardar el producto.');
    }

    await loadProducts();
    resetForm();
    alert(id ? 'Producto actualizado.' : 'Producto creado.');
}

async function deleteProduct(id) {
    if (!confirm('¿Seguro que deseas eliminar este producto?')) {
        return;
    }

    const response = await fetch(`${apiUrl}?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
    });

    const payload = await response.json();
    if (!response.ok) {
        throw new Error(payload.error || 'No se pudo eliminar el producto.');
    }

    await loadProducts();
    alert('Producto eliminado.');
}

rowsContainer?.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
        return;
    }

    const action = target.dataset.action;
    if (!action) {
        return;
    }

    const row = target.closest('tr');
    const id = row?.dataset.id;
    if (!id) {
        return;
    }

    const product = products.find((item) => item.id === id);
    if (!product) {
        return;
    }

    try {
        if (action === 'edit') {
            fillForm(product);
        } else if (action === 'delete') {
            await deleteProduct(id);
        }
    } catch (error) {
        alert(error.message);
    }
});

form?.addEventListener('submit', async (event) => {
    try {
        await saveProduct(event);
    } catch (error) {
        alert(error.message);
    }
});

form?.addEventListener('reset', () => {
    idField.value = '';
});

loadProducts().catch((error) => {
    console.error(error);
    rowsContainer.innerHTML = '<tr><td colspan="6">No se pudo cargar el catálogo.</td></tr>';
});

    // --- 2. LÓGICA DE ESTADÍSTICAS ---
    let chartVentasMensuales, chartVentasEstacionales, chartVisitas, chartTopProductos;

    function cargarEstadisticas() {
        // Destruir gráficas anteriores para evitar duplicados
        if (chartVentasMensuales) chartVentasMensuales.destroy();
        if (chartVentasEstacionales) chartVentasEstacionales.destroy();
        if (chartVisitas) chartVisitas.destroy();
        if (chartTopProductos) chartTopProductos.destroy();

        // 1. Gráfica de Ventas Mensuales
        fetch('../api/stats.php?report=ventas_mensuales')
            .then(res => res.json())
            .then(response => {
                if (response.data) {
                    const ctx = document.getElementById('chart-ventas-mensuales').getContext('2d');
                    chartVentasMensuales = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: response.data.map(item => item.mes),
                            datasets: [{ label: 'Ventas $MXN', data: response.data.map(item => item.total), backgroundColor: 'rgba(75, 192, 192, 0.5)' }]
                        }
                    });
                }
            });

        // 2. Gráfica de Ventas Estacionales
        fetch('../api/stats.php?report=ventas_estacionales')
            .then(res => res.json())
            .then(response => {
                 if (response.data) {
                    const ctx = document.getElementById('chart-ventas-estacionales').getContext('2d');
                    chartVentasEstacionales = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: response.data.map(item => item.trimestre),
                            datasets: [{ label: 'Ventas $MXN', data: response.data.map(item => item.total), borderColor: 'rgba(153, 102, 255, 1)', tension: 0.1 }]
                        }
                    });
                }
            });

        // 3. Gráfica de Visitas Diarias
        fetch('../api/stats.php?report=visitas_diarias')
            .then(res => res.json())
            .then(response => {
                 if (response.data) {
                    const ctx = document.getElementById('chart-visitas-diarias').getContext('2d');
                    chartVisitas = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: response.data.map(item => item.fecha_visita).reverse(),
                            datasets: [{ label: 'Visitas', data: response.data.map(item => item.contador).reverse(), borderColor: 'rgba(255, 159, 64, 1)' }]
                        }
                    });
                }
            });
            
        // 4. Gráfica Top 5 Productos
        fetch('../api/stats.php?report=top_productos')
            .then(res => res.json())
            .then(response => {
                 if (response.data) {
                    const ctx = document.getElementById('chart-top-productos').getContext('2d');
                    chartTopProductos = new Chart(ctx, {
                        type: 'pie',
                        data: {
                            labels: response.data.map(item => item.nombre),
                            datasets: [{ label: 'Total Vendido', data: response.data.map(item => item.total_vendido) }]
                        }
                    });
                }
            });
    }

    // --- 3. LÓGICA DE CUPONES ---
    // (Seleccionamos los elementos que YA EXISTEN en tu index.php)
    const formCupon = document.getElementById('form-cupon');
    const tablaCuponesBody = document.getElementById('tabla-cupones-body');
    const cuponIdField = document.getElementById('cupon-id');
    const cuponCodigoField = document.getElementById('cupon-codigo');
    const cuponDescripcionField = document.getElementById('cupon-descripcion');
    const cuponValorField = document.getElementById('cupon-valor');
    const cuponInicioField = document.getElementById('cupon-inicio');
    const cuponFinField = document.getElementById('cupon-fin');
    const cuponActivoField = document.getElementById('cupon-activo');
    const btnCancelarCupon = document.getElementById('btn-cancelar-cupon');

    function cargarCupones() {
        const formData = new FormData();
        formData.append('action', 'read_cupones');

        fetch('../api/admin_manager.php', { method: 'POST', body: formData })
            .then(res => res.json())
            .then(response => {
                tablaCuponesBody.innerHTML = ''; // Limpiar tabla
                if (response.data) {
                    response.data.forEach(cupon => {
                        // Guardamos los datos en el 'dataset' de la fila para editarlos fácil
                        tablaCuponesBody.innerHTML += `
                            <tr data-id="${cupon.id_cupon}" 
                                data-codigo="${cupon.codigo}" 
                                data-descripcion="${cupon.descripcion}" 
                                data-valor="${cupon.valor_descuento}" 
                                data-inicio="${cupon.fecha_inicio}" 
                                data-fin="${cupon.fecha_final}" 
                                data-activo="${cupon.activo}">
                                
                                <td>${cupon.codigo}</td>
                                <td>${cupon.descripcion}</td>
                                <td>$${cupon.valor_descuento}</td>
                                <td>${cupon.fecha_inicio}</td>
                                <td>${cupon.fecha_final}</td>
                                <td>${cupon.activo ? 'Sí' : 'No'}</td>
                                <td>
                                    <button class="btn-editar-cupon">Editar</button>
                                    <button class="btn-borrar-cupon">Borrar</button>
                                </td>
                            </tr>
                        `;
                    });
                }
            });
    }

    function resetFormCupon() {
        formCupon.reset();
        cuponIdField.value = '';
        btnCancelarCupon.style.display = 'none';
    }

    if(formCupon) {
        formCupon.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const id = cuponIdField.value;
            const action = id ? 'update_cupon' : 'create_cupon';

            const data = {
                id_cupon: id || null,
                codigo: cuponCodigoField.value,
                descripcion: cuponDescripcionField.value,
                valor_descuento: cuponValorField.value,
                fecha_inicio: cuponInicioField.value.replace('T', ' '),
                fecha_final: cuponFinField.value.replace('T', ' '),
                activo: cuponActivoField.checked
            };
            
            const formData = new FormData();
            formData.append('action', action);
            formData.append('data', JSON.stringify(data));

            fetch('../api/admin_manager.php', { method: 'POST', body: formData })
                .then(res => res.json())
                .then(response => {
                    alert(response.message);
                    if(response.success) {
                        cargarCupones(); // Recargar la tabla
                        resetFormCupon();
                    }
                });
        });
    }

    if(btnCancelarCupon) {
        btnCancelarCupon.addEventListener('click', resetFormCupon);
    }

    if(tablaCuponesBody) {
        tablaCuponesBody.addEventListener('click', function(e) {
            const tr = e.target.closest('tr');
            if (!tr) return;
            const id = tr.dataset.id;
            
            // Botón Borrar
            if (e.target.classList.contains('btn-borrar-cupon')) {
                if (!confirm(`¿Seguro que quieres borrar el cupón ID ${id}?`)) return;
                
                const formData = new FormData();
                formData.append('action', 'delete_cupon');
                formData.append('data', JSON.stringify({ id_cupon: id }));

                fetch('../api/admin_manager.php', { method: 'POST', body: formData })
                    .then(res => res.json())
                    .then(response => {
                        alert(response.message);
                        if (response.success) cargarCupones();
                    });
            }

            // Botón Editar
            if (e.target.classList.contains('btn-editar-cupon')) {
                cuponIdField.value = id;
                cuponCodigoField.value = tr.dataset.codigo;
                cuponDescripcionField.value = tr.dataset.descripcion;
                cuponValorField.value = tr.dataset.valor;
                cuponInicioField.value = tr.dataset.inicio.replace(' ', 'T');
                cuponFinField.value = tr.dataset.fin.replace(' ', 'T');
                cuponActivoField.checked = (tr.dataset.activo == "1");
                
                btnCancelarCupon.style.display = 'inline-block';
                formCupon.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // --- 4. LÓGICA DE BANNERS ---
    const formBanner = document.getElementById('form-banner');
    const tablaBannersBody = document.getElementById('tabla-banners-body');

    function cargarBanners() {
        const formData = new FormData();
        formData.append('action', 'read_banners');

        fetch('../api/admin_manager.php', { method: 'POST', body: formData })
            .then(res => res.json())
            .then(response => {
                tablaBannersBody.innerHTML = ''; // Limpiar tabla
                if (response.data) {
                    response.data.forEach(banner => {
                        tablaBannersBody.innerHTML += `
                            <tr data-id="${banner.id_banner}">
                                <td><img src="../${banner.imagen_url}" alt="${banner.titulo}" width="150"></td>
                                <td>${banner.titulo}</td>
                                <td>${banner.link_destino || 'N/A'}</td>
                                <td>
                                    <input type="checkbox" class="check-banner-activo" ${banner.activo ? 'checked' : ''}>
                                </td>
                                <td>
                                    <button class="btn-borrar-banner">Borrar</button>
                                </td>
                            </tr>
                        `;
                    });
                }
            });
    }

    if(formBanner) {
        formBanner.addEventListener('submit', function(e) {
            e.preventDefault();
            const submitButton = formBanner.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Subiendo...';
            
            const fileInput = document.getElementById('banner-imagen-file');
            if (fileInput.files.length === 0) {
                alert('Por favor, selecciona una imagen.');
                submitButton.disabled = false;
                submitButton.textContent = 'Subir y Guardar Banner';
                return;
            }

            // PASO 1: Subir la imagen
            const fileData = new FormData();
            fileData.append('fileToUpload', fileInput.files[0]);

            fetch('../api/admin_upload.php', { method: 'POST', body: fileData })
                .then(res => res.json())
                .then(uploadResponse => {
                    if (!uploadResponse.success) {
                        throw new Error(uploadResponse.error || 'Error al subir la imagen');
                    }
                    
                    // PASO 2: Guardar datos del banner
                    const data = {
                        titulo: document.getElementById('banner-titulo').value,
                        descripcion_corta: document.getElementById('banner-descripcion').value,
                        link_destino: document.getElementById('banner-link').value,
                        imagen_url: uploadResponse.url
                    };

                    const managerData = new FormData();
                    managerData.append('action', 'create_banner');
                    managerData.append('data', JSON.stringify(data));

                    return fetch('../api/admin_manager.php', { method: 'POST', body: managerData });
                })
                .then(res => res.json())
                .then(managerResponse => {
                    alert(managerResponse.message);
                    if (managerResponse.success) {
                         formBanner.reset();
                         cargarBanners();
                    }
                })
                .catch(err => {
                    alert('Error en el proceso: ' + err.message);
                })
                .finally(() => {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Subir y Guardar Banner';
                });
        });
    }
    
    if(tablaBannersBody) {
        tablaBannersBody.addEventListener('click', function(e) {
            const tr = e.target.closest('tr');
            if (!tr) return;
            const id = tr.dataset.id;

            // Borrar Banner
            if (e.target.classList.contains('btn-borrar-banner')) {
                if (!confirm(`¿Seguro que quieres borrar el banner ID ${id}?`)) return;
                
                const formData = new FormData();
                formData.append('action', 'delete_banner');
                formData.append('data', JSON.stringify({ id_banner: id }));

                fetch('../api/admin_manager.php', { method: 'POST', body: formData })
                    .then(res => res.json())
                    .then(response => {
                        alert(response.message);
                        if (response.success) cargarBanners();
                    });
            }

            // Actualizar estado 'Activo'
            if (e.target.classList.contains('check-banner-activo')) {
                const estaActivo = e.target.checked;
                const formData = new FormData();
                formData.append('action', 'update_banner_status');
                formData.append('data', JSON.stringify({ id_banner: id, activo: estaActivo }));

                fetch('../api/admin_manager.php', { method: 'POST', body: formData })
                    .then(res => res.json())
                    .then(response => {
                        if (!response.success) alert('Error al actualizar');
                    });
            }
        });
    }
    //---5.Logica de Promociones---//
    const formPromocion = document.getElementById('form-promocion');
    const tablaPromocionesBody = document.getElementById('tabla-promociones-body');
    const promocionIdField = document.getElementById('promocion-id');
    const promocionNombreField = document.getElementById('promocion-nombre');
    const promocionDescripcionField = document.getElementById('promocion-descripcion');
    const promocionValorField = document.getElementById('promocion-valor');
    const promocionProductoField = document.getElementById('promocion-producto');
    const promocionCategoriaField = document.getElementById('promocion-categoria');
    const promocionInicioField = document.getElementById('promocion-inicio');
    const promocionFinField = document.getElementById('promocion-final');
    const promocionActivoField = document.getElementById('promocion-activo');
    const btnCancelarPromocion = document.getElementById('btn-cancelar-promocion');    

    async function cargarOpcionesPromociones(){
        const catFormData = new FormData();
        catFormData.append('action', 'read_categorias');
        fetch('../api/admin_manager.php', {method: 'POST', body: catFormData})
            .then(res=>res.json())
            .then(response=>{
                if(response.data){
                    promocionCategoriaField.innerHTML = '<option value="">Ninguna</option>';
                    response.data.forEach(cat=>{
                        promocionCategoriaField.innerHTML += `<option value="${cat.id_categoria}">${cat.nombre_categoria}</option>`;
                    });
                }
            });
        fetch('../api/products.php')
            .then(res=>res.json())
            .then(response=>{
                if(response.data){
                    promocionProductoField.innerHTML = '<option value="">Ninguno</option>';
                    response.data.forEach(prod=>{
                        promocionProductoField.innerHTML += `<option value="${prod.id}">${prod.name}</option>`;
                    });
                }
            });
    }

    function cargarPromociones(){
        const formData = new FormData();
        formData.append('action', 'read_promociones');
        fetch('../api/admin_manager.php', { method: 'POST', body: formData })
            .then(res => res.json())
            .then(response => {
                if(!tablaPromocionesBody) return;
                tablaPromocionesBody.innerHTML = '';
                if(response.data){
                    response.data.forEach(promo=>{
                        const productoNombre = promo.producto_nombre || 'NA';
                        const categoriaNombre = promo.categoria_nombre || 'NA';

                        tablaPromocionesBody.innerHTML += `
                            <tr data-id="${promo.id_promocion}"
                                data-nombre_promo="${promo.nombre_promo}"
                                data-descripcion="${promo.descripcion || ''}"
                                data-valor_descuento="${promo.valor_descuento}"
                                data-id_producto_asociado="${promo.id_producto_asociado || ''}"
                                data-id_categoria_asociada="${promo.id_categoria_asociada || ''}"
                                data-fecha_inicio="${promo.fecha_inicio}"
                                data-fecha_final="${promo.fecha_final}"
                                data-activa="${promo.activa}">

                                <td>${promo.nombre_promo}</td>
                                <td>${promo.valor_descuento}</td>
                                <td>${productoNombre}</td>
                                <td>${categoriaNombre}</td>
                                <td>${promo.fecha_inicio}</td>
                                <td>${promo.fecha_final}</td>
                                <td>${promo.activa ? 'Sí' : 'No'}</td>
                                <td>
                                    <button class="btn-editar-promocion">Editar</button>
                                    <button class="btn-borrar-promocion">Borrar</button>
                                </td>
                            </tr>
                        `;
                    });
                }
            });
        cargarOpcionesPromociones();
    }

    function resetFormPromocion(){
        if(formPromocion) formPromocion.reset();
        if(promocionIdField) promocionIdField.value = '';
        if(promocionProductoField) promocionProductoField.value = '';
        if(promocionCategoriaField) promocionCategoriaField.value = '';
        if(btnCancelarPromocion) btnCancelarPromocion.style.display = 'none';
    }

    if(formPromocion){
        formPromocion.addEventListener('submit', function(e){
            e.preventDefault();
            const id = promocionIdField.value;
            const action = id ? 'update_promocion' : 'create_promocion';

            const data={
                id_promocion: id || null,
                nombre_promo: promocionNombreField.value,
                descripcion: promocionDescripcionField.value,
                valor_descuento: promocionValorField.value,
                id_producto_asociado: promocionProductoField.value || null, // Enviar null si está vacío
                id_categoria_asociada: promocionCategoriaField.value || null, // Enviar null si está vacío
                fecha_inicio: promocionInicioField.value.replace('T', ' '),
                fecha_final: promocionFinField.value.replace('T', ' '),
                activo: promocionActivoField.checked
            };

            const formData = new FormData();
            formData.append('action', action);
            formData.append('data', JSON.stringify(data));

            fetch('../api/admin_manager.php', {method: 'POST', body: formData})
                .then(res=>res.json())
                .then(response=>{
                    alert(response.message);
                    if(response.success){
                        cargarPromociones();
                        resetFormPromocion();
                    }
                });
        });
    }
    if(btnCancelarPromocion){
        btnCancelarPromocion.addEventListener('click', resetFormPromocion);
    }
    if(tablaPromocionesBody){
        tablaPromocionesBody.addEventListener('click', function(e) {
        const tr = e.target.closest('tr');
        if (!tr) return;
        const id = tr.dataset.id;

        // Botón Borrar
        if (e.target.classList.contains('btn-borrar-promocion')) {
            if (!confirm(`¿Seguro que quieres borrar la promoción ID ${id}?`)) return;

            const formData = new FormData();
            formData.append('action', 'delete_promocion');
            formData.append('data', JSON.stringify({ id_promocion: id }));

            fetch('../api/admin_manager.php', { method: 'POST', body: formData })
                .then(res => res.json())
                .then(response => {
                    alert(response.message);
                    if (response.success) cargarPromociones();
                });
        }

        // Botón Editar
        if (e.target.classList.contains('btn-editar-promocion')) {
            promocionIdField.value = id;
            promocionNombreField.value = tr.dataset.nombre_promo;
            promocionDescripcionField.value = tr.dataset.descripcion;
            promocionValorField.value = tr.dataset.valor_descuento;
            promocionProductoField.value = tr.dataset.id_producto_asociado;
            promocionCategoriaField.value = tr.dataset.id_categoria_asociada;
            promocionInicioField.value = tr.dataset.fecha_inicio.replace(' ', 'T');
            promocionFinField.value = tr.dataset.fecha_final.replace(' ', 'T');
            promocionActivoField.checked = (tr.dataset.activa == "1");

            btnCancelarPromocion.style.display = 'inline-block';
            formPromocion.scrollIntoView({ behavior: 'smooth' });
        }
        });
    }
});
