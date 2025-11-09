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

if($_SERVER['REQUEST_METHOD']!=='GET'){
    jsonResponse(['error'=>'metodo no permitido, usar get'], 405);
    exit;
}

$report_type =$_GET['report'] ?? 'ventas_mensuales';

try{
    $pdo = getPDO();
    $data = [];
    switch($report_type){
        case 'ventas_mensuales':
            $stmt = $pdo->query("
                SELECT DATE_FORMAT(fecha_compra, '%Y-%m') as Mes, SUM(precio_total) as Total
                FROM pedido
                WHERE pago_completado = TRUE
                GROUP BY Mes
                ORDER BY Mes ASC
            ");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;
        case 'visitas_diarias':
            $stmt = $pdo->query("
                SELECT fecha_visita, contador
                FROM estadisticas_visitas
                ORDER BY fecha_visita DESC
                LIMIT 30
            ");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;
        case 'ventas_estacionales':
            $stmt = $pdo->query("
                SELECT CONCAT(YEAR(fecha_compra), '-Q', QUARTER(fecha_compra)) as Trimestre,
                    SUM(precio_total) as Total
                FROM pedido
                WHERE pago_completado = TRUE
                GROUP BY Trimestre
                ORDER BY Trimestre ASC
            ");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;
        case 'top_products':
            $stmt = $pdo->query("
                SELECT p.nombre, SUM(pi.cantidad) as Total_vendido
                FROM pedido_item pi
                JOIN producto p ON pi.id_producto = p.id_producto
                JOIN pedido pe ON pi.id_pedido = pe.id_pedido
                WHERE pe.pago_completado = TRUE
                GROUP BY p.id_producto, p.nombre
                ORDER BY total_vendido DESC
                LIMIT 5
            ");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;
        default:
            jsonResponse(['error'=>'tipo de reporte no valido'], 400);
            exit;
    }
    jsonResponse(['error'=>$report_type, 'data'=>$data]);
}catch(\Throwable $e){
    errorResponse('error al consultar las estadisticas: ' . $e->getMessage(), 500);
}