import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Directory, File, Paths } from 'expo-file-system';
import QRCode from 'qrcode';
import type { TicketDocument, TicketExporter } from '../../application/booking/ports';
import { createTicketPdf } from './ticket-pdf';

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]!);

/** e.g. "Ticket-Robia-A1B2C3.pdf" — no "#", spaces or other characters a file system may refuse. */
export const ticketFileName = (id: string) => `Ticket-Robia-${id.replace(/[^A-Za-z0-9-]/g, '') || 'rendez-vous'}.pdf`;

/**
 * Android 11+ refuses the root of "Téléchargements" in the folder picker, so it
 * opens on "Documents", which can be used as is (the customer can still browse).
 */
const ANDROID_DOCUMENTS = 'content://com.android.externalstorage.documents/document/primary%3ADocuments';
let lastFolder: string | undefined;

async function ticketHtml(ticket: TicketDocument): Promise<string> {
  const qr = await QRCode.toString(ticket.reference, { type: 'svg', margin: 2 });
  const status = ticket.status ? ({ pending: 'Demande transmise, en attente de confirmation par la boutique.', confirmed: 'Rendez-vous confirmé par la boutique.', rejected: 'Demande refusée par la boutique.', cancelled: 'Rendez-vous annulé.' }[ticket.status]) : 'Enregistré sur cet appareil, non transmis à la boutique. Rendez-vous à confirmer.';
  return `<!doctype html><html><head><meta charset="utf-8"></head>
    <body style="font-family:Arial,Helvetica,sans-serif;padding:40px;color:#202124">
    <h1 style="color:#ff6600;margin:0">robia.</h1><p style="letter-spacing:2px;color:#60646c;font-size:12px">VOTRE RENDEZ-VOUS EN BOUTIQUE</p>
    <h1 style="font-size:28px;margin:24px 0 4px">Ticket ${escapeHtml(ticket.id)}</h1><h2 style="margin:0 0 16px">${escapeHtml(ticket.name)}</h2>
    <p>${escapeHtml(ticket.shopName)} — ${escapeHtml(ticket.address)}</p>
    <p><strong>${escapeHtml(ticket.date)} à ${escapeHtml(ticket.time)}</strong></p>
    <p>${ticket.services.map(escapeHtml).join(' · ')}</p>
    <p>Conseiller : ${escapeHtml(ticket.agent)}</p><div style="width:200px;margin:16px 0">${qr}</div>
    <p style="font-family:monospace;font-size:10px;color:#85858a">Réf. ${escapeHtml(ticket.reference)}</p>
    <p>Présentez votre CIN originale et arrivez 10 minutes à l’avance.</p>
    <p>${escapeHtml(status)}</p></body></html>`;
}

/** The PDF bytes: pure JavaScript first (no WebView involved), the system print engine as a fallback. */
async function renderPdf(ticket: TicketDocument): Promise<Uint8Array> {
  try { return await createTicketPdf(ticket); }
  catch (first) {
    if (__DEV__) console.warn('pdf-lib failed, trying expo-print', first);
    const { uri } = await Print.printToFileAsync({ html: await ticketHtml(ticket) });
    return new File(uri).bytes();
  }
}

/** A cache copy with a readable name, used for sharing. */
function cacheCopy(name: string, bytes: Uint8Array): File {
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(bytes);
  return file;
}

/** Android: let the customer choose a folder, then write the PDF there. False when they close the picker. */
async function saveToChosenFolder(name: string, bytes: Uint8Array): Promise<boolean> {
  let folder: Directory;
  try { folder = await Directory.pickDirectoryAsync(lastFolder ?? ANDROID_DOCUMENTS); }
  catch { return false; }
  lastFolder = folder.uri;
  const target = folder.createFile(name, 'application/pdf');
  await target.write(bytes);
  return true;
}

export const ticketExporter: TicketExporter = {
  async export(ticket) {
    const name = ticketFileName(ticket.id);
    const bytes = await renderPdf(ticket);
    if (Platform.OS === 'android') {
      try { if (await saveToChosenFolder(name, bytes)) return 'saved'; }
      catch (cause) { if (__DEV__) console.warn('Saving to the chosen folder failed, sharing instead', cause); }
    }
    const file = cacheCopy(name, bytes);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Enregistrer ou partager le ticket' });
      return 'shared';
    }
    await Print.printAsync({ uri: file.uri });
    return 'shared';
  },
};
