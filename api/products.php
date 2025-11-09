<?php

declare(strict_types=1);

namespace App\Lib\Products;

use PDOException;

// Importamos todas las funciones que usará el script
use function App\Lib\deleteProduct;
use function App\Lib\deleteStoredFile;
use function App\Lib\errorResponse;
use function App\Lib\findProduct;
use function App\Lib\jsonResponse;
use function App\Lib\readProducts;
use function App\Lib\storeUploadedFile;
use function App\Lib\upsertProduct;
use function App\Lib\applyPromotions;
use function App\Lib\getPDO;

// Requerimos los archivos que contienen esas funciones
require_once __DIR__ . '/../lib/storage.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/uploads.php';
require_once __DIR__ . '/../lib/auth.php'; // Este es el auth de Admin
require_once __DIR__ . '/../lib/db.php';
// --- INICIO DE LA LÓGICA ---

// Proteger el API: Solo administradores logueados pueden usar esto
// (Importante: 'auth.php' debe usar el namespace App\Lib\Admin)


$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'POST' && isset($_POST['_method'])) {
    $method = strtoupper((string) $_POST['_method']);
}

try {
    switch ($method) {
        case 'GET':
            handleGet();
            break;
        case 'POST':
            handleCreate();
            break;
        case 'PUT':
            handleUpdate();
            break;
        case 'DELETE':
            handleDelete();
            break;
        default:
            errorResponse('Método no permitido', 405);
    }
} catch (\Throwable $e) {
    // esto lo atrapará y enviará un JSON válido.
    error_log($e->getMessage()); // Guarda el error real en el log del servidor
    errorResponse('Ocurrió un error inesperado en el servidor.', 500);
}

/**
 * funcion para aplicar descuentos: aplica promociones activas a una lista de productos
 * @param array $products - lista de productos de la bd
 * @return array - lista de productos con precios de descuento aplicados
 */
/*
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
*/

function handleGet() : void {
    $id = $_GET['id'] ?? null;
    if($id){
        $product = findProduct($id);
        if(!$product){
            errorResponse('Producto no encontrado', 404);
        }
        //$productConDescuento = applyPromotions([$product]); //ahora le pasamos la funcion de aplicar promos primero
        jsonResponse(['data' => $product]);
    }else{ //obtener todos los productos
        $products = readProducts();
        //$productConDescuento = applyPromotions($products);
        jsonResponse(['data' => $products]);
    }
}

function normalizeInput(array $input) : array {
    $name = trim((string) ($input['name'] ?? ''));
    $price = (float) ($input['price'] ?? 0);
    $description = trim((string) ($input['description'] ?? ''));
    $stock = (int) ($input['stock'] ?? 0); 
    $id = $input['id'] ?? null;

    if($name === ''){
        errorResponse('El nombre es obligatorio.');
    }
    if($price <= 0){
        errorResponse('El precio debe ser mayor que 0.');
    }

    return [
        'id' => $id,
        'name' => $name,
        'price' => $price,
        'description' => $description,
        'stock' => $stock
    ];
}

function handleCreate() : void {
    //App\Lib\Admin\requireAuth();
    $payload = normalizeInput($_POST);

    if(!empty($_FILES['productImage']['name'] ?? '')){
        $payload['image'] = storeUploadedFile($_FILES['productImage']);
    }else{
        $payload['image'] = null;
    }

    $product = upsertProduct($payload);
    jsonResponse(['message' => 'Producto creado', 'data' => $product], 201);
}

function handleUpdate() : void {
    $data = $_POST;
    if(empty($data)){
        parse_str(file_get_contents('php://input') ?: '', $data);
    }

    $id = $data['id'] ?? ($_GET['id'] ?? null);
    if(!$id){
        errorResponse('Falta el identificador del producto.');
    }

    $existing = findProduct($id);
    if(!$existing){
        errorResponse('Producto no encontrado.', 404);
    }

    $data['id'] = $id;
    $payload = normalizeInput($data); 
    $payload['image'] = $existing['image'] ?? null;

    if(!empty($_FILES['productImage']['name'] ?? '')){
        $payload['image'] = storeUploadedFile($_FILES['productImage']);
        if(isset($existing['image']) && str_starts_with((string) $existing['image'], 'uploads/')){
            deleteStoredFile($existing['image']);
        }
    }

    $product = upsertProduct($payload);
    jsonResponse(['message' => 'Producto actualizado', 'data' => $product]);
}

function handleDelete() : void {
    $id = $_GET['id'] ?? null;
    if(!$id){
        parse_str(file_get_contents('php://input') ?: '', $parsed);
        $id = $parsed['id'] ?? null;
    }

    if(!$id){
        errorResponse('Falta el identificador del producto.');
    }

    $existing = findProduct($id);
    if(!$existing){
        errorResponse('Producto no encontrado.', 404);
    }

    deleteProduct($id);
    if(isset($existing['image']) && str_starts_with((string) $existing['image'], 'uploads/')){
        deleteStoredFile($existing['image']);
    }

    jsonResponse(['message' => 'Producto eliminado']);
}