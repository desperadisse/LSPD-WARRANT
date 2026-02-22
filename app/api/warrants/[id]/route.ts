import { NextRequest, NextResponse } from 'next/server';
import { getWarrantById, saveWarrant, Warrant } from '@/lib/db';
import { getSession } from '@/lib/auth';

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
      warrant.judgeName = `${session.username}#${session.discriminator}`;
      warrant.updatedAt = new Date().toISOString();
    } else if (status === 'rejected') {
      warrant.status = 'rejected';
      warrant.judgeId = session.id as string;
      warrant.judgeName = `${session.username}#${session.discriminator}`;
      warrant.rejectionReason = rejectionReason;
      warrant.updatedAt = new Date().toISOString();
    } else {
      return new NextResponse('Invalid status', { status: 400 });
    }

    saveWarrant(warrant);
    return NextResponse.json(warrant);
  } catch (error) {
    console.error('Error updating warrant:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
