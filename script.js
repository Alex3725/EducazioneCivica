
const anta = document.getElementById('anta');
const maniglia = document.getElementById('maniglia');
const graficoContainer = document.getElementById('graficoContainer');
const chiudiGrafico = document.getElementById('chiudiGrafico');
let aperto = false;
let grafico = null;

// Funzione di consumo: f(x) = 0,90 + 0,006x + 0,00012x² − 0,000001x³
function calcolaConsumo(x) {
    return 0.90 + 0.006 * x + 0.00012 * Math.pow(x, 2) - 0.000001 * Math.pow(x, 3);
}

// Genera dati per il grafico
function generaDatiGrafico() {
    const dati = [];
    const labels = [];
    // Determina l'incremento in base alla larghezza dello schermo
    let incremento = 3;
    if (window.innerWidth <= 480) {
        incremento = 9; // Smartphone
    } else if (window.innerWidth <= 768) {
        incremento = 6; // Tablet
    }

    for (let x = 0; x <= 90; x += incremento) {
        labels.push(x);
        dati.push(calcolaConsumo(x));
    }
    return { labels, dati };
}

// Crea il grafico
function creaGrafico() {
    const ctx = document.getElementById('graficoConsumo').getContext('2d');
    const { labels, dati } = generaDatiGrafico();

    if (grafico) {
        grafico.destroy();
    }

    grafico = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Consumo energetico (kWh/giorno)',
                data: dati,
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `Consumo: ${context.parsed.y.toFixed(3)} kWh/giorno`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Minuti totali di porta aperta al giorno',
                        font: { size: 14, weight: 'bold' }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Consumo Energetico (kWh/giorno)',
                        font: { size: 14, weight: 'bold' }
                    },
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            }
        }
    });
}

function toggleFrigo() {
    aperto = !aperto;
    if (aperto) {
        anta.classList.add('aperta');
        setTimeout(() => {
            graficoContainer.classList.add('visibile');
            creaGrafico();
        }, 400);
    } else {
        anta.classList.remove('aperta');
        graficoContainer.classList.remove('visibile');
    }
}

anta.addEventListener('click', toggleFrigo);
maniglia.addEventListener('click', function () {
    toggleFrigo();
});

chiudiGrafico.addEventListener('click', function () {
    aperto = false;
    anta.classList.remove('aperta');
    graficoContainer.classList.remove('visibile');
});
