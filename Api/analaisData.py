#!/usr/bin/env python3
"""
Small Flask API to compute consumption curve data for the fridge function.

Endpoint: GET /api/consumo
Query parameters:
- max (number) default 90
- increment (number) default 3

Returns JSON: { labels: [...], dati: [...] }
"""
from math import pow
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


def calcola_consumo(x: float) -> float:
    # f(x) = 0,90 + 0,006x + 0,00012x^2 − 0,000001x^3
    return 0.90 + 0.006 * x + 0.00012 * pow(x, 2) - 0.000001 * pow(x, 3)


@app.route('/api/consumo')
def consumo_api():
    try:
        max_x = float(request.args.get('max', '90'))
        increment = float(request.args.get('increment', '3'))
        if increment <= 0:
            increment = 3
    except Exception:
        max_x, increment = 90.0, 3.0

    labels = []
    dati = []
    x = 0.0
    while x <= max_x + 1e-9:
        labels.append(round(x, 3))
        dati.append(round(calcola_consumo(x), 6))
        x += increment

    return jsonify({ 'labels': labels, 'dati': dati })


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
