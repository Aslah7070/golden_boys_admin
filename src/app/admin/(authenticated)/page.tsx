'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuctionStore } from '@/store/auctionStore';
import { fetchTeams, fetchPlayers, buyPlayer } from '@/services/api';
import { Team, Player } from '@/types';
import { 
  Gavel, 
  Coins, 
  Users, 
  ShieldAlert, 
  Check, 
  UserCheck, 
  UserX,
  Phone,
  MapPin,
  Calendar
} from 'lucide-react';

export default function AdminPage() {
  const queryClient = useQueryClient();
  const showToast = useAuctionStore((state) => state.showToast);

  // Bidding Panel State
  const [biddingPlayerId, setBiddingPlayerId] = useState<string | null>(null);
  const [biddingTeamId, setBiddingTeamId] = useState('');
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [biddingError, setBiddingError] = useState('');

  // Query - Fetch all teams
  const { data: teams, isLoading: isLoadingTeams } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: fetchTeams,
  });

  // Query - Fetch all players (filtering for unsold in the auction view)
  const { data: players, isLoading: isLoadingPlayers } = useQuery<Player[]>({
    queryKey: ['players', { status: 'all' }],
    queryFn: () => fetchPlayers({ search: '', position: '', category: '', status: 'all' }),
  });

  const unsoldPlayers = players?.filter((p) => !p.isSold) || [];

  // Mutation - Buy Player (Auction)
  const buyMutation = useMutation({
    mutationFn: buyPlayer,
    onSuccess: (data) => {
      showToast(`SUCCESS: Sold to ${data.teamName} for ₹${data.player.soldPrice.toLocaleString('en-IN')}!`, 'success');
      queryClient.invalidateQueries();
      setBiddingPlayerId(null);
      setBiddingTeamId('');
      setBiddingError('');
    },
    onError: (error: any) => {
      setBiddingError(error.message || 'Transaction failed');
      showToast(error.message || 'Failed to complete sale.', 'error');
    },
  });

  // Handle Auction Sale Confirm
  const handleConfirmSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!biddingPlayerId || !biddingTeamId) {
      setBiddingError('Please select a team.');
      return;
    }

    const biddingTeam = teams?.find((t) => t._id === biddingTeamId);
    const biddingPlayer = players?.find((p) => p._id === biddingPlayerId);

    if (!biddingTeam || !biddingPlayer) return;

    if (bidAmount < biddingPlayer.basePrice) {
      setBiddingError(`Bid must be at least base price ₹${biddingPlayer.basePrice.toLocaleString('en-IN')}`);
      return;
    }

    if (bidAmount > biddingTeam.balance) {
      setBiddingError(`Insufficient team balance. Club only has ₹${biddingTeam.balance.toLocaleString('en-IN')}`);
      return;
    }

    buyMutation.mutate({
      playerId: biddingPlayerId,
      teamId: biddingTeamId,
      bidAmount,
    });
  };

  const renderPlayerPhoto = (player: Player, className = 'w-10 h-10') => {
    const photo = player.photo || player.playerImage;
    const pName = player.playerName || player.name || 'Unknown Player';
    if (photo && photo !== '/players/default.png' && !photo.startsWith('/players/default')) {
      return <img src={photo} alt={pName} className={`${className} rounded-full object-cover border border-white/10`} />;
    }
    const initials = pName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    return (
      <div className={`${className} rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs uppercase`}>
        {initials}
      </div>
    );
  };

  const selectedBiddingPlayer = players?.find((p) => p._id === biddingPlayerId);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white uppercase flex items-center gap-2.5">
          <Gavel className="w-8 h-8 text-amber-500" />
          <span>Live Auction Manager</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor the bidding pool, select active players, and execute transactions to build team rosters.
        </p>
      </div>

      {/* Admin Quick Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4 border-white/5 flex flex-col justify-between h-24">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Teams Registered</span>
          <div className="flex items-baseline justify-between mt-2">
            <h2 className="text-2xl font-black text-white">{isLoadingTeams ? '...' : teams?.length || 0}</h2>
            <Coins className="w-5 h-5 text-amber-500/30" />
          </div>
        </div>
        <div className="glass-card rounded-xl p-4 border-white/5 flex flex-col justify-between h-24">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Unsold Players</span>
          <div className="flex items-baseline justify-between mt-2">
            <h2 className="text-2xl font-black text-emerald-400">{isLoadingPlayers ? '...' : unsoldPlayers.length}</h2>
            <UserX className="w-5 h-5 text-emerald-500/30" />
          </div>
        </div>
        <div className="glass-card rounded-xl p-4 border-white/5 flex flex-col justify-between h-24">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sold Players</span>
          <div className="flex items-baseline justify-between mt-2">
            <h2 className="text-2xl font-black text-rose-400">
              {isLoadingPlayers ? '...' : (players?.length || 0) - unsoldPlayers.length}
            </h2>
            <UserCheck className="w-5 h-5 text-rose-500/30" />
          </div>
        </div>
        <div className="glass-card rounded-xl p-4 border-white/5 flex flex-col justify-between h-24">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Player Pool</span>
          <div className="flex items-baseline justify-between mt-2">
            <h2 className="text-2xl font-black text-slate-100">{isLoadingPlayers ? '...' : players?.length || 0}</h2>
            <Users className="w-5 h-5 text-slate-500/30" />
          </div>
        </div>
      </div>

      {/* Main Auction Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Unsold Players List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Available Players in Auction Pool</span>
            <span className="text-xs bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/20 font-mono">
              {unsoldPlayers.length} Left
            </span>
          </h2>

          {isLoadingPlayers ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-24 bg-slate-900/50 border border-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : unsoldPlayers.length === 0 ? (
            <div className="p-12 text-center glass-card rounded-2xl border-white/5">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                <Check className="w-6 h-6" />
              </div>
              <p className="text-base text-slate-200 font-bold">All players have been sold!</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">There are no unsold players left in the tournament pool. All team rosters are complete.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unsoldPlayers.map((player) => (
                <div 
                  key={player._id} 
                  className={`glass-card rounded-xl p-4 border flex justify-between items-center transition-all ${
                    biddingPlayerId === player._id 
                      ? 'border-amber-500/50 bg-amber-500/10 shadow-lg shadow-amber-500/5 translate-y-[-2px]' 
                      : 'border-white/5 hover:border-white/10 hover:bg-slate-900/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {renderPlayerPhoto(player, "w-11 h-11")}
                    <div>
                      <h4 className="font-bold text-slate-100">{player.playerName || player.name || 'Unknown Player'}</h4>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <span className="text-[9px] uppercase font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          {player.position.replace('_', ' ')}
                        </span>
                        <span className="text-[9px] uppercase font-black text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                          {player.category}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 font-bold bg-white/5 px-1.5 py-0.5 rounded">
                          Base: ₹{player.basePrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setBiddingPlayerId(player._id);
                      setBiddingTeamId('');
                      setBidAmount(player.basePrice);
                      setBiddingError('');
                    }}
                    className={`rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                      biddingPlayerId === player._id
                        ? 'bg-amber-500 text-slate-950 shadow-md glow-gold scale-95'
                        : 'bg-slate-900 border border-white/5 text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {biddingPlayerId === player._id ? 'Bidding...' : 'Bid'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bidding Control Panel */}
        <div>
          <div className="glass-card rounded-2xl p-6 border-white/5 sticky top-24 shadow-2xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
              <Gavel className="w-4 h-4 text-amber-500" />
              <span>Bidding Desk</span>
            </h3>

            {!biddingPlayerId ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                Select an available player from the list to start the transaction flow.
              </div>
            ) : (
              <form onSubmit={handleConfirmSale} className="space-y-5">
                {/* Selected player metadata summary card */}
                {selectedBiddingPlayer && (
                  <div className="p-4 bg-slate-950/60 border border-white/10 rounded-xl flex items-center gap-3">
                    {renderPlayerPhoto(selectedBiddingPlayer, "w-12 h-12")}
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-white uppercase tracking-wide">
                        {selectedBiddingPlayer.playerName || selectedBiddingPlayer.name || 'Unknown Player'}
                      </div>
                      <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1.5">
                        <span>Base:</span>
                        <span className="text-amber-400 font-mono font-bold">
                          ₹{selectedBiddingPlayer.basePrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {selectedBiddingPlayer.place} • {selectedBiddingPlayer.age} Yrs
                      </div>
                    </div>
                  </div>
                )}

                {/* Team Dropdown */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                    Selling to Team
                  </label>
                  {isLoadingTeams ? (
                    <div className="h-10 bg-slate-900 rounded-xl animate-pulse" />
                  ) : (
                    <select
                      value={biddingTeamId}
                      onChange={(e) => setBiddingTeamId(e.target.value)}
                      required
                      className="w-full h-11 bg-slate-950 border border-white/10 rounded-xl px-3 text-slate-200 text-xs font-bold focus:outline-none focus:border-amber-500 transition-colors"
                    >
                      <option value="">-- Select Purchaser Team --</option>
                      {teams?.map((team) => {
                        const cannotAfford = selectedBiddingPlayer && team.balance < selectedBiddingPlayer.basePrice;
                        return (
                          <option 
                            key={team._id} 
                            value={team._id}
                            disabled={cannotAfford}
                            className={cannotAfford ? 'text-slate-600 bg-slate-950' : 'text-slate-200 bg-slate-950'}
                          >
                            {team.teamName} (Avail: ₹{team.balance.toLocaleString('en-IN')})
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>

                {/* Bid Input */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                    Final Sold Price (₹)
                      </label>
                      <input
                        type="number"
                        min={selectedBiddingPlayer?.basePrice || 0}
                        step={500}
                        value={bidAmount || ''}
                        onChange={(e) => setBidAmount(Number(e.target.value))}
                        required
                        className="w-full h-11 bg-slate-950 border border-white/10 rounded-xl px-3 text-slate-200 text-sm font-black focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>

                    {/* Error Alerts */}
                    {biddingError && (
                      <div className="p-3 bg-rose-950/30 border border-rose-500/20 rounded-xl text-[10px] text-rose-300 flex items-start gap-2">
                        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                        <span className="font-semibold leading-relaxed">{biddingError}</span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setBiddingPlayerId(null);
                          setBiddingTeamId('');
                          setBiddingError('');
                        }}
                        className="flex-1 h-11 rounded-xl bg-slate-900 border border-white/5 hover:bg-slate-800 text-xs font-bold text-slate-400 hover:text-white transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={buyMutation.isPending || !biddingTeamId}
                        className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-black text-slate-950 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {buyMutation.isPending ? 'Saving Bid...' : 'Confirm Sale'}
                      </button>
                    </div>
                  </form>
                )}
          </div>
        </div>
      </div>
    </div>
  );
}
