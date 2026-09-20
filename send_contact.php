<?php
/**
 * ==========================================================================
 * SEND_CONTACT.PHP - INSPECTION WORK C.A.
 * Procesador de formulario de contacto con envío de email HTML y
 * respaldo local en archivo CSV para asegurar que ningún lead se pierda.
 * ==========================================================================
 */

header('Content-Type: application/json');

// Solo procesar peticiones POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'status' => 'error',
        'message' => 'Acceso no autorizado por este método.'
    ]);
    exit;
}

// 1. Recibir y sanitizar datos
$empresa   = filter_input(INPUT_POST, 'empresa', FILTER_SANITIZE_SPECIAL_CHARS);
$contacto  = filter_input(INPUT_POST, 'contacto', FILTER_SANITIZE_SPECIAL_CHARS);
$servicio  = filter_input(INPUT_POST, 'servicio', FILTER_SANITIZE_SPECIAL_CHARS);
$ubicacion = filter_input(INPUT_POST, 'ubicacion', FILTER_SANITIZE_SPECIAL_CHARS);
$telefono  = filter_input(INPUT_POST, 'telefono', FILTER_SANITIZE_SPECIAL_CHARS);
$email     = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
$mensaje   = filter_input(INPUT_POST, 'mensaje', FILTER_SANITIZE_SPECIAL_CHARS);

// 2. Validación en el Servidor
if (!$empresa || !$contacto || !$servicio || !$ubicacion || !$telefono || !$email) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Todos los campos obligatorios deben ser completados correctamente.'
    ]);
    exit;
}

$mensaje = $mensaje ? $mensaje : 'Ninguno especificado.';

// 3. Crear Respaldo Local en CSV (Seguridad Antipérdida de Leads)
$backup_file = 'leads_backup.csv';
$file_exists = file_exists($backup_file);

// Datos a escribir en el CSV
$lead_data = [
    date('Y-m-d H:i:s'),
    $empresa,
    $contacto,
    $servicio,
    $ubicacion,
    $telefono,
    $email,
    str_replace(["\r", "\n", ","], " ", $mensaje) // Evitar saltos de línea y comas destructivas en CSV
];

$backup_success = false;
$fp = fopen($backup_file, 'a');
if ($fp) {
    // Si el archivo es nuevo, escribir el encabezado primero
    if (!$file_exists) {
        fputcsv($fp, ['Fecha/Hora', 'Empresa', 'Contacto', 'Servicio Solicitado', 'Ubicacion', 'Telefono', 'Correo', 'Mensaje']);
    }
    fputcsv($fp, $lead_data);
    fclose($fp);
    $backup_success = true;
}

// 4. Configurar el Correo Electrónico
$destinatarios = 'iwcaventas@gmail.com, inspectionworkca@gmail.com';
$asunto = "Nueva Cotización Web - Empresa: " . $empresa;

// Cabeceras para correo HTML
$headers  = "MIME-Version: 1.0\r\n";
$headers .= "Content-type: text/html; charset=UTF-8\r\n";
// Cabecera remitente (Debe ser del mismo dominio para evitar spam)
$headers .= "From: Web inworkca <noreply@inworkca.com>\r\n";
$headers .= "Reply-To: " . $contacto . " <" . $email . ">\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

// Cuerpo del correo con diseño corporativo elegante (Rojo Industrial)
$body = '
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; background-color: #F5F5F3; color: #1F1F1F; margin: 0; padding: 20px; }
        .card { max-width: 600px; background-color: #FFFFFF; border-top: 6px solid #C8102E; border-radius: 8px; margin: 0 auto; box-shadow: 0 4px 10px rgba(0,0,0,0.1); padding: 30px; }
        .header { text-align: center; border-bottom: 1px solid #EEEEEE; padding-bottom: 20px; margin-bottom: 25px; }
        .logo-text { font-size: 24px; font-weight: bold; color: #1F1F1F; font-family: "Montserrat", Arial, sans-serif; }
        .logo-red { color: #C8102E; }
        .title { font-size: 18px; font-weight: bold; color: #8B0E24; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
        .field-group { margin-bottom: 15px; border-bottom: 1px solid #F9F9F9; padding-bottom: 10px; }
        .field-label { font-size: 11px; font-weight: bold; color: #8B0E24; text-transform: uppercase; margin-bottom: 3px; }
        .field-value { font-size: 15px; color: #2B2B2B; line-height: 1.4; }
        .footer { font-size: 11px; color: #A0A0A0; text-align: center; margin-top: 30px; border-top: 1px solid #EEEEEE; padding-top: 15px; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <div class="logo-text">INSPECTION <span class="logo-red">WORK</span></div>
            <p style="font-size: 12px; color: #666; margin: 5px 0 0 0;">Notificación Automática de Solicitud de Cotización</p>
        </div>
        
        <div class="title">Datos del Requerimiento</div>
        
        <div class="field-group">
            <div class="field-label">Empresa o Cliente</div>
            <div class="field-value">' . htmlspecialchars($empresa) . '</div>
        </div>
        
        <div class="field-group">
            <div class="field-label">Persona de Contacto</div>
            <div class="field-value">' . htmlspecialchars($contacto) . '</div>
        </div>
        
        <div class="field-group">
            <div class="field-label">Servicio Solicitado</div>
            <div class="field-value"><strong>' . htmlspecialchars($servicio) . '</strong></div>
        </div>
        
        <div class="field-group">
            <div class="field-label">Ubicación del Servicio</div>
            <div class="field-value">' . htmlspecialchars($ubicacion) . '</div>
        </div>
        
        <div class="field-group">
            <div class="field-label">Teléfono</div>
            <div class="field-value">' . htmlspecialchars($telefono) . '</div>
        </div>
        
        <div class="field-group">
            <div class="field-label">Correo Electrónico</div>
            <div class="field-value">' . htmlspecialchars($email) . '</div>
        </div>
        
        <div class="field-group" style="border-bottom: none;">
            <div class="field-label">Especificaciones Adicionales</div>
            <div class="field-value">' . nl2br(htmlspecialchars($mensaje)) . '</div>
        </div>
        
        <div class="footer">
            Este mensaje ha sido enviado desde el formulario de contacto inteligente del portal web inworkca.com.<br>
            Copia guardada localmente en la base de datos de seguridad: ' . ($backup_success ? 'Éxito' : 'Fallo de registro') . '.
        </div>
    </div>
</body>
</html>
';

// 5. Enviar Correo
$mail_success = false;

// Evitar bloqueos si se prueba en localhost sin servidor SMTP configurado
if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
    // mail() retornará true o false según si se aceptó para su entrega
    $mail_success = @mail($destinatarios, $asunto, $body, $headers);
}

// 6. Retornar Respuesta
// Consideramos éxito si se envió por correo O si al menos se respaldó de forma local en CSV
// de esta forma, en entornos locales de pruebas, el cliente no verá un error si no tiene SMTP configurado,
// pero en Hostinger funcionarán ambos a la perfección.
if ($mail_success || $backup_success) {
    echo json_encode([
        'status' => 'success',
        'message' => 'Formulario recibido con éxito.'
    ]);
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'Ocurrió un error al enviar su cotización. Por favor, contáctenos directamente al correo o por teléfono.'
    ]);
}
exit;
