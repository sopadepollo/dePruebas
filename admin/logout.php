<?php

declare(strict_types=1);

require_once __DIR__ . '/../lib/auth.php';

use function App\Lib\logout;

logout();
header('Location: login.php');
exit;
