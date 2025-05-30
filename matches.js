document.addEventListener('matchesReady', () => {
    const matchesContainer = document.querySelector('.matches-container');
    const monthSelector = document.querySelector('#month-selector');
    const weekSelector = document.querySelector('#week-selector');
    const championshipSelector = document.querySelector('#championship-selector');
    const matchesCurrent = document.querySelector('.matches-current');
    const matchSearchInput = document.getElementById('match-search-input');

    let matchesData;
    let dynamicMatchesDisplay; // This will be the single scrollable div
    let currentMonth = monthSelector ? monthSelector.value : 'Junho';
    let currentWeekIndex = "all"; // Default to "All Weeks"
    let currentChampionship = 'all';
    let currentSearchTerm = '';
    let lastUpdatedKey = '';

    let isDragging = false;
    let startPageX;
    let initialScrollLeft;

    function createMatchItemElement(match) {
        const matchItem = document.createElement('div');
        matchItem.classList.add('match-item');
        const hasRanking = match.teamA.rank && match.teamB.rank;
        matchItem.innerHTML = `
            <div class="match-header">
                <span class="match-championship">${match.championship}</span>
                <span class="match-date">${match.date}</span>
            </div>
            <div class="match-teams">
                <div class="team">
                    <div class="team-emblem-container">
                        <img class="team-emblem" src="${match.teamA.emblem}" alt="${match.teamA.name}">
                    </div>
                    <span class="team-name">${match.teamA.name}</span>
                    ${hasRanking ? `<span class="team-rank">${match.teamA.rank}</span>` : ''}
                </div>
                <div class="score">${match.score}</div>
                <div class="team">
                    <div class="team-emblem-container">
                        <img class="team-emblem" src="${match.teamB.emblem}" alt="${match.teamB.name}">
                    </div>
                    <span class="team-name">${match.teamB.name}</span>
                    ${hasRanking ? `<span class="team-rank">${match.teamB.rank}</span>` : ''}
                </div>
            </div>
            <div class="match-description">${match.description || ''}</div>
            ${match.comments && match.comments.length > 0 ? `
            <div class="comments-section">
                <button class="toggle-comments">Ver Comentários (${match.comments.length})</button>
                <div class="comments-content">
                    ${match.comments.map(comment => `<p class="comment">${comment}</p>`).join('')}
                </div>
            </div>` : ''}
        `;

        if (match.comments && match.comments.length > 0) {
            const toggleButton = matchItem.querySelector('.toggle-comments');
            const commentsContent = matchItem.querySelector('.comments-content');
            if (toggleButton && commentsContent) {
                toggleButton.addEventListener('click', () => {
                    const isCurrentlyExpanded = commentsContent.classList.contains('expanded');
                    commentsContent.classList.toggle('expanded', !isCurrentlyExpanded);
                    toggleButton.textContent = !isCurrentlyExpanded ? `Esconder Comentários` : `Ver Comentários (${match.comments.length})`;
                });
            }
        }
        return matchItem;
    }

    function populateWeekSelector(month) {
        if (!weekSelector || !matchesData) {
            if (weekSelector) weekSelector.innerHTML = '<option value="all">Todas as Semanas</option><option value="0">N/A</option>';
            return;
        }
        weekSelector.innerHTML = ''; // Clear existing

        const allWeeksOption = document.createElement('option');
        allWeeksOption.value = "all";
        allWeeksOption.textContent = "Todas as Semanas";
        weekSelector.appendChild(allWeeksOption);

        if (matchesData[month]) {
            matchesData[month].forEach((week, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = week.weekLabel;
                weekSelector.appendChild(option);
            });
        }

        let foundOption = Array.from(weekSelector.options).find(opt => opt.value == currentWeekIndex);
        if (foundOption) {
            weekSelector.value = currentWeekIndex;
        } else if (weekSelector.options.length > 0) {
            weekSelector.value = weekSelector.options[0].value;
            currentWeekIndex = weekSelector.value === "all" ? "all" : parseInt(weekSelector.value);
        } else {
            weekSelector.innerHTML = '<option value="all">Todas as Semanas</option>';
            weekSelector.value = "all";
            currentWeekIndex = "all";
        }
    }

    function populateChampionshipSelector() {
        if (!championshipSelector || !matchesData) return;
        const championships = new Set();
        Object.keys(matchesData).forEach(month => {
            if (matchesData[month]) {
                matchesData[month].forEach(week => {
                    if (week.matches) {
                        week.matches.forEach(match => {
                            championships.add(match.championship);
                        });
                    }
                });
            }
        });
        while (championshipSelector.options.length > 1) {
            championshipSelector.remove(1);
        }
        championships.forEach(championship => {
            const option = document.createElement('option');
            option.value = championship;
            option.textContent = championship;
            championshipSelector.appendChild(option);
        });
        championshipSelector.value = currentChampionship;
    }

    function initializeMatches(data) {
        if (!data || !data.matchesData) {
            console.error("Matches data is missing or invalid.");
            if (matchesContainer) matchesContainer.innerHTML = "<p style='color:red; text-align:center;'>Erro ao carregar dados.</p>";
            return;
        }
        matchesData = data.matchesData;
        if (!matchesContainer) {
            console.error("Matches container not found.");
            return;
        }
        matchesContainer.innerHTML = '';

        dynamicMatchesDisplay = document.createElement('div');
        dynamicMatchesDisplay.classList.add('dynamic-matches-display');
        matchesContainer.appendChild(dynamicMatchesDisplay);

        if (monthSelector) currentMonth = monthSelector.value;
        populateWeekSelector(currentMonth);
        populateChampionshipSelector();
        updateMatches('init');

        if (monthSelector) monthSelector.addEventListener('change', (e) => {
            currentMonth = e.target.value;
            currentWeekIndex = "all";
            populateWeekSelector(currentMonth);
            updateMatches('month');
        });
        if (weekSelector) weekSelector.addEventListener('change', (e) => {
            currentWeekIndex = e.target.value === "all" ? "all" : parseInt(e.target.value);
            updateMatches('week');
        });
        if (championshipSelector) championshipSelector.addEventListener('change', (e) => {
            currentChampionship = e.target.value;
            updateMatches('championship');
        });
        if (matchSearchInput) {
            matchSearchInput.addEventListener('input', (e) => {
                currentSearchTerm = e.target.value.toLowerCase().trim();
                updateMatches('search');
            });
        }
    }

    function updateMatches(updateSource = '') {
        if (!matchesData || !dynamicMatchesDisplay) return;
        dynamicMatchesDisplay.innerHTML = '';

        const newFilterKey = `${currentMonth}-${currentWeekIndex}-${currentChampionship}-${currentSearchTerm}`;
        if (updateSource === 'month' || updateSource === 'week' || updateSource === 'init' || lastUpdatedKey !== newFilterKey) {
            dynamicMatchesDisplay.style.transform = 'translateX(0px)';
        }
        lastUpdatedKey = newFilterKey;

        let visibleMatchCountOverall = 0;
        let activeDisplayLabel = "Nenhuma partida encontrada com os filtros selecionados.";

        if (currentWeekIndex === "all") {
            activeDisplayLabel = `Todas as Semanas de ${currentMonth}`;
            if (matchesData[currentMonth]) {
                matchesData[currentMonth].forEach(week => {
                    let matchesForThisWeekInAllView = [];
                    if (week.matches) {
                        week.matches.forEach(match => {
                            const championshipFilterMatch = (currentChampionship === 'all' || match.championship.toLowerCase() === currentChampionship.toLowerCase());
                            const searchableData = [match.championship, match.teamA.name, match.teamB.name].join(' ').toLowerCase();
                            const searchTermMatch = (!currentSearchTerm || searchableData.includes(currentSearchTerm));

                            if (championshipFilterMatch && searchTermMatch) {
                                matchesForThisWeekInAllView.push(match);
                            }
                        });
                    }

                    if (matchesForThisWeekInAllView.length > 0) {
                        // REMOVIDA A CRIAÇÃO E ADIÇÃO DO weekLabelDiv DAQUI
                        // const weekLabelDiv = document.createElement('div');
                        // weekLabelDiv.classList.add('week-separator-label');
                        // weekLabelDiv.textContent = week.weekLabel;
                        // dynamicMatchesDisplay.appendChild(weekLabelDiv);

                        matchesForThisWeekInAllView.forEach(match => {
                            const matchItem = createMatchItemElement(match);
                            dynamicMatchesDisplay.appendChild(matchItem);
                            visibleMatchCountOverall++;
                        });
                    }
                });
            }
        } else { 
            if (matchesData[currentMonth] && matchesData[currentMonth][currentWeekIndex]) {
                const week = matchesData[currentMonth][currentWeekIndex];
                activeDisplayLabel = week.weekLabel;

                if (week.matches) {
                    week.matches.forEach(match => {
                        const championshipFilterMatch = (currentChampionship === 'all' || match.championship.toLowerCase() === currentChampionship.toLowerCase());
                        const searchableData = [match.championship, match.teamA.name, match.teamB.name].join(' ').toLowerCase();
                        const searchTermMatch = (!currentSearchTerm || searchableData.includes(currentSearchTerm));

                        if (championshipFilterMatch && searchTermMatch) {
                            const matchItem = createMatchItemElement(match);
                            dynamicMatchesDisplay.appendChild(matchItem);
                            visibleMatchCountOverall++;
                        }
                    });
                }
            }
        }

        if (matchesCurrent) {
            matchesCurrent.textContent = visibleMatchCountOverall > 0 ? activeDisplayLabel : "Nenhuma partida para esta semana/filtro.";
        }
        if (visibleMatchCountOverall === 0 && dynamicMatchesDisplay.innerHTML === '') {
             dynamicMatchesDisplay.innerHTML = '<p class="no-matches-message">Nenhuma partida encontrada com os filtros selecionados.</p>';
        }

        setTimeout(() => enforceBoundsAfterDrag(), 50);
    }

    function getCurrentTranslateX() {
        if (!dynamicMatchesDisplay) return 0;
        const transform = window.getComputedStyle(dynamicMatchesDisplay).getPropertyValue('transform');
        if (transform === 'none') return 0;
        const matrix = transform.match(/matrix.*\((.+)\)/);
        return matrix ? parseFloat(matrix[1].split(', ')[4]) : 0;
    }

    function enforceBoundsAfterDrag() {
        if (!dynamicMatchesDisplay) return;
        let currentTranslateX = getCurrentTranslateX();
        
        const visibleItems = Array.from(dynamicMatchesDisplay.children)
                                 .filter(child => child.matches('.match-item')); // Consider only match-items for width if separators are gone

        if (!visibleItems.length) { 
            if (!dynamicMatchesDisplay.querySelector('.match-item')) { // Check if only no-matches-message is present
                 dynamicMatchesDisplay.style.transition = 'transform 0.3s ease-out';
                 dynamicMatchesDisplay.style.transform = 'translateX(0px)';
                 return;
            }
        }
        
        const gap = 15; 
        const containerWidth = matchesContainer.clientWidth;
        let calculatedContentWidth = 0;
        visibleItems.forEach((item, index) => {
            calculatedContentWidth += item.offsetWidth;
            if (index < visibleItems.length - 1) {
                calculatedContentWidth += gap;
            }
        });

        const maxTranslateX = 0;
        let minTranslateX = 0;
        if (calculatedContentWidth > containerWidth) {
            minTranslateX = -(calculatedContentWidth - containerWidth);
        }

        let finalTranslateX = currentTranslateX;
        if (currentTranslateX > maxTranslateX) finalTranslateX = maxTranslateX;
        else if (currentTranslateX < minTranslateX) finalTranslateX = minTranslateX;

        if (Math.abs(finalTranslateX - currentTranslateX) > 0.5) {
            dynamicMatchesDisplay.style.transition = 'transform 0.3s ease-out';
        } else {
            dynamicMatchesDisplay.style.transition = 'none';
        }
        dynamicMatchesDisplay.style.transform = `translateX(${finalTranslateX}px)`;
    }

    if (matchesContainer) {
        matchesContainer.style.cursor = 'grab';
        matchesContainer.addEventListener('mousedown', (e) => {
            if (!dynamicMatchesDisplay || (e.target.closest && e.target.closest('button, select, input, a'))) return;
            if (!dynamicMatchesDisplay.contains(e.target) && e.target !== dynamicMatchesDisplay) return;

            isDragging = true;
            startPageX = e.pageX;
            initialScrollLeft = getCurrentTranslateX();
            matchesContainer.style.cursor = 'grabbing';
            if (dynamicMatchesDisplay) dynamicMatchesDisplay.style.transition = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging || !dynamicMatchesDisplay) return;
            const currentX = e.pageX;
            const walk = currentX - startPageX;
            let targetX = initialScrollLeft + walk;
            dynamicMatchesDisplay.style.transform = `translateX(${targetX}px)`;
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                if (matchesContainer) matchesContainer.style.cursor = 'grab';
                enforceBoundsAfterDrag();
            }
        });
        matchesContainer.addEventListener('mouseleave', () => { 
            if (isDragging) {
                isDragging = false;
                if (matchesContainer) matchesContainer.style.cursor = 'grab';
                enforceBoundsAfterDrag();
            }
        });
        matchesContainer.addEventListener('dragstart', (e) => e.preventDefault());
    }

    const dataFile = getDataFile();
    if (dataFile) {
        fetch(dataFile)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for ${dataFile}`);
                return response.json();
            })
            .then(data => initializeMatches(data))
            .catch(error => {
                console.error('Erro ao carregar dados das partidas:', error);
                if(matchesContainer) matchesContainer.innerHTML = "<p style='color:red; text-align:center;'>Falha ao carregar partidas.</p>";
            });
    } else {
        console.error("Não foi possível determinar o arquivo de dados das partidas.");
        if(matchesContainer) matchesContainer.innerHTML = "<p style='color:orange; text-align:center;'>Arquivo de configuração não encontrado.</p>";
    }
});

function getDataFile() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    switch (currentPage) {
        case 'index.html': return 'futebol-data.json';
        case 'basquete.html': return 'basquete-data.json';
        case 'tenis.html': return 'tenis-data.json';
        case 'ufc.html': return 'ufc-data.json';
        default:
            // console.warn(`Página desconhecida para getDataFile: ${currentPage}`); // Removido log excessivo
            return null; 
    }
}