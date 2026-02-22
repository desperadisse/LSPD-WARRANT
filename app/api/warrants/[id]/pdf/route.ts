import { NextRequest, NextResponse } from 'next/server';
import { getWarrantById } from '@/lib/db';
import { generateWarrantPDFBuffer } from '@/lib/pdf';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return new NextResponse('Missing token', { status: 400 });
  }

  const warrant = getWarrantById(id);
  if (!warrant) {
    return new NextResponse('Not Found', { status: 404 });
  }

  if (warrant.status !== 'approved' || warrant.pdfToken !== token) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const pdfBuffer = generateWarrantPDFBuffer(warrant);

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="mandat-${warrant.id.slice(0, 8)}.pdf"`,
    },
  });
}
