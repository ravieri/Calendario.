// In aplicativo.js

// (renderCarouselItems and renderMatches functions remain the same as in your provided file)
function renderCarouselItems(data) { //
    const carouselContainer = document.getElementById("carousel-container"); //
    if (!carouselContainer) return; // Add guard clause
    carouselContainer.innerHTML = ''; // Clear previous items
    data.forEach(item => { //
        const carouselItem = document.createElement("div"); //
        carouselItem.classList.add("carousel-item"); //

        const img = document.createElement("img"); //
        img.classList.add("carousel-image"); //
        img.src = item.imgSrc; //
        img.alt = item.alt || "Imagem de Esporte"; //

        const contentDiv = document.createElement("div"); //
        contentDiv.classList.add("carousel-content"); //

        const spanCategory = document.createElement("span"); //
        spanCategory.classList.add("category-tag"); //
        spanCategory.textContent = item.categoryTag; //

        const title = document.createElement("h2"); //
        title.textContent = item.title; //

        const desc = document.createElement("p"); //
        desc.textContent = item.description; //

        contentDiv.appendChild(spanCategory); //
        contentDiv.appendChild(title); //
        contentDiv.appendChild(desc); //

        carouselItem.appendChild(img); //
        carouselItem.appendChild(contentDiv); //

        carouselContainer.appendChild(carouselItem); //
    });
}

function renderMatches(matchesData) { //
    const matchesContainer = document.getElementById("matches-container"); //
    if (!matchesContainer) return; // Add guard clause
    matchesContainer.innerHTML = ''; //

    Object.keys(matchesData).forEach(month => { //
        matchesData[month].forEach((weekObj, weekIndex) => { //
            const weekDiv = document.createElement("div"); //
            weekDiv.classList.add("matches-week"); //
            weekDiv.setAttribute("data-month", month); //
            weekDiv.setAttribute("data-week-index", weekIndex); //

            weekObj.matches.forEach(match => { //
                const matchItem = document.createElement("div"); //
                matchItem.classList.add("match-item"); //

                const championshipDiv = document.createElement("div"); //
                championshipDiv.classList.add("match-championship"); //
                championshipDiv.textContent = match.championship; //

                const matchTeamsDiv = document.createElement("div"); //
                matchTeamsDiv.classList.add("match-teams"); //

                const teamADiv = document.createElement("div"); //
                teamADiv.classList.add("team"); //
                const teamAEmblemContainer = document.createElement("div"); //
                teamAEmblemContainer.classList.add("team-emblem-container"); //
                const teamAImg = document.createElement("img"); //
                teamAImg.classList.add("team-emblem"); //
                teamAImg.src = match.teamA.emblem; //
                teamAImg.alt = match.teamA.name; //
                teamAEmblemContainer.appendChild(teamAImg); //
                const teamAName = document.createElement("span"); //
                teamAName.classList.add("team-name"); //
                teamAName.textContent = match.teamA.name; //
                teamADiv.appendChild(teamAEmblemContainer); //
                teamADiv.appendChild(teamAName); //

                const matchScore = document.createElement("span"); //
                matchScore.classList.add("match-score"); //
                matchScore.textContent = match.score; //

                const teamBDiv = document.createElement("div"); //
                teamBDiv.classList.add("team"); //
                const teamBEmblemContainer = document.createElement("div"); //
                teamBEmblemContainer.classList.add("team-emblem-container"); //
                const teamBImg = document.createElement("img"); //
                teamBImg.classList.add("team-emblem"); //
                teamBImg.src = match.teamB.emblem; //
                teamBImg.alt = match.teamB.name; //
                teamBEmblemContainer.appendChild(teamBImg); //
                const teamBName = document.createElement("span"); //
                teamBName.classList.add("team-name"); //
                teamBName.textContent = match.teamB.name; //
                teamBDiv.appendChild(teamBEmblemContainer); //
                teamBDiv.appendChild(teamBName); //

                matchTeamsDiv.appendChild(teamADiv); //
                matchTeamsDiv.appendChild(matchScore); //
                matchTeamsDiv.appendChild(teamBDiv); //

                const matchDate = document.createElement("div"); //
                matchDate.classList.add("match-date"); //
                matchDate.textContent = match.date; //

                const matchDesc = document.createElement("span"); //
                matchDesc.classList.add("match-description"); //
                matchDesc.textContent = match.description || ""; //

                matchItem.appendChild(championshipDiv); //
                matchItem.appendChild(matchTeamsDiv); //
                matchItem.appendChild(matchDate); //
                matchItem.appendChild(matchDesc); //

                weekDiv.appendChild(matchItem); //
            });

            matchesContainer.appendChild(weekDiv); //
        });
    });
}


function getDataFile() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    switch (currentPage) {
        case 'index.html':
            return 'futebol-data.json'; //
        case 'basquete.html':   
            return 'basquete-data.json'; //
        case 'tenis.html':
            return 'tenis-data.json'; //
        case 'ufc.html':
            return 'ufc-data.json'; //
        // For promocoes.html, data loading is handled by promocoes.js
        // So, no specific case is strictly needed here for promocoes-data.json
        // unless other parts of aplicativo.js might use it.
        // If not, this function might not even be called from promocoes.html path.
        default:
            // Fallback for pages that might still use this generic loader
            // or if the current page is not one of the main sports pages.
            // Check if the current page is one of the main sports pages
            // before defaulting to futebol-data.json to avoid loading it unnecessarily.
            if (['index.html', 'basquete.html', 'tenis.html', 'ufc.html'].includes(currentPage)) {
                 return 'futebol-data.json'; // Default for main sports pages if not matched
            }
            return null; // Return null if no specific data file for the page
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const dataFile = getDataFile();
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Only attempt to load data if dataFile is not null (i.e., it's a page that uses this generic loader)
    if (dataFile) {
        // Check if this page is expected to have a carousel or matches section
        const hasCarousel = document.getElementById("carousel-container") !== null; //
        const hasMatches = document.getElementById("matches-container") !== null; //

        if (hasCarousel || hasMatches) {
            fetch(dataFile)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status} for ${dataFile}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (hasCarousel && data.carouselData) {
                        renderCarouselItems(data.carouselData); //
                        document.dispatchEvent(new Event("carouselReady")); //
                    }
                    if (hasMatches && data.matchesData) {
                        renderMatches(data.matchesData); //
                        document.dispatchEvent(new Event("matchesReady")); //
                    }
                })
                .catch(error => console.error(`Erro ao carregar ${dataFile}:`, error)); //
        }
    }
    // Note: promocoes.js handles its own data fetching for promocoes.html.
    // calendar.js also fetches its own data.
});