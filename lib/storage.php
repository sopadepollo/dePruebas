<?php
namespace App\Lib;
use PDO;
require_once __DIR__ . '/db.php';

// Mapea una fila de la tabla `producto` al formato usado en el frontend/API
function mapProductRow(array $row) : array {
    return [
        'id' => isset($row['id_producto']) ? (string) $row['id_producto'] : null,
        'name' => (string) ($row['nombre'] ?? ''),
        'price' => isset($row['precio']) ? (float) $row['precio'] : 0.0,
        'description' => (string) ($row['descripcion'] ?? ''),
        'image' => $row['foto'] ?? null,
        'stock' => isset($row['stock']) ? (int) $row['stock'] : 0
    ];
}

function readProducts() : array {
    $sql = 'SELECT id_producto, nombre, descripcion, stock, precio, foto FROM producto ORDER BY id_producto DESC';
    $stmt = getPDO()->query($sql);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    return array_map(static fn($r) => mapProductRow($r), $rows);
}

function findProduct(string $id) : ?array {
    $sql = 'SELECT id_producto, nombre, descripcion, stock, precio, foto FROM producto WHERE id_producto = :id LIMIT 1';
    $stmt = getPDO()->prepare($sql);
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ? mapProductRow($row) : null;
}

function upsertProduct(array $payload) : array {
    $id = $payload['id'] ?? null;
    $name = (string) ($payload['name'] ?? '');
    $price = (float) ($payload['price'] ?? 0);
    $description = (string) ($payload['description'] ?? '');
    $stock = (int) ($payload['stock'] ?? 0);
    $image = $payload['image'] ?? null;

    if ($id === null || $id === '' ) {
        $sql = 'INSERT INTO producto (nombre, descripcion, stock, precio, foto) VALUES (:n, :d, :s, :p, :f)';
        $stmt = getPDO()->prepare($sql);
        $stmt->execute([
            ':n' => $name,
            ':d' => $description,
            ':s' => $stock,
            ':p' => $price,
            ':f' => $image,
        ]);
        $newId = (string) getPDO()->lastInsertId();
        return findProduct($newId) ?? [
            'id' => (int) $newId,
            'name' => $name,
            'price' => $price,
            'description' => $description,
            'image' => $image,
            'stock' => $stock,
            'date' => null,
        ];
    }

    $sql = 'UPDATE producto SET nombre = :n, descripcion = :d, stock = :s, precio = :p, foto = :f WHERE id_producto = :id';
    $stmt = getPDO()->prepare($sql);
    $stmt->execute([
        ':n' => $name,
        ':d' => $description,
        ':s' => $stock,
        ':p' => $price,
        ':f' => $image,
        ':id' => $id,
    ]);
    return findProduct((string) $id) ?? [
        'id' => (int) $id,
        'name' => $name,
        'price' => $price,
        'description' => $description,
        'image' => $image,
        'stock' => $stock,
        'date' => null,
    ];
}

function deleteProduct(string $id): void
{
    $stmt = getPDO()->prepare('DELETE FROM producto WHERE id_producto = :id');
    $stmt->execute([':id' => $id]);
}

/**
 * funcion para aplicar descuentos: aplica promociones activas a una lista de productos
 * @param array $products - lista de productos de la bd
 * @return array - lista de productos con precios de descuento aplicados
 */

function applyPromotions(array $products) : array {
    if (empty($products)) {
        return $products;
    }
    try{
        $pdo = getPDO();
        //obtener todas las promociones activas
        $stmt = $pdo->query("
            SELECT id_promocion, valor_descuento,
            id_producto_asociado, id_categoria_asociada
            FROM promociones
            WHERE activa = TRUE
                AND NOW() BETWEEN fecha_inicio AND fecha_final
        ");
        $promos = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        if(empty($promos)){
            return $products; //si no hay promociones, mandar los productos tal cual
        }
        //crear mapas de busqueda para mejorar eficiencia
        $promoPorProducto = [];
        $promoPorCategoria = [];
        foreach($promos as $promo){
            if($promo['id_producto_asociado']){
                $promoPorProducto[$promo['id_producto_asociado']] = (float)$promo['valor_descuento'];
            }elseif($promo['id_categoria_asociada']){
                $promoPorCategoria[$promo['id_categoria_asociada']] = (float)$promo['valor_descuento'];
            }
        }
        //iterar sobre los productos y se aplican descuentos
        foreach($products as &$product){//uso de & para modificar el arreglo original
            $precioOriginal = (float)($product['precio'] ?? 0.0);
            $descuento = 0.0;
            // Obtenemos los IDs de forma segura
            $productId = $product['id_producto'] ?? null;
            $categoryId = $product['id_categoria'] ?? null; // Tu SQL confirma que esta columna existe

            //prioridad a promocion por producto
            if($productId !== null && isset($promoPorProducto[$productId])){
                $descuento = $promoPorProducto[$productId];
            
            //busqueda de promocion por categorias
            }elseif($categoryId !== null && isset($promoPorCategoria[$categoryId])){
                $descuento = $promoPorCategoria[$categoryId];
            }
            //aplicar el descuento en caso de existir
            if($descuento > 0){
                $product['precio_original'] = $precioOriginal;
                $product['precio_descuento'] = max(0.01, $precioOriginal - $descuento);//con 0.01 se evitan precios negativos
            }
        }
        return $products;
    }catch(\Throwable $e){
        error_log("error al aplicar las promociones: " . $e->getMessage());
        return $products;
    }
}
