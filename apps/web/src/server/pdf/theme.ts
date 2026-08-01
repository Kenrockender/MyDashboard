import { StyleSheet } from '@react-pdf/renderer';

/**
 * Shared look for every generated PDF, so an invoice and a report read as the
 * same product. Colours mirror the app's light-theme tokens from globals.css
 * (paper / ink / accent / border) rather than generic greys, and layout leans
 * on generous whitespace and a single accent rule instead of heavy borders.
 */
export const COLORS = {
  ink: '#211d15',
  inkMuted: '#79705c',
  accent: '#1f6f4f',
  accentSoft: '#eef4f0',
  border: '#e6ded0',
  hair: '#f0e9dd',
  paper: '#ffffff',
  negative: '#af3f28',
} as const;

export const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: COLORS.ink,
    backgroundColor: COLORS.paper,
  },

  // --- Masthead -----------------------------------------------------------
  masthead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
  },
  brand: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: COLORS.ink, letterSpacing: -0.3 },
  brandTag: { fontSize: 8, color: COLORS.inkMuted, letterSpacing: 1.4, marginTop: 3 },
  docTitle: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.ink,
    textAlign: 'right',
  },
  docMeta: { fontSize: 9, color: COLORS.inkMuted, textAlign: 'right', marginTop: 3 },

  // --- Labels & sections --------------------------------------------------
  label: {
    fontSize: 7.5,
    color: COLORS.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.ink,
    marginBottom: 8,
  },

  // --- Tables -------------------------------------------------------------
  tableHead: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: COLORS.accentSoft,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  th: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tr: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.hair,
  },
  td: { fontSize: 9.5, color: COLORS.ink },
  tdMuted: { fontSize: 9.5, color: COLORS.inkMuted },

  // --- Footer -------------------------------------------------------------
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    fontSize: 7.5,
    color: COLORS.inkMuted,
  },
});

/** `YYYY-MM-DD`, matching how dates render throughout the app. */
export function toDateString(value: Date | string): string {
  return new Date(value).toISOString().slice(0, 10);
}
