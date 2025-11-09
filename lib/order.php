<?php
declare(strict_types=1);

namespace App\Lib;

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/storage.php';

use function App\Lib\getPDO;
use function App\Lib\readProducts;
use PDO;

/**
 * NUEVA FUNCIÓN DE AYUDA
 * Busca un cupón válido en la BDD y calcula el descuento basado en un subtotal.
 */
function getCouponDiscount(int $couponId, float $subtotal): float
{
    try {
        $pdo = getPDO();
        $stmt = $pdo->prepare("
            SELECT discount_type, discount_value
            FROM cupones
            WHERE id = :id
              AND is_active = 1
              AND valid_until >= CURDATE()
        ");
        $stmt->execute([':id' => $couponId]);
        $coupon = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$coupon) {
            return 0.0; // Cupón no encontrado o no válido
        }

        $discount = 0.0;
        if ($coupon['discount_type'] === 'fixed') {
            $discount = (float)$coupon['discount_value'];
            // Asegurarse de que el descuento no sea mayor que el subtotal
            return min($discount, $subtotal);
            
        } elseif ($coupon['discount_type'] === 'percentage') {
            $discount = $subtotal * ((float)$coupon['discount_value'] / 100);
            return $discount;
        }

        return 0.0;

    } catch (\PDOException $e) {
        error_log($e->getMessage());
        return 0.0; // Error en la BDD, no aplicar descuento
    }
}

/**
 * FUNCIÓN MODIFICADA
 * Calcula el monto total del pedido para Stripe, AHORA SÍ aplicando el cupón.
 */
function calculateOrderAmount(array $items, ?int $couponId): array
{
    $products = readProducts();
    $productMap = [];
    foreach ($products as $product) {
        $productMap[$product['id']] = $product;
    }

    $subtotal = 0;
    foreach ($items as $item) {
        $productId = $item['id'];
        $quantity = $item['quantity'];

        if (isset($productMap[$productId])) {
            $product = $productMap[$productId];
            $subtotal += $product['price'] * $quantity;
        }
    }

    // === INICIO DE LA MODIFICACIÓN ===
    $discountAmount = 0.0;
    if ($couponId !== null) {
        // Llamamos a nuestra nueva función de ayuda
        $discountAmount = getCouponDiscount($couponId, $subtotal);
    }

    $total = $subtotal - $discountAmount;
    
    // Asegurarse de que el total no sea negativo
    if ($total < 0) {
        $total = 0;
    }
    // === FIN DE LA MODIFICACIÓN ===

    // Stripe requiere el monto en centavos
    //return (int)($total * 100);
    return [
        'subtotal' => $subtotal,
        'discountAmount' => $discountAmount,
        'total' => $total,
        'totalInCents' => (int)($total * 100)
    ];
}

/**
 * FUNCIÓN MODIFICADA
 * Crea el registro del pedido en la BDD, AHORA SÍ guardando el descuento.
 */
function createOrder(
    string $name,
    string $email,
    string $phone,
    string $address,
    string $city,
    string $state,
    string $zip,
    array $items,
    string $paymentIntentId,
    ?int $userId,
    ?int $couponId
): bool {
    try {
        $pdo = getPDO();
        $products = readProducts();
        $productMap = [];
        foreach ($products as $product) {
            $productMap[$product['id']] = $product;
        }

        $subtotal = 0.0;
        
        // Calcular subtotal (de nuevo, para seguridad del backend)
        foreach ($items as $item) {
            if (isset($productMap[$item['id']])) {
                $subtotal += $productMap[$item['id']]['price'] * $item['quantity'];
            }
        }

        // === INICIO DE LA MODIFICACIÓN ===
        $discountAmount = 0.0;
        if ($couponId !== null) {
            // Volvemos a llamar a nuestra función de ayuda
            $discountAmount = getCouponDiscount($couponId, $subtotal);
        }

        $total = $subtotal - $discountAmount;
        if ($total < 0) {
            $total = 0; // El total no puede ser negativo
        }
        // === FIN DE LA MODIFICACIÓN ===


        // Iniciar transacción
        $pdo->beginTransaction();

        // 1. Insertar en la tabla 'pedidos'
        $stmt = $pdo->prepare("
            INSERT INTO pedidos (
                id_usuario, nombre_cliente, email_cliente, telefono_cliente,
                direccion, ciudad, estado, cp,
                subtotal, descuento, total,
                payment_intent_id, cupon_id
            ) VALUES (
                :id_usuario, :nombre_cliente, :email_cliente, :telefono_cliente,
                :direccion, :ciudad, :estado, :cp,
                :subtotal, :descuento, :total,
                :payment_intent_id, :cupon_id
            )
        ");

        $stmt->execute([
            ':id_usuario' => $userId,
            ':nombre_cliente' => $name,
            ':email_cliente' => $email,
            ':telefono_cliente' => $phone,
            ':direccion' => $address,
            ':ciudad' => $city,
            ':estado' => $state,
            ':cp' => $zip,
            ':subtotal' => $subtotal,
            ':descuento' => $discountAmount, // <-- VALOR CORREGIDO
            ':total' => $total,             // <-- VALOR CORREGIDO
            ':payment_intent_id' => $paymentIntentId,
            ':cupon_id' => $couponId
        ]);

        $orderId = $pdo->lastInsertId();

        // 2. Insertar en la tabla 'detalles_pedido'
        $stmt = $pdo->prepare("
            INSERT INTO detalles_pedido (id_pedido, id_producto, cantidad, precio_unitario)
            VALUES (:id_pedido, :id_producto, :cantidad, :precio_unitario)
        ");

        foreach ($items as $item) {
            if (isset($productMap[$item['id']])) {
                $stmt->execute([
                    ':id_pedido' => $orderId,
                    ':id_producto' => $item['id'],
                    ':cantidad' => $item['quantity'],
                    ':precio_unitario' => $productMap[$item['id']]['price']
                ]);
            }
        }
        
        // 3. (Opcional pero recomendado) Actualizar el stock si lo manejas
        // ... (Tu lógica de stock aquí) ...


        // Completar transacción
        $pdo->commit();
        
        // Guardar el ID del pedido en la sesión para la página de "gracias"
        $_SESSION['last_order_id'] = $orderId;

        return true;

    } catch (\PDOException $e) {
        $pdo->rollBack();
        error_log("Error al crear pedido: " . $e->getMessage());
        return false;
    }
}