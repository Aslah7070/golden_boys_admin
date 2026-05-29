import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Player from '@/models/player';
import Team from '@/models/team';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
    const { playerId, teamId, bidAmount } = body;

    // Validation
    if (!playerId || !teamId || bidAmount === undefined) {
      return NextResponse.json({ error: 'playerId, teamId, and bidAmount are required' }, { status: 400 });
    }

    const bid = Number(bidAmount);
    if (isNaN(bid) || bid <= 0) {
      return NextResponse.json({ error: 'Bid amount must be a valid positive number' }, { status: 400 });
    }

    const player = await Player.findById(playerId);
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    if (player.isSold) {
      return NextResponse.json({ error: 'Cannot buy already sold player' }, { status: 400 });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (team.balance < bid) {
      return NextResponse.json({ error: `Insufficient team balance. Team has ${team.balance}, but bid is ${bid}` }, { status: 400 });
    }

    if (bid < player.basePrice) {
      return NextResponse.json({ error: `Bid amount (${bid}) must be greater than or equal to the base price (${player.basePrice})` }, { status: 400 });
    }

    // Enforce 10 player limit (including manager) and minimum reserved balance for remaining slots
    const currentPlayers = team.buyedPlayers.length + 1; // Manager counts as the first player
    if (currentPlayers >= 10) {
      return NextResponse.json({ error: 'Team already has 10 players (including manager). Cannot buy more.' }, { status: 400 });
    }
    
    const remainingSlotsAfterThis = 10 - (currentPlayers + 1);
    const requiredReservedBalance = remainingSlotsAfterThis * 50;
    const maxAllowedBid = team.balance - requiredReservedBalance;

    if (bid > maxAllowedBid) {
      return NextResponse.json({ 
        error: `Bid rejected! Maximum allowed bid is ₹${maxAllowedBid}. The team needs to reserve ₹${requiredReservedBalance} for their remaining ${remainingSlotsAfterThis} players.` 
      }, { status: 400 });
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // Update player
      player.isSold = true;
      player.soldPrice = bid;
      player.soldTo = new mongoose.Types.ObjectId(teamId);
      await player.save({ session });

      // Update team
      team.balance -= bid;
      team.totalSpent += bid;
      team.buyedPlayers.push(new mongoose.Types.ObjectId(playerId));
      await team.save({ session });

      await session.commitTransaction();
      session.endSession();

      return NextResponse.json({
        message: 'Player bought successfully',
        player,
        teamName: team.teamName,
        remainingBalance: team.balance,
      });
    } catch (transactionError: unknown) {
      await session.abortTransaction();
      session.endSession();
      throw transactionError;
    }
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'An error occurred during purchase' }, { status: 500 });
  }
}
