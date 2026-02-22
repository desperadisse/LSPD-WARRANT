import { NextRequest, NextResponse } from 'next/server';
import { getWarrantById, saveWarrant, deleteWarrant } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { notifyOfficerWarrantDecision } from '@/lib/discord';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const warrant = getWarrantById(id);
  if (!warrant) {
    return new NextResponse('Not Found', { status: 404 });
  }

  return NextResponse.json(warrant);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userRoles = (session.roles as string[]) || [];
  // Only DOJ can update status (approve/reject)
  if (!userRoles.includes('doj')) {
    return new NextResponse('Forbidden: Only DOJ can update warrant status', { status: 403 });
  }

  try {
    const body = await request.json();
    const { status, rejectionReason } = body;

    const warrant = getWarrantById(id);
    if (!warrant) {
      return new NextResponse('Not Found', { status: 404 });
    }

    if (status === 'approved') {
      warrant.status = 'approved';
      warrant.judgeId = session.id as string;
      warrant.judgeName = (session.rpName as string) || `${session.username}`;
      warrant.updatedAt = new Date().toISOString();
      warrant.pdfToken = uuidv4();
    } else if (status === 'rejected') {
      warrant.status = 'rejected';
      warrant.judgeId = session.id as string;
      warrant.judgeName = (session.rpName as string) || `${session.username}`;
      warrant.rejectionReason = rejectionReason;
      warrant.updatedAt = new Date().toISOString();
    } else if (status === 'cancelled') {
      warrant.status = 'cancelled';
      warrant.judgeId = session.id as string;
      warrant.judgeName = (session.rpName as string) || `${session.username}`;
      warrant.updatedAt = new Date().toISOString();
    } else {
      return new NextResponse('Invalid status', { status: 400 });
    }

    saveWarrant(warrant);

    notifyOfficerWarrantDecision({
      type: warrant.type,
      targetName: warrant.targetName,
      officerId: warrant.officerId,
      status: warrant.status as 'approved' | 'rejected' | 'cancelled',
      judgeName: warrant.judgeName!,
      rejectionReason: warrant.rejectionReason,
      id: warrant.id,
      pdfToken: warrant.pdfToken,
    }).catch(() => {});

    return NextResponse.json(warrant);
  } catch (error) {
    console.error('Error updating warrant:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userRoles = (session.roles as string[]) || [];
  if (!userRoles.includes('doj')) {
    return new NextResponse('Forbidden: Only DOJ can delete warrants', { status: 403 });
  }

  const deleted = deleteWarrant(id);
  if (!deleted) {
    return new NextResponse('Not Found', { status: 404 });
  }

  return NextResponse.json({ success: true });
}
