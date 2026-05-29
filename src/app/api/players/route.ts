import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Player from '@/models/player';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const position = searchParams.get('position') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || ''; // 'sold' | 'unsold' | ''

    // Build query object
    const query: Record<string, unknown> = {};

    if (search) {
      query.playerName = { $regex: search, $options: 'i' };
    }

    if (position) {
      query.position = position;
    }

    if (category) {
      query.category = category;
    }

    if (status === 'sold') {
      query.isSold = true;
    } else if (status === 'unsold') {
      query.isSold = false;
    }

    const players = await Player.find(query).sort({ playerName: 1 }).populate('soldTo', 'teamName logo');
    return NextResponse.json(players);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to fetch players' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const {
      playerName,
      position,
      category,
      phoneNumber,
      age,
      place,
      photo,
      basePrice,
    } = body;

    if (!playerName || !position || !category || !phoneNumber || basePrice === undefined) {
      return NextResponse.json({ error: 'Core fields (playerName, position, category, phoneNumber, basePrice) are required' }, { status: 400 });
    }

    const player = await Player.create({
      playerName,
      position,
      category,
      phoneNumber,
      age: age ? Number(age) : undefined,
      place: place || undefined,
      photo: photo || '/players/default.png',
      basePrice,
      soldPrice: 0,
      soldTo: null,
      isSold: false,
    });

    return NextResponse.json(player, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to create player' }, { status: 500 });
  }
}
