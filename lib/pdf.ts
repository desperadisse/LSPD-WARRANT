import jsPDF from 'jspdf';
import { Warrant } from '@/lib/db';

export function generateWarrantPDF(warrant: Warrant) {
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('times', 'normal');

  // Header
  doc.setFontSize(22);
  doc.setFont('times', 'bold');
  doc.text('LOS SANTOS POLICE DEPARTMENT', 105, 20, { align: 'center' });
  
  doc.setFontSize(16);
  doc.text('DEPARTMENT OF JUSTICE', 105, 30, { align: 'center' });

  doc.setLineWidth(0.5);
  doc.line(20, 35, 190, 35);

  // Title
  doc.setFontSize(18);
  doc.setFont('times', 'bold');
  let title = '';
  if (warrant.type === 'perquisition') title = 'MANDAT DE PERQUISITION';
  else if (warrant.type === 'arrestation') title = "MANDAT D'ARRÊT";
  else title = 'RÉQUISITION JUDICIAIRE';
  
  doc.text(title, 105, 50, { align: 'center' });

  // Info Box
  doc.setFontSize(12);
  doc.setFont('times', 'normal');
  
  const startY = 70;
  const lineHeight = 10;

  doc.text(`Date: ${new Date(warrant.createdAt).toLocaleDateString('fr-FR')}`, 20, startY);
  doc.text(`Officier requérant: ${warrant.officerName.split('#')[0]}`, 20, startY + lineHeight);
  doc.text(`Cible: ${warrant.targetName}`, 20, startY + lineHeight * 2);
  
  if (warrant.location) {
    doc.text(`Lieu concerné: ${warrant.location}`, 20, startY + lineHeight * 3);
  }

  // Content
  const contentStartY = startY + lineHeight * (warrant.location ? 5 : 4);
  
  doc.setFont('times', 'bold');
  doc.text('MOTIF:', 20, contentStartY);
  doc.setFont('times', 'normal');
  doc.text(warrant.reason, 20, contentStartY + 7);

  doc.setFont('times', 'bold');
  doc.text('DÉTAILS ET PREUVES:', 20, contentStartY + 20);
  doc.setFont('times', 'normal');
  
  const splitDetails = doc.splitTextToSize(warrant.details, 170);
  doc.text(splitDetails, 20, contentStartY + 27);

  // Footer (Validation)
  const footerY = 240;
  
  doc.line(20, footerY, 190, footerY);
  
  doc.setFontSize(10);
  doc.text('DÉCISION DU JUGE / PROCUREUR', 20, footerY + 10);
  
  if (warrant.status === 'approved') {
    doc.setFontSize(14);
    doc.setTextColor(0, 100, 0);
    doc.text('APPROUVÉ', 20, footerY + 20);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Validé par: ${warrant.judgeName?.split('#')[0]}`, 20, footerY + 30);
    doc.text(`Date: ${new Date(warrant.updatedAt).toLocaleDateString('fr-FR')}`, 20, footerY + 35);
    
    // Stamp
    doc.setDrawColor(0, 100, 0);
    doc.setLineWidth(2);
    doc.rect(130, footerY + 5, 50, 30);
    doc.setTextColor(0, 100, 0);
    doc.setFontSize(16);
    doc.setFont('courier', 'bold');
    doc.text('VALIDÉ', 155, footerY + 22, { align: 'center', angle: 15 });
  } else if (warrant.status === 'rejected') {
    doc.setFontSize(14);
    doc.setTextColor(150, 0, 0);
    doc.text('REJETÉ', 20, footerY + 20);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Rejeté par: ${warrant.judgeName?.split('#')[0]}`, 20, footerY + 30);
    doc.text(`Raison: ${warrant.rejectionReason}`, 20, footerY + 40);
  } else {
    doc.text('EN ATTENTE DE VALIDATION', 20, footerY + 20);
  }

  doc.save(`mandat-${warrant.id.slice(0, 8)}.pdf`);
}
