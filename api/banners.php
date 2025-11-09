<?php
header('Content-Type: application/json');

require_once '../lib/db.php';
require_once '../lib/response.php';
use function App\Lib\jsonResponse;
use function App\Lib\getPDO;

if($_SERVER['REQUEST_METHOD']!=='GET'){
    jsonResponse(['error'=>'metodo no permitido, usar get'], 405);
    exit;
}

try{
    $pdo = getPDO();
    $stmt = $pdo->prepare("
        SELECT titulo,
               descripcion_corta,
               imagen_url,
               link_destino
        FROM banners_visuales
        WHERE activo = TRUE
        ORDER BY fecha_creacion DESC
    ");
    $stmt->execute();
    $banners = $stmt->fetchAll(PDO::FETCH_ASSOC);
    jsonResponse(['banners'=>$banners]);
}catch(PDOException $e){
    jsonResponse(['error'=>'Error al consultar los banners: ' . $e->getMessage()], 500);
}
