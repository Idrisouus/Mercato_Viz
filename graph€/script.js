document.addEventListener('DOMContentLoaded', async () => {

    // AJOUT : Une fonction "helper" pour convertir une couleur HEX en RGBA
    // Cela nous permettra de gérer la transparence du dégradé.
    function hexToRgba(hex, alpha) {
        let r = 0, g = 0, b = 0;
        // Gère les couleurs hexadécimales à 3 chiffres (ex: #F00)
        if (hex.length === 4) {
            r = "0x" + hex[1] + hex[1];
            g = "0x" + hex[2] + hex[2];
            b = "0x" + hex[3] + hex[3];
        // Gère les couleurs hexadécimales à 6 chiffres (ex: #FF0000)
        } else if (hex.length === 7) {
            r = "0x" + hex[1] + hex[2];
            g = "0x" + hex[3] + hex[4];
            b = "0x" + hex[5] + hex[6];
        }
        return `rgba(${+r},${+g},${+b},${alpha})`;
    }

    // --- FONCTION POUR CHARGER ET PRÉPARER LES DONNÉES DEPUIS LE JSON ---
    async function chargerEtPreparerDonnees() {
        // ... (cette fonction ne change pas)
        try {
            const reponse = await fetch('transfert_championnats.json');
            if (!reponse.ok) {
                throw new Error(`Erreur HTTP: ${reponse.status}`);
            }
            const donneesBrutes = await reponse.json();
            const leagueData = {};
            const labels = Object.keys(donneesBrutes[0])
                .filter(key => key.includes('/'))
                .map(annee => annee.trim());

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
                        const montantString = championnat[cleOriginale] || "0";
                        const montantNumerique = parseFloat(montantString.replace(/[\s€,]/g, ''));
                        return montantNumerique / 1000000;
                    });
                    const elementHTML = document.querySelector(`.country[data-league="${leagueId}"]`);
                    const couleurLigne = elementHTML ? elementHTML.dataset.lineColor : '#EFEFEF';
                    leagueData[leagueId] = {
                        label: championnat.CHAMPIONNAT.trim(),
                        data: dataPoints,
                        borderColor: couleurLigne,
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

    // --- INITIALISATION DU GRAPHIQUE ET DES ÉVÉNEMENTS ---
    const donneesTraitees = await chargerEtPreparerDonnees();
    if (!donneesTraitees) return;

    const { leagueData, labels } = donneesTraitees;

    const ctx = document.getElementById('evolutionChart').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sélectionnez un pays',
                data: [],
                borderColor: '#555',
                borderWidth: 3,
                tension: 0.4,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#fff',
                fill: false // Important : false par défaut
            }]
        },
        options: {
            // ... (les options ne changent pas)
            responsive: true,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => ` ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(context.parsed.y * 1000000)}` } } },
            scales: {
                y: { beginAtZero: true, ticks: { color: 'rgba(255, 255, 255, 0.7)', callback: (value) => `${value} M€` }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
                x: { ticks: { color: 'rgba(255, 255, 255, 0.7)' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
            }
        }
    });

    const countries = document.querySelectorAll('.country');
    const body = document.body;
    const highlightSpan = document.querySelector('header .highlight');
    const leagueLogos = document.querySelectorAll('.league-logo');

    countries.forEach(country => {
        country.addEventListener('click', function () {
            const leagueId = this.dataset.league;
            const selectedData = leagueData[leagueId];

            if (selectedData) {
                countries.forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                
                body.style.backgroundColor = selectedData.bgColor; 
                
                highlightSpan.style.color = selectedData.borderColor; 

                const activeLogo = document.querySelector(`.league-logo[data-league="${leagueId}"]`);
                leagueLogos.forEach(logo => logo.classList.remove('active'));
                if (activeLogo) {
                    activeLogo.classList.add('active');
                }
                
                // --- AJOUT : LOGIQUE POUR CRÉER ET APPLIQUER LE DÉGRADÉ ---
                
                // 1. On crée le dégradé vertical sur la zone du graphique
                const gradient = ctx.createLinearGradient(0, chart.chartArea.top, 0, chart.chartArea.bottom);
                
                // 2. On définit les couleurs du dégradé
                // Il part d'une version semi-transparente de la couleur de la ligne...
                gradient.addColorStop(0, hexToRgba(selectedData.borderColor, 0.6)); 
                // ...pour aller vers une version totalement transparente en bas.
                gradient.addColorStop(1, hexToRgba(selectedData.borderColor, 0));

                // 3. On applique les modifications au dataset du graphique
                chart.data.datasets[0].label = selectedData.label;
                chart.data.datasets[0].data = selectedData.data;
                chart.data.datasets[0].borderColor = selectedData.borderColor;
                chart.data.datasets[0].backgroundColor = gradient; // On applique notre dégradé
                chart.data.datasets[0].fill = true; // On active le remplissage

                chart.update(); // On met à jour le graphique pour afficher le résultat
            }
        });
    });
});