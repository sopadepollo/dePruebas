<?php
require_once __DIR__ . '/templates/header.php';
use function App\Lib\findProduct;

$id_producto = filter_input(INPUT_GET, 'id_producto', FILTER_SANITIZE_SPECIAL_CHARS);
//echo "<h1> este es el producto: $id_producto</h1>";
$product = findProduct($id_producto);

if (!$product) {
    echo "<h1>Producto no encontrado</h1>";
    exit;
}
?>

<main class="product-page-container section">

    <div class="product-gallery">
        <img src="<?= htmlspecialchars($product['image'] ?? 'placeholder.jpg') ?>" alt="Vista principal de <?= htmlspecialchars($product['name']) ?>">
    </div>

    <div class="product-content">
        <h1><?= htmlspecialchars($product['name']) ?></h1>
        
        <p class="price-large">$<?= number_format($product['price'], 2) ?></p>

        <h3>Acerca de este artículo</h3>
        <p><?= nl2br(htmlspecialchars($product['description'])) ?></p> 
        <div class="product-specs">
            <h4>Especificaciones</h4>
            <ul>
                <li><strong>Disponibilidad:</strong> <?= ($product['stock'] > 0) ? $product['stock'] . ' unidades en stock' : 'Agotado' ?></li>
                <li><strong>Categoría:</strong> Dulce Típico</li>
            </ul>
        </div>
    </div>

    <aside class="product-action-card">
        <div class="price-display">
            <strong class="price-large">$<?= number_format($product['price'], 2) ?></strong>
        </div>
        
        <p class="delivery-info">
            Envío a todo San Luis Potosí
        </p>

        <?php if ($product['stock'] > 0): ?>
            <p class="stock-status available">
                Disponible
            </p>
            
            <div class="form-field quantity-container" style="margin-top: var(--space-md);">
                <label for="quantity">Cantidad:</label>
                <div class="quantity-selector">
                    <input type="number" id="quantity" name="cantidad" value="1" min="1" max="<?= htmlspecialchars($product['stock'] ?? 10) ?>" aria-label="Cantidad de producto">
                </div>
                <span id="stock-error-message" class="error-message"></span>
            </div>

            <button type="button" class="primary button full-width" id="add-to-cart-btn" data-product-id="<?= htmlspecialchars($product['id']) ?>">
                Agregar al carrito
            </button>
            <p id="cart-feedback" class="hint" hidden></p>

        <?php else: ?>
            <p class="stock-status unavailable">Agotado</p>
            <button class="primary button full-width" disabled>No disponible</button>
        <?php endif; ?>
    </aside>

</main>

<script>
    // Pasa los datos del producto a JS
    window.__CURRENT_PRODUCT__ = <?php echo json_encode([
        'id' => $product['id'],
        'name' => $product['name'],
        'price' => $product['price'],
        'image' => $product['image'] ?? 'placeholder.jpg',
        'stock' => $product['stock']
    ], JSON_UNESCAPED_UNICODE); ?>;
</script>

<script src="./js/vista_producto.js" defer></script>

<?php require_once __DIR__ . '/templates/footer.php'; ?>