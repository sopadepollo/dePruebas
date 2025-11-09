<?php
declare(strict_types=1);

// Establecer cabecera de respuesta JSON
header('Content-Type: application/json');

// Cargar la configuración (para .env) y la función de correo
require_once __DIR__ . '/../lib/config.php';
require_once __DIR__ . '/../lib/auth_usr.php';

use function App\Lib\sendEmail;

// 1. Solo aceptar peticiones POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido.']);
    exit;
}

// 2. Leer los datos JSON
$input = json_decode(file_get_contents('php://input'), true);


// --- VERIFICACIÓN reCAPTCHA ---
$token = $input['recaptcha_token'] ?? null;
if (!$token) {
    http_response_code(400);
    echo json_encode(['error' => 'Falló la verificación de seguridad (sin token).']);
    exit;
}

// Enviar a Google para verificar
$secret = $_ENV['RECAPTCHA_SECRET_KEY']; // Cargar la clave secreta
$url = 'https://www.google.com/recaptcha/api/siteverify';
$data = [
    'secret' => $secret,
    'response' => $token,
    'remoteip' => $_SERVER['REMOTE_ADDR'] 
];

$options = [
    'http' => [
        'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
        'method'  => 'POST',
        'content' => http_build_query($data)
    ]
];
$context  = stream_context_create($options);
$response = @file_get_contents($url, false, $context); // Usar @ para suprimir warnings
$result = $response ? json_decode($response, true) : null;

// Revisar la respuesta de Google
if (!$result || !isset($result['success']) || $result['success'] !== true) {
    // Registrar el error para ti
    error_log('Fallo de reCAPTCHA: ' . ($result['error-codes'][0] ?? 'Respuesta inválida'));
    http_response_code(400);
    echo json_encode(['error' => 'Falló la verificación de seguridad (respuesta inválida).']);
    exit;
}

// (Opcional) Revisar el puntaje. v3 siempre da un puntaje.
// 0.5 es el umbral estándar. 1.0 es humano, 0.0 es bot.
if (!isset($result['score']) || $result['score'] < 0.5) {
     http_response_code(400);
    echo json_encode(['error' => 'Falló la verificación de seguridad (posible bot).']);
    exit;
}
// --- FIN DE LA VERIFICACIÓN ---


// 3. Sanitizar y validar los datos 
$name = trim($input['nombre'] ?? '');
$email = filter_var(trim($input['correo'] ?? ''), FILTER_SANITIZE_EMAIL);
$message = trim($input['mensaje'] ?? '');

if (empty($name) || empty($email) || empty($message)) {
    http_response_code(400);
    echo json_encode(['error' => 'Por favor, completa todos los campos.']);
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Por favor, ingresa un correo electrónico válido.']);
    exit;
}

// 4. Preparar el correo
$to = $_ENV['MAIL_USERNAME'];
$subject = "Nuevo Mensaje de Contacto de: " . $name;
$body = "
    <html>
    <body>
        <h2>Has recibido un nuevo mensaje desde tu sitio web</h2>
        <p><strong>Nombre:</strong> " . htmlspecialchars($name) . "</p>
        <p><strong>Correo (para responder):</strong> " . htmlspecialchars($email) . "</p>
        <hr>
        <h3>Mensaje:</h3>
        <p>" . nl2br(htmlspecialchars($message)) . "</p>
    </body>
    </html>
";

// 5. Enviar el correo
try {
    $emailSent = sendEmail($to, $subject, $body);
    if ($emailSent) {
        echo json_encode(['success' => true, 'message' => '¡Mensaje enviado con éxito! Gracias por contactarnos.']);
    } else {
        throw new Exception('PHPMailer falló al enviar el correo.');
    }
} catch (Exception $e) {
    http_response_code(500);
    error_log('Error al enviar correo de contacto: ' . $e->getMessage()); 
    echo json_encode(['error' => 'No se pudo enviar el mensaje en este momento.']);
}
?>