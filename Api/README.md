# API per analisi consumo

Questa cartella contiene un piccolo server Python (Flask) che espone un endpoint per calcolare i dati del grafico di consumo.

Come eseguire (Windows PowerShell):

1) Crea un ambiente virtuale (opzionale ma consigliato):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2) Installa dipendenze:
```powershell
pip install flask flask-cors
```

3) Avvia il server:
```powershell
python analaisData.py
```

Sull'URL `http://127.0.0.1:5000/api/consumo` troverai i dati JSON per costruire il grafico.

Esempi di query parameters:
 - `?max=90&increment=3`
