<?php
header('Content-Type: application/json');

require_once '../lib/db.php';
require_once '../lib/response.php';
use function App\Lib\jsonResponse;
use function App\Lib\getPDO;

if($_SERVER['REQUEST_METHOD'] !== 'GET'){
    jsonResponse(['error'=>'Metodo no permitido, usar GET'], 405);
    exit;
}

try{
    $pdo = getPDO();
    $stmt = $pdo->prepare("
        SELECT nom_sucursal,
               direccion_surc,
               latitud,
               longitud,
               telefono,
               correo
        FROM sucursal
    ");
    $stmt->execute();
    $sucursales = $stmt->fetchAll(PDO::FETCH_ASSOC);
    jsonResponse(['sucursales'=>$sucursales]);

}catch(PDOException $e){
    jsonResponse(['error'=>'Error al consultar las sucursales:' . $e->getMessage()], 500);
}

