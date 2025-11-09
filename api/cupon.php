<?php
// api/cupon.php

use function App\Lib\getPDO;
use function App\Lib\jsonResponse;

header('Content-Type: application/json');

require_once '../lib/db.php';
require_once '../lib/response.php';

// Este endpoint solo acepta peticiones POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Método no permitido. Use POST.'], 405);
    exit;
}

// Leemos el JSON enviado desde el frontend (ej. js/cart.js)
$input = json_decode(file_get_contents('php://input'), true);
$codigo_cupon = $input['codigo'] ?? null;

if (empty($codigo_cupon)) {
    jsonResponse(['error' => 'No se proporcionó un código de cupón.'], 400);
    exit;
}

try {
    $pdo = getPDO();
    
    // Buscamos el cupón en la base de datos
    $stmt = $pdo->prepare("
        SELECT id_cupon, codigo, valor_descuento, descripcion
        FROM cupones
        WHERE codigo = ? 
          AND activo = TRUE 
          AND NOW() BETWEEN fecha_inicio AND fecha_final
    ");
    
    $stmt->execute([$codigo_cupon]);
    $cupon = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($cupon) {
        // Éxito: Cupón encontrado y válido
        jsonResponse(['success' => true, 'cupon' => $cupon]);
    } else {
        // Error: Cupón no válido o expirado
        jsonResponse(['error' => 'El cupón no es válido o ha expirado.'], 404);
    }

} catch (PDOException $e) {
    // Error interno del servidor
    jsonResponse(['error' => 'Error al validar el cupón: ' . $e->getMessage()], 500);
}