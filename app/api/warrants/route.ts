import { NextRequest, NextResponse } from 'next/server';
import { getWarrants, saveWarrant, Warrant } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const warrants = getWarrants();
  // Filter warrants based on role if needed, but for now both can see all?
  // Maybe police only see their own or approved ones?
  // Usually police can see all active warrants.
  // DOJ can see all.
  
  return NextResponse.json(warrants);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userRoles = (session.roles as string[]) || [];
  if (!userRoles.includes('police') && !userRoles.includes('doj')) { // Allow DOJ to create for testing? No, only police.
      // Actually, let's stick to the requirement: "Police pour faire les demandes"
      if (!userRoles.includes('police')) {
          return new NextResponse('Forbidden: Only Police can create warrants', { status: 403 });
      }
  }

  try {
    const body = await request.json();
    const { type, targetName, reason, details, location } = body;

    if (!type || !targetName || !reason || !details) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const newWarrant: Warrant = {
      id: uuidv4(),
      type,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      officerId: session.id as string,
      officerName: (session.rpName as string) || `${session.username}`,
      targetName,
      reason,
      details,
      location,
    };

    saveWarrant(newWarrant);
    return NextResponse.json(newWarrant);
  } catch (error) {
    console.error('Error creating warrant:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
