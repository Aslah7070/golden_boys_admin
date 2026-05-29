import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Team from '@/models/team';
import Player from '@/models/player';

type Props = {
  params: Promise<{ id: string }>;
};

export async function PUT(
  request: NextRequest,
  { params }: Props
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();
    const { teamName, logo, balance, shortName, managerName, managerImage, coverImage } = body;

    if (!teamName) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    const team = await Team.findById(id);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    team.teamName = teamName;
    if (logo !== undefined) team.logo = logo || '/teams/default.png';
    if (balance !== undefined) team.balance = balance;
    if (shortName !== undefined) team.shortName = shortName;
    if (managerName !== undefined) team.managerName = managerName;
    if (managerImage !== undefined) team.managerImage = managerImage || '/managers/default.png';
    if (coverImage !== undefined) team.coverImage = coverImage || '/teams/covers/default.jpg';

    await team.save();

    return NextResponse.json(team);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to update team' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: Props
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const team = await Team.findById(id);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Reset all players sold to this team back to unsold
    await Player.updateMany(
      { soldTo: id },
      {
        $set: {
          isSold: false,
          soldPrice: 0,
          soldTo: null,
        },
      }
    );

    // Delete the team
    await Team.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Team and associated rosters reset successfully' });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to delete team' }, { status: 500 });
  }
}
