const anta = document.getElementById('anta');
const maniglia = document.getElementById('maniglia');
const graficoContainer = document.getElementById('graficoContainer');
const chiudiGrafico = document.getElementById('chiudiGrafico');
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
let aperto = false;
let grafico = null;
let graficoRealtime = null;
let cronometroAttivo = false;
let tempoInizio = 0;
let tempoTotale = 0;
let intervalloTimer = null;
let datiRealtime = [];
let labelsRealtime = [];

// Funzione di consumo: f(x) = 0,90 + 0,006x + 0,00012x² − 0,000001x³
function calcolaConsumo(x) {
    return 0.90 + 0.006 * x + 0.00012 * Math.pow(x, 2) - 0.000001 * Math.pow(x, 3);
}

// Genera dati per il grafico teorico
function generaDatiGrafico() {
    const dati = [];
    const labels = [];
    let incremento = 3;
    if (window.innerWidth <= 480) {
        incremento = 9;
    } else if (window.innerWidth <= 768) {
        incremento = 6;
    }

    for (let x = 0; x <= 90; x += incremento) {
        labels.push(x);
        dati.push(calcolaConsumo(x));
    }
    return { labels, dati };
}

// Crea il grafico teorico
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

// Crea il grafico realtime
function creaGraficoRealtime() {
    const ctx = document.getElementById('graficoRealtime').getContext('2d');

    if (graficoRealtime) {
        graficoRealtime.destroy();
    }

    // Calcola il consumo massimo a 2 ore (120 minuti)
    const consumoMax = calcolaConsumo(120);

    graficoRealtime = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labelsRealtime,
            datasets: [{
                label: 'Consumo in tempo reale (kWh/giorno)',
                data: datiRealtime,
                borderColor: 'rgb(76, 175, 80)',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
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
            animation: {
                duration: 0
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `Consumo: ${context.parsed.y.toFixed(4)} kWh/giorno`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Tempo (secondi)',
                        font: { size: 14, weight: 'bold' }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    min: 0,
                    max: 7200
                },
                y: {
                    title: {
                        display: true,
                        text: 'Consumo Energetico (kWh/giorno)',
                        font: { size: 14, weight: 'bold' }
                    },
                    beginAtZero: false,
                    min: 0.85,
                    max: consumoMax + 0.05,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            }
        }
    });
}

// Aggiorna il grafico realtime
function aggiornaGraficoRealtime() {
    if (graficoRealtime) {
        graficoRealtime.data.labels = labelsRealtime;
        graficoRealtime.data.datasets[0].data = datiRealtime;
        graficoRealtime.update('none');
    }
}

// Funzioni per il cronometro
function avviaCronometro() {
    if (!cronometroAttivo) {
        cronometroAttivo = true;
        tempoInizio = Date.now() - (tempoTotale * 1000);
        intervalloTimer = setInterval(aggiornaCronometro, 100);
        document.getElementById('btnAvvia').textContent = 'Pausa';
        document.getElementById('btnAvvia').classList.add('pausa');
    } else {
        pausaCronometro();
    }
}

function pausaCronometro() {
    cronometroAttivo = false;
    clearInterval(intervalloTimer);
    document.getElementById('btnAvvia').textContent = 'Riprendi';
    document.getElementById('btnAvvia').classList.remove('pausa');
}

function resetCronometro() {
    cronometroAttivo = false;
    tempoTotale = 0;
    datiRealtime = [];
    labelsRealtime = [];
    clearInterval(intervalloTimer);
    aggiornaDisplay();
    aggiornaGraficoRealtime();
    document.getElementById('btnAvvia').textContent = 'Avvia';
    document.getElementById('btnAvvia').classList.remove('pausa');
}

function avanzaTempo() {
    // Avanza di 10 minuti (600 secondi)
    const secondiDaAggiungere = 600;
    const tempoInizioAvanzamento = tempoTotale;
    
    // Aggiungi i punti per i 600 secondi
    for (let i = 1; i <= secondiDaAggiungere; i++) {
        const nuovoTempo = tempoInizioAvanzamento + i;
        labelsRealtime.push(Math.floor(nuovoTempo));
        datiRealtime.push(calcolaConsumo(nuovoTempo / 60));
    }
    
    // Aggiorna il tempo totale
    tempoTotale += secondiDaAggiungere;
    
    // Se il cronometro è attivo, aggiorna il tempo di inizio
    if (cronometroAttivo) {
        tempoInizio = Date.now() - (tempoTotale * 1000);
    }
    
    aggiornaDisplay();
    aggiornaGraficoRealtime();
}

function aggiornaCronometro() {
    tempoTotale = (Date.now() - tempoInizio) / 1000;
    aggiornaDisplay();
    
    // Aggiungi punto al grafico ogni secondo
    if (Math.floor(tempoTotale) !== labelsRealtime.length) {
        labelsRealtime.push(Math.floor(tempoTotale));
        datiRealtime.push(calcolaConsumo(tempoTotale / 60));
        aggiornaGraficoRealtime();
    }
}

function aggiornaDisplay() {
    const minuti = Math.floor(tempoTotale / 60);
    const secondi = Math.floor(tempoTotale % 60);
    const decimi = Math.floor((tempoTotale % 1) * 10);
    
    document.getElementById('tempoDisplay').textContent = 
        `${String(minuti).padStart(2, '0')}:${String(secondi).padStart(2, '0')}.${decimi}`;
    
    const consumo = calcolaConsumo(tempoTotale / 60);
    document.getElementById('consumoRealtime').textContent = consumo.toFixed(4);
}

function toggleFrigo() {
    aperto = !aperto;
    if (aperto) {
        anta.classList.add('aperta');
        setTimeout(() => {
            graficoContainer.style.display = 'block';
            void graficoContainer.offsetHeight;
            graficoContainer.classList.add('visibile');
            
            // Mostra il grafico teorico di default
            const activeTab = document.querySelector('.tab-button.active');
            if (activeTab && activeTab.dataset.tab === 'teorico') {
                creaGrafico();
            } else if (activeTab && activeTab.dataset.tab === 'realtime') {
                creaGraficoRealtime();
            }
        }, 400);
    } else {
        anta.classList.remove('aperta');
        graficoContainer.classList.remove('visibile');
        
        // Pausa il cronometro quando si chiude
        if (cronometroAttivo) {
            pausaCronometro();
        }
    }
}

// Gestione delle schede
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.dataset.tab;
        
        // Rimuovi classe active da tutti i bottoni e contenuti
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Aggiungi classe active al bottone e contenuto selezionato
        button.classList.add('active');
        document.getElementById(tabName).classList.add('active');
        
        // Crea il grafico appropriato
        if (tabName === 'teorico') {
            setTimeout(() => creaGrafico(), 100);
        } else if (tabName === 'realtime') {
            setTimeout(() => creaGraficoRealtime(), 100);
        }
    });
});

// Event listeners
maniglia.addEventListener('click', function (e) {
    e.stopPropagation();
    toggleFrigo();
});

anta.addEventListener('click', toggleFrigo);

chiudiGrafico.addEventListener('click', function () {
    aperto = false;
    anta.classList.remove('aperta');
    graficoContainer.classList.remove('visibile');
    
    if (cronometroAttivo) {
        pausaCronometro();
    }
});

document.getElementById('btnAvvia').addEventListener('click', avviaCronometro);
document.getElementById('btnReset').addEventListener('click', resetCronometro);
document.getElementById('btnAvanza').addEventListener('click', avanzaTempo);

window.addEventListener('resize', () => {
    if (aperto && graficoContainer.classList.contains('visibile')) {
        const activeTab = document.querySelector('.tab-button.active');
        if (activeTab && activeTab.dataset.tab === 'teorico') {
            creaGrafico();
        } else if (activeTab && activeTab.dataset.tab === 'realtime') {
            creaGraficoRealtime();
        }
    }
});

window.addEventListener('load', () => {
    graficoContainer.style.display = 'block';
    void graficoContainer.offsetHeight;
    graficoContainer.style.display = '';
    aggiornaDisplay();
});