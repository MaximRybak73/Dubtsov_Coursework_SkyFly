// ═════════════════════════════════════════════════════════════════════════════
// 📱 КОНФИГУРАЦИЯ И API - PHP ВЕРСИЯ
// ═════════════════════════════════════════════════════════════════════════════

// URL вашего API (просто укажите на api.php)
const API_URL = 'api.php';

// ═════════════════════════════════════════════════════════════════════════════
// ФУНКЦИЯ ДЛЯ РАБОТЫ С API
// ═════════════════════════════════════════════════════════════════════════════

async function callAPI(action, data = {}) {
    try {
        const params = new URLSearchParams();
        params.append('action', action);

        const response = await fetch(`${API_URL}?action=${action}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Ошибка API:', error);
        throw error;
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// РЕГИСТРАЦИЯ
// ═════════════════════════════════════════════════════════════════════════════

async function registerPassenger(firstName, lastName, passportNumber, dateOfBirth, email, password, phoneNumber) {
    try {
        const data = {
            FirstName: firstName,
            LastName: lastName,
            PassportNumber: passportNumber,
            DateOfBirth: dateOfBirth,
            Email: email,
            Password: password,
            PhoneNumber: phoneNumber
        };

        const result = await callAPI('register', data);

        if (result.success) {
            alert('✅ Регистрация успешна! Теперь войдите в свой аккаунт');
            window.location.href = 'login.html';
        } else {
            alert('❌ Ошибка регистрации: ' + result.message);
        }
    } catch (error) {
        alert('❌ Ошибка: ' + error.message);
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// ВХОД
// ═════════════════════════════════════════════════════════════════════════════

async function loginPassenger(email, password) {
    try {
        const data = {
            Email: email,
            Password: password
        };

        const result = await callAPI('login', data);

        if (result.success) {
            localStorage.setItem('passengerData', JSON.stringify(result.passenger));
            localStorage.setItem('passengerID', result.passenger.PassengerID);
            localStorage.setItem('isLoggedIn', 'true');

            alert('✅ Вы успешно вошли!');
            window.location.href = 'index.html';
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        alert('❌ Ошибка входа: ' + error.message);
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// ВЫХОД
// ═════════════════════════════════════════════════════════════════════════════

function logoutPassenger() {
    localStorage.removeItem('passengerData');
    localStorage.removeItem('passengerID');
    localStorage.removeItem('isLoggedIn');
    alert('✅ Вы вышли из аккаунта');
    window.location.href = 'index.html';
}

// ═════════════════════════════════════════════════════════════════════════════
// ПРОВЕРКА АВТОРИЗАЦИИ
// ═════════════════════════════════════════════════════════════════════════════

function isUserLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true';
}

function getCurrentPassenger() {
    const data = localStorage.getItem('passengerData');
    return data ? JSON.parse(data) : null;
}

// ═════════════════════════════════════════════════════════════════════════════
// ПОИСК РЕЙСОВ
// ═════════════════════════════════════════════════════════════════════════════

async function searchFlights(departureCity, arrivalCity, departureDate) {
    try {
        const data = {
            DepartureCity: departureCity,
            ArrivalCity: arrivalCity,
            DepartureDate: departureDate
        };

        const result = await callAPI('search-flights', data);

        if (result.success) {
            return result.flights;
        } else {
            alert('❌ Ошибка поиска: ' + result.message);
            return [];
        }
    } catch (error) {
        alert('❌ Ошибка при поиске рейсов: ' + error.message);
        return [];
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// ОТОБРАЖЕНИЕ РЕЙСОВ
// ═════════════════════════════════════════════════════════════════════════════

function displayFlights(flights) {
    const flightsContainer = document.getElementById('flightsResults');

    if (!flightsContainer) {
        console.error('Элемент flightsResults не найден');
        return;
    }

    if (flights.length === 0) {
        flightsContainer.innerHTML = '<p style="text-align: center; color: #d32f2f;">❌ Рейсы не найдены. Попробуйте другие параметры поиска.</p>';
        return;
    }

    let html = '<div style="margin-top: 20px;">';
    html += '<h2>Доступные рейсы:</h2>';
    html += '<table style="width: 100%; border-collapse: collapse; margin-top: 15px;">';
    html += '<thead style="background-color: #1976d2; color: white;">';
    html += '<tr>';
    html += '<th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Рейс</th>';
    html += '<th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Откуда → Куда</th>';
    html += '<th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Вылет</th>';
    html += '<th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Прилет</th>';
    html += '<th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Статус</th>';
    html += '<th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Цена</th>';
    html += '<th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Свободно мест</th>';
    html += '<th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Действие</th>';
    html += '</tr>';
    html += '</thead>';
    html += '<tbody>';

    flights.forEach((flight, index) => {
        const bgColor = index % 2 === 0 ? '#f5f5f5' : '#ffffff';
        const statusColor = flight.Status === 'По расписанию' ? '#4caf50' : 
                           flight.Status === 'Задержан' ? '#ff9800' : '#d32f2f';
        const freeSeats = flight.Capacity - flight.BookedSeats;

        html += `<tr style="background-color: ${bgColor};">`;
        html += `<td style="padding: 12px; border: 1px solid #ddd;"><strong>${flight.FlightNumber}</strong></td>`;
        html += `<td style="padding: 12px; border: 1px solid #ddd;">${flight.DepartureCity} → ${flight.ArrivalCity}</td>`;
        html += `<td style="padding: 12px; border: 1px solid #ddd;">${formatDateTime(flight.DepartureDateTime)}</td>`;
        html += `<td style="padding: 12px; border: 1px solid #ddd;">${formatDateTime(flight.ArrivalDateTime)}</td>`;
        html += `<td style="padding: 12px; border: 1px solid #ddd; color: ${statusColor}; font-weight: bold;">${flight.Status}</td>`;
        html += `<td style="padding: 12px; border: 1px solid #ddd; color: #1976d2; font-weight: bold;">${flight.BasePrice} ₽</td>`;
        html += `<td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${freeSeats}/${flight.Capacity}</td>`;
        html += `<td style="padding: 12px; border: 1px solid #ddd; text-align: center;">`;
        html += `<button onclick="bookFlight(${flight.FlightID})" style="padding: 8px 16px; background-color: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">`;
        html += 'Забронировать';
        html += '</button>';
        html += '</td>';
        html += '</tr>';
    });

    html += '</tbody>';
    html += '</table>';
    html += '</div>';

    flightsContainer.innerHTML = html;
}

// ═════════════════════════════════════════════════════════════════════════════
// ФОРМАТИРОВАНИЕ ДАТЫ И ВРЕМЕНИ
// ═════════════════════════════════════════════════════════════════════════════

function formatDateTime(dateTimeString) {
    if (!dateTimeString) return '';

    const date = new Date(dateTimeString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}.${month} ${hours}:${minutes}`;
}

// ═════════════════════════════════════════════════════════════════════════════
// БРОНИРОВАНИЕ
// ═════════════════════════════════════════════════════════════════════════════

async function bookFlight(flightID) {
    if (!isUserLoggedIn()) {
        alert('❌ Вы должны быть авторизованы для бронирования');
        window.location.href = 'login.html';
        return;
    }

    try {
        const passengerID = localStorage.getItem('passengerID');
        const seatNumber = prompt('Введите номер места (например: 12A):');

        if (!seatNumber) return;

        const data = {
            PassengerID: parseInt(passengerID),
            FlightID: flightID,
            SeatNumber: seatNumber
        };

        const result = await callAPI('create-booking', data);

        if (result.success) {
            alert('✅ Рейс успешно забронирован!');
            window.location.href = 'profile.html';
        } else {
            alert('❌ Ошибка бронирования: ' + result.message);
        }
    } catch (error) {
        alert('❌ Ошибка при бронировании: ' + error.message);
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// ЗАГРУЗКА ГОРОДОВ
// ═════════════════════════════════════════════════════════════════════════════

async function loadCities() {
    try {
        const response = await callAPI('get-airports', {});

        if (response.success) {
            const airports = response.airports;

            const departureSelect = document.getElementById('departureCity');
            const arrivalSelect = document.getElementById('arrivalCity');

            if (departureSelect && arrivalSelect) {
                airports.forEach(airport => {
                    const option1 = document.createElement('option');
                    option1.value = airport.City;
                    option1.textContent = airport.City;
                    departureSelect.appendChild(option1);

                    const option2 = document.createElement('option');
                    option2.value = airport.City;
                    option2.textContent = airport.City;
                    arrivalSelect.appendChild(option2);
                });
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки городов:', error);
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// ОБНОВЛЕНИЕ НАВИГАЦИИ
// ═════════════════════════════════════════════════════════════════════════════

function updateNavigation() {
    const isLogged = isUserLoggedIn();
    const passenger = getCurrentPassenger();

    const loginBtn = document.getElementById('navLogin');
    const registerBtn = document.getElementById('navRegister');
    const profileBtn = document.getElementById('navProfile');
    const logoutBtn = document.getElementById('navLogout');

    if (isLogged && passenger) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        if (profileBtn) profileBtn.style.display = 'inline';
        if (logoutBtn) logoutBtn.style.display = 'inline';

        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = `${passenger.FirstName} ${passenger.LastName}`;
        }
    } else {
        if (loginBtn) loginBtn.style.display = 'inline';
        if (registerBtn) registerBtn.style.display = 'inline';
        if (profileBtn) profileBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// ИНИЦИАЛИЗАЦИЯ
// ═════════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function() {
    updateNavigation();
    console.log('✅ PHP JavaScript инициализирован');
});