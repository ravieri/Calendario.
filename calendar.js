document.addEventListener('DOMContentLoaded', () => {
    console.log('Calendário JS: DOMContentLoaded disparado.');

    const calendarModal = document.getElementById('calendar-modal');
    const calendarButton = document.getElementById('calendar-button');
    const closeButton = document.querySelector('.close-button');
    const monthYearDisplay = document.getElementById('month-year');
    const calendarGrid = document.getElementById('calendar-grid');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');
    const eventDetails = document.getElementById('event-details');
    const eventSearchInput = document.getElementById('event-search-input');
    const searchResultsContainer = document.getElementById('search-results-container');

    // Verificando se os elementos principais foram encontrados
    if (!calendarModal) console.error('Calendário JS ERRO: Elemento #calendar-modal não encontrado!');
    if (!calendarButton) console.error('Calendário JS ERRO: Elemento #calendar-button não encontrado!');
    if (!eventSearchInput) console.warn('Calendário JS AVISO: Elemento #event-search-input não encontrado!');
    if (!searchResultsContainer) console.warn('Calendário JS AVISO: Elemento #search-results-container não encontrado!');


    let currentDate = new Date();
    let events = [];

    function formatDateForDisplay(dateStr) {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }

    function displaySearchResults(results) {
        if (!searchResultsContainer) return;
        searchResultsContainer.innerHTML = '';
        if (results.length === 0) {
            searchResultsContainer.style.display = 'none';
            return;
        }
        searchResultsContainer.style.display = 'block';

        results.forEach(event => {
            const item = document.createElement('div');
            item.classList.add('search-result-item');
            item.innerHTML = `
                ${event.description}
                <span class="event-date">${formatDateForDisplay(event.date)}</span>
            `;
            item.addEventListener('click', () => {
                const [year, month, day] = event.date.split('-').map(Number);
                currentDate = new Date(year, month - 1, day);
                renderCalendar(currentDate);

                if (eventDetails) {
                    eventDetails.innerHTML = `<p>• ${event.description}</p>`;
                }

                if (eventSearchInput) eventSearchInput.value = '';
                searchResultsContainer.innerHTML = '';
                searchResultsContainer.style.display = 'none';
            });
            searchResultsContainer.appendChild(item);
        });
    }

    if (eventSearchInput) {
        eventSearchInput.addEventListener('input', () => {
            const searchTerm = eventSearchInput.value.toLowerCase().trim();
            if (searchTerm.length < 2) {
                if (searchResultsContainer) {
                    searchResultsContainer.innerHTML = '';
                    searchResultsContainer.style.display = 'none';
                }
                return;
            }
            const filteredEvents = events.filter(event =>
                event.description.toLowerCase().includes(searchTerm)
            );
            displaySearchResults(filteredEvents);
        });
    } else {
        console.warn("Calendário JS: Listener para eventSearchInput não adicionado pois o elemento não foi encontrado.");
    }

    async function fetchEvents() {
        try {
            console.log('Calendário JS: Buscando eventos...');
            const response = await fetch('calendar-events.json');
            if (!response.ok) {
                throw new Error(`Erro ao buscar calendar-events.json: ${response.statusText}`);
            }
            const data = await response.json();
            events = data.events || [];
            console.log('Calendário JS: Eventos carregados:', events.length);
            renderCalendar(currentDate);
        } catch (error) {
            console.error('Calendário JS ERRO ao carregar eventos do calendário:', error);
            if(calendarGrid) calendarGrid.innerHTML = "<p style='color:red;'>Erro ao carregar eventos.</p>";
        }
    }

    function renderCalendar(date) {
        console.log('Calendário JS: Renderizando calendário para', date);
        if (!calendarGrid || !monthYearDisplay) {
            console.error("Calendário JS ERRO: calendarGrid ou monthYearDisplay não encontrados para renderizar.");
            return;
        }

        calendarGrid.innerHTML = '';
        const month = date.getMonth();
        const year = date.getFullYear();
        
        const monthName = date.toLocaleString('pt-BR', { month: 'long' });
        monthYearDisplay.textContent = `${monthName} de ${year}`;

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        
        const today = new Date();

        for (let i = firstDayOfMonth; i > 0; i--) {
            const day = daysInPrevMonth - i + 1;
            const dayCell = document.createElement('div');
            dayCell.textContent = day;
            dayCell.classList.add('day-cell', 'other-month');
            calendarGrid.appendChild(dayCell);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.textContent = day;
            dayCell.classList.add('day-cell');
            
            if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayCell.classList.add('today');
            }

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = events.filter(event => event.date === dateStr);
            
            if (dayEvents.length > 0) {
                dayCell.classList.add('event-day');
                dayCell.addEventListener('click', () => {
                    if (eventDetails) {
                        eventDetails.innerHTML = '';
                        dayEvents.forEach(event => {
                            const eventInfo = document.createElement('p');
                            eventInfo.textContent = `• ${event.description}`;
                            eventDetails.appendChild(eventInfo);
                        });
                    }
                    if (eventSearchInput) eventSearchInput.value = '';
                    if (searchResultsContainer) {
                        searchResultsContainer.innerHTML = '';
                        searchResultsContainer.style.display = 'none';
                    }
                });
            }
            calendarGrid.appendChild(dayCell);
        }

        const totalCells = calendarGrid.children.length;
        const remainingCells = Math.max(0, 42 - totalCells); // Garantir que seja no mínimo 0
        for (let i = 1; i <= remainingCells; i++) {
            const dayCell = document.createElement('div');
            dayCell.textContent = i;
            dayCell.classList.add('day-cell', 'other-month');
            calendarGrid.appendChild(dayCell);
        }
        console.log('Calendário JS: Calendário renderizado.');
    }

    if (calendarButton) {
        console.log('Calendário JS: Adicionando listener ao calendarButton.');
        calendarButton.addEventListener('click', () => {
            console.log('Calendário JS: Botão do calendário clicado!');
            try {
                if (calendarModal) {
                    calendarModal.style.display = 'flex';
                } else {
                    console.error("Calendário JS ERRO: calendarModal não encontrado ao tentar abrir!");
                    return;
                }

                if (eventSearchInput) eventSearchInput.value = '';
                if (searchResultsContainer) {
                    searchResultsContainer.innerHTML = '';
                    searchResultsContainer.style.display = 'none';
                }
                
                currentDate = new Date();
                renderCalendar(currentDate); // Esta chamada deve funcionar se renderCalendar for robusta

                if (eventDetails) {
                    eventDetails.innerHTML = '<p>Selecione uma data com evento para ver os detalhes.</p>';
                } else {
                     console.warn("Calendário JS AVISO: eventDetails não encontrado ao abrir modal.");
                }
            } catch (e) {
                console.error('Calendário JS ERRO ao tentar abrir o calendário:', e);
            }
        });
    } else {
        console.error("Calendário JS: Botão do calendário (#calendar-button) não encontrado. O calendário não poderá ser aberto.");
    }

    if (closeButton) {
        closeButton.addEventListener('click', () => {
            if (calendarModal) calendarModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === calendarModal) {
            if (calendarModal) calendarModal.style.display = 'none';
        }
    });

    if (prevMonthButton) {
        prevMonthButton.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar(currentDate);
            if (eventDetails) eventDetails.innerHTML = '<p>Selecione uma data com evento para ver os detalhes.</p>';
        });
    }

    if (nextMonthButton) {
        nextMonthButton.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar(currentDate);
            if (eventDetails) eventDetails.innerHTML = '<p>Selecione uma data com evento para ver os detalhes.</p>';
        });
    }

    fetchEvents();
    console.log('Calendário JS: Script inicializado.');
});