<?php require_once __DIR__ . '/templates/header.php'; ?>

    <main>
        <section id="catalogo" class="section">
            <header class="section-header">
                <h2>Cat&aacute;logo de productos</h2>
                <p>Descubre nuestra selecci&oacute;n de dulces de leche, cada uno creado con dedicaci&oacute;n y sabor aut&eacute;ntico.</p>
            </header>

            <div class="category-filters">
                </div>
            
            <div class="product-controls">
                <span class="control-label">Vista:</span>
                <div class="view-toggle" role="group" aria-label="Cambiar vista del cat&aacute;logo">
                    <button type="button" data-view="grid" class="active">Cuadr&iacute;cula</button>
                    <button type="button" data-view="list">Lista</button>
                </div>
            </div>
            <div class="product-list" data-view="grid" aria-live="polite"></div>
        </section>
        <script src="./js/catalogo.js" defer></script>
    </main>

<?php require_once __DIR__ . '/templates/footer.php'; ?>