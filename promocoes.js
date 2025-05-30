document.addEventListener('DOMContentLoaded', () => {
    const promotionsDisplayArea = document.getElementById('promotions-display-area');
    const marketTabsContainer = document.getElementById('market-tabs');
    const dateSelector = document.getElementById('promo-date-selector');
    const searchInput = document.getElementById('promo-search-input');

    let allPromotions = []; // To store promotions from all categories
    let uniqueDates = new Set();

    // Function to fetch promotions data
    async function fetchPromotions() {
        try {
            const response = await fetch('promocoes-data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            allPromotions = []; // Reset before populating
            if (data.promotions) {
                for (const marketType in data.promotions) {
                    data.promotions[marketType].forEach(promo => {
                        allPromotions.push({ ...promo, marketType }); // Add marketType to each promo object
                        if (promo.dataOriginal) {
                            uniqueDates.add(promo.dataOriginal);
                        }
                    });
                }
            }
            populateDateFilter();
            renderPromotions(); // Initial render with "Mostrar Todos"
        } catch (error) {
            console.error("Could not fetch promotions data:", error);
            if (promotionsDisplayArea) {
                promotionsDisplayArea.innerHTML = '<p>Erro ao carregar promoções. Tente novamente mais tarde.</p>';
            }
        }
    }

    // Function to populate date filter
    function populateDateFilter() {
        if (!dateSelector) return;
        // Sort dates: most recent first, then older dates
        const sortedDates = Array.from(uniqueDates).sort((a,b) => new Date(b) - new Date(a)); 
        
        // Clear existing options except for "Todas as Datas"
        while (dateSelector.options.length > 1) {
            dateSelector.remove(1);
        }

        sortedDates.forEach(dateStr => {
            const option = document.createElement('option');
            option.value = dateStr;
            const [year, month, day] = dateStr.split('-');
            option.textContent = `${day}/${month}/${year}`; // Format DD/MM/YYYY
            dateSelector.appendChild(option);
        });
    }

    // Function to render promotions based on filters
    function renderPromotions() {
        if (!promotionsDisplayArea) return;
        promotionsDisplayArea.innerHTML = ''; // Clear previous items

        const selectedMarket = marketTabsContainer.querySelector('button.active')?.dataset.market || 'all';
        const selectedDate = dateSelector.value;
        const searchTerm = searchInput.value.toLowerCase().trim();

        let filteredPromotions = allPromotions;

        // 1. Filter by market type
        if (selectedMarket !== 'all') {
            filteredPromotions = filteredPromotions.filter(promo => promo.marketType === selectedMarket);
        }

        // 2. Filter by date
        if (selectedDate !== 'all') {
            filteredPromotions = filteredPromotions.filter(promo => promo.dataOriginal === selectedDate);
        }

        // 3. Filter by search term
        if (searchTerm) {
            filteredPromotions = filteredPromotions.filter(promo => {
                let searchString = '';
                if (promo.marketType === '100X' || promo.marketType === 'M12') {
                    searchString = `${promo.liga || ''} ${promo.nomeDoMercado || ''} ${promo.fechamentoDoMercado || ''}`.toLowerCase();
                } else if (promo.marketType === 'SuperOdds') {
                    searchString = `${promo.pais || ''} ${promo.liga || ''} ${promo.oferta || ''} ${promo.finalizacao || ''}`.toLowerCase();
                }
                return searchString.includes(searchTerm);
            });
        }

        if (filteredPromotions.length === 0) {
            promotionsDisplayArea.innerHTML = '<p>Nenhuma promoção encontrada com os filtros selecionados.</p>';
            return;
        }

        filteredPromotions.forEach(promo => {
            const card = document.createElement('div');
            card.classList.add('promo-item-card');
            
            // Sanitize marketType for display (e.g., SuperOdds -> Super Odds)
            const displayMarketType = promo.marketType.replace(/([A-Z])/g, ' $1').replace(/^ /, '');

            let content = `<h3>${displayMarketType}</h3>`;

            if (promo.marketType === '100X' || promo.marketType === 'M12') {
                content += `
                    <p><strong>Liga:</strong> ${promo.liga || 'N/A'}</p>
                    <p><strong>Nome do Mercado:</strong> ${promo.nomeDoMercado || 'N/A'}</p>
                    <p><strong>Fechamento do Mercado:</strong> ${promo.fechamentoDoMercado || 'N/A'}</p>
                `;
            } else if (promo.marketType === 'SuperOdds') {
                content += `
                    <p><strong>País:</strong> ${promo.pais || 'N/A'}</p>
                    <p><strong>Liga:</strong> ${promo.liga || 'N/A'}</p>
                    <p><strong>Oferta:</strong> ${promo.oferta || 'N/A'}</p>
                    <p><strong>Finalização:</strong> ${promo.finalizacao || 'N/A'}</p>
                `;
            }
            card.innerHTML = content;
            promotionsDisplayArea.appendChild(card);
        });
    }

    // Event listeners for filters
    if (marketTabsContainer) {
        marketTabsContainer.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                marketTabsContainer.querySelector('button.active')?.classList.remove('active');
                e.target.classList.add('active');
                renderPromotions();
            }
        });
    }

    if (dateSelector) {
        dateSelector.addEventListener('change', renderPromotions);
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => { // Using 'input' for real-time search
            renderPromotions();
        });
    }

    // Initial fetch and render
    fetchPromotions();

    // --- Fade-in/Fade-out logic for page transitions ---
    // This logic is similar to what's in carousel.js
    // It's included here because promocoes.html does not use carousel.js

    // Apply fade-in when the page loads
    if (document.body.classList.contains('fade-in')) { // Check if class is already there from HTML
        // Already applied via HTML, or handled if body.classList.add('fade-in') is here
    } else {
        document.body.classList.add('fade-in'); //
    }


    // Handle navigation fade-out for sports-buttons
    const sportButtons = document.querySelectorAll('.sports-buttons .button'); //
    sportButtons.forEach(button => { //
        button.addEventListener('click', (e) => { //
            const href = button.getAttribute('href'); //

            // If the button clicked is already selected (i.e., it's the current page),
            // prevent default action to avoid unnecessary fade and reload.
            if (button.classList.contains('selected') && 
                (window.location.pathname.endsWith(href) || (href === "index.html" && window.location.pathname.endsWith('/')))) {
                e.preventDefault();
                return;
            }

            if (href && href !== "#" && !button.classList.contains('selected')) { // Ensure it's a valid link and not the current page
                e.preventDefault(); // Impede o redirecionamento imediato
                
                document.body.classList.remove('fade-in'); //
                document.body.classList.add('fade-out'); //

                setTimeout(() => { //
                    window.location.href = href; //
                }, 500); // Tempo igual à duração da transição (0.5s)
            }
        });
    });
});