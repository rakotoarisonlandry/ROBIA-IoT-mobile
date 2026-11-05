import type { TicketExporter } from '../../application/booking/ports';

export const ticketExporter: TicketExporter = {
  async export(ticket) {
    const { createTicketPdf } = await import('./ticket-pdf');
    const bytes = await createTicketPdf(ticket);
    const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `Robia-ticket-${ticket.id}.pdf`;
    document.body.appendChild(link);
    try { link.click(); }
    finally {
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }
  },
};
