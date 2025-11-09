<?php
namespace App\Lib;
// Usamos una ruta absoluta para asegurar que siempre encuentre el archivo
require_once __DIR__ . '/../lib/config.php';
require_once __DIR__ . '/../lib/storage.php';
require_once __DIR__ . '/../lib/auth_usr.php';

use function App\Lib\readProducts;
use function App\Lib\startSecureSession;
use function App\Lib\isLoggedIn;

startSecureSession();

// Leemos los productos para que estén disponibles en cualquier página que incluya este header
$products = readProducts();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dulces de Leche - Tradici&oacute;n Mexicana</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css" />
    <link rel="stylesheet" href="https://unpkg.com/swiper/swiper-bundle.min.css" />
    <script src="https://unpkg.com/swiper/swiper-bundle.min.js"></script>

    <script src="https://www.google.com/recaptcha/api.js?render=<?php echo htmlspecialchars($_ENV['RECAPTCHA_SITE_KEY']); ?>"></script>
    <script src="https://js.stripe.com/v3/"></script>

    <script src="app.js" defer></script>
    <script src="users/user.js" defer></script>
    <?php
        // Inyectamos los productos que ya cargamos en PHP al 'window' de JavaScript
        echo "<script>";
        echo "window.__INITIAL_PRODUCTS__ = " . json_encode($products) . ";";
        echo "</script>";
    ?>
    
</head>
<body data-theme="light">
    <header class="top-bar">
        <div class="brand">
            <span class="brand-mark" aria-hidden="true">DL</span>
            <span class="brand-name">Las Sevillanas</span>
        </div>
        <button class="theme-toggle" type="button" aria-pressed="false" aria-label="Cambiar tema">
            </button>
        <nav class="main-nav" aria-label="Principal">
            <ul>
                <li><a href="/LasSevillanas/Proyectini/index.php">Inicio</a></li>
                <li><a href="/LasSevillanas/Proyectini/catalogo.php">Cat&aacute;logo</a></li>
                <li><a href="/LasSevillanas/Proyectini/sucursales.php">Sucursales</a></li>
                <li><a href="/LasSevillanas/Proyectini/historia.php">Historia</a></li>
                <li><a href="/LasSevillanas/Proyectini/index.php#valores">Valores</a></li>
                <li><a href="/LasSevillanas/Proyectini/index.php#contacto">Contacto</a></li>
                <li><a href="/LasSevillanas/Proyectini/terminos.php">T&eacute;rminos y Condiciones</a></li>
            </ul>
        </nav>
        
        <div class="header-actions">
            
            <div class="user-session">
                <?php if (isLoggedIn()): ?>
                    <a href="/LasSevillanas/Proyectini/users/account.php" class="user-account-link" aria-label="Mi cuenta">
                        <svg fill="currentColor" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                    </a>
                <?php else: ?>
                    <button type="button" id="login-user-btn">Iniciar Sesión</button>
                    <button type="button" id="register-user-btn" class="primary">Registrarse</button>
                <?php endif; ?>
            </div>

            <div class="cart-wrapper">
                <button id="cart-toggle" class="cart-toggle" type="button" aria-controls="cart-dropdown" aria-expanded="false">                    
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M19 7h-3V6a4 4 0 10-8 0v1H5a1 1 0 00-1 1v11a3 3 0 003 3h10a3 3 0 003-3V8a1 1 0 00-1 1Zm-9-1a2 2 0 114 0v1H10V6ZM6 9h12v9a1 1 0 01-1 1H7a1 1 0 01-1-1V9Z" />
                    </svg>
                    <span>Carrito</span>
                    <span class="cart-count" data-cart-count>0</span>
                </button>

                <div class="cart-dropdown" id="cart-dropdown" hidden>
                    <div class="cart-dropdown-header">
                        <h2>Tu Carrito</h2>
                        <button type="button" class="cart-close" aria-label="Cerrar carrito">&times;</button>
                    </div>
                    
                    <ul class="cart-items" data-cart-items>
                        <li class="cart-empty">Aun no has agregado productos.</li>
                    </ul>

                    <div class="cart-dropdown-footer">
                        <div class="cart-summary">
                            <strong>Subtotal:</strong>
                            <strong data-cart-total>$0.00</strong>
                        </div>
                        <div class="cart-actions">
                            <button type="button" class="secondary" data-cart-clear>Vaciar</button>
                            
                            <a href="compra.php" class="primary button">Procesar Pedido</a>
                        </div>
                    </div>
                </div>
                </div>

        </div>

        <div class="social-links" aria-label="Redes sociales">
            </div>
    </header>
