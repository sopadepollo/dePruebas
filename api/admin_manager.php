<?php
header('Content-Type: application/json');

require_once '../lib/auth.php';
require_once '../lib/db.php';
require_once '../lib/response.php';
use function App\Lib\getPDO;
use function App\Lib\jsonResponse;
use function App\Lib\errorResponse;

try{
    App\Lib\Admin\requireAuth();
}catch(\Throwable $e){
    errorResponse('Acceso no autorizado', 401);
}

if($_SERVER['REQUEST_METHOD']!=='POST'){
    jsonResponse(['error'=>'metodo no permitido, usar post'], 405);
    exit;
}

$action = $_POST['action'] ?? null;
$data = json_decode($_POST['data']??'{}', true);

if(!$action){
    jsonResponse(['error'=>'accion no especificada'], 400);
    exit;
}

try{
    $pdo = getPDO();
    $response_data = null;
    $message = "";

    switch($action){
        case 'read_cupones':
            $stmt = $pdo->query("SELECT * FROM cupones ORDER BY fecha_final DESC");
            $response_data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $message = "Cupones obtenidos";
            break;
        case 'create_cupon':
            $stmt = $pdo->prepare("
                INSERT INTO cupones(codigo, descripcion, valor_descuento, fecha_inicio, fecha_final, activo)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['codigo'],
                $data['descripcion'],
                $data['valor_descuento'],
                $data['fecha_inicio'],
                $data['fecha_final'],
                $data['activo'] ?? true
            ]);
            $message = 'cupon creado con exito';
            $response_data = ['id'=>$pdo->lastInsertId()];
            break;
        case 'update_cupon':
            $stmt = $pdo->prepare("
                UPDATE cupones SET
                    codigo = ?, descripcion = ?, valor_descuento = ?,
                    fecha_inicio = ?, fecha_final = ?, activo = ?
                WHERE id_cupon = ?
            ");
            $stmt->execute([
                $data['codigo'],
                $data['descripcion'],
                $data['valor_descuento'],
                $data['fecha_inicio'],
                $data['fecha_final'],
                $data['activo'],
                $data['id_cupon']
            ]);
            $message = "Cupon actualizado";
            break;
        case 'delete_cupon':
            $stmt = $pdo->prepare("
                DELETE FROM cupones WHERE id_cupon = ?
            ");
            $stmt->execute([$data['id_cupon']]);
            $message = "cupon eliminado";
            break;
        
        case 'read_promociones':
            $stmt = $pdo->query("
                SELECT
                    promo.*,
                    p.nombre as producto_nombre,
                    c.nombre_categoria as categoria_nombre
                FROM promociones promo
                LEFT JOIN producto p ON promo.id_producto_asociado = p.id_producto
                LEFT JOIN producto_categoria c ON promo.id_categoria_asociada = c.id_categoria
                ORDER BY promo.fecha_final DESC
            ");
            $response_data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $message = "promociones obtenidas";
            break;
        case 'create_promocion':
            $stmt = $pdo->prepare("
                INSERT INTO promociones(nombre_promo, descripcion, valor_descuento, 
                    id_producto_asociado, id_categoria_asociada, fecha_inicio, fecha_final, activa)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['nombre_promo'],
                $data['descripcion'],
                $data['valor_descuento'],
                $data['id_producto_asociado'],
                $data['id_categoria_asociada'],
                $data['fecha_inicio'],
                $data['fecha_final'],
                $data['activo'] ?? true 
            ]);
            $message = 'promo creada con exito';
            $response_data = ['id'=>$pdo->lastInsertId()];
            break;
        case 'update_promocion':
            $stmt = $pdo->prepare("
                UPDATE promociones SET
                    nombre_promo = ?, descripcion = ?, valor_descuento = ?,
                    id_producto_asociado = ?, id_categoria_asociada = ?, 
                    fecha_inicio = ?, fecha_final = ?, activa = ? 
                WHERE id_promocion = ?
            ");
            $stmt->execute([
                $data['nombre_promo'],
                $data['descripcion'],
                $data['valor_descuento'],
                $data['id_producto_asociado'],
                $data['id_categoria_asociada'],
                $data['fecha_inicio'],
                $data['fecha_final'],
                $data['activo'],
                $data['id_promocion']
            ]);
            $message = "Promocion actualizada";
            break;
        case 'delete_promocion':
            $stmt = $pdo->prepare("
                DELETE FROM promociones WHERE id_promocion = ?
            ");
            $stmt->execute([$data['id_promocion']]);
            $message = "promocion eliminada";
            break;

        case 'read_banners':
            $stmt = $pdo->query("
                SELECT * FROM banners_visuales
                ORDER BY fecha_creacion DESC
            ");
            $response_data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $message = "Banners obtenidos";
            break;
        case 'create_banner':
            $stmt = $pdo->prepare("
                INSERT INTO banners_visuales (titulo, descripcion_corta, 
                    imagen_url, link_destino, activo)
                    VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['titulo'],
                $data['descripcion_corta'],
                $data['imagen_url'],
                $data['link_destino'],
                $data['activo'] ?? true
            ]);
            $message = "Banner creado";
            break;
        case 'update_banner_status':
            $stmt = $pdo->prepare("
                UPDATE banners_visuales
                SET activo = ?
                WHERE id_banner = ?
            ");
            $stmt->execute([$data['activo'], $data['id_banner']]);
            $message = "Estado del banner actualizado";
            break;
        case 'delete_banner':
            $stmt = $pdo->prepare("
                DELETE FROM banners_visuales
                WHERE id_banner = ?
            ");
            $stmt->execute([$data['id_banner']]);
            $message = "Banner eliminado con exito";
            break;
        
        case 'read_categorias':
            $stmt = $pdo->query("
                SELECT * FROM producto_categoria
                ORDER BY nombre_categoria ASC
            ");
            $response_data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $message = "Categorias obtenidas";
            break;
        
        default:
            jsonResponse(['error'=>'accion no valida o no implementada aun'], 400);
            exit;
    }
    jsonResponse(['success'=>true, 'message'=>$message, 'data'=>$response_data]);
}catch(PDOException $e){
    errorResponse('error en la base de datos: ' . $e->getMessage(), 500);
}
