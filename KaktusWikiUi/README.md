# 🌵 KaktusWiki

Inoffizielle, automatisch generierte Wiki für **Cactus Clicker** auf [PlayLegend.net](https://playlegend.net).

WICHTIG: Dieses Repository enthält gescrapte Inhalte von PlayLegend. Lies zuerst die `NOTICE.md` bevor du Inhalte veröffentlichst. Der Quellcode steht unter der `LICENSE`.

Technologie-Stack: **React + shadcn/ui + Tailwind CSS + Vite**

---

## 🚀 Schnellstart

### 1. Abhängigkeiten installieren
```bash
npm install
```

### 2. Wiki-Daten scrapen
```bash
npm run scrape
```

> Scrapt alle ~140 Seiten von playlegend.net und speichert die Daten in `public/wiki-data.json`.  
> Dauert ca. 2–3 Minuten (höfliche Wartezeit zwischen Requests).

### 3. Entwicklungsserver starten
```bash
npm run dev
```

Öffne [http://localhost:5173](http://localhost:5173) im Browser.

---

## 📦 Projekt bauen (Production)
```bash
npm run build
npm run preview
```

---

## 🔄 Wiki aktualisieren

Führe den Scraper erneut aus, um die neuesten Daten zu holen:
```bash
npm run scrape
```

---

## 📁 Projektstruktur

```
KaktusWiki/
├── scraper.js              ← Node.js Scraper (axios + cheerio)
├── public/
│   └── wiki-data.json      ← Generierte Wiki-Daten (nach npm run scrape)
└── src/
    ├── App.tsx             ← Hauptkomponente
    ├── components/
    │   ├── ui/             ← shadcn/ui Komponenten
    │   ├── Header.tsx      ← Navigation + Suche
    │   ├── Sidebar.tsx     ← Kategorien-Navigation
    │   ├── WikiContent.tsx ← Wiki-Seiten-Anzeige
    │   ├── HomePage.tsx    ← Übersichts-Dashboard
    │   └── SearchPage.tsx  ← Suchergebnisse
    ├── data/
    │   └── wikiStructure.ts ← Alle Wiki-URLs und Kategorien
    └── types/
        └── wiki.ts         ← TypeScript-Typen
```

---

## ✨ Features

- 📚 **140+ Wiki-Seiten** aus 9 Kategorien
- 🔍 **Volltextsuche** durch alle gescrapten Inhalte
- 🌙 **Dark/Light Mode** (automatisch nach Systemeinstellung)
- 📱 **Responsive** – funktioniert auf Mobile und Desktop
- ⬅️ ➡️ **Vor/Zurück Navigation** zwischen Seiten
- 📊 **Tabellen** aus der originalen Wiki werden korrekt dargestellt
- 🔗 **Link zur Original-Seite** auf jeder Wiki-Seite

---

Datenquelle: [PlayLegend.net Wiki](https://playlegend.net/cactusclicker-wiki/)
