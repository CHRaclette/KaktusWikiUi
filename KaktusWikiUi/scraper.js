/**
 * KaktusWiki Scraper
 * Scrapt alle Seiten von https://playlegend.net/cactusclicker-wiki/
 * und speichert die Daten in public/wiki-data.json
 *
 * Ausführen: npm run scrape
 */

import axios from 'axios'
import * as cheerio from 'cheerio'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const BASE_URL = 'https://playlegend.net/cactusclicker-wiki'
const DELAY_MS = 600        // Wartezeit zwischen Requests (höflicher Scraper)
const TIMEOUT_MS = 20000    // Request-Timeout

// ─────────────────────────────────────────────────────────────────────────────
// Alle Wiki-Seiten die gescrapt werden sollen
// ─────────────────────────────────────────────────────────────────────────────
const WIKI_PAGES = [
  // Allgemeines
  { url: `${BASE_URL}/allgemeines/kristalle/`, slug: 'allgemeines/kristalle', category: 'Allgemeines' },
  { url: `${BASE_URL}/allgemeines/legend/`, slug: 'allgemeines/legend', category: 'Allgemeines' },
  { url: `${BASE_URL}/allgemeines/skins/`, slug: 'allgemeines/skins', category: 'Allgemeines' },
  { url: `${BASE_URL}/allgemeines/booster/`, slug: 'allgemeines/booster', category: 'Allgemeines' },
  { url: `${BASE_URL}/allgemeines/modifier/`, slug: 'allgemeines/modifier', category: 'Allgemeines' },
  { url: `${BASE_URL}/allgemeines/attribute/`, slug: 'allgemeines/attribute', category: 'Allgemeines' },
  { url: `${BASE_URL}/allgemeines/gadrobe/`, slug: 'allgemeines/gadrobe', category: 'Allgemeines' },
  { url: `${BASE_URL}/allgemeines/widgetsystem/`, slug: 'allgemeines/widgetsystem', category: 'Allgemeines' },
  { url: `${BASE_URL}/allgemeines/teams/`, slug: 'allgemeines/teams', category: 'Allgemeines' },
  { url: `${BASE_URL}/allgemeines/turniere/`, slug: 'allgemeines/turniere', category: 'Allgemeines' },

  // Fabrik
  { url: `${BASE_URL}/fabrik/kaktusfeld/`, slug: 'fabrik/kaktusfeld', category: 'Fabrik' },
  { url: `${BASE_URL}/fabrik/kaktusfarm/`, slug: 'fabrik/kaktusfarm', category: 'Fabrik' },
  { url: `${BASE_URL}/fabrik/haendler/`, slug: 'fabrik/haendler', category: 'Fabrik' },
  { url: `${BASE_URL}/fabrik/forschungen/`, slug: 'fabrik/forschungen', category: 'Fabrik' },
  { url: `${BASE_URL}/fabrik/whitefeather/`, slug: 'fabrik/whitefeather', category: 'Fabrik' },
  { url: `${BASE_URL}/fabrik/seelenhaendler/`, slug: 'fabrik/seelenhaendler', category: 'Fabrik' },
  { url: `${BASE_URL}/fabrik/seelensammler/`, slug: 'fabrik/seelensammler', category: 'Fabrik' },
  { url: `${BASE_URL}/fabrik/essenzensammler/`, slug: 'fabrik/essenzensammler', category: 'Fabrik' },

  // Tower Defense
  { url: `${BASE_URL}/tower-defense/wellen/`, slug: 'tower-defense/wellen', category: 'Tower Defense' },
  { url: `${BASE_URL}/tower-defense/bosse/`, slug: 'tower-defense/bosse', category: 'Tower Defense' },
  { url: `${BASE_URL}/tower-defense/tuerme/`, slug: 'tower-defense/tuerme', category: 'Tower Defense' },
  { url: `${BASE_URL}/tower-defense/bruecken/`, slug: 'tower-defense/bruecken', category: 'Tower Defense' },
  { url: `${BASE_URL}/tower-defense/bufftuerme/`, slug: 'tower-defense/bufftuerme', category: 'Tower Defense' },

  // Runen
  { url: `${BASE_URL}/runen/runen-uebersicht/`, slug: 'runen/runen-uebersicht', category: 'Runen' },
  { url: `${BASE_URL}/runen/verstaerkte-dunkelheit/`, slug: 'runen/verstaerkte-dunkelheit', category: 'Runen' },
  { url: `${BASE_URL}/runen/harmonische-dominanz/`, slug: 'runen/harmonische-dominanz', category: 'Runen' },
  { url: `${BASE_URL}/runen/kraftvolle-explosion/`, slug: 'runen/kraftvolle-explosion', category: 'Runen' },
  { url: `${BASE_URL}/runen/eiszeit/`, slug: 'runen/eiszeit', category: 'Runen' },
  { url: `${BASE_URL}/runen/doppelte-explosionspfeile/`, slug: 'runen/doppelte-explosionspfeile', category: 'Runen' },
  { url: `${BASE_URL}/runen/brennende-pfeile/`, slug: 'runen/brennende-pfeile', category: 'Runen' },
  { url: `${BASE_URL}/runen/kettenpfeil/`, slug: 'runen/kettenpfeil', category: 'Runen' },
  { url: `${BASE_URL}/runen/schaden/`, slug: 'runen/schaden', category: 'Runen' },
  { url: `${BASE_URL}/runen/dreifache-explosionspfeile/`, slug: 'runen/dreifache-explosionspfeile', category: 'Runen' },
  { url: `${BASE_URL}/runen/gefrorener-boden/`, slug: 'runen/gefrorener-boden', category: 'Runen' },
  { url: `${BASE_URL}/runen/giftpfeil/`, slug: 'runen/giftpfeil', category: 'Runen' },
  { url: `${BASE_URL}/runen/detonation/`, slug: 'runen/detonation', category: 'Runen' },
  { url: `${BASE_URL}/runen/tickrate/`, slug: 'runen/tickrate', category: 'Runen' },
  { url: `${BASE_URL}/runen/brennende-ausdauer/`, slug: 'runen/brennende-ausdauer', category: 'Runen' },
  { url: `${BASE_URL}/runen/starke-eisplfeile/`, slug: 'runen/starke-eisplfeile', category: 'Runen' },
  { url: `${BASE_URL}/runen/fluch/`, slug: 'runen/fluch', category: 'Runen' },
  { url: `${BASE_URL}/runen/versaerkter-feuerpfeil/`, slug: 'runen/versaerkter-feuerpfeil', category: 'Runen' },
  { url: `${BASE_URL}/runen/dunkle-hinrichtung/`, slug: 'runen/dunkle-hinrichtung', category: 'Runen' },
  { url: `${BASE_URL}/runen/frostige-schritte/`, slug: 'runen/frostige-schritte', category: 'Runen' },
  { url: `${BASE_URL}/runen/erstschlag/`, slug: 'runen/erstschlag', category: 'Runen' },
  { url: `${BASE_URL}/runen/letzte-chance/`, slug: 'runen/letzte-chance', category: 'Runen' },
  { url: `${BASE_URL}/runen/doppelter-giftpfeil/`, slug: 'runen/doppelter-giftpfeil', category: 'Runen' },
  { url: `${BASE_URL}/runen/permafrost/`, slug: 'runen/permafrost', category: 'Runen' },
  { url: `${BASE_URL}/runen/verstaerkter-giftpfeil/`, slug: 'runen/verstaerkter-giftpfeil', category: 'Runen' },
  { url: `${BASE_URL}/runen/nekromant/`, slug: 'runen/nekromant', category: 'Runen' },
  { url: `${BASE_URL}/runen/schaedlicher-frost/`, slug: 'runen/schaedlicher-frost', category: 'Runen' },
  { url: `${BASE_URL}/runen/schutzlose-zerstoerung/`, slug: 'runen/schutzlose-zerstoerung', category: 'Runen' },
  { url: `${BASE_URL}/runen/sofortiger-tod/`, slug: 'runen/sofortiger-tod', category: 'Runen' },
  { url: `${BASE_URL}/runen/geschwindigkeit/`, slug: 'runen/geschwindigkeit', category: 'Runen' },
  { url: `${BASE_URL}/runen/effektiver-giftplfeil/`, slug: 'runen/effektiver-giftplfeil', category: 'Runen' },
  { url: `${BASE_URL}/runen/doppelter-eispfeil/`, slug: 'runen/doppelter-eispfeil', category: 'Runen' },
  { url: `${BASE_URL}/runen/zerstoerung/`, slug: 'runen/zerstoerung', category: 'Runen' },
  { url: `${BASE_URL}/runen/eisige-durchdringung/`, slug: 'runen/eisige-durchdringung', category: 'Runen' },
  { url: `${BASE_URL}/runen/toedlicher-schuss/`, slug: 'runen/toedlicher-schuss', category: 'Runen' },
  { url: `${BASE_URL}/runen/schwaechendes-gift/`, slug: 'runen/schwaechendes-gift', category: 'Runen' },
  { url: `${BASE_URL}/runen/detonationsradius/`, slug: 'runen/detonationsradius', category: 'Runen' },
  { url: `${BASE_URL}/runen/blitz/`, slug: 'runen/blitz', category: 'Runen' },
  { url: `${BASE_URL}/runen/eisengolem/`, slug: 'runen/eisengolem', category: 'Runen' },
  { url: `${BASE_URL}/runen/gefroren/`, slug: 'runen/gefroren', category: 'Runen' },
  { url: `${BASE_URL}/runen/toedliche-chance/`, slug: 'runen/toedliche-chance', category: 'Runen' },
  { url: `${BASE_URL}/runen/schwaechung/`, slug: 'runen/schwaechung', category: 'Runen' },
  { url: `${BASE_URL}/runen/inferno-pfeil/`, slug: 'runen/inferno-pfeil', category: 'Runen' },
  { url: `${BASE_URL}/runen/tnt/`, slug: 'runen/tnt', category: 'Runen' },
  { url: `${BASE_URL}/runen/schwaechende-reichweite/`, slug: 'runen/schwaechende-reichweite', category: 'Runen' },
  { url: `${BASE_URL}/runen/giftige-reichweite/`, slug: 'runen/giftige-reichweite', category: 'Runen' },
  { url: `${BASE_URL}/runen/brennende-bosse/`, slug: 'runen/brennende-bosse', category: 'Runen' },
  { url: `${BASE_URL}/runen/letzter-treffer/`, slug: 'runen/letzter-treffer', category: 'Runen' },

  // Stadt
  { url: `${BASE_URL}/schmied/amboss/`, slug: 'schmied/amboss', category: 'Stadt' },
  { url: `${BASE_URL}/schmied/schmelzofen/`, slug: 'schmied/schmelzofen', category: 'Stadt' },
  { url: `${BASE_URL}/schmied/legendaere-aspekte/`, slug: 'schmied/legendaere-aspekte', category: 'Stadt' },
  { url: `${BASE_URL}/schmied/schmiedezustaende/`, slug: 'schmied/schmiedezustaende', category: 'Stadt' },
  { url: `${BASE_URL}/schmied/zerlegen-von-ausruestung/`, slug: 'schmied/zerlegen-von-ausruestung', category: 'Stadt' },
  { url: `${BASE_URL}/schmied/zerlegen-von-bauplaenen/`, slug: 'schmied/zerlegen-von-bauplaenen', category: 'Stadt' },
  { url: `${BASE_URL}/schmied/bauplaene-kaufen/`, slug: 'schmied/bauplaene-kaufen', category: 'Stadt' },
  { url: `${BASE_URL}/schmied/umschmieden/`, slug: 'schmied/umschmieden', category: 'Stadt' },
  { url: `${BASE_URL}/schmied/ausruestung-aufwerten/`, slug: 'schmied/ausruestung-aufwerten', category: 'Stadt' },
  { url: `${BASE_URL}/ingenieur/gadgets/`, slug: 'ingenieur/gadgets', category: 'Stadt' },
  { url: `${BASE_URL}/stadt/recycler-ticketautomat/`, slug: 'stadt/recycler-ticketautomat', category: 'Stadt' },

  // Aincraft
  { url: `${BASE_URL}/aincraft/events/`, slug: 'aincraft/events', category: 'Aincraft' },
  { url: `${BASE_URL}/aincraft/ebenen/`, slug: 'aincraft/ebenen', category: 'Aincraft' },
  { url: `${BASE_URL}/aincraft/karten/`, slug: 'aincraft/karten', category: 'Aincraft' },
  { url: `${BASE_URL}/aincraft/statuen-uebersicht/`, slug: 'aincraft/statuen-uebersicht', category: 'Aincraft' },
  { url: `${BASE_URL}/aincraft/materialien/`, slug: 'aincraft/materialien', category: 'Aincraft' },
  { url: `${BASE_URL}/aincraft/jaeger/`, slug: 'aincraft/jaeger', category: 'Aincraft' },
  { url: `${BASE_URL}/aincraft/meilensteine/`, slug: 'aincraft/meilensteine', category: 'Aincraft' },
  { url: `${BASE_URL}/aincraft/machtkristalle/`, slug: 'aincraft/machtkristalle', category: 'Aincraft' },
  { url: `${BASE_URL}/aincraft/kombo-kiste/`, slug: 'aincraft/kombo-kiste', category: 'Aincraft' },
  { url: `${BASE_URL}/aincraft/monsterlexikon/`, slug: 'aincraft/monsterlexikon', category: 'Aincraft' },

  // Farmzone
  { url: `${BASE_URL}/farmzone/biome/`, slug: 'farmzone/biome', category: 'Farmzone' },
  { url: `${BASE_URL}/fischen/fischer-rainpaw/`, slug: 'fischen/fischer-rainpaw', category: 'Farmzone' },
  { url: `${BASE_URL}/fischen/angeln-ausruesten/`, slug: 'fischen/angeln-ausruesten', category: 'Farmzone' },
  { url: `${BASE_URL}/fischen/teiche/`, slug: 'fischen/teiche', category: 'Farmzone' },
  { url: `${BASE_URL}/fischen/fischschwaerme/`, slug: 'fischen/fischschwaerme', category: 'Farmzone' },
  { url: `${BASE_URL}/fischen/fische-angeln/`, slug: 'fischen/fische-angeln', category: 'Farmzone' },
  { url: `${BASE_URL}/fischen/fischlexikon/`, slug: 'fischen/fischlexikon', category: 'Farmzone' },
  { url: `${BASE_URL}/fischen/angelkomponenten/`, slug: 'fischen/angelkomponenten', category: 'Farmzone' },
  { url: `${BASE_URL}/fischen/fischreusen/`, slug: 'fischen/fischreusen', category: 'Farmzone' },
  { url: `${BASE_URL}/fischen/schatzangeln/`, slug: 'fischen/schatzangeln', category: 'Farmzone' },

  // Baupläne
  { url: `${BASE_URL}/waffen/schwerter/`, slug: 'waffen/schwerter', category: 'Baupläne' },
  { url: `${BASE_URL}/waffen/aexte/`, slug: 'waffen/aexte', category: 'Baupläne' },
  { url: `${BASE_URL}/werkzeuge/aexte-2/`, slug: 'werkzeuge/aexte-2', category: 'Baupläne' },
  { url: `${BASE_URL}/werkzeuge/spitzhacken/`, slug: 'werkzeuge/spitzhacken', category: 'Baupläne' },
  { url: `${BASE_URL}/werkzeuge/hacken/`, slug: 'werkzeuge/hacken', category: 'Baupläne' },
  { url: `${BASE_URL}/accessoires/ringe/`, slug: 'accessoires/ringe', category: 'Baupläne' },
  { url: `${BASE_URL}/accessoires/halsketten/`, slug: 'accessoires/halsketten', category: 'Baupläne' },
  { url: `${BASE_URL}/ausruestung-platte/helme/`, slug: 'ausruestung-platte/helme', category: 'Baupläne' },
  { url: `${BASE_URL}/ausruestung-platte/schultern/`, slug: 'ausruestung-platte/schultern', category: 'Baupläne' },
  { url: `${BASE_URL}/ausruestung-platte/brustplatten/`, slug: 'ausruestung-platte/brustplatten', category: 'Baupläne' },
  { url: `${BASE_URL}/ausruestung-platte/handschuhe/`, slug: 'ausruestung-platte/handschuhe', category: 'Baupläne' },
  { url: `${BASE_URL}/ausruestung-platte/guertel/`, slug: 'ausruestung-platte/guertel', category: 'Baupläne' },
  { url: `${BASE_URL}/ausruestung-platte/hosen/`, slug: 'ausruestung-platte/hosen', category: 'Baupläne' },
  { url: `${BASE_URL}/ausruestung-platte/schuhe/`, slug: 'ausruestung-platte/schuhe', category: 'Baupläne' },

  // Klassensystem
  { url: `${BASE_URL}/klassensystem/allgemein/`, slug: 'klassensystem/allgemein', category: 'Klassensystem' },
  { url: `${BASE_URL}/klassensystem/klassen-ressourcen/`, slug: 'klassensystem/klassen-ressourcen', category: 'Klassensystem' },
  { url: `${BASE_URL}/klassensystem/krieger-klasse/`, slug: 'klassensystem/krieger-klasse', category: 'Klassensystem' },

  // Tutorials
  { url: `${BASE_URL}/tutorials-guides/talent-baum-skillung/`, slug: 'tutorials-guides/talent-baum-skillung', category: 'Tutorials' },
  { url: `${BASE_URL}/tutorials-guides/wichtige-aincraft-aspekte/`, slug: 'tutorials-guides/wichtige-aincraft-aspekte', category: 'Tutorials' },
  { url: `${BASE_URL}/erste-schritte-in-kaktus-klicker/1-die-wahl-der-klasse/`, slug: 'erste-schritte/1-die-wahl-der-klasse', category: 'Tutorials' },
  { url: `${BASE_URL}/erste-schritte-in-kaktus-klicker/2-die-ersten-1-000-kaktus/`, slug: 'erste-schritte/2-die-ersten-kaktus', category: 'Tutorials' },
  { url: `${BASE_URL}/erste-schritte-in-kaktus-klicker/3-der-forschungsraum/`, slug: 'erste-schritte/3-der-forschungsraum', category: 'Tutorials' },
  { url: `${BASE_URL}/erste-schritte-in-kaktus-klicker/4-der-erste-besuch-in-der-stadt/`, slug: 'erste-schritte/4-der-erste-besuch-in-der-stadt', category: 'Tutorials' },
  { url: `${BASE_URL}/erste-schritte-in-kaktus-klicker/5-die-ersten-seelen/`, slug: 'erste-schritte/5-die-ersten-seelen', category: 'Tutorials' },
  { url: `${BASE_URL}/erste-schritte-in-kaktus-klicker/6-der-seelenbaum/`, slug: 'erste-schritte/6-der-seelenbaum', category: 'Tutorials' },
  { url: `${BASE_URL}/erste-schritte-in-kaktus-klicker/7-der-erste-turm/`, slug: 'erste-schritte/7-der-erste-turm', category: 'Tutorials' },
  { url: `${BASE_URL}/erste-schritte-in-kaktus-klicker/8-weitere-wichtige-tower-defense-elemente/`, slug: 'erste-schritte/8-tower-defense-elemente', category: 'Tutorials' },
  { url: `${BASE_URL}/erste-schritte-in-kaktus-klicker/9-die-erste-reise-nach-aincraft/`, slug: 'erste-schritte/9-reise-nach-aincraft', category: 'Tutorials' },
  { url: `${BASE_URL}/erste-schritte-in-kaktus-klicker/10-die-erste-reise-in-die-farmzone-module/`, slug: 'erste-schritte/10-farmzone-module', category: 'Tutorials' },
  { url: `${BASE_URL}/erste-schritte-in-kaktus-klicker/11-machtkristalle/`, slug: 'erste-schritte/11-machtkristalle', category: 'Tutorials' },
  { url: `${BASE_URL}/ausruestung/muenz-ausruestung/`, slug: 'ausruestung/muenz-ausruestung', category: 'Tutorials' },
  { url: `${BASE_URL}/ausruestung/ressourcenausruestung/`, slug: 'ausruestung/ressourcenausruestung', category: 'Tutorials' },
  { url: `${BASE_URL}/ausruestung/herstellungsauruestung/`, slug: 'ausruestung/herstellungsauruestung', category: 'Tutorials' },
  { url: `${BASE_URL}/ausruestung/waffen-schwerter/`, slug: 'ausruestung/waffen-schwerter', category: 'Tutorials' },
  { url: `${BASE_URL}/kits-platte/schaden-kits/`, slug: 'kits-platte/schaden-kits', category: 'Tutorials' },
  { url: `${BASE_URL}/kits-platte/allrounder-kits/`, slug: 'kits-platte/allrounder-kits', category: 'Tutorials' },
  { url: `${BASE_URL}/kits-platte/tank-kits/`, slug: 'kits-platte/tank-kits', category: 'Tutorials' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Hilfsfunktionen
// ─────────────────────────────────────────────────────────────────────────────

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Returns true if a URL looks like a real content image (not a UI icon/logo) */
function isContentImage(src) {
  if (!src || src.startsWith('data:')) return false
  const lower = src.toLowerCase()
  // Skip obvious UI/theme assets
  const SKIP = ['logo', 'icon', 'avatar', 'emoji', 'smilie', 'spinner',
                 'placeholder', 'loading', 'pixel.gif', '1x1', 'blank.']
  if (SKIP.some(s => lower.includes(s))) return false
  // Always accept WordPress upload URLs — these are genuine content images
  if (lower.includes('wp-content/uploads')) return true
  // Accept common image extensions from the same domain
  if (/\.(png|jpg|jpeg|gif|webp|svg)(\?|$)/i.test(lower)) return true
  return false
}

/** Make a potentially relative URL absolute (PlayLegend images are always absolute, but just in case) */
function absoluteUrl(src) {
  if (src.startsWith('http')) return src
  return `https://playlegend.net${src.startsWith('/') ? '' : '/'}${src}`
}

/**
 * Extrahiert strukturierte Content-Blöcke aus dem cheerio-geparsten HTML
 */
function extractBlocks($, $content) {
  const blocks = []

  function processNode(el) {
    const tag = el.tagName?.toLowerCase()
    if (!tag) return

    // Skip navigation, scripts, styles, sidebar
    if (['script', 'style', 'nav', 'footer', 'header', 'noscript'].includes(tag)) return

    // Headings
    if (['h1', 'h2', 'h3', 'h4', 'h5'].includes(tag)) {
      const text = $(el).text().replace(/\s+/g, ' ').trim()
      if (text && text.length > 1) {
        blocks.push({
          type: 'heading',
          level: parseInt(tag[1]),
          content: text,
        })
      }
      return
    }

    // Paragraphs — also detect image-only <p> tags (e.g. float-left rune/item icons)
    if (tag === 'p') {
      const $img = $(el).find('img').first()
      if ($img.length > 0) {
        const textWithoutImg = $(el).clone().find('img').remove().end().text().replace(/\s+/g, ' ').trim()
        if (!textWithoutImg || textWithoutImg.length <= 3) {
          // Pure image paragraph — emit image block at correct position
          const src = $img.attr('src') || $img.attr('data-src') || $img.attr('data-lazy-src')
          if (src && isContentImage(src)) {
            const alt = $img.attr('alt') || $img.attr('title') || ''
            blocks.push({ type: 'image', src: absoluteUrl(src), alt })
          }
          return
        }
      }
      const text = $(el).text().replace(/\s+/g, ' ').trim()
      if (text && text.length > 3) {
        blocks.push({ type: 'paragraph', content: text })
      }
      return
    }

    // Tables
    if (tag === 'table') {
      const headers = []
      const rows = []

      // Try thead first
      $(el).find('thead tr').first().find('th, td').each((_, th) => {
        headers.push($(th).text().replace(/\s+/g, ' ').trim())
      })

      // tbody rows
      $(el).find('tbody tr').each((_, tr) => {
        const row = []
        $(tr).find('td, th').each((_, td) => {
          const $td = $(td)
          const text = $td.text().replace(/\s+/g, ' ').trim()
          // If the cell contains an image and minimal/no extra text → store as image cell
          const $img = $td.find('img').first()
          if ($img.length > 0) {
            const cellSrc = $img.attr('src') || $img.attr('data-src') || $img.attr('data-lazy-src')
            if (cellSrc && isContentImage(cellSrc)) {
              const cellAlt = $img.attr('alt') || $img.attr('title') || ''
              // Use image cell when the text is empty or just repeats the alt text
              if (!text || text === cellAlt) {
                row.push({ img: absoluteUrl(cellSrc), alt: cellAlt })
                return
              }
            }
          }
          row.push(text)
        })
        if (row.some((c) => (typeof c === 'string' ? c.length > 0 : true))) rows.push(row)
      })

      // If no thead, check if first row should be header
      if (headers.length === 0) {
        $(el).find('tr').first().find('th').each((_, th) => {
          headers.push($(th).text().replace(/\s+/g, ' ').trim())
        })
        if (headers.length === 0 && rows.length > 0) {
          const firstRow = rows.shift()
          if (firstRow) headers.push(...firstRow)
        }
      }

      if (headers.length > 0 || rows.length > 0) {
        blocks.push({ type: 'table', headers, rows })
      }
      return
    }

    // Lists
    if (tag === 'ul' || tag === 'ol') {
      const items = []
      $(el).children('li').each((_, li) => {
        const text = $(li).clone().children('ul, ol').remove().end().text().replace(/\s+/g, ' ').trim()
        if (text) items.push(text)
      })
      if (items.length > 0) {
        blocks.push({ type: 'list', ordered: tag === 'ol', items })
      }
      return
    }

    // Images — accept any wp-content upload, drop obvious UI icons
    if (tag === 'img') {
      const src = $(el).attr('src')
        || $(el).attr('data-src')
        || $(el).attr('data-lazy-src')
        || $(el).attr('data-lazy')
        || $(el).attr('data-original')
      const alt = $(el).attr('alt') || ''
      if (src && isContentImage(src)) {
        blocks.push({ type: 'image', src: absoluteUrl(src), alt })
      }
      return
    }

    // Figure (WordPress block editor wraps images in <figure>)
    if (tag === 'figure') {
      const $img = $(el).find('img').first()
      const src = $img.attr('src')
        || $img.attr('data-src')
        || $img.attr('data-lazy-src')
      const alt = $img.attr('alt') || ''
      if (src && isContentImage(src)) {
        blocks.push({ type: 'image', src: absoluteUrl(src), alt })
      }
      const caption = $(el).find('figcaption').text().trim()
      if (caption) blocks.push({ type: 'paragraph', content: caption })
      return
    }

    // Blockquote / callout
    if (tag === 'blockquote') {
      const text = $(el).text().replace(/\s+/g, ' ').trim()
      if (text) blocks.push({ type: 'paragraph', content: `💬 ${text}` })
      return
    }

    // Divs and other containers — recurse
    if (['div', 'section', 'article', 'main', 'aside', 'details', 'summary'].includes(tag)) {
      // Skip sidebars
      const cls = ($(el).attr('class') || '').toLowerCase()
      const id = ($(el).attr('id') || '').toLowerCase()
      if (['sidebar', 'navigation', 'nav', 'menu', 'widget', 'footer', 'header', 'comment'].some(
        (skip) => cls.includes(skip) || id.includes(skip)
      )) return

      $(el).children().each((_, child) => processNode(child))
      return
    }

    // Strong/em/span with substantial text (no wrapping element)
    if (['strong', 'em', 'b', 'i', 'span'].includes(tag)) {
      // Usually handled by parent <p> — skip standalone
      return
    }
  }

  $content.children().each((_, el) => processNode(el))

  return blocks
}

/**
 * Scrapt eine einzelne Wiki-Seite
 */
async function scrapePage(pageInfo) {
  const response = await axios.get(pageInfo.url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'no-cache',
    },
    timeout: TIMEOUT_MS,
  })

  const $ = cheerio.load(response.data)

  // ── Titel extrahieren ──
  let title =
    $('h1.entry-title').first().text().trim() ||
    $('h1.page-title').first().text().trim() ||
    $('h1').first().text().trim() ||
    $('title').text().replace(/[\s–-]*(PlayLegend|Wiki|Cactus Clicker).*/gi, '').trim() ||
    pageInfo.slug.split('/').pop()?.replace(/-/g, ' ') || 'Unbekannte Seite'

  // ── Content-Bereich finden ──
  // PlayLegend nutzt WordPress – versuche verschiedene Selektoren
  const contentSelectors = [
    '.entry-content',
    '.post-content',
    '.page-content',
    'article .content',
    '.wiki-content',
    'main .elementor-widget-theme-post-content',
    '.elementor-widget-theme-post-content',
    'main article',
    'article',
    '.site-content main',
    'main',
  ]

  let $content = null
  for (const sel of contentSelectors) {
    const found = $(sel).first()
    if (found.length > 0) {
      // Make sure it actually has some text content
      if (found.text().trim().length > 50) {
        $content = found
        break
      }
    }
  }

  // Fallback: remove known noise elements and use body
  if (!$content) {
    $('header, footer, nav, .sidebar, .menu, script, style, noscript').remove()
    $content = $('body')
  }

  // Remove sidebar, navigation etc from content area
  $content.find('nav, .sidebar, .widget-area, .site-sidebar, [class*="sidebar"], [class*="navigation"], [class*="breadcrumb"], .share-buttons, .author-box, .related-posts, .comments-area').remove()

  // ── Alle content-Bilder sammeln (als Set um Duplikate zu vermeiden) ──
  const seenImages = new Set()

  // ── Blöcke extrahieren ──
  let blocks = extractBlocks($, $content)

  // Filter: ersten h1 entfernen wenn er dem Titel entspricht
  if (blocks.length > 0 && blocks[0].type === 'heading' && blocks[0].level === 1) {
    blocks.shift()
  }

  // Deduplizieren von identischen aufeinanderfolgenden Blöcken
  blocks = blocks.filter((block, i) => {
    if (i === 0) return true
    const prev = blocks[i - 1]
    if (block.type === 'paragraph' && prev.type === 'paragraph') {
      return block.content !== prev.content
    }
    return true
  })

  // ── De-duplicate images already in blocks ──
  blocks.forEach(b => { if (b.type === 'image') seenImages.add(b.src) })

  // Mark images already captured as table cells so the sweep doesn't duplicate them
  blocks.forEach(b => {
    if (b.type === 'table') {
      b.rows.forEach(row => row.forEach(cell => {
        if (typeof cell === 'object' && cell.img) seenImages.add(cell.img)
      }))
    }
  })

  // ── Sweep the full content area for any missed wp-content images ──
  // Skip images that live inside a table cell — they are already stored as TableCell objects
  $content.find('img').each((_, img) => {
    if ($(img).closest('table').length > 0) return   // already in table data
    const src = $(img).attr('src')
      || $(img).attr('data-src')
      || $(img).attr('data-lazy-src')
    if (src && isContentImage(src)) {
      const abs = absoluteUrl(src)
      if (!seenImages.has(abs)) {
        seenImages.add(abs)
        const alt = $(img).attr('alt') || ''
        blocks.push({ type: 'image', src: abs, alt })
      }
    }
  })

  // ── Wenn keine Blöcke gefunden: Fallback Text ──
  if (blocks.length === 0) {
    const rawText = $content.text().replace(/\s+/g, ' ').trim()
    if (rawText.length > 20) {
      blocks = [{ type: 'paragraph', content: rawText.substring(0, 3000) }]
    }
  }

  return {
    url: pageInfo.url,
    slug: pageInfo.slug,
    title: title.trim(),
    category: pageInfo.category,
    blocks,
    scrapedAt: new Date().toISOString(),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Hauptprogramm
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🌵 KaktusWiki Scraper gestartet\n')
  console.log(`📋 Seiten gesamt: ${WIKI_PAGES.length}`)
  console.log(`⏱️  Verzögerung: ${DELAY_MS}ms zwischen Requests`)
  console.log(`📁 Ausgabe: public/wiki-data.json\n`)

  // Ausgabeverzeichnis erstellen
  const outputDir = path.join(__dirname, 'public')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const pages = []
  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < WIKI_PAGES.length; i++) {
    const pageInfo = WIKI_PAGES[i]
    const progress = `[${String(i + 1).padStart(3)}/${WIKI_PAGES.length}]`

    try {
      process.stdout.write(`${progress} ⏳ ${pageInfo.slug} ...`)
      const page = await scrapePage(pageInfo)
      pages.push(page)
      successCount++
      const blockCount = page.blocks.length
      process.stdout.write(` ✅ (${blockCount} Blöcke, "${page.title.substring(0, 40)}")\n`)
    } catch (err) {
      errorCount++
      process.stdout.write(` ❌ Fehler: ${err.message}\n`)
      pages.push({
        url: pageInfo.url,
        slug: pageInfo.slug,
        title: pageInfo.slug.split('/').pop()?.replace(/-/g, ' ') || pageInfo.slug,
        category: pageInfo.category,
        blocks: [
          {
            type: 'paragraph',
            content: `⚠️ Diese Seite konnte nicht geladen werden. Fehler: ${err.message}`,
          },
        ],
        scrapedAt: new Date().toISOString(),
        error: true,
      })
    }

    // Pause zwischen Requests
    if (i < WIKI_PAGES.length - 1) {
      await delay(DELAY_MS)
    }
  }

  // ── Daten speichern ──
  const wikiData = {
    pages,
    scrapedAt: new Date().toISOString(),
    totalPages: pages.length,
    version: '1.0.0',
  }

  const outputPath = path.join(outputDir, 'wiki-data.json')
  fs.writeFileSync(outputPath, JSON.stringify(wikiData, null, 2), 'utf-8')

  // ── Zusammenfassung ──
  console.log('\n─────────────────────────────────────────')
  console.log(`✅ Erfolgreich: ${successCount} Seiten`)
  console.log(`❌ Fehler:      ${errorCount} Seiten`)
  console.log(`📄 Gesamt:      ${pages.length} Seiten`)
  console.log(`💾 Gespeichert: ${outputPath}`)
  console.log(`📊 Dateigröße:  ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`)
  console.log('─────────────────────────────────────────')
  console.log('\n🚀 Jetzt kannst du die Wiki starten: npm run dev\n')
}

main().catch((err) => {
  console.error('\n💥 Fataler Fehler:', err)
  process.exit(1)
})
