import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Team from '@/models/team';
import Player from '@/models/player'; // Ensure Player model is registered for populate

export async function GET() {
  try {
    await connectToDatabase();
    const teams = await Team.find({}).sort({ teamName: 1 }).populate('buyedPlayers');
    return NextResponse.json(teams);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to fetch teams' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
    const { teamName, logo, balance } = body;
    
    if (!teamName) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    const team = await Team.create({
      teamName,
      logo: logo || '/teams/default.png',
      balance: balance !== undefined ? balance : 50000,
      totalSpent: 0,
      buyedPlayers: [],
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to create team' }, { status: 500 });
  }
}
