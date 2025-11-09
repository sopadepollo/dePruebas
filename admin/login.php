<?php
// EN: admin/login.php

declare(strict_types=1);

require_once __DIR__ . '/../lib/auth.php';

// Apunta al namespace de Admin que definimos
use function App\Lib\Admin\attemptLogin;
use function App\Lib\Admin\isLoggedIn;

$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = trim($_POST['password'] ?? '');

    // 1. Obtenemos el resultado (que es un string)
    $loginResult = attemptLogin($email, $password);

    // 2. Si es éxito, redirigimos
    if ($loginResult === 'SUCCESS') {
        header('Location: index.php');
        exit;
    } 
    
    // 3. Si no, asignamos un mensaje de error detallado
    switch ($loginResult) {
        case 'NOT_FOUND':
            $error = 'El email no está registrado.';
            break;
        case 'WRONG_PASS':
            $error = 'La contraseña es incorrecta.';
            break;
        case 'NO_PERMISSIONS':
            $error = 'Este usuario existe, pero no tiene permisos de administrador.';
            break;
        case 'DB_ERROR':
            $error = 'Error de base de datos. Contacte al soporte.';
            break;
        default:
            $error = 'Error desconocido.';
    }

} elseif (isLoggedIn()) {
    header('Location: index.php');
    exit;
}

?><!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel administrativo - Iniciar sesión</title>
    <link rel="stylesheet" href="../styles.css">
    <style>
        body { display: grid; place-items: center; min-height: 100vh; }
        .login-card { max-width: 360px; width: 100%; padding: 24px; border: 1px solid var(--color-border); border-radius: var(--radius-base); background: var(--color-surface); box-shadow: var(--shadow-soft); }
        .login-card h1 { margin-top: 0; text-align: center; }
        .login-card form { display: grid; gap: var(--space-md); }
        .error { color: var(--color-error); font-weight: 500; }
    </style>
</head>
<body data-theme="light">
    <main class="login-card">
        <h1>Administración</h1>
        <?php if ($error): ?>
            <p class="error"><?php echo htmlspecialchars($error, ENT_QUOTES, 'UTF-8'); ?></p>
        <?php endif; ?>
        <form method="post" autocomplete="off">
            <div class="form-field">
                <label for="email">Email:</label>
                <input id="email" name="email" type="email" required>
            </div>
            <div class="form-field">
                <label for="password">Contraseña:</label>
                <input id="password" name="password" type="password" required>
            </div>
            <button class="primary" type="submit">Entrar</button>
        </form>
        <p style="text-align:center; margin-top: var(--space-md);"><a href="../index.php">Volver al sitio</a></p>
    </main>
</body>
</html>