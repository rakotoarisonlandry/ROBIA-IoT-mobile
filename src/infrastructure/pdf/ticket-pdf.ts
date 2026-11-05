import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';

import type { TicketDocument as PdfTicket } from '../../application/booking/ports';

/** Generates the file locally, including a vector QR code with its quiet zone. */
export async function createTicketPdf(ticket: PdfTicket): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Robia - Ticket ${ticket.id}`);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const supported = new Set(font.getCharacterSet());
  const safeText = (value: string) => Array.from(value.normalize('NFC'))
    .map(char => supported.has(char.codePointAt(0)!) ? char : ' ')
    .join('');
  let page = pdf.addPage([595, 842]);
  let y = 785;
  const text = (value: string, size = 12, strong = false) => {
    const face = strong ? bold : font;
    const words = safeText(value).split(/\s+/);
    let line = '';
    const write = () => {
      if (y < 65) { page = pdf.addPage([595, 842]); y = 785; }
      page.drawText(line, { x: 48, y, size, font: face, color: rgb(.12, .12, .12) });
      y -= size + 9;
    };
    for (const word of words) {
      // Split very long names/references as well as ordinary text.
      for (const char of `${word} `) {
        if (face.widthOfTextAtSize(line + char, size) > 499) { write(); line = ''; }
        line += char;
      }
    }
    if (line.trim()) write();
  };
  page.drawText('robia.', { x: 48, y, size: 32, font: bold, color: rgb(1, .4, 0) });
  y -= 50;
  text('VOTRE RENDEZ-VOUS EN BOUTIQUE', 11);
  text(ticket.id, 38, true);
  text(ticket.name, 18, true);
  text(ticket.shopName, 14, true);
  text(ticket.address);
  text(`${ticket.date} à ${ticket.time}`);
  text(ticket.services.join(' · '));
  text(`Conseiller : ${ticket.agent}`);
  y -= 14;
  const qr = QRCode.create(ticket.reference, { errorCorrectionLevel: 'M' });
  const quietZone = 4;
  const cell = 160 / (qr.modules.size + quietZone * 2);
  if (y < 250) { page = pdf.addPage([595, 842]); y = 785; }
  const top = y;
  for (let row = 0;row < qr.modules.size;row++) {
    for (let col = 0;col < qr.modules.size;col++) {
      if (qr.modules.get(row, col)) {
        page.drawRectangle({
          x: 48 + (col + quietZone) * cell,
          y: top - (row + quietZone + 1) * cell,
          width: cell, height: cell, color: rgb(0, 0, 0),
        });
      }
    }
  }
  y -= 180;
  text(ticket.reference, 9);
  text('Présentez votre CIN originale et arrivez 10 minutes à l’avance.', 10);
  text('Ticket de démonstration — disponibilité à confirmer en boutique.', 10);
  return pdf.save();
}

