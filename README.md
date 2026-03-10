# ERM-Extraktion aus Text
### Regelbasierte Analyse mit LLM-Normalisierung

Dieses Projekt extrahiert automatisch Entity-Relationship-Modelle (ERM) aus deutschsprachigem Fließtext. Die Verarbeitung erfolgt über eine mehrstufige Pipeline aus linguistischer Analyse, Homonym-Auflösung, Synonym-Clustering und regelbasierter Relationsextraktion.

---

## Voraussetzungen

- Python 3.10+
- [Ollama](https://ollama.com) (lokal installiert)
- Internetverbindung beim ersten Start (für automatischen GBERT-Download)

---

## Installation

### 1. Repository klonen

```bash
git clone <[repo-url](https://github.com/MiranAkyar/FH_NLP.git)>
cd <FH_NLP/Testing>
```

### 2. Python-Abhängigkeiten installieren

```bash
pip install -r requirements.txt
```

### 3. Deutsches spaCy-Sprachmodell laden

```bash
python -m spacy download de_core_news_lg
```

### 4. Ollama einrichten

Ollama installieren: https://ollama.com/download

Anschließend das benötigte Modell laden:

```bash
ollama pull llama3.1:8b
```

Ollama muss im Hintergrund laufen, bevor das Skript gestartet wird:

```bash
ollama serve
```

---

## Starten

```bash
python code.ipynb
```

Beim ersten Start wird das GBERT-Modell (`deepset/gbert-base`) automatisch über Hugging Face heruntergeladen. Dies kann einige Minuten dauern.

Die REST-API ist anschließend erreichbar unter:

```
http://localhost:8000
```

---

## API-Nutzung

### `POST /extract`

Extrahiert ein ERM aus dem übergebenen Text.

**Request:**
```json
{
  "text": "Ein Kunde kann mehrere Bestellungen aufgeben. Eine Bestellung enthält mehrere Produkte."
}
```

**Response:**
```json
{
  "entities": [...],
  "relations": [...]
}
```

---

## Projektstruktur

```
├── main.py              # Einstiegspunkt, Pipeline & API
├── requirements.txt     # Python-Abhängigkeiten
└── README.md
```

---

## Hinweise

- Der Eingabetext sollte deutschsprachig und ca. eine DIN-A4-Seite umfassen.
- Das Synonym-Clustering erfordert eine laufende Ollama-Instanz mit `llama3.1:8b`.
- GBERT wird nur für die embedding-basierte Homonym-Auflösung benötigt und beim ersten Start automatisch gecacht.
