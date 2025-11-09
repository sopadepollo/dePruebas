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
        INSER INTO estadisticas_visitas(fecha_visita, contador)
        VALUES (CURDATE(), 1)
        ON DUPLICATE KEY UPDATE contador = contador +1
    ");
    $stmt->execute();
    jsonResponse(['success'=>true, 'message'=>'visita registrada']);
}catch(PDOException $e){
    jsonResponse(['error'=>'error al registrar la visita: ' . $e->getMessage()], 500);
}