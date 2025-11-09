<?php
header('Content-Type: application/json');

require_once '../lib/auth.php';
require_once '../lib/response.php';
require_once '../lib/uploads.php';
use function App\Lib\jsonResponse;
use function App\Lib\errorResponse;
use function App\Lib\storeUploadedFile;

try{
    App\Lib\Admin\requireAuth();
}catch(\Throwable $e){
    errorResponse('Acceso no autorizado', 401);
}

if($_SERVER['REQUEST_METHOD']!=='POST'){
    errorResponse('metodo no permitido, usar post', 405);
    exit;
}
if(!isset($_FILES['fileToUpload'])){
    errorResponse('no se recibio ningun archivo', 400);
    exit;
}

try{
    $upload_dir = "../uploads/";
    $file_url = storeUploadedFile($_FILES['fileToUpload'], $upload_dir);
    if($file_url){
        jsonResponse(['success'=>true, 'url'=>'uploads/' . basename($file_url)]);
    }else{
        errorResponse('la subida del archivo fallo', 500);
    }
}catch(PDOException $e){
    errorResponse('error al sbir el archivo: ' . $e->getMessage(), 500);
}