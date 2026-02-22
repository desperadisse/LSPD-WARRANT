import jsPDF from 'jspdf';
import { Warrant } from '@/lib/db';

function getWarrantTitle(type: string): string {
  if (type === 'perquisition') return 'MANDAT DE PERQUISITION';
  if (type === 'arrestation') return "MANDAT D'ARRESTATION";
  return 'REQUISITION JUDICIAIRE';
}

export function generateWarrantPDFBuffer(warrant: Warrant): ArrayBuffer {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  const innerW = pageW - margin * 2;

  // --- Outer border (double frame) ---
  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(1.5);
  doc.rect(margin, margin, innerW, 267);
  doc.setLineWidth(0.3);
  doc.rect(margin + 3, margin + 3, innerW - 6, 261);

  // --- Header ---
  let y = 28;
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text('STATE OF SAN ANDREAS', pageW / 2, y, { align: 'center' });

  y += 8;
  doc.setFontSize(20);
  doc.setTextColor(20, 20, 20);
  doc.text('LOS SANTOS POLICE DEPARTMENT', pageW / 2, y, { align: 'center' });

  y += 8;
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text('DEPARTMENT OF JUSTICE', pageW / 2, y, { align: 'center' });

  // Decorative lines under header
  y += 5;
  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(1);
  doc.line(margin + 20, y, pageW - margin - 20, y);
  doc.setLineWidth(0.3);
  doc.line(margin + 20, y + 2, pageW - margin - 20, y + 2);

  // --- Document title ---
  y += 14;
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(20, 20, 20);
  doc.text(getWarrantTitle(warrant.type), pageW / 2, y, { align: 'center' });

  // Reference number
  y += 8;
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Ref: ${warrant.id.toUpperCase().slice(0, 8)} | ${new Date(warrant.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageW / 2, y, { align: 'center' });

  // --- Info box ---
  y += 10;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.setFillColor(248, 248, 246);
  doc.roundedRect(margin + 8, y, innerW - 16, warrant.location ? 40 : 32, 2, 2, 'FD');

  y += 8;
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);

  const labelX = margin + 14;
  const valueX = margin + 60;

  doc.setFont('times', 'bold');
  doc.text('Date :', labelX, y);
  doc.setFont('times', 'normal');
  doc.text(new Date(warrant.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }), valueX, y);

  y += 8;
  doc.setFont('times', 'bold');
  doc.text('Officier :', labelX, y);
  doc.setFont('times', 'normal');
  doc.text(warrant.officerName, valueX, y);

  y += 8;
  doc.setFont('times', 'bold');
  doc.text('Cible :', labelX, y);
  doc.setFont('times', 'normal');
  doc.text(warrant.targetName, valueX, y);

  if (warrant.location) {
    y += 8;
    doc.setFont('times', 'bold');
    doc.text('Lieu :', labelX, y);
    doc.setFont('times', 'normal');
    doc.text(warrant.location, valueX, y);
  }

  // --- Motif section ---
  y += 16;
  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(0.5);
  doc.line(margin + 8, y, margin + 8 + 40, y);
  y += 6;
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('MOTIF', margin + 8, y);

  y += 7;
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  const splitReason = doc.splitTextToSize(warrant.reason, innerW - 24);
  doc.text(splitReason, margin + 8, y);
  y += splitReason.length * 5.5;

  // --- Details section ---
  y += 8;
  doc.setLineWidth(0.5);
  doc.line(margin + 8, y, margin + 8 + 40, y);
  y += 6;
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text('DETAILS ET PREUVES', margin + 8, y);

  y += 7;
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  const splitDetails = doc.splitTextToSize(warrant.details, innerW - 24);
  doc.text(splitDetails, margin + 8, y);

  // --- Footer / Decision ---
  const footerY = 228;
  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(0.8);
  doc.line(margin + 8, footerY, pageW - margin - 8, footerY);

  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text('DECISION DU MAGISTRAT', margin + 8, footerY + 8);

  if (warrant.status === 'approved') {
    doc.setFontSize(13);
    doc.setTextColor(0, 100, 0);
    doc.setFont('times', 'bold');
    doc.text('APPROUVE', margin + 8, footerY + 18);

    doc.setTextColor(20, 20, 20);
    doc.setFontSize(10);
    doc.setFont('times', 'normal');
    doc.text(`Valide par: ${warrant.judgeName}`, margin + 8, footerY + 26);
    doc.text(`Date: ${new Date(warrant.updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`, margin + 8, footerY + 32);

    // Stamp
    doc.setDrawColor(0, 100, 0);
    doc.setLineWidth(2);
    doc.roundedRect(pageW - margin - 58, footerY + 4, 50, 30, 3, 3);
    doc.setTextColor(0, 100, 0);
    doc.setFontSize(14);
    doc.setFont('courier', 'bold');
    doc.text('VALIDE', pageW - margin - 33, footerY + 22, { align: 'center', angle: 12 });

    doc.setDrawColor(0, 100, 0);
    doc.setLineWidth(0.5);
    doc.circle(pageW - margin - 33, footerY + 19, 12);
  } else if (warrant.status === 'rejected') {
    doc.setFontSize(13);
    doc.setTextColor(150, 0, 0);
    doc.setFont('times', 'bold');
    doc.text('REJETE', margin + 8, footerY + 18);

    doc.setTextColor(20, 20, 20);
    doc.setFontSize(10);
    doc.setFont('times', 'normal');
    doc.text(`Rejete par: ${warrant.judgeName}`, margin + 8, footerY + 26);
    if (warrant.rejectionReason) {
      const splitRej = doc.splitTextToSize(`Motif: ${warrant.rejectionReason}`, innerW - 24);
      doc.text(splitRej, margin + 8, footerY + 32);
    }
  } else if (warrant.status === 'cancelled') {
    doc.setFontSize(13);
    doc.setTextColor(100, 100, 100);
    doc.setFont('times', 'bold');
    doc.text('ANNULE', margin + 8, footerY + 18);

    doc.setTextColor(20, 20, 20);
    doc.setFontSize(10);
    doc.setFont('times', 'normal');
    doc.text(`Annule par: ${warrant.judgeName}`, margin + 8, footerY + 26);
  } else {
    doc.setFontSize(11);
    doc.setTextColor(180, 140, 0);
    doc.setFont('times', 'italic');
    doc.text('EN ATTENTE DE VALIDATION', margin + 8, footerY + 18);
  }

  // --- Bottom bar ---
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(7);
  doc.setFont('courier', 'normal');
  doc.text('DOCUMENT OFFICIEL - LOS SANTOS POLICE DEPARTMENT / DEPARTMENT OF JUSTICE', pageW / 2, 277, { align: 'center' });

  return doc.output('arraybuffer');
}
