import type { TicketExporter } from '../../application/booking/ports';

export const ticketExporter: TicketExporter = {
  async export(ticket) {
    const { createTicketPdf } = await import('./ticket-pdf');
    const bytes = await createTicketPdf(ticket);
    const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ticket-Robia-${ticket.id.replace(/[^A-Za-z0-9-]/g, '') || 'rendez-vous'}.pdf`;
    document.body.appendChild(link);
    try { link.click(); }
    finally {
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }
    return 'saved';
  },
};
