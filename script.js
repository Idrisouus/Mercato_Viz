document.addEventListener('DOMContentLoaded', () => {

    // --- DÉBUT : LOGIQUE DE L'INTRO VIDÉO ---
    const videoOverlay = document.getElementById('video-overlay');
    const introVideo = document.getElementById('introVideo');
    const body = document.body;
    const skipButton = document.getElementById('skip-intro-btn'); 

    // Je définis ici la fonction qui lance les animations de la page d'accueil
    function startHomepageAnimations() {
        const title = document.getElementById('main-title');
        const subtitle = document.getElementById('main-subtitle');
        const button = document.getElementById('main-button');

        if (!title || !subtitle || !button) return; 

        const imgLeft = title.querySelector('.img-left');
        const imgCentral = title.querySelector('.img-central');
        const imgRight = title.querySelector('.img-right');
        
        // Je rends les éléments visibles avant de les animer
        title.style.opacity = 1;
        subtitle.style.opacity = 1;
        button.style.opacity = 1;

        // J'ajoute les classes d'animation (animate.css)
        title.classList.add('animate__animated', 'animate__fadeIn');
        title.style.animationDuration = '3s';

        subtitle.classList.add('animate__animated', 'animate__fadeIn');
        subtitle.style.animationDuration = '3s';

        if (imgLeft) {
            imgLeft.classList.add('animate__animated', 'animate__bounceInDown');
            imgLeft.style.animationDuration = '4s'; 
        }
        if (imgCentral) {
            imgCentral.classList.add('animate__animated', 'animate__bounceInDown');
            imgCentral.style.animationDuration = '4s';
        }
        if (imgRight) {
            imgRight.classList.add('animate__animated', 'animate__bounceInDown');
            imgRight.style.animationDuration = '4s'; 
        }

        button.classList.add('animate__animated', 'animate__fadeIn');
        button.style.animationDuration = '4s';
        button.style.animationDelay = '1s'; 
    }

    // C'est ma fonction centrale pour gérer la fin ou le "skip" de la vidéo
    function skipOrEndVideo() {
        if (!videoOverlay) return; 

        if (skipButton) skipButton.disabled = true; 
        
        videoOverlay.classList.add('hidden');
        body.classList.remove('video-active');
        startHomepageAnimations(); // Je lance les animations de la page
        
        // Je stocke dans la session que la vidéo a été vue pour ne pas la rejouer
        sessionStorage.setItem('introPlayed', 'true');
        
        if (introVideo) {
            introVideo.pause();
            introVideo.muted = true;
        }

        // Je supprime l'overlay vidéo du DOM après une petite transition
        setTimeout(() => {
            if (videoOverlay) videoOverlay.remove();
        }, 500); 
    }


    // --- LA MODIFICATION PRINCIPALE EST ICI ---
    
    // 1. Je vérifie si la vidéo a DÉJÀ été jouée dans cette session
    if (sessionStorage.getItem('introPlayed') === 'true') {
        
        // OUI : Je cache tout et je lance les animations directement
        if (videoOverlay) {
            videoOverlay.style.display = 'none'; 
            videoOverlay.remove(); 
        }
        body.classList.remove('video-active'); 
        startHomepageAnimations(); 

    } else {
        
        // NON (1ère fois) : Je joue la vidéo
        
        // 1. Je bloque le scroll du body
        body.classList.add('video-active');

        if (videoOverlay && introVideo) {
            
            // 2. J'écoute l'événement de fin de vidéo
            introVideo.addEventListener('ended', skipOrEndVideo); 

            // 3. Je gère les erreurs (si la vidéo ne charge pas)
            introVideo.addEventListener('error', () => { 
                console.error("Erreur de chargement de la vidéo d'introduction.");
                skipOrEndVideo();
            });

            // 4. J'écoute le clic sur le bouton "skip"
            if (skipButton) {
                skipButton.addEventListener('click', skipOrEndVideo);
            }

            // 5. J'essaie de lancer la vidéo
            introVideo.play().catch(error => { 
                // Si l'autoplay est bloqué, je "skip" directement
                console.warn("L'autoplay a été bloqué par le navigateur.", error);
                skipOrEndVideo();
            });

        } else {
            // Sécurité s'il manque des éléments
            body.classList.remove('video-active');
            startHomepageAnimations();
            sessionStorage.setItem('introPlayed', 'true'); 
        }
    }
    // --- FIN : LOGIQUE DE L'INTRO VIDÉO ---


    const sideHeader = document.querySelector('.side-header');
    const sideHeaderUl = document.querySelector('.side-header ul'); 

    const navLinks = document.querySelectorAll(".side-header ul li a");
    // Je récupère tous les IDs des sections ciblées par ma navigation
    const sectionIds = Array.from(navLinks).map(link => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
            return href.substring(1); 
        }
        return null;
    }).filter(id => id !== null);
    
    // Je récupère les éléments DOM de ces sections
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

    // C'est ma fonction principale qui s'active à chaque scroll
    function handleScroll() {
        const viewportHeight = window.innerHeight;
        const activeLinkPoint = viewportHeight * 0.4; // Le point de "déclenchement"

        if (contexteSection) {
            // Je vérifie si la section "contexte" est visible pour afficher/cacher le menu latéral
            const contexteTop = contexteSection.getBoundingClientRect().top;
            const isVisible = contexteTop < viewportHeight * 0.8;
            sideHeader.classList.toggle('visible', isVisible);

            if (!isVisible && sideHeaderUl) {
                sideHeaderUl.style.setProperty('--scroll-progress', '0%');
            }
        }

        let newActiveSectionId = "";
        
        // Je boucle sur mes sections (en partant de la fin) pour trouver celle qui est active
        for (let i = sections.length - 1; i >= 0; i--) {
            const section = sections[i];
            if (section) {

                const rect = section.getBoundingClientRect();
  
                // Si le haut de la section dépasse mon point de déclenchement
                if (rect.top <= activeLinkPoint) {
                    newActiveSectionId = section.getAttribute("id");
                    break; 
                }
            }
        }

        // Si la section active a changé, je mets à jour l'état
        if (newActiveSectionId !== currentActiveSection) {
            currentActiveSection = newActiveSectionId;
            
            const activeIndex = Array.from(navLinks).findIndex(link => link.getAttribute("href") === `#${currentActiveSection}`);
            
            let progressPercent = 0;
            if (activeIndex > -1 && navLinks.length > 1) {
                progressPercent = (activeIndex / (navLinks.length - 1)) * 100;
            }
            
            // Je mets à jour la barre de progression dans le menu latéral
            if (sideHeaderUl) {
                sideHeaderUl.style.setProperty('--scroll-progress', `${progressPercent}%`);
            }

            // Je mets à jour les classes "active" et "is-past" sur les liens
            navLinks.forEach((link, index) => {
                const isActive = (index === activeIndex);
                const isPast = (index < activeIndex); 

                link.classList.toggle("active", isActive);
                link.classList.toggle("is-past", isPast); 
            });
        }

        // Je vérifie si le header a une couleur personnalisée
        const isHeaderColored = sideHeaderUl && sideHeaderUl.style.getPropertyValue('--header-bg-bar-color');

        // Si je suis sorti de la section "évolution" et que le fond était coloré...
        if (isHeaderColored && evolutionSectionNode) { 
            const rect = evolutionSectionNode.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top > viewportHeight) {
                // ... je réinitialise les styles
                resetEvolutionChartStyle();
            }
        }
    }

    // J'initialise le slider Swiper pour la section des records
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
            
            // Cette fonction met à jour la zone d'affichage quand je clique sur un point
            const updateDisplayContent = (data) => {
                // 1. Je mets d'abord en place un état de chargement (loader)
                displayArea.innerHTML = `
                    <div class="loader-container">
                        <div class="loader"></div>
                    </div>
                    <p class="transfer-description">${data.TEXTE}</p>
                `;
    
                const loaderContainer = displayArea.querySelector('.loader-container');
                if (!loaderContainer) return; 
    
                let finalImageHtml = '';
                if (data.info && data.info.trim() !== "") {
                    finalImageHtml = `
                        <a href="${data.info}" target="_blank" rel="noopener noreferrer" title="Cliquer pour plus d'infos">
                            <img src="${data.LIEN}" alt="Transfert de ${data.NOM}">
                        </a>
                    `;
                } else {
                    finalImageHtml = `
                        <img src="${data.LIEN}" alt="Transfert de ${data.NOM}">
                    `;
                }
    
                // 3. Je crée une image en mémoire pour la précharger
                const img = new Image();
                
                img.onload = () => {
                    // 4. Une fois l'image chargée, je remplace le loader par l'image finale
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = finalImageHtml;
                    
                    const finalNode = tempDiv.children[0]; 

                    if (finalNode && loaderContainer.parentNode) {
                        loaderContainer.parentNode.replaceChild(finalNode, loaderContainer);
                    }
                };
    
                img.onerror = () => {
                    // 5. En cas d'erreur de chargement
                    loaderContainer.innerHTML = `
                        <p class="loader-error">Impossible de charger l'image.</p>
                    `;
                };
    
                // 6. Je lance le chargement de l'image
                img.src = data.LIEN;
            };

            const labels = transferData.map(item => item['ANNÉE'].split('/')[0]);
            const prices = transferData.map(item => parseFloat(item[' PRIX '].replace(/\s/g, '').replace('€', '').replace(/,/g, '')));
            const ctx = transferChartElement.getContext('2d');
            let selectedIndex = -1;

            // Ici, je crée le graphique (Chart.js) pour les transferts individuels
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
                    // Je définis ce qui se passe quand je clique sur un point du graphique
                    onClick: (event, elements) => {
                        if (elements.length > 0) {
                            const newIndex = elements[0].index; if (newIndex === selectedIndex) return; selectedIndex = newIndex;
                            const selectedData = transferData[selectedIndex]; 
                            // J'appelle ma fonction pour afficher les détails
                            updateDisplayContent(selectedData);
                            // J'augmente la taille du point sélectionné
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
            // Je charge les données depuis le fichier JSON
            fetch('transfert_individuels.json')
                .then(response => { if (!response.ok) { throw new Error(`Erreur HTTP ! Statut : ${response.status}`); } return response.json(); })
                .then(data => { initChart(data); })
                .catch(error => {
                    console.error("Impossible de charger le fichier de données des transferts :", error);
                    document.getElementById('display-area').innerHTML = "<p>Erreur lors du chargement des données.</p>";
                });
        };
        
        // J'utilise un IntersectionObserver pour ne charger le graphique que lorsqu'il devient visible
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    chartSectionContainer.classList.add('is-visible'); 
                    loadAndCreateChart(); // Je charge les données et crée le graphique
                    observer.unobserve(entry.target); // J'arrête d'observer
                }
            });
        }, { threshold: 0.1 });
        // Je commence à observer la section du graphique
        observer.observe(chartSectionContainer);
    }

    function hexToRgba(hex, alpha) {
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) { r = "0x" + hex[1] + hex[1]; g = "0x" + hex[2] + hex[2]; b = "0x" + hex[3] + hex[3]; } 
        else if (hex.length === 7) { r = "0x" + hex[1] + hex[2]; g = "0x" + hex[3] + hex[4]; b = "0x" + hex[5] + hex[6]; }
        return `rgba(${+r},${+g},${+b},${alpha})`;
    }

    // Fonction pour tout réinitialiser (couleurs, données du graphique, etc.)
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
        
        // Je supprime les variables CSS pour que le header retrouve sa couleur d'origine
        if (sideHeaderUl) {
            sideHeaderUl.style.removeProperty('--header-bg-bar-color');
            sideHeaderUl.style.removeProperty('--header-progress-bar-color');
            sideHeaderUl.style.removeProperty('--header-pill-active-color');
            sideHeaderUl.style.removeProperty('--header-pill-inactive-color');
        }
        
        isBackgroundChanged = false; 
    }

    // Je charge et je prépare les données pour le graphique des championnats
    async function chargerEtPreparerDonnees() {
        try {
            // Je charge le JSON (fonction asynchrone)
            const reponse = await fetch('transfert_championnats.json');
            if (!reponse.ok) throw new Error(`Erreur HTTP: ${reponse.status}`);
            const donneesBrutes = await reponse.json();
            const leagueData = {};
            const labels = Object.keys(donneesBrutes[0]).filter(key => key.includes('/')).map(annee => annee.trim());
            
            // Je formate les données
            donneesBrutes.forEach(championnat => {
                const nomChampionnat = championnat.CHAMPIONNAT.trim().toLowerCase();
                let leagueId = '';
                if (nomChampionnat.includes('premier league')) leagueId = 'premier';
                else if (nomChampionnat.includes('ligue 1')) leagueId = 'ligue1';
                else if (nomChampionnat.includes('liga')) leagueId = 'liga';
                else if (nomChampionnat.includes('bundes')) leagueId = 'bundes';
                else if (nomChampionnat.includes('serie a')) leagueId = 'seriea';
                
                // --- DÉBUT DE LA MODIFICATION 1 ---
                if (leagueId) {
                    const dataPoints = labels.map(label => {
                        const cleOriginale = Object.keys(championnat).find(k => k.trim() === label);
                        const montantNumerique = parseFloat((championnat[cleOriginale] || "0").replace(/[\s€,]/g, ''));
                        return montantNumerique / 1000000;
                    });
                    const elementHTML = document.querySelector(`.country[data-league="${leagueId}"]`);
                    
                    // Je récupère le style "calculé" de l'élément pour lire les variables CSS
                    const elementStyle = elementHTML ? window.getComputedStyle(elementHTML) : null;
                    
                    leagueData[leagueId] = {
                        label: championnat.CHAMPIONNAT.trim(),
                        data: dataPoints,
                        // Je lis la variable CSS '--line-color' (en enlevant les espaces)
                        borderColor: elementStyle ? elementStyle.getPropertyValue('--line-color').trim() : '#EFEFEF',
                        // Je lis la variable CSS '--bg-color'
                        bgColor: elementStyle ? elementStyle.getPropertyValue('--bg-color').trim() : '#212121'
                    };
                }
                // --- FIN DE LA MODIFICATION 1 ---
            });
            // Je retourne les données formatées
            return { leagueData, labels };
        } catch (erreur) {
            console.error("Impossible de charger ou traiter les données:", erreur);
            return null;
        }
    }

    async function initEvolutionChart() {
        const donneesTraitees = await chargerEtPreparerDonnees();
        if (!donneesTraitees) return;

        // Je stocke les données formatées dans un cache pour y accéder facilement
        leagueDataCache = donneesTraitees.leagueData;
        const labels = donneesTraitees.labels;
        
        const evolutionChartElement = document.getElementById('evolutionChart');
        if (!evolutionChartElement) return;

        const ctx = evolutionChartElement.getContext('2d');
        // J'initialise le deuxième graphique (Chart.js)
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
                                // Je formate les labels de l'axe Y (M€ ou Md€)
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
        // J'ajoute un écouteur de clic sur chaque "pays" (les boutons)
        // ==================================================================
        countries.forEach(country => {
            country.addEventListener('click', function () {
                // Je récupère l'ID du championnat depuis l'attribut data
                const leagueId = this.dataset.league;
                const selectedData = leagueDataCache[leagueId];

                // --- DÉBUT DE LA MODIFICATION 2 ---
                // Je lis les 4 couleurs personnalisées depuis les variables CSS de l'élément cliqué
                const style = window.getComputedStyle(this);
                const headerBgBar = style.getPropertyValue('--header-bg-bar').trim();
                const headerProgressBar = style.getPropertyValue('--header-progress-bar').trim();
                const headerPillActive = style.getPropertyValue('--header-pill-active').trim();
                const headerPillInactive = style.getPropertyValue('--header-pill-inactive').trim();
                // --- FIN DE LA MODIFICATION 2 ---

                // Si je clique sur le pays déjà actif, je réinitialise tout
                if (this.classList.contains('active')) {
                    resetEvolutionChartStyle();
                    return;
                }

                if (selectedData) {
                    countries.forEach(c => c.classList.remove('active'));
                    this.classList.add('active');

                    // Je change la couleur de fond du body
                    document.body.style.backgroundColor = selectedData.bgColor;

                    if (evolutionTitleHighlight) evolutionTitleHighlight.style.color = selectedData.borderColor;
                    if (evolutionRoiElement) evolutionRoiElement.style.color = selectedData.borderColor;

                    const activeLogo = document.querySelector(`.league-logo[data-league="${leagueId}"]`);
                    leagueLogos.forEach(logo => logo.classList.remove('active'));
                    if (activeLogo) activeLogo.classList.add('active');
                    
                    const gradient = ctx.createLinearGradient(0, evolutionChartInstance.chartArea.top, 0, evolutionChartInstance.chartArea.bottom);
                    gradient.addColorStop(0, hexToRgba(selectedData.borderColor, 0.6));
                    gradient.addColorStop(1, hexToRgba(selectedData.borderColor, 0));

                    // Je mets à jour le graphique avec les données du pays sélectionné
                    evolutionChartInstance.data.datasets[0].label = selectedData.label;
                    evolutionChartInstance.data.datasets[0].data = selectedData.data;
                    evolutionChartInstance.data.datasets[0].borderColor = selectedData.borderColor;
                    evolutionChartInstance.data.datasets[0].backgroundColor = gradient;
                    evolutionChartInstance.data.datasets[0].fill = true;
                    evolutionChartInstance.update();
                    
                    // J'applique les nouvelles couleurs (variables CSS) au menu latéral
                    if (sideHeaderUl) {
                        
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
                    
                    isBackgroundChanged = true;
                }
            });
        });

        // Je fais en sorte que cliquer sur les logos active aussi le pays correspondant
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

    // J'appelle mes fonctions d'initialisation
    initIndividualChart();
    initEvolutionChart();
    window.addEventListener('scroll', handleScroll); // J'attache ma fonction de scroll


    // --- LOGIQUE DE LA LIGHTBOX (POP-UP D'IMAGE) ---
    
    // Je crée dynamiquement la structure HTML de ma lightbox
    const lightbox = document.createElement('div');
    lightbox.id = 'lightbox';
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
        <span class="lightbox-close">&times;</span>
        <img src="" alt="Image agrandie" class="lightbox-content">
    `;
    // Je l'ajoute au body
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

    // Je boucle sur toutes les images de la timeline pour leur ajouter un clic
    timelineImages.forEach(img => {
        img.addEventListener('click', (e) => {
            const imgSrc = img.getAttribute('src');
            openLightbox(imgSrc);
        });
    });

    
    // J'ajoute les événements pour fermer la lightbox
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

// --- LOGIQUE DES COMPTEURS (GSAP) ---
gsap.registerPlugin(ScrollTrigger);

// Note : ce DOMContentLoaded est redondant car tout est déjà dans le premier.
// Mais je le garde tel quel.
document.addEventListener('DOMContentLoaded', function() {

    const declencheur = document.querySelector('#top3');
    const counter = document.querySelectorAll('.compteur');
    const valeurs = [400000000, 369220000, 247000000];


    // Je boucle sur mes 3 éléments "compteur"
    counter.forEach((counter, index) => {


    const obj = { valeur: 0};

    const valeursfinale = valeurs[index];

    // J'utilise GSAP pour animer un objet "valeur" de 0 au montant final
    gsap.to(obj, {

        valeur: valeursfinale,
        duration: 6,
        ease: "power1.in",

        // À chaque "tick" de l'animation, je mets à jour le texte du compteur
        onUpdate: function() {
            counter.textContent = Math.floor(obj.valeur).toLocaleString('fr-FR') + ' €';
        },

        // J'utilise ScrollTrigger pour que l'animation se lance uniquement quand j'arrive à la section #top3
        scrollTrigger: {
            trigger: declencheur,
            start: 'center',
            toggleActions: 'play none none none',
        },

    });

});

});