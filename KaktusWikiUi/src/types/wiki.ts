export interface HeadingBlock {
  type: 'heading'
  level: 2 | 3 | 4 | 5
  content: string
}

export interface ParagraphBlock {
  type: 'paragraph'
  content: string
}

/** A table cell is either plain text or an inline image (e.g. the Fundort/Rune icon columns) */
export type TableCell = string | { img: string; alt: string }

export interface TableBlock {
  type: 'table'
  headers: string[]
  rows: TableCell[][]
}

export interface ListBlock {
  type: 'list'
  ordered: boolean
  items: string[]
}

export interface ImageBlock {
  type: 'image'
  src: string
  alt: string
}

export type ContentBlock =
  | HeadingBlock
  | ParagraphBlock
  | TableBlock
  | ListBlock
  | ImageBlock

export interface WikiPage {
  url: string
  slug: string
  title: string
  category: string
  blocks: ContentBlock[]
  scrapedAt: string
  error?: boolean
}

export interface WikiData {
  pages: WikiPage[]
  scrapedAt: string
  totalPages: number
  version: string
}

export interface CategoryInfo {
  id: string
  title: string
  emoji: string
  color: string
  pages: PageLink[]
}

export interface PageLink {
  slug: string
  title: string
  url: string
}
