<?php
// ═════════════════════════════════════════════════════════════════════════════
// ✈️  API НА PHP - ВСЕ ENDPOINTS
// ═════════════════════════════════════════════════════════════════════════════

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

require_once 'config.php';

// Получаем данные из POST запроса
$data = json_decode(file_get_contents('php://input'), true);
$action = isset($_GET['action']) ? $_GET['action'] : '';

// ═════════════════════════════════════════════════════════════════════════════
// 1️⃣  РЕГИСТРАЦИЯ
// ═════════════════════════════════════════════════════════════════════════════

if ($action === 'register') {
    $firstName = isset($data['FirstName']) ? $connection->real_escape_string($data['FirstName']) : '';
    $lastName = isset($data['LastName']) ? $connection->real_escape_string($data['LastName']) : '';
    $passportNumber = isset($data['PassportNumber']) ? $connection->real_escape_string($data['PassportNumber']) : '';
    $dateOfBirth = isset($data['DateOfBirth']) ? $connection->real_escape_string($data['DateOfBirth']) : '';
    $email = isset($data['Email']) ? $connection->real_escape_string($data['Email']) : '';
    $password = isset($data['Password']) ? $data['Password'] : '';
    $phoneNumber = isset($data['PhoneNumber']) ? $connection->real_escape_string($data['PhoneNumber']) : '';

    // Валидация
    if (!$firstName || !$lastName || !$passportNumber || !$dateOfBirth || !$email || !$password) {
        sendResponse(false, 'Все поля обязательны');
    }

    // Проверка если email уже существует
    $checkEmail = $connection->query("SELECT PassengerID FROM Passenger WHERE Email = '$email'");

    if ($checkEmail->num_rows > 0) {
        sendResponse(false, 'Email уже зарегистрирован');
    }

    // Хешируем пароль
    $hashedPassword = hashPassword($password);

    // Вставляем нового пассажира
    $query = "INSERT INTO Passenger (FirstName, LastName, PassportNumber, DateOfBirth, Email, Password, PhoneNumber) 
              VALUES ('$firstName', '$lastName', '$passportNumber', '$dateOfBirth', '$email', '$hashedPassword', '$phoneNumber')";

    if ($connection->query($query)) {
        sendResponse(true, 'Регистрация успешна');
    } else {
        sendResponse(false, 'Ошибка при регистрации: ' . $connection->error);
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// 2️⃣  ВХОД
// ═════════════════════════════════════════════════════════════════════════════

if ($action === 'login') {
    $email = isset($data['Email']) ? $connection->real_escape_string($data['Email']) : '';
    $password = isset($data['Password']) ? $data['Password'] : '';

    if (!$email || !$password) {
        sendResponse(false, 'Email и пароль обязательны');
    }

    // Ищем пассажира по email
    $query = "SELECT * FROM Passenger WHERE Email = '$email'";
    $result = $connection->query($query);

    if ($result->num_rows === 0) {
        sendResponse(false, 'Пассажир не найден');
    }

    $passenger = $result->fetch_assoc();

    // Проверяем пароль
    if (!verifyPassword($password, $passenger['Password'])) {
        sendResponse(false, 'Неверный пароль');
    }

    // Удаляем пароль из результата
    unset($passenger['Password']);

    sendResponse(true, 'Вход успешен', ['passenger' => $passenger]);
}

// ═════════════════════════════════════════════════════════════════════════════
// 3️⃣  ПОЛУЧИТЬ АЭРОПОРТЫ
// ═════════════════════════════════════════════════════════════════════════════

if ($action === 'get-airports') {
    $query = "SELECT DISTINCT City FROM Airport ORDER BY City ASC";
    $result = $connection->query($query);

    $airports = [];
    while ($row = $result->fetch_assoc()) {
        $airports[] = $row;
    }

    sendResponse(true, '', ['airports' => $airports]);
}

// ═════════════════════════════════════════════════════════════════════════════
// 4️⃣  ПОИСК РЕЙСОВ
// ═════════════════════════════════════════════════════════════════════════════

if ($action === 'search-flights') {
    $departureCity = isset($data['DepartureCity']) ? $connection->real_escape_string($data['DepartureCity']) : '';
    $arrivalCity = isset($data['ArrivalCity']) ? $connection->real_escape_string($data['ArrivalCity']) : '';
    $departureDate = isset($data['DepartureDate']) ? $connection->real_escape_string($data['DepartureDate']) : '';

    if (!$departureCity || !$arrivalCity || !$departureDate) {
        sendResponse(false, 'Все параметры поиска обязательны');
    }

    // SQL запрос для поиска рейсов
    $query = "
        SELECT 
            f.FlightID,
            f.FlightNumber,
            a1.City AS DepartureCity,
            a2.City AS ArrivalCity,
            f.DepartureDateTime,
            f.ArrivalDateTime,
            f.Status,
            f.BasePrice,
            ac.Model AS AircraftModel,
            ac.Capacity,
            (SELECT COUNT(*) FROM Booking WHERE FlightID = f.FlightID AND Status != 'Отменен') as BookedSeats
        FROM Flight f
        JOIN Airport a1 ON f.DepartureAirportID = a1.AirportID
        JOIN Airport a2 ON f.ArrivalAirportID = a2.AirportID
        JOIN Aircraft ac ON f.AircraftID = ac.AircraftID
        WHERE a1.City = '$departureCity' 
        AND a2.City = '$arrivalCity' 
        AND DATE(f.DepartureDateTime) = '$departureDate'
        AND f.Status != 'Отменен'
        ORDER BY f.DepartureDateTime ASC
    ";

    $result = $connection->query($query);

    if (!$result) {
        sendResponse(false, 'Ошибка БД: ' . $connection->error);
    }

    $flights = [];
    while ($row = $result->fetch_assoc()) {
        $flights[] = $row;
    }

    sendResponse(true, '', ['flights' => $flights]);
}

// ═════════════════════════════════════════════════════════════════════════════
// 5️⃣  СОЗДАТЬ БРОНИРОВАНИЕ
// ═════════════════════════════════════════════════════════════════════════════

if ($action === 'create-booking') {
    $passengerID = isset($data['PassengerID']) ? (int)$data['PassengerID'] : 0;
    $flightID = isset($data['FlightID']) ? (int)$data['FlightID'] : 0;
    $seatNumber = isset($data['SeatNumber']) ? $connection->real_escape_string($data['SeatNumber']) : '';

    if (!$passengerID || !$flightID || !$seatNumber) {
        sendResponse(false, 'Все параметры обязательны');
    }

    // Проверяем если место уже забронировано
    $checkSeat = $connection->query("
        SELECT BookingID FROM Booking 
        WHERE FlightID = $flightID 
        AND SeatNumber = '$seatNumber' 
        AND Status != 'Отменен'
    ");

    if ($checkSeat->num_rows > 0) {
        sendResponse(false, 'Это место уже забронировано');
    }

    // Получаем цену рейса
    $flightQuery = $connection->query("SELECT BasePrice FROM Flight WHERE FlightID = $flightID");

    if ($flightQuery->num_rows === 0) {
        sendResponse(false, 'Рейс не найден');
    }

    $flight = $flightQuery->fetch_assoc();
    $totalPrice = $flight['BasePrice'];

    // Вставляем бронирование
    $bookingQuery = "
        INSERT INTO Booking (PassengerID, FlightID, Status, TotalPrice, SeatNumber, BookingDate) 
        VALUES ($passengerID, $flightID, 'Подтвережден', $totalPrice, '$seatNumber', NOW())
    ";

    if ($connection->query($bookingQuery)) {
        $bookingID = $connection->insert_id;

        // Создаем платеж
        $paymentQuery = "
            INSERT INTO Payment (BookingID, Amount, PaymentMethod, Status, PaymentDate) 
            VALUES ($bookingID, $totalPrice, 'Карта', 'Завершен', NOW())
        ";

        $connection->query($paymentQuery);

        // Создаем посадочный талон
        $boardingQuery = "
            INSERT INTO BoardingPass (BookingID, Gate, BoardingTime, CheckinStatus) 
            VALUES ($bookingID, '1A', DATE_ADD(NOW(), INTERVAL 1 DAY), 'Не регистрирован')
        ";

        $connection->query($boardingQuery);

        sendResponse(true, 'Бронирование успешно', ['bookingID' => $bookingID]);
    } else {
        sendResponse(false, 'Ошибка при бронировании: ' . $connection->error);
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// 6️⃣  ПОЛУЧИТЬ БРОНИРОВАНИЯ ПАССАЖИРА
// ═════════════════════════════════════════════════════════════════════════════

if ($action === 'get-bookings') {
    $passengerID = isset($data['PassengerID']) ? (int)$data['PassengerID'] : 0;

    if (!$passengerID) {
        sendResponse(false, 'PassengerID обязателен');
    }

    $query = "
        SELECT 
            b.BookingID,
            b.Status,
            b.TotalPrice,
            b.SeatNumber,
            b.BookingDate,
            f.FlightNumber,
            a1.City AS DepartureCity,
            a2.City AS ArrivalCity,
            f.DepartureDateTime,
            f.ArrivalDateTime,
            p2.Status as PaymentStatus,
            bp.Gate,
            bp.BoardingTime,
            bp.CheckinStatus
        FROM Booking b
        JOIN Flight f ON b.FlightID = f.FlightID
        JOIN Airport a1 ON f.DepartureAirportID = a1.AirportID
        JOIN Airport a2 ON f.ArrivalAirportID = a2.AirportID
        LEFT JOIN Payment p2 ON b.BookingID = p2.BookingID
        LEFT JOIN BoardingPass bp ON b.BookingID = bp.BookingID
        WHERE b.PassengerID = $passengerID
        ORDER BY f.DepartureDateTime DESC
    ";

    $result = $connection->query($query);

    if (!$result) {
        sendResponse(false, 'Ошибка БД: ' . $connection->error);
    }

    $bookings = [];
    while ($row = $result->fetch_assoc()) {
        $bookings[] = $row;
    }

    sendResponse(true, '', ['bookings' => $bookings]);
}

// Если action неизвестен
sendResponse(false, 'Неизвестное действие');
?>