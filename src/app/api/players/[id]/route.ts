import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Player from '@/models/player';
import Team from '@/models/team';

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: Props
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const player = await Player.findById(id).populate('soldTo', 'teamName logo');
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }
    return NextResponse.json(player);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to fetch player' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: Props
) {
  try {
    await connectToDatabase();
    const { id } = await params;
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
      isSold,
      soldPrice,
      soldTo,
    } = body;

    if (!playerName || !position || !category || !phoneNumber || basePrice === undefined) {
      return NextResponse.json({ error: 'Core fields are required' }, { status: 400 });
    }

    const player = await Player.findById(id);
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Handle Sale Status updates and sync with Team balance
    if (player.isSold && isSold === false) {
      // Refund the team
      if (player.soldTo) {
        const team = await Team.findById(player.soldTo);
        if (team) {
          team.balance += player.soldPrice;
          team.totalSpent -= player.soldPrice;
          team.buyedPlayers = team.buyedPlayers.filter(
            (pId) => pId.toString() !== player._id.toString()
          );
          await team.save();
        }
      }
      player.isSold = false;
      player.soldPrice = 0;
      player.soldTo = null;
    } else if (isSold === true) {
      const targetTeamId = soldTo && typeof soldTo === 'object' ? soldTo._id : soldTo;
      const targetSoldPrice = Number(soldPrice) || 0;

      const oldSoldTo = player.soldTo ? player.soldTo.toString() : null;
      const oldSoldPrice = player.soldPrice;

      if (oldSoldTo !== targetTeamId || oldSoldPrice !== targetSoldPrice) {
        // Refund old team if previously sold
        if (player.isSold && player.soldTo) {
          const oldTeam = await Team.findById(player.soldTo);
          if (oldTeam) {
            oldTeam.balance += player.soldPrice;
            oldTeam.totalSpent -= player.soldPrice;
            oldTeam.buyedPlayers = oldTeam.buyedPlayers.filter(
              (pId) => pId.toString() !== player._id.toString()
            );
            await oldTeam.save();
          }
        }

        // Charge new team
        if (targetTeamId) {
          const newTeam = await Team.findById(targetTeamId);
          if (newTeam) {
            newTeam.balance -= targetSoldPrice;
            newTeam.totalSpent += targetSoldPrice;
            newTeam.buyedPlayers.push(player._id);
            await newTeam.save();
          }
        }

        player.isSold = true;
        player.soldPrice = targetSoldPrice;
        player.soldTo = targetTeamId;
      }
    }

    // Update Core Fields
    player.playerName = playerName;
    player.position = position;
    player.category = category;
    player.phoneNumber = phoneNumber;
    player.age = age ? Number(age) : undefined;
    player.place = place || undefined;
    player.photo = photo || '/players/default.png';
    player.basePrice = Number(basePrice);

    await player.save();

    return NextResponse.json(player);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to update player' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: Props
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const player = await Player.findById(id);
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // If player was sold, refund the buying team
    if (player.isSold && player.soldTo) {
      const team = await Team.findById(player.soldTo);
      if (team) {
        team.balance += player.soldPrice;
        team.totalSpent -= player.soldPrice;
        team.buyedPlayers = team.buyedPlayers.filter(
          (pId) => pId.toString() !== player._id.toString()
        );
        await team.save();
      }
    }

    // Delete player
    await Player.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Player deleted and roster adjusted successfully' });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Failed to delete player' }, { status: 500 });
  }
}
