import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import QRCode from 'qrcode';
import type { TicketDocument, TicketExporter } from '../../application/booking/ports';

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]!);

async function ticketHtml(ticket: TicketDocument): Promise<string> {
  const qr = await QRCode.toString(ticket.reference, { type: 'svg' });
  return `<!doctype html><html><head><meta charset="utf-8"></head>
    <body style="font-family:Arial;padding:45px">
    <h1 style="color:#ff6600">robia.</h1><p>VOTRE RENDEZ-VOUS EN BOUTIQUE</p>
    <h1>${escapeHtml(ticket.id)}</h1><h2>${escapeHtml(ticket.name)}</h2>
    <p>${escapeHtml(ticket.shopName)} — ${escapeHtml(ticket.address)}</p>
    <p>${escapeHtml(ticket.date)} à ${escapeHtml(ticket.time)}</p>
    <p>${ticket.services.map(escapeHtml).join(' · ')}</p>
    <p>Conseiller : ${escapeHtml(ticket.agent)}</p><div style="width:180px">${qr}</div>
    <p>${escapeHtml(ticket.reference)}</p>
    <p>Présentez votre CIN originale et arrivez 10 minutes à l’avance.</p>
    <p>Ticket de démonstration — disponibilité à confirmer en boutique.</p></body></html>`;
}

export const ticketExporter: TicketExporter = {
  async export(ticket) {
    const { uri } = await Print.printToFileAsync({ html: await ticketHtml(ticket) });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: '.pdf' });
    } else { await Print.printAsync({ uri }); }
  },
};
