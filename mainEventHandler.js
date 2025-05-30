document.addEventListener('DOMContentLoaded', () => {
    const mainEventsTrigger = document.getElementById('main-events-trigger');
    const mainEventsPopup = document.getElementById('main-events-popup');
    const closeMainEventsPopup = document.getElementById('close-main-events-popup');
    const mainEventsList = document.getElementById('main-events-list');

    // A CHAVE DO LOCALSTORAGE NÃO É MAIS NECESSÁRIA PARA ESTA LÓGICA
    // const FIRST_VISIT_POPUP_KEY = 'hasSeenMainEventsPopup_v1';
    let inactivityTimer;
    const INACTIVITY_TIMEOUT = 10000; // 10 segundos

    if (!mainEventsTrigger || !mainEventsPopup || !closeMainEventsPopup || !mainEventsList) {
        console.error('Elementos do popup de principais eventos não encontrados.');
        return;
    }

    async function fetchAndRenderMainEvents() {
        try {
            const response = await fetch('principais-eventos.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.principaisEventos && data.principaisEventos.length > 0) {
                mainEventsList.innerHTML = ''; // Limpa o "Carregando..."
                const ul = document.createElement('ul');
                data.principaisEventos.forEach(event => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <strong>${event.nome}</strong>
                        <span class="event-date">${event.data}</span>
                        ${event.descricao}
                    `;
                    ul.appendChild(li);
                });
                mainEventsList.appendChild(ul);
            } else {
                mainEventsList.innerHTML = '<p>Nenhum evento principal para exibir no momento.</p>';
            }
        } catch (error) {
            console.error("Não foi possível carregar os principais eventos:", error);
            mainEventsList.innerHTML = '<p>Erro ao carregar eventos. Tente novamente mais tarde.</p>';
        }
    }

    function showPopup() {
        mainEventsPopup.classList.add('visible');
        mainEventsTrigger.classList.remove('pulsing'); // Garante que não pulse enquanto estiver aberto
        resetInactivityTimer();
        document.addEventListener('mousemove', handleMouseMovement);
    }

    function hidePopup() {
        mainEventsPopup.classList.remove('visible');
        mainEventsTrigger.classList.add('pulsing'); // Ativa o pulso ao fechar
        clearTimeout(inactivityTimer);
        document.removeEventListener('mousemove', handleMouseMovement);
    }

    function resetInactivityTimer() {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            if (mainEventsPopup.classList.contains('visible')) {
                hidePopup();
            }
        }, INACTIVITY_TIMEOUT);
    }

    function handleMouseMovement() {
        if (mainEventsPopup.classList.contains('visible')) {
            resetInactivityTimer();
        }
    }

    // Carrega os eventos assim que o DOM estiver pronto
    fetchAndRenderMainEvents();

    // --- MODIFICAÇÃO PRINCIPAL AQUI ---
    // Lógica de exibição do popup: SEMPRE MOSTRAR ao carregar a página index.html
    // Removemos a verificação do localStorage.
    setTimeout(showPopup, 500); // Pequeno delay para não ser tão abrupto.
    // A classe 'pulsing' será adicionada ao mainEventsTrigger pela função hidePopup() quando o popup for fechado.
    // Não é mais necessário adicioná-la aqui no 'else'.

    // Event Listeners
    mainEventsTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        if (mainEventsPopup.classList.contains('visible')) {
            hidePopup();
        } else {
            showPopup();
        }
    });

    closeMainEventsPopup.addEventListener('click', () => {
        hidePopup();
    });

    mainEventsPopup.addEventListener('click', (e) => {
        if (e.target === mainEventsPopup) {
            hidePopup();
        }
    });

    // Garante que o timer de inatividade comece se o popup for aberto
    // e o mouse não se mover inicialmente.
    if (mainEventsPopup.classList.contains('visible')) {
        resetInactivityTimer();
        document.addEventListener('mousemove', handleMouseMovement);
    }
});