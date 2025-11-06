document.addEventListener('DOMContentLoaded', () => {

    // --- DÉBUT : LOGIQUE DE L'INTRO VIDÉO (MODIFIÉE AVEC SESSIONSTORAGE) ---
    const videoOverlay = document.getElementById('video-overlay');
    const introVideo = document.getElementById('introVideo');
    const body = document.body;

    // Fonction pour lancer les animations de la page d'accueil
    function startHomepageAnimations() {
        const title = document.getElementById('main-title');
        const subtitle = document.getElementById('main-subtitle');
        const button = document.getElementById('main-button');

        if (!title || !subtitle || !button) return; // Sécurité

        const imgLeft = title.querySelector('.img-left');
        const imgCentral = title.querySelector('.img-central');
        const imgRight = title.querySelector('.img-right');
        
        // Rendre les éléments visibles pour que l'animation se lance
        title.style.opacity = 1;
        subtitle.style.opacity = 1;
        button.style.opacity = 1;

        // Animer le Titre & le Sous-titre
        title.classList.add('animate__animated', 'animate__fadeIn');
        title.style.animationDuration = '3s';

        subtitle.classList.add('animate__animated', 'animate__fadeIn');
        subtitle.style.animationDuration = '3s';

        // Animer les Images dans le titre
        if (imgLeft) {
            imgLeft.classList.add('animate__animated', 'animate__bounceInDown');
            imgLeft.style.animationDuration = '4s'; // Durée de l'ancien CSS
        }
        if (imgCentral) {
            imgCentral.classList.add('animate__animated', 'animate__bounceInDown');
            imgCentral.style.animationDuration = '4s';
        }
        if (imgRight) {
            imgRight.classList.add('animate__animated', 'animate__bounceInDown');
            imgRight.style.animationDuration = '4s'; 
        }

        // Animer le Bouton (avec un délai pour qu'il arrive après le titre)
        button.classList.add('animate__animated', 'animate__fadeIn');
        button.style.animationDuration = '4s';
        button.style.animationDelay = '1s'; // Nouveau délai
    }


    // --- LA MODIFICATION PRINCIPALE EST ICI ---
    
    // 1. On vérifie si la vidéo a DÉJÀ été jouée dans cette session
    if (sessionStorage.getItem('introPlayed') === 'true') {
        
        // OUI, elle a été jouée : on cache l'overlay et on lance les animations
        if (videoOverlay) {
            videoOverlay.style.display = 'none'; // Cache immédiatement
            videoOverlay.remove(); // Supprime du DOM
        }
        body.classList.remove('video-active'); // Assure que le scroll est actif
        startHomepageAnimations(); // Lance les animations du titre

    } else {
        
        // NON, c'est la 1ère fois : on joue la vidéo
        
        // 1. Bloquer le scroll du body immédiatement
        body.classList.add('video-active');

        if (videoOverlay && introVideo) {
            
            // 2. Écouter l'événement 'ended' (fin de la vidéo)
            introVideo.addEventListener('ended', () => {
                videoOverlay.classList.add('hidden');
                body.classList.remove('video-active');
                startHomepageAnimations();
                
                // --- AJOUT CLÉ : On note que la vidéo a été jouée ---
                sessionStorage.setItem('introPlayed', 'true');
                
                setTimeout(() => {
                    videoOverlay.remove();
                }, 500);
            });

            // 3. Gérer les erreurs (si la vidéo ne charge pas)
            introVideo.addEventListener('error', () => {
                console.error("Erreur de chargement de la vidéo d'introduction.");
                videoOverlay.classList.add('hidden');
                body.classList.remove('video-active');
                startHomepageAnimations();
                
                // --- AJOUT CLÉ : On note aussi, pour ne pas re-tenter ---
                sessionStorage.setItem('introPlayed', 'true');

                setTimeout(() => {
                    videoOverlay.remove();
                }, 500);
            });

            // 4. Essayer de lancer la vidéo (sécurité pour certains navigateurs)
            introVideo.play().catch(error => {
                console.warn("L'autoplay a été bloqué par le navigateur.", error);
                videoOverlay.classList.add('hidden');
                body.classList.remove('video-active');
                startHomepageAnimations();

                // --- AJOUT CLÉ : On note aussi en cas de blocage ---
                sessionStorage.setItem('introPlayed', 'true');

                 setTimeout(() => {
                    videoOverlay.remove();
                }, 500);
            });

        } else {
            // S'il n'y a pas d'overlay (cas d'erreur de base)
            body.classList.remove('video-active');
            startHomepageAnimations();
            sessionStorage.setItem('introPlayed', 'true'); // Sécurité
        }
    }
    // --- FIN : LOGIQUE DE L'INTRO VIDÉO ---


    const sideHeader = document.querySelector('.side-header');
    const sideHeaderUl = document.querySelector('.side-header ul'); 

    const navLinks = document.querySelectorAll(".side-header ul li a");
    const sectionIds = Array.from(navLinks).map(link => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
            return href.substring(1); 
        }
        return null;
    }).filter(id => id !== null);
    
    const sections = sectionIds.map(id => document.getElementById(id)).filter(el => el !== null);
    
    const contexteSection = document.querySelector('#contexte');

    const evolutionSectionNode = document.getElementById('evolution');
    const evolutionTitleHighlight = document.querySelector('#evolution h2 .highlight');
    const evolutionRoiElement = document.querySelector('#evolution .roi');
    const countries = document.querySelectorAll('.country');
    const leagueLogos = document.querySelectorAll('.league-logo');
    const defaultBgColor = '#0f0f0f'; 
    let isBackgroundChanged = false;
    let evolutionChartInstance = null;
    let leagueDataCache = null;

    let currentActiveSection = "";

    function handleScroll() {
        const viewportHeight = window.innerHeight;
        const activeLinkPoint = viewportHeight * 0.4; 

        if (contexteSection) {
            const contexteTop = contexteSection.getBoundingClientRect().top;
            const isVisible = contexteTop < viewportHeight * 0.8;
            sideHeader.classList.toggle('visible', isVisible);

            if (!isVisible && sideHeaderUl) {
                sideHeaderUl.style.setProperty('--scroll-progress', '0%');
            }
        }

        let newActiveSectionId = "";
        
        for (let i = sections.length - 1; i >= 0; i--) {
            const section = sections[i];
            if (section) {

                const rect = section.getBoundingClientRect();
  
                if (rect.top <= activeLinkPoint) {
                    newActiveSectionId = section.getAttribute("id");
                    break; 
                }
            }
        }

        if (newActiveSectionId !== currentActiveSection) {
            currentActiveSection = newActiveSectionId;
            
            const activeIndex = Array.from(navLinks).findIndex(link => link.getAttribute("href") === `#${currentActiveSection}`);
            
            let progressPercent = 0;
            if (activeIndex > -1 && navLinks.length > 1) {
                progressPercent = (activeIndex / (navLinks.length - 1)) * 100;
            }
            
            if (sideHeaderUl) {
                sideHeaderUl.style.setProperty('--scroll-progress', `${progressPercent}%`);
            }

            navLinks.forEach((link, index) => {
                const isActive = (index === activeIndex);
                const isPast = (index < activeIndex); 

                link.classList.toggle("active", isActive);
                link.classList.toggle("is-past", isPast); 
            });
        }

        // *** MODIFICATION *** : Changement de 'isBackgroundChanged'
        // On vérifie si la couleur du header a été changée (via une variable)
        const isHeaderColored = sideHeaderUl && sideHeaderUl.style.getPropertyValue('--header-bg-bar-color');

        if (isHeaderColored && evolutionSectionNode) { // Vérifie 'isHeaderColored' au lieu de 'isBackgroundChanged'
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
                if (data.info && data.info.trim() !== "") {
                    displayArea.innerHTML = `
                        <a href="${data.info}" target="_blank" rel="noopener noreferrer" title="Cliquer pour plus d'infos">
                            <img src="${data.LIEN}" alt="Transfert de ${data.NOM}">
                        </a>
                        <p class="transfer-description">${data.TEXTE}</p>
                    `;
                } else {
                    displayArea.innerHTML = `
                        <img src="${data.LIEN}" alt="Transfert de ${data.NOM}">
                        <p class="transfer-description">${data.TEXTE}</p>
                    `;
                }
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
                        y: { beginAtZero: true, ticks: { color: '#AAAAAA', callback: value => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', notation: 'compact' }).format(value) }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
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
            fetch('transfert_individuels.json')
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
            evolutionChartInstance.update();
        }
        
        // *** DÉBUT MODIFICATION ***
        // Réinitialise les couleurs du header en supprimant les variables
        if (sideHeaderUl) {
            sideHeaderUl.style.removeProperty('--header-bg-bar-color');
            sideHeaderUl.style.removeProperty('--header-progress-bar-color');
            sideHeaderUl.style.removeProperty('--header-pill-active-color');
            sideHeaderUl.style.removeProperty('--header-pill-inactive-color');
        }
        // *** FIN MODIFICATION ***
        
        isBackgroundChanged = false; // Gardé pour la logique du body, mais le scroll utilise sa propre logique
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

        // ==================================================================
        // DÉBUT DE LA MODIFICATION
        // ==================================================================
        countries.forEach(country => {
            country.addEventListener('click', function () {
                const leagueId = this.dataset.league;
                const selectedData = leagueDataCache[leagueId];

                // NOUVEAU : Lire les 4 couleurs personnalisées depuis les attributs data
                const headerBgBar = this.dataset.headerBgBar;
                const headerProgressBar = this.dataset.headerProgressBar;
                const headerPillActive = this.dataset.headerPillActive;
                const headerPillInactive = this.dataset.headerPillInactive;

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
                    
                    // *** DÉBUT MODIFICATION (MISE À JOUR) ***
                    // Applique les couleurs personnalisées au header
                    if (sideHeaderUl) {
                        
                        // Applique chaque couleur.
                        // Utilise la couleur du data-attribut si elle existe,
                        // sinon, utilise une couleur dérivée du graphique (selectedData.borderColor) comme avant.
                        
                        sideHeaderUl.style.setProperty(
                            '--header-bg-bar-color', 
                            headerBgBar || hexToRgba(selectedData.borderColor, 0.3)
                        );
                        sideHeaderUl.style.setProperty(
                            '--header-progress-bar-color', 
                            headerProgressBar || selectedData.borderColor
                        );
                        sideHeaderUl.style.setProperty(
                            '--header-pill-active-color', 
                            headerPillActive || selectedData.borderColor
                        );
                        sideHeaderUl.style.setProperty(
                            '--header-pill-inactive-color', 
                            headerPillInactive || hexToRgba(selectedData.borderColor, 0.5)
                        );
                    }
                    // *** FIN MODIFICATION ***
                    
                    isBackgroundChanged = true;
                }
            });
        });
        // ==================================================================
        // FIN DE LA MODIFICATION
        // ==================================================================

        leagueLogos.forEach(logo => {
            logo.addEventListener('click', function() {
                const leagueId = this.dataset.league;
                const correspondingCountry = document.querySelector(`.country[data-league="${leagueId}"]`);
                if (correspondingCountry) {
                    correspondingCountry.click(); 
                }
            });
        });
    }

    initIndividualChart();
    initEvolutionChart();
    window.addEventListener('scroll', handleScroll);


    const lightbox = document.createElement('div');
    lightbox.id = 'lightbox';
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
        <span class="lightbox-close">&times;</span>
        <img src="" alt="Image agrandie" class="lightbox-content">
    `;
    document.body.appendChild(lightbox);

    const lightboxImg = lightbox.querySelector('.lightbox-content');
    const lightboxClose = lightbox.querySelector('.lightbox-close');
    const timelineImages = document.querySelectorAll('.timeline-event img');


    const openLightbox = (imgSrc) => {
        lightboxImg.setAttribute('src', imgSrc);
        lightbox.classList.add('visible');
    };

    
    const closeLightbox = () => {
        lightbox.classList.remove('visible');
    };

    timelineImages.forEach(img => {
        img.addEventListener('click', (e) => {
            const imgSrc = img.getAttribute('src');
            openLightbox(imgSrc);
        });
    });

    
    lightboxClose.addEventListener('click', (e) => {
        e.stopPropagation();
        closeLightbox();
    });

    lightbox.addEventListener('click', () => {
        closeLightbox();
    });

    lightboxImg.addEventListener('click', (e) => {
        e.stopPropagation();
    });

});