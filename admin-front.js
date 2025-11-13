// ===== ЛОГИКА АДМИНИСТРАТОРА НА ФРОНТЕНДЕ =====

// Инициализация админ-панели
async function initAdmin() {
    await displayAllFlights();
}

// Отображение всех рейсов
async function displayAllFlights() {
    const flightsManagement = document.getElementById('flightsManagement');
    if (!flightsManagement) return;

    const result = await APIClient.getAllFlights();

    if (!result.success || !result.flights) {
        flightsManagement.innerHTML = '<p>Ошибка загрузки рейсов</p>';
        return;
    }

    if (result.flights.length === 0) {
        flightsManagement.innerHTML = '<p>Рейсов пока нет</p>';
        return;
    }

    flightsManagement.innerHTML = '';

    result.flights.forEach(flight => {
        const flightCard = document.createElement('div');
        flightCard.className = 'flight-manage-card';
        flightCard.innerHTML = `
            <div class="flight-manage-header">
                <div>
                    <h3>Рейс ${flight.FlightNumber}</h3>
                    <p><strong>Маршрут:</strong> ${flight.DepartureCity} → ${flight.ArrivalCity}</p>
                </div>
                <div class="flight-manage-actions">
                    <button class="btn btn-warning" onclick="editFlightPrice(${flight.FlightID}, ${flight.BasePrice})">Редактировать цену</button>
                    <button class="btn btn-danger" onclick="deleteFlightHandler(${flight.FlightID})">Удалить</button>
                </div>
            </div>
            <div class="flight-manage-details">
                <p><strong>Вылет:</strong> ${new Date(flight.DepartureDateTime).toLocaleString('ru-RU')}</p>
                <p><strong>Прилет:</strong> ${new Date(flight.ArrivalDateTime).toLocaleString('ru-RU')}</p>
                <p><strong>Самолет:</strong> ${flight.AircraftModel}</p>
                <p><strong>Цена:</strong> ${flight.BasePrice} ₽</p>
                <p><strong>Статус:</strong> ${flight.Status}</p>
            </div>
        `;

        flightsManagement.appendChild(flightCard);
    });
}

// Редактирование цены рейса
async function editFlightPrice(flightId, currentPrice) {
    const newPrice = prompt('Введите новую цену билета:', currentPrice);

    if (newPrice && !isNaN(newPrice)) {
        const result = await APIClient.updateFlight(flightId, { basePrice: parseFloat(newPrice), status: 'Scheduled' });

        if (result.success) {
            alert(result.message);
            await displayAllFlights();
        } else {
            alert('Ошибка: ' + result.message);
        }
    }
}

// Удаление рейса
async function deleteFlightHandler(flightId) {
    if (!confirm('Вы уверены, что хотите удалить этот рейс?')) {
        return;
    }

    const result = await APIClient.deleteFlight(flightId);

    if (result.success) {
        alert(result.message);
        await displayAllFlights();
    } else {
        alert('Ошибка: ' + result.message);
    }
}

// ===== ДОБАВЛЕНИЕ НОВОГО РЕЙСА =====

if (document.getElementById('addFlightForm')) {
    document.getElementById('addFlightForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const flightData = {
            flightNumber: document.getElementById('flightNumber').value,
            departureAirportId: parseInt(document.getElementById('departureAirportId').value),
            arrivalAirportId: parseInt(document.getElementById('arrivalAirportId').value),
            aircraftId: parseInt(document.getElementById('aircraftId').value),
            departureDateTime: document.getElementById('departureDateTime').value,
            arrivalDateTime: document.getElementById('arrivalDateTime').value,
            basePrice: parseFloat(document.getElementById('basePrice').value)
        };

        const result = await APIClient.addFlight(flightData);

        if (result.success) {
            alert(result.message);
            e.target.reset();
            await displayAllFlights();
        } else {
            alert('Ошибка: ' + result.message);
        }
    });
}

// ===== ВЫХОД ИЗ АДМИН ПАНЕЛИ =====

if (document.getElementById('adminLogoutBtn')) {
    document.getElementById('adminLogoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });
}

// ===== ИНИЦИАЛИЗАЦИЯ =====

if (document.getElementById('flightsManagement')) {
    initAdmin();
}