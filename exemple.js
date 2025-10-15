const sideHeader = document.querySelector('.side-header');
const contexteSection = document.querySelector('#contexte');
const recordsSection = document.querySelector('#records');
const depenseSection = document.querySelector('#depenses');

window.addEventListener('scroll', () => {
    const contexteRect = contexteSection.getBoundingClientRect();
    const recordsRect = recordsSection.getBoundingClientRect();
    const depenseRect = depenseSection.getBoundingClientRect();

    if ((contexteRect.top <= window.innerHeight * 0.5 && contexteRect.bottom > 0) ||
        (recordsRect.top <= window.innerHeight && recordsRect.bottom > 0) ||
        (depenseRect.top <= window.innerHeight && depenseRect.bottom > 0)) {
        sideHeader.classList.add('visible');
    } else {
        sideHeader.classList.remove('visible');
    }
});

const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".side-header ul li a");

window.addEventListener("scroll", () => {
    let current = "";
    sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.4 && rect.bottom > window.innerHeight * 0.4) {
            current = section.getAttribute("id");
        }
    });
    navLinks.forEach(link => {
        link.classList.remove("active");
        if (link.getAttribute("href") === `#${current}`) {
            link.classList.add("active");
        }
    });
});

const recordsSwiper = new Swiper('.records-swiper', {
    direction: 'vertical',
    loop: true,
    slidesPerView: 1.6,
    centeredSlides: true,
    spaceBetween: 20,
    initialSlide: 1,
    autoplay: {
        delay: 2500,
        disableOnInteraction: false,
    },
    speed: 2500,
    scrollbar: {
        el: '.swiper-scrollbar',
        draggable: true,
    },
});

document.addEventListener('DOMContentLoaded', () => {
    const transferChartElement = document.getElementById('transferChart');
    const chartSectionContainer = document.querySelector('.chart-section-container');

    if (transferChartElement && chartSectionContainer) {

        const initChart = (transferData) => {
            const displayArea = document.getElementById('display-area');

            const showDefaultMessage = () => {
                displayArea.innerHTML = '<p>Cliquez sur un point du graphique pour voir le détail du transfert.</p>';
            };

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
                        label: 'Montant du Transfert',
                        data: prices,
                        borderColor: '#EDD60A',
                        backgroundColor: 'rgba(237, 214, 10, 0.19)',
                        pointBackgroundColor: '#FFFFFF',
                        pointBorderColor: '#FFFFFF',
                        pointHoverBackgroundColor: '#EDD60A',
                        pointHoverBorderColor: '#EDD60A',
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: context => `Montant : ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(context.parsed.y)}`
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            ticks: {
                                color: '#AAAAAA',
                                callback: value => new Intl.NumberFormat('fr-FR', {
                                    style: 'currency',
                                    currency: 'EUR',
                                    notation: 'compact'
                                }).format(value)
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        },
                        x: {
                            ticks: {
                                color: '#AAAAAA'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        }
                    },
                    onClick: (event, elements) => {
                        if (elements.length > 0) {
                            const newIndex = elements[0].index;
                            if (newIndex === selectedIndex) return;
                            selectedIndex = newIndex;
                            const selectedData = transferData[selectedIndex];
                            updateDisplayContent(selectedData);
                            const pointRadii = transferData.map((_, index) => index === selectedIndex ? 10 : 6);
                            const pointHoverRadii = transferData.map((_, index) => index === selectedIndex ? 12 : 8);
                            transferChart.data.datasets[0].pointRadius = pointRadii;
                            transferChart.data.datasets[0].pointHoverRadius = pointHoverRadii;
                            transferChart.update();
                        }
                    }
                }
            });

            showDefaultMessage();
        };

        const loadAndCreateChart = () => {
            fetch('transfert_invidividuels.json')
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Erreur HTTP ! Statut : ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    initChart(data);
                })
                .catch(error => {
                    console.error("Impossible de charger le fichier de données des transferts :", error);
                    const displayArea = document.getElementById('display-area');
                    displayArea.innerHTML = "<p>Erreur lors du chargement des données.</p>";
                });
        };

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    chartSectionContainer.classList.add('is-visible');
                    loadAndCreateChart();
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1
        });

        observer.observe(chartSectionContainer);
    }
});