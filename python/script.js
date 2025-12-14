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

// LIMITE MASSIMO: 90 minuti = 5400 secondi
const LIMITE_SECONDI = 5400;
const LIMITE_MINUTI = 90;

// Funzione di consumo: f(x) = 0,90 + 0,006x + 0,00012x² − 0,000001x³
function calcolaConsumo(x) {
    // Blocca il calcolo a 90 minuti massimo
    if (x > LIMITE_MINUTI) {
        x = LIMITE_MINUTI;
    }
    return 0.90 + 0.006 * x + 0.00012 * Math.pow(x, 2) - 0.000001 * Math.pow(x, 3);
}

// Fetch data SOLO da Python API (NO JSON fallback)
async function generaDatiGrafico() {
    let incremento = 3;
    if (window.innerWidth <= 480) {
        incremento = 9;
    } else if (window.innerWidth <= 768) {
        incremento = 6;
    }

    const apiUrl = `http://127.0.0.1:5000/api/consumo?max=90&increment=${incremento}`;

    try {
        const res = await fetch(apiUrl, { cache: 'no-store' });
        if (!res.ok) {
            throw new Error(`Errore API: ${res.status} ${res.statusText}`);
        }
        const payload = await res.json();
        if (payload && Array.isArray(payload.labels) && Array.isArray(payload.dati)) {
            console.log('✓ Dati caricati da API Python');
            return { labels: payload.labels, dati: payload.dati };
        }
        throw new Error('Formato API non valido');
    } catch (err) {
        console.error('❌ Errore caricamento dati dall\'API Python:', err);
        alert('Errore: Impossibile connettersi all\'API Python.\n\nAssicurati che il server Flask sia attivo su http://127.0.0.1:5000\n\nPer avviarlo:\n1. Apri PowerShell nella cartella Api/\n2. Attiva l\'ambiente virtuale: .\\.venv\\Scripts\\Activate.ps1\n3. Avvia il server: python analaisData.py');
        throw err; // Rilancia l'errore per impedire la creazione del grafico
    }
}

// Crea il grafico teorico
async function creaGrafico() {
    const ctx = document.getElementById('graficoConsumo').getContext('2d');
    
    try {
        const { labels, dati } = await generaDatiGrafico();

        if (grafico) grafico.destroy();

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
    } catch (err) {
        // Errore già gestito nella funzione generaDatiGrafico
        console.error('Impossibile creare il grafico:', err);
    }
}

// Crea il grafico realtime
function creaGraficoRealtime() {
    const ctx = document.getElementById('graficoRealtime').getContext('2d');

    if (graficoRealtime) {
        graficoRealtime.destroy();
    }

    const consumoMax = calcolaConsumo(LIMITE_MINUTI);

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
                    max: LIMITE_SECONDI
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

function aggiornaGraficoRealtime() {
    if (graficoRealtime) {
        graficoRealtime.data.labels = labelsRealtime;
        graficoRealtime.data.datasets[0].data = datiRealtime;
        graficoRealtime.update('none');
    }
}

function avviaCronometro() {
    if (tempoTotale >= LIMITE_SECONDI) {
        alert(`Limite massimo raggiunto: ${LIMITE_MINUTI} minuti`);
        return;
    }

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
    const tempoRimanente = LIMITE_SECONDI - tempoTotale;
    
    if (tempoRimanente <= 0) {
        alert(`Limite massimo raggiunto: ${LIMITE_MINUTI} minuti`);
        return;
    }

    const secondiDaAggiungere = Math.min(600, tempoRimanente);
    const tempoInizioAvanzamento = tempoTotale;
    
    for (let i = 1; i <= secondiDaAggiungere; i++) {
        const nuovoTempo = tempoInizioAvanzamento + i;
        labelsRealtime.push(Math.floor(nuovoTempo));
        datiRealtime.push(calcolaConsumo(nuovoTempo / 60));
    }
    
    tempoTotale += secondiDaAggiungere;
    
    if (cronometroAttivo) {
        tempoInizio = Date.now() - (tempoTotale * 1000);
    }
    
    if (tempoTotale >= LIMITE_SECONDI) {
        pausaCronometro();
        alert(`Limite massimo raggiunto: ${LIMITE_MINUTI} minuti`);
    }
    
    aggiornaDisplay();
    aggiornaGraficoRealtime();
}

function aggiornaCronometro() {
    tempoTotale = (Date.now() - tempoInizio) / 1000;
    
    if (tempoTotale >= LIMITE_SECONDI) {
        tempoTotale = LIMITE_SECONDI;
        pausaCronometro();
        alert(`Limite massimo raggiunto: ${LIMITE_MINUTI} minuti`);
    }
    
    aggiornaDisplay();
    
    if (Math.floor(tempoTotale) !== labelsRealtime.length && tempoTotale < LIMITE_SECONDI) {
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
    
    if (tempoTotale >= LIMITE_SECONDI * 0.95) {
        document.getElementById('tempoDisplay').style.color = '#ff4444';
    } else {
        document.getElementById('tempoDisplay').style.color = '#333';
    }
}

function toggleFrigo() {
    aperto = !aperto;
    if (aperto) {
        anta.classList.add('aperta');
        setTimeout(() => {
            graficoContainer.style.display = 'block';
            void graficoContainer.offsetHeight;
            graficoContainer.classList.add('visibile');
            
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
        
        if (cronometroAttivo) {
            pausaCronometro();
        }
    }
}

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.dataset.tab;
        
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        button.classList.add('active');
        document.getElementById(tabName).classList.add('active');
        
        if (tabName === 'teorico') {
            setTimeout(() => creaGrafico(), 100);
        } else if (tabName === 'realtime') {
            setTimeout(() => creaGraficoRealtime(), 100);
        }
    });
});

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