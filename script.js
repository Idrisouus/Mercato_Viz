document.addEventListener('DOMContentLoaded', () => {

    const sideHeader = document.querySelector('.side-header');
    
    // MODIFIÉ : Sélectionner les liens et les éléments d'ancrage qu'ils ciblent
    const navLinks = document.querySelectorAll(".side-header ul li a");
    const sectionIds = Array.from(navLinks).map(link => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
            return href.substring(1); // Récupère "cont", "rec", etc.
        }
        return null;
    }).filter(id => id !== null);
    
    // `sections` contient maintenant les éléments <p id="cont">, <p id="rec">, etc.
    const sections = sectionIds.map(id => document.getElementById(id)).filter(el => el !== null);
    
    const contexteSection = document.querySelector('#contexte');

    const evolutionSectionNode = document.getElementById('evolution');
    const evolutionTitleHighlight = document.querySelector('#evolution h2 .highlight');
    const evolutionRoiElement = document.querySelector('#evolution .roi');
    const countries = document.querySelectorAll('.country');
    const leagueLogos = document.querySelectorAll('.league-logo');
    const defaultBgColor = '#101010';
    let isBackgroundChanged = false;
    let evolutionChartInstance = null;
    let leagueDataCache = null;

    let currentActiveSection = ""; // Stockera "cont", "rec", "city", etc.

    function handleScroll() {
        const viewportHeight = window.innerHeight;
        // Point d'activation (40% du haut de la fenêtre)
        const activeLinkPoint = viewportHeight * 0.4; 

        if (contexteSection) {
            const contexteTop = contexteSection.getBoundingClientRect().top;
            sideHeader.classList.toggle('visible', contexteTop < viewportHeight * 0.8);
        }

        // MODIFIÉ : Logique pour trouver la section active
        let newActiveSectionId = "";
        
        // On itère à l'envers pour trouver le *dernier* élément qui est passé au-dessus du point d'activation
        for (let i = sections.length - 1; i >= 0; i--) {
            const section = sections[i]; // C'est l'ancre <p>
            if (section) {
                const rect = section.getBoundingClientRect();
                // Si le haut de l'ancre est au-dessus ou sur le point d'activation
                if (rect.top <= activeLinkPoint) {
                    newActiveSectionId = section.getAttribute("id");
                    break; // On a trouvé la section active
                }
            }
        }

        if (newActiveSectionId !== currentActiveSection) {
            currentActiveSection = newActiveSectionId;
            
            navLinks.forEach(link => {
                // Compare le href (ex: "#cont") à l'ID actif (ex: "cont")
                const isActive = link.getAttribute("href") === `#${currentActiveSection}`;
                link.classList.toggle("active", isActive);
            });
        }
        // FIN DES MODIFICATIONS DE LA LOGIQUE DE SCROLL

        if (isBackgroundChanged && evolutionSectionNode) {
            const rect = evolutionSectionNode.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top > viewportHeight) {
                resetEvolutionChartStyle();
            }
        }
    }

    new Swiper('.records-swiper', {
        direction: 'vertical',
        loop: true,
        slidesPerView: 1.6,
        centeredSlides: true,
        spaceBetween: 20,
        initialSlide: 1,
        autoplay: { delay: 2500, disableOnInteraction: false },
        speed: 2500,
        scrollbar: { el: '.swiper-scrollbar', draggable: true },
    });

    function initIndividualChart() {
        const transferChartElement = document.getElementById('transferChart');
        const chartSectionContainer = document.querySelector('.chart-section-container');

        if (!transferChartElement || !chartSectionContainer) return;

        const initChart = (transferData) => {
            const displayArea = document.getElementById('display-area');
            const showDefaultMessage = () => { displayArea.innerHTML = '<p>Cliquez sur un point du graphique pour voir le détail du transfert.</p>'; };
            const updateDisplayContent = (data) => {
                displayArea.innerHTML = `
                    <img src="${data.LIEN}" alt="Transfert de ${data.NOM}">
                    <p class="transfer-description">${data.TEXTE}</p>
                `;
            };
            const labels = transferData.map(item => item['ANNÉE'].split('/')[0]);
            const prices = transferData.map(item => parseFloat(item[' PRIX '].replace(/\s/g, '').replace('€', '').replace(/,/g, '')));
            const ctx = transferChartElement.getContext('2d');
            let selectedIndex = -1;

            const transferChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Montant du Transfert', data: prices, borderColor: '#EDD60A', backgroundColor: 'rgba(237, 214, 10, 0.19)',
                        pointBackgroundColor: '#FFFFFF', pointBorderColor: '#FFFFFF', pointHoverBackgroundColor: '#EDD60A',
                        pointHoverBorderColor: '#EDD60A', pointRadius: 6, pointHoverRadius: 8, tension: 0.3, fill: true
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false },
                        tooltip: { callbacks: { label: context => `Montant : ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(context.parsed.y)}` } }
                    },
                    scales: {
                        y: { beginAtZero: false, ticks: { color: '#AAAAAA', callback: value => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', notation: 'compact' }).format(value) }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
                        x: { ticks: { color: '#AAAAAA' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
                    },
                    onClick: (event, elements) => {
                        if (elements.length > 0) {
                            const newIndex = elements[0].index; if (newIndex === selectedIndex) return; selectedIndex = newIndex;
                            const selectedData = transferData[selectedIndex]; updateDisplayContent(selectedData);
                            const pointRadii = transferData.map((_, index) => index === selectedIndex ? 10 : 6);
                            const pointHoverRadii = transferData.map((_, index) => index === selectedIndex ? 12 : 8);
                            transferChart.data.datasets[0].pointRadius = pointRadii; transferChart.data.datasets[0].pointHoverRadius = pointHoverRadii;
                            transferChart.update();
                        }
                    }
                }
            });
            showDefaultMessage();
        };

        const loadAndCreateChart = () => {
            fetch('transfert_invidividuels.json')
                .then(response => { if (!response.ok) { throw new Error(`Erreur HTTP ! Statut : ${response.status}`); } return response.json(); })
                .then(data => { initChart(data); })
                .catch(error => {
                    console.error("Impossible de charger le fichier de données des transferts :", error);
                    document.getElementById('display-area').innerHTML = "<p>Erreur lors du chargement des données.</p>";
                });
        };
        
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    chartSectionContainer.classList.add('is-visible'); loadAndCreateChart(); observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        observer.observe(chartSectionContainer);
    }

    function hexToRgba(hex, alpha) {
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) { r = "0x" + hex[1] + hex[1]; g = "0x" + hex[2] + hex[2]; b = "0x" + hex[3] + hex[3]; } 
        else if (hex.length === 7) { r = "0x" + hex[1] + hex[2]; g = "0x" + hex[3] + hex[4]; b = "0x" + hex[5] + hex[6]; }
        return `rgba(${+r},${+g},${+b},${alpha})`;
    }

    function resetEvolutionChartStyle() {
        document.body.style.backgroundColor = defaultBgColor;
        countries.forEach(c => c.classList.remove('active'));
        leagueLogos.forEach(logo => logo.classList.remove('active'));

        if (evolutionTitleHighlight) evolutionTitleHighlight.style.color = '';
        if (evolutionRoiElement) evolutionRoiElement.style.color = '';

        if (evolutionChartInstance) {
            evolutionChartInstance.data.datasets[0].label = 'Sélectionnez un pays';
            evolutionChartInstance.data.datasets[0].data = [];
            evolutionChartInstance.data.datasets[0].borderColor = '#555';
            evolutionChartInstance.data.datasets[0].backgroundColor = 'transparent';
            evolutionChartInstance.data.datasets[0].fill = false;
            evolutionChartInstance.update();
        }
        isBackgroundChanged = false;
    }

    async function chargerEtPreparerDonnees() {
        try {
            const reponse = await fetch('transfert_championnats.json');
            if (!reponse.ok) throw new Error(`Erreur HTTP: ${reponse.status}`);
            const donneesBrutes = await reponse.json();
            const leagueData = {};
            const labels = Object.keys(donneesBrutes[0]).filter(key => key.includes('/')).map(annee => annee.trim());
            
            donneesBrutes.forEach(championnat => {
                const nomChampionnat = championnat.CHAMPIONNAT.trim().toLowerCase();
                let leagueId = '';
                if (nomChampionnat.includes('premier league')) leagueId = 'premier';
                else if (nomChampionnat.includes('ligue 1')) leagueId = 'ligue1';
                else if (nomChampionnat.includes('liga')) leagueId = 'liga';
                else if (nomChampionnat.includes('bundes')) leagueId = 'bundes';
                else if (nomChampionnat.includes('serie a')) leagueId = 'seriea';
                
                if (leagueId) {
                    const dataPoints = labels.map(label => {
                        const cleOriginale = Object.keys(championnat).find(k => k.trim() === label);
                        const montantNumerique = parseFloat((championnat[cleOriginale] || "0").replace(/[\s€,]/g, ''));
                        return montantNumerique / 1000000;
                    });
                    const elementHTML = document.querySelector(`.country[data-league="${leagueId}"]`);
                    leagueData[leagueId] = {
                        label: championnat.CHAMPIONNAT.trim(),
                        data: dataPoints,
                        borderColor: elementHTML ? elementHTML.dataset.lineColor : '#EFEFEF',
                        bgColor: elementHTML ? elementHTML.dataset.bgColor : '#212121'
                    };
                }
            });
            return { leagueData, labels };
        } catch (erreur) {
            console.error("Impossible de charger ou traiter les données:", erreur);
            return null;
        }
    }

    async function initEvolutionChart() {
        const donneesTraitees = await chargerEtPreparerDonnees();
        if (!donneesTraitees) return;

        leagueDataCache = donneesTraitees.leagueData;
        const labels = donneesTraitees.labels;
        
        const evolutionChartElement = document.getElementById('evolutionChart');
        if (!evolutionChartElement) return;

        const ctx = evolutionChartElement.getContext('2d');
        evolutionChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Sélectionnez un pays', data: [], borderColor: '#555', borderWidth: 3,
                    tension: 0.4, pointBackgroundColor: '#fff', pointBorderColor: '#fff', fill: false
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => ` ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(context.parsed.y * 1000000)}` } } },
                scales: {
                    y: { 
                        beginAtZero: true, 
                        ticks: { 
                            color: 'rgba(255, 255, 255, 0.7)', 
                            callback: function(value) {
                                if (value >= 1000) return (value / 1000).toLocaleString('fr-FR') + ' Md€';
                                return value + ' M€';
                            }
                        }, 
                        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
                    },
                    x: { ticks: { color: 'rgba(255, 255, 255, 0.7)' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
                }
            }
        });

        countries.forEach(country => {
            country.addEventListener('click', function () {
                const leagueId = this.dataset.league;
                const selectedData = leagueDataCache[leagueId];

                if (this.classList.contains('active')) {
                    resetEvolutionChartStyle();
                    return;
                }

                if (selectedData) {
                    countries.forEach(c => c.classList.remove('active'));
                    this.classList.add('active');
                    
                    document.body.style.backgroundColor = selectedData.bgColor;

                    if (evolutionTitleHighlight) evolutionTitleHighlight.style.color = selectedData.borderColor;
                    if (evolutionRoiElement) evolutionRoiElement.style.color = selectedData.borderColor;

                    const activeLogo = document.querySelector(`.league-logo[data-league="${leagueId}"]`);
                    leagueLogos.forEach(logo => logo.classList.remove('active'));
                    if (activeLogo) activeLogo.classList.add('active');
                    
                    const gradient = ctx.createLinearGradient(0, evolutionChartInstance.chartArea.top, 0, evolutionChartInstance.chartArea.bottom);
                    gradient.addColorStop(0, hexToRgba(selectedData.borderColor, 0.6));
                    gradient.addColorStop(1, hexToRgba(selectedData.borderColor, 0));

                    evolutionChartInstance.data.datasets[0].label = selectedData.label;
                    evolutionChartInstance.data.datasets[0].data = selectedData.data;
                    evolutionChartInstance.data.datasets[0].borderColor = selectedData.borderColor;
                    evolutionChartInstance.data.datasets[0].backgroundColor = gradient;
                    evolutionChartInstance.data.datasets[0].fill = true;
                    evolutionChartInstance.update();
                    isBackgroundChanged = true;
                }
            });
        });
    }

    initIndividualChart();
    initEvolutionChart();
    window.addEventListener('scroll', handleScroll);
});