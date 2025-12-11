<?php
//КОНФИГУРАЦИЯ БД

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'airline_system');

// Создание подключения
$connection = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

// Проверка подключения
if ($connection->connect_error) {
    die(json_encode(['success' => false, 'message' => 'Ошибка подключения к БД: ' . $connection->connect_error])); //die - остановка выполнеиня php
}

// Установка кодировки UTF-8
$connection->set_charset('utf8mb4');

// Вспомогательная функция для ответа
function sendResponse($success, $message = '', $data = null) {
    $response = [
        'success' => $success,
        'message' => $message
    ];

    if ($data !== null) {
        $response = array_merge($response, $data);
    }

    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($response, JSON_UNESCAPED_UNICODE); //превращение массива $response в JSON-строку
    exit; //остановка выполнения скрипта после отправки ответа
}

// Функция для хеширования пароля
function hashPassword($password) {
    return password_hash($password, PASSWORD_DEFAULT);
}

// Функция для проверки пароля
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}
?>