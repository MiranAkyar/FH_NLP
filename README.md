# ERM-Extraktion aus Text
### Regelbasierte Analyse mit LLM-Normalisierung

Dieses Projekt extrahiert automatisch Entity-Relationship-Modelle (ERM) aus deutschsprachigem Fließtext. Die Verarbeitung erfolgt über eine mehrstufige Pipeline aus linguistischer Analyse, Homonym-Auflösung, Synonym-Clustering und regelbasierter Relationsextraktion. Eine React-Webanwendung ermöglicht die interaktive Nutzung über den Browser.

---

## Projektstruktur

```
FH_NLP/
├── Testing/
│   └── code.ipynb       # Pipeline-Implementierung & API
└── er-app/
    └── src/             # React Web-UI
```

---

## Voraussetzungen

- Python 3.10+
- Node.js & npm
- [Ollama](https://ollama.com) (lokal installiert)
- Internetverbindung beim ersten Start (für automatischen GBERT-Download)

---

## Installation

### 1. Repository klonen

```bash
git clone https://github.com/MiranAkyar/FH_NLP.git
cd FH_NLP
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

### 5. Frontend-Abhängigkeiten installieren

```bash
cd er-app
npm install
```

---

## Starten

### Backend (REST-API)

Ollama muss im Hintergrund laufen:

```bash
ollama serve
```

Anschließend das Notebook `Testing/code.ipynb` vollständig ausführen. Beim ersten Start wird das GBERT-Modell (`deepset/gbert-base`) automatisch heruntergeladen — dies kann einige Minuten dauern.

Die API ist anschließend erreichbar unter:
```
http://localhost:8000
```

### Frontend (React Web-UI)

```bash
cd er-app
npm start
```

Die Web-UI öffnet sich automatisch im Browser unter:
```
http://localhost:3000
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

## Hinweise

- Der Eingabetext sollte deutschsprachig und ca. eine DIN-A4-Seite umfassen.
- Das Synonym-Clustering erfordert eine laufende Ollama-Instanz mit `llama3.1:8b`.
- GBERT wird nur für die embedding-basierte Homonym-Auflösung benötigt und beim ersten Start automatisch gecacht.
