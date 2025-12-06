
// КОНФИГУРАЦИЯ И API
const API_URL = 'api.php';
let citiesLoaded = false;

// ФУНКЦИЯ ДЛЯ РАБОТЫ С API
async function callAPI(action, data = {}) {
    try {
        const response = await fetch(`${API_URL}?action=${action}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP ошибка! Статус: ${response.status}`);
        }

        const responseText = await response.text();
        
        if (!responseText || responseText.trim() === '') {
            throw new Error('Пустой ответ от сервера');
        }

        const result = JSON.parse(responseText);
        return result;
    } catch (error) {
        console.error('❌ Ошибка API:', error);
        console.error('Подробности:', error.message);
        throw error;
    }
}

// РЕГИСТРАЦИЯ
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

// ВХОД (с проверкой админа)
async function loginPassenger(email, password) {
    try {
        const data = {
            Email: email,
            Password: password
        };

        const result = await callAPI('login', data);

        if (result.success) {
            // Если это админ
            if (email === 'admin@admin.ru' && password === 'adminadmin') {
                localStorage.setItem('isAdmin', 'true');
                localStorage.setItem('adminLoggedIn', 'true');
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('passengerData');
                alert('✅ Вы вошли как администратор!');
                window.location.href = 'admin.html';
                return;
            }

            // Обычный пользователь
            localStorage.setItem('passengerData', JSON.stringify(result.passenger));
            localStorage.setItem('passengerID', result.passenger.PassengerID);
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.removeItem('isAdmin');
            alert('✅ Вы успешно вошли!');
            window.location.href = 'index.html';
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        alert('❌ Ошибка входа: ' + error.message);
    }
}

// ВЫХОД
function logoutPassenger() {
    localStorage.removeItem('passengerData');
    localStorage.removeItem('passengerID');
    localStorage.removeItem('isLoggedIn');
    alert('✅ Вы вышли из аккаунта');
    window.location.href = 'index.html';
}

// ВЫХОД ДЛЯ АДМИНА
function logoutAdmin() {
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('adminLoggedIn');
    alert('✅ Вы вышли из администраторского аккаунта');
    window.location.href = 'login.html';
}

// ПРОВЕРКА АВТОРИЗАЦИИ
function isUserLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true';
}

function isAdmin() {
    return localStorage.getItem('isAdmin') === 'true';
}

function getCurrentPassenger() {
    const data = localStorage.getItem('passengerData');
    return data ? JSON.parse(data) : null;
}

// ПОИСК РЕЙСОВ
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

// ФОРМАТИРОВАНИЕ ДАТЫ И ВРЕМЕНИ
function formatDateTime(dateTimeString) {
    if (!dateTimeString) return '';

    const date = new Date(dateTimeString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}.${month} ${hours}:${minutes}`;
}

//ОТОБРАЖЕНИЕ РЕЙСОВ
function displayFlights(flights) {
    const flightsContainer = document.getElementById('flightsResults');

    if (!flightsContainer) {
        console.error('Элемент flightsResults не найден');
        return;
    }

    if (flights.length === 0) {
        flightsContainer.innerHTML = '<p style="text-align: center; color: #d32f2f; font-size: 16px; padding: 20px;">❌ Рейсы не найдены. Попробуйте другие параметры поиска.</p>';
        return;
    }

    let html = '<div style="margin-top: 20px; overflow-x: auto;">';
    html += '<h2 style="margin-bottom: 15px; color: #1976d2;">✈️ Доступные рейсы</h2>';
    html += '<table style="width: 100%; border-collapse: collapse; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-radius: 4px; overflow: hidden;">';
    
    // Заголовок таблицы
    html += '<thead>';
    html += '<tr style="background-color: #1976d2; color: white;">';
    html += '<th style="padding: 12px; text-align: left; border: 1px solid #1565c0; font-weight: bold;">✈️ Рейс</th>';
    html += '<th style="padding: 12px; text-align: left; border: 1px solid #1565c0; font-weight: bold;">Маршрут</th>';
    html += '<th style="padding: 12px; text-align: center; border: 1px solid #1565c0; font-weight: bold;">Вылет</th>';
    html += '<th style="padding: 12px; text-align: center; border: 1px solid #1565c0; font-weight: bold;">Прилет</th>';
    html += '<th style="padding: 12px; text-align: center; border: 1px solid #1565c0; font-weight: bold;">Статус</th>';
    html += '<th style="padding: 12px; text-align: right; border: 1px solid #1565c0; font-weight: bold;">💰 Цена</th>';
    html += '<th style="padding: 12px; text-align: center; border: 1px solid #1565c0; font-weight: bold;">🪑 Места</th>';
    html += '<th style="padding: 12px; text-align: center; border: 1px solid #1565c0; font-weight: bold;">Действие</th>';
    html += '</tr>';
    html += '</thead>';
    
    // Тело таблицы
    html += '<tbody>';

    flights.forEach((flight, index) => {
        const bgColor = index % 2 === 0 ? '#f9f9f9' : '#ffffff';
        const freeSeats = flight.Capacity - flight.BookedSeats;
        const statusColor = flight.Status === 'По расписанию' ? '#4caf50' : 
                           flight.Status === 'Задержан' ? '#ff9800' : '#d32f2f';

        html += `<tr style="background-color: ${bgColor}; border-bottom: 1px solid #e0e0e0;">`;
        html += `<td style="padding: 12px; border-right: 1px solid #e0e0e0;"><strong>${flight.FlightNumber}</strong></td>`;
        html += `<td style="padding: 12px; border-right: 1px solid #e0e0e0;">${flight.DepartureCity} ✈️ ${flight.ArrivalCity}</td>`;
        html += `<td style="padding: 12px; border-right: 1px solid #e0e0e0; text-align: center;">${formatDateTime(flight.DepartureDateTime)}</td>`;
        html += `<td style="padding: 12px; border-right: 1px solid #e0e0e0; text-align: center;">${formatDateTime(flight.ArrivalDateTime)}</td>`;
        html += `<td style="padding: 12px; border-right: 1px solid #e0e0e0; text-align: center; color: ${statusColor}; font-weight: bold;">${flight.Status}</td>`;
        html += `<td style="padding: 12px; border-right: 1px solid #e0e0e0; text-align: right; color: #1976d2; font-weight: bold; font-size: 16px;">${flight.BasePrice} ₽</td>`;
        html += `<td style="padding: 12px; border-right: 1px solid #e0e0e0; text-align: center;">`;
        
        // Визуальная полоса свободных мест
        const percentFree = (freeSeats / flight.Capacity) * 100;
        const barColor = percentFree > 50 ? '#4caf50' : percentFree > 20 ? '#ff9800' : '#d32f2f';
        html += `<div style="background-color: #e0e0e0; height: 20px; border-radius: 10px; overflow: hidden; margin-bottom: 5px;">`;
        html += `<div style="background-color: ${barColor}; width: ${percentFree}%; height: 100%;"></div>`;
        html += `</div>`;
        html += `<span style="font-size: 12px; font-weight: bold;">${freeSeats}/${flight.Capacity}</span>`;
        
        html += `</td>`;
        html += `<td style="padding: 12px; text-align: center;">`;
        html += `<button onclick="bookFlight(${flight.FlightID})" style="padding: 8px 16px; background-color: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold; transition: background-color 0.3s;" onmouseover="this.style.backgroundColor='#1565c0'" onmouseout="this.style.backgroundColor='#1976d2'">`;
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

// БРОНИРОВАНИЕ
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

        console.log('📤 Отправляем данные бронирования:', data);

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

// ЗАГРУЗКА ГОРОДОВ
async function loadCities() {
    try {
        console.log('📍 Начало загрузки городов...');
        
        const response = await callAPI('get-airports', {});

        if (response.success) {
            console.log('📍 Города загружены:', response.airports);
            const airports = response.airports;

            const departureSelect = document.getElementById('departureCity');
            const arrivalSelect = document.getElementById('arrivalCity');

            if (!departureSelect || !arrivalSelect) {
                console.error('❌ Элементы select не найдены в DOM!');
                return;
            }

            // Очищаем старые опции (кроме первой)
            while (departureSelect.options.length > 1) {
                departureSelect.remove(1);
            }
            while (arrivalSelect.options.length > 1) {
                arrivalSelect.remove(1);
            }

            // Добавляем новые опции
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

            citiesLoaded = true;
            console.log('Города успешно загружены в selects!');
        } else {
            console.error('Ошибка загрузки городов:', response.message);
        }
    } catch (error) {
        console.error('Ошибка при загрузке городов:', error);
    }
}

// ПОЛУЧИТЬ БРОНИРОВАНИЯ
async function getBookings() {
    if (!isUserLoggedIn()) {
        return [];
    }

    try {
        const passengerID = localStorage.getItem('passengerID');
        const data = {
            PassengerID: parseInt(passengerID)
        };

        const result = await callAPI('get-bookings', data);

        if (result.success) {
            return result.bookings;
        } else {
            console.error('❌ Ошибка получения бронирований:', result.message);
            return [];
        }
    } catch (error) {
        console.error('❌ Ошибка при получении бронирований:', error);
        return [];
    }
}

// ОБНОВЛЕНИЕ НАВИГАЦИИ
function updateNavigation() {
    const isLogged = isUserLoggedIn();
    const isAdminLogged = isAdmin();
    const passenger = getCurrentPassenger();

    const loginBtn = document.getElementById('navLogin');
    const registerBtn = document.getElementById('navRegister');
    const profileBtn = document.getElementById('navProfile');
    const logoutBtn = document.getElementById('navLogout');
    const adminBtn = document.getElementById('navAdminCabinet');
    const adminLogoutBtn = document.getElementById('navAdminLogout');

    // ЕСЛИ АДМИН ЗАЛОГИНЕН
    if (isAdminLogged) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        if (profileBtn) profileBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';

        if (adminBtn) adminBtn.style.display = 'inline';
        if (adminLogoutBtn) adminLogoutBtn.style.display = 'inline';
    }

    // ЕСЛИ ОБЫЧНЫЙ ПОЛЬЗОВАТЕЛЬ ЗАЛОГИНЕН
    else if (isLogged && passenger) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';

        if (profileBtn) profileBtn.style.display = 'inline';
        if (logoutBtn) logoutBtn.style.display = 'inline';

        if (adminBtn) adminBtn.style.display = 'none';
        if (adminLogoutBtn) adminLogoutBtn.style.display = 'none';

        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = `${passenger.FirstName} ${passenger.LastName}`;
        }
    }

    // НИКТО НЕ ЗАЛОГИНЕН
    else {
        if (loginBtn) loginBtn.style.display = 'inline';
        if (registerBtn) registerBtn.style.display = 'inline';

        if (profileBtn) profileBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (adminBtn) adminBtn.style.display = 'none';
        if (adminLogoutBtn) adminLogoutBtn.style.display = 'none';
    }
}

// ИНИЦИАЛИЗАЦИЯ
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOMContentLoaded - начало инициализации');
    updateNavigation();
    loadCities();
    console.log('✅ PHP JavaScript инициализирован');
});
