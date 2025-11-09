<footer class="footer">
        <div class="footer-brand">
            <span class="brand-mark" aria-hidden="true">DL</span>
            <span class="brand-name">Las Sevillanas</span>
        </div>
        <div class="footer-info">
            <p>Av. de la Dulzura 123, Col. Centro, Michoac&aacute;n, M&eacute;xico</p>
            <p>Tel: <a href="tel:+523511234567">+52 351 123 4567</a> &middot; <a href="mailto:LaSevillanas@gmail.com">LaSevillanas@gmail.com</a></p>
        </div>
        <div class="footer-links">
            <a href="https://www.facebook.com/share/1SSXYufzZw/">Facebook</a>
            <a href=" https://www.instagram.com/lassevillanas2025?igsh=bnM3cDc5N3RyN3ox">Instagram</a>
            <a href="https://www.tiktok.com/@lassevillanasnooficial">TikTok</a>
        </div>
        <div class="footer-legal">
            <a href="index.php#terminos">Aviso de privacidad</a>
            <span aria-hidden="true">&middot;</span>
            <a href="index.php#terminos">T&eacute;rminos y condiciones</a>
        </div>
        <div class="footer-legal">
            <a href="admin/login.php">Panel administrativo</a>
        </div>
    </footer>

    <script>
        // La variable $products es accesible aquí porque fue definida en header.php
        window.__INITIAL_PRODUCTS__ = <?php echo json_encode($products, JSON_UNESCAPED_UNICODE); ?>;
    </script>
        <script src="js/cart.js" defer></script>

        <?php if (strpos($_SERVER['PHP_SELF'], 'compra.php') !== false): ?>
            <script src="js/compra.js" defer></script>
        <?php endif; ?>
    </body>
</html>
