'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuctionStore } from '@/store/auctionStore';
import { 
  fetchTeams,
  fetchPlayers, 
  updatePlayer, 
  deletePlayer 
} from '@/services/api';
import { Team, Player, PlayerPosition, PlayerCategory } from '@/types';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Search, 
  X, 
  ShieldAlert, 
  Phone, 
  MapPin, 
  Calendar, 
  Coins 
} from 'lucide-react';

export default function PlayersAdminPage() {
  const queryClient = useQueryClient();
  const showToast = useAuctionStore((state) => state.showToast);

  // States
  const [playerSearch, setPlayerSearch] = useState('');
  const [playerPositionFilter, setPlayerPositionFilter] = useState('');
  const [playerCategoryFilter, setPlayerCategoryFilter] = useState('');
  const [playerStatusFilter, setPlayerStatusFilter] = useState<'all' | 'sold' | 'unsold'>('all');

  const [isCreatePlayerOpen, setIsCreatePlayerOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Cloudinary Uploader State
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingCreatePhoto, setIsUploadingCreatePhoto] = useState(false);

  const handleUploadCreatePhoto = async (file: File) => {
    setIsUploadingCreatePhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload photo');
      setPlayerPhoto(data.url);
      showToast('SUCCESS: Player photo uploaded!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setIsUploadingCreatePhoto(false);
    }
  };

  const handleUploadPhoto = async (file: File) => {
    if (!editingPlayer) return;
    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload photo');
      setEditingPlayer({ ...editingPlayer, photo: data.url });
      showToast('SUCCESS: Player photo uploaded!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Forms State - Create Player
  const [playerName, setPlayerName] = useState('');
  const [playerPosition, setPlayerPosition] = useState<PlayerPosition>('MIDFIELDER');
  const [playerCategory, setPlayerCategory] = useState<PlayerCategory>('YOUNG');
  const [playerPhone, setPlayerPhone] = useState('');
  const [playerAge, setPlayerAge] = useState<number>(22);
  const [playerPlace, setPlayerPlace] = useState('');
  const [playerBasePrice, setPlayerBasePrice] = useState<number>(25000);
  const [playerPhoto, setPlayerPhoto] = useState('');

  // Query - Fetch all teams (for soldTo dropdown)
  const { data: teams } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: fetchTeams,
  });

  // Query - Fetch all players
  const { data: players, isLoading: isLoadingPlayers } = useQuery<Player[]>({
    queryKey: ['players', { status: 'all' }],
    queryFn: () => fetchPlayers({ search: '', position: '', category: '', status: 'all' }),
  });

  const filteredPlayersList = players?.filter(player => {
    const pName = player.playerName || player.name || 'Unknown Player';
    const matchesSearch = pName.toLowerCase().includes(playerSearch.toLowerCase());
    const matchesPosition = !playerPositionFilter || player.position === playerPositionFilter;
    const matchesCategory = !playerCategoryFilter || player.category === playerCategoryFilter;
    const isSoldState = player.isSold || !!player.team || !!player.soldTo;
    const matchesStatus = playerStatusFilter === 'all' || 
      (playerStatusFilter === 'sold' && isSoldState) || 
      (playerStatusFilter === 'unsold' && !isSoldState);
    return matchesSearch && matchesPosition && matchesCategory && matchesStatus;
  }) || [];

  // Mutation - Create Player
  const createPlayerMutation = useMutation({
    mutationFn: async (newPlayer: any) => {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlayer),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create player');
      return data;
    },
    onSuccess: (data) => {
      showToast(`SUCCESS: ${data.playerName} added!`, 'success');
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setIsCreatePlayerOpen(false);
      setPlayerName('');
      setPlayerPhone('');
      setPlayerAge(22);
      setPlayerPlace('');
      setPlayerBasePrice(25000);
      setPlayerPhoto('');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to register player.', 'error');
    },
  });

  // Mutation - Update Player
  const updatePlayerMutation = useMutation({
    mutationFn: ({ id, params }: { id: string; params: Partial<Player> }) => updatePlayer(id, params),
    onSuccess: (data) => {
      showToast(`SUCCESS: ${data.playerName} updated!`, 'success');
      queryClient.invalidateQueries();
      setEditingPlayer(null);
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to update player.', 'error');
    },
  });

  // Mutation - Delete Player
  const deletePlayerMutation = useMutation({
    mutationFn: (id: string) => deletePlayer(id),
    onSuccess: () => {
      showToast(`SUCCESS: Player deleted!`, 'success');
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to delete player.', 'error');
    },
  });

  // Form Submissions
  const handleCreatePlayerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName || !playerPhone || !playerPlace) return;
    createPlayerMutation.mutate({
      playerName,
      position: playerPosition,
      category: playerCategory,
      phoneNumber: playerPhone,
      age: playerAge,
      place: playerPlace,
      basePrice: playerBasePrice,
      photo: playerPhoto || undefined,
    });
  };

  const handleEditPlayerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer) return;
    updatePlayerMutation.mutate({
      id: editingPlayer._id,
      params: {
        playerName: editingPlayer.playerName,
        position: editingPlayer.position,
        category: editingPlayer.category,
        phoneNumber: editingPlayer.phoneNumber,
        age: editingPlayer.age,
        place: editingPlayer.place,
        photo: editingPlayer.photo,
        basePrice: editingPlayer.basePrice,
        isSold: editingPlayer.isSold,
        soldPrice: editingPlayer.soldPrice,
        soldTo: editingPlayer.soldTo,
      },
    });
  };

  const handleDeletePlayer = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the player "${name}" from the database?`)) {
      deletePlayerMutation.mutate(id);
    }
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white uppercase flex items-center gap-2.5">
          <Users className="w-8 h-8 text-amber-500" />
          <span>Manage Player Pool</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Review, filter, and edit players registered in the database, including setting custom category, price, and purchase status.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 flex-1">
          {/* Search */}
          <div className="relative sm:col-span-1">
            <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search player name..."
              value={playerSearch}
              onChange={(e) => setPlayerSearch(e.target.value)}
              className="w-full h-11 bg-slate-950 border border-white/10 rounded-xl pl-10 pr-4 text-slate-200 text-xs font-medium focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Filter Position */}
          <select
            value={playerPositionFilter}
            onChange={(e) => setPlayerPositionFilter(e.target.value)}
            className="h-11 bg-slate-950 border border-white/10 rounded-xl px-3 text-slate-300 text-xs font-semibold focus:outline-none focus:border-amber-500"
          >
            <option value="">All Positions</option>
            <option value="GOALKEEPER">Goalkeeper</option>
            <option value="DEFENDER">Defender</option>
            <option value="MIDFIELDER">Midfielder</option>
            <option value="LEFT_WING">Left Wing</option>
            <option value="RIGHT_WING">Right Wing</option>
            <option value="STRIKER">Striker</option>
          </select>

          {/* Filter Category */}
          <select
            value={playerCategoryFilter}
            onChange={(e) => setPlayerCategoryFilter(e.target.value)}
            className="h-11 bg-slate-950 border border-white/10 rounded-xl px-3 text-slate-300 text-xs font-semibold focus:outline-none focus:border-amber-500"
          >
            <option value="">All Categories</option>
            <option value="GK">GK</option>
            <option value="ICON">ICON</option>
            <option value="YOUNG">YOUNG</option>
            <option value="LEGEND">LEGEND</option>
          </select>

          {/* Filter Status */}
          <select
            value={playerStatusFilter}
            onChange={(e) => setPlayerStatusFilter(e.target.value as any)}
            className="h-11 bg-slate-950 border border-white/10 rounded-xl px-3 text-slate-300 text-xs font-semibold focus:outline-none focus:border-amber-500"
          >
            <option value="all">All States (Sold & Unsold)</option>
            <option value="unsold">Unsold Only</option>
            <option value="sold">Sold Only</option>
          </select>
        </div>

        <button
          onClick={() => setIsCreatePlayerOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 text-xs font-black text-slate-950 shadow-md transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Player</span>
        </button>
      </div>

      {/* Roster Listing */}
      {isLoadingPlayers ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-16 bg-slate-900/50 border border-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredPlayersList.length === 0 ? (
        <div className="p-16 text-center glass-card rounded-2xl border-white/5">
          <Users className="w-12 h-12 text-slate-600 mb-4 mx-auto" />
          <p className="text-base text-slate-300 font-bold">No players found</p>
          <p className="text-xs text-slate-500 mt-1">Adjust filters or register new players in the database.</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl border-white/5 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-slate-950/40 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-4 px-4 sm:px-6">Player Info</th>
                  <th className="py-4 px-4">Contact</th>
                  <th className="py-4 px-4">Origins</th>
                  <th className="py-4 px-4">Base Pricing</th>
                  <th className="py-4 px-4">Acquisition / Sold Status</th>
                  <th className="py-4 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filteredPlayersList.map((player) => (
                  <tr key={player._id} className="hover:bg-slate-900/20 transition-colors group">
                    {/* Photo + Name + Tags */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        {renderPlayerPhoto(player, "w-10 h-10 shrink-0")}
                        <div>
                          <h4 className="font-extrabold text-white text-sm leading-tight tracking-wide">{player.playerName || player.name || 'Unknown Player'}</h4>
                          <div className="flex gap-1.5 mt-1">
                            <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 px-1 rounded uppercase tracking-wide">
                              {player.position.replace('_', ' ')}
                            </span>
                            <span className="text-[8px] font-black text-blue-400 bg-blue-500/10 px-1 rounded uppercase tracking-wide">
                              {player.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-4 px-4 text-slate-300 font-mono font-medium">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        {player.phoneNumber}
                      </span>
                    </td>

                    {/* Place/Age */}
                    <td className="py-4 px-4 text-slate-400">
                      <div className="space-y-0.5">
                        <div className="text-slate-300 font-semibold">{player.place}</div>
                        <div className="text-[10px] text-slate-500">{player.age} Years Old</div>
                      </div>
                    </td>

                    {/* Base Price */}
                    <td className="py-4 px-4 font-semibold text-slate-200">
                      <span className="font-bold">₹{player.basePrice.toLocaleString('en-IN')}</span>
                    </td>

                    {/* Bought / Sold Status */}
                    <td className="py-4 px-4">
                      {(player.isSold || !!player.team || !!player.soldTo) ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 text-[9px] uppercase font-black text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                            Sold
                          </span>
                          <div className="text-slate-300 font-bold flex items-center gap-1 mt-1">
                            <span className="text-amber-400">₹{(player.soldPrice || player.currentBid || 0).toLocaleString('en-IN')}</span>
                            <span className="text-slate-500 text-[10px]">to</span>
                            <span className="text-slate-100 text-xs font-extrabold truncate max-w-[120px]">
                              {typeof player.soldTo === 'object' && player.soldTo 
                                ? player.soldTo.teamName 
                                : (typeof player.team === 'object' && player.team ? player.team.teamName : 'Unknown Team')}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] uppercase font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          Unsold
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setEditingPlayer({
                            ...player,
                            playerName: player.playerName || player.name || '',
                            photo: player.photo || player.playerImage || '',
                            isSold: player.isSold || !!player.team || !!player.soldTo,
                            soldTo: player.soldTo || player.team || null,
                            soldPrice: player.soldPrice || player.currentBid || 0
                          })}
                          className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/5 hover:border-amber-500/30 text-amber-500 flex items-center justify-center transition-colors cursor-pointer"
                          title="Edit Player"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePlayer(player._id, player.playerName || player.name || 'Unknown Player')}
                          className="w-8 h-8 rounded-lg bg-red-950/20 hover:bg-red-900/20 border border-red-950 text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                          title="Delete Player"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Modal: Add Player */}
      {isCreatePlayerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="glass-card rounded-2xl p-6 sm:p-8 max-w-2xl w-full border-amber-500/20 shadow-2xl relative my-8">
            <button 
              onClick={() => setIsCreatePlayerOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              <span>Add Player to Pool</span>
            </h2>

            <form onSubmit={handleCreatePlayerSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Player Name */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                    Player Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sahal Abdul Samad"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full h-11 bg-slate-950 border border-white/10 rounded-xl px-3 text-slate-200 text-sm font-medium focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={playerPhone}
                      onChange={(e) => setPlayerPhone(e.target.value)}
                      className="w-full h-11 bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3 text-slate-200 text-sm font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Position */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                    Position
                  </label>
                  <select
                    value={playerPosition}
                    onChange={(e) => setPlayerPosition(e.target.value as PlayerPosition)}
                    className="w-full h-11 bg-slate-950 border border-white/10 rounded-xl px-3 text-slate-300 text-xs font-semibold focus:outline-none focus:border-amber-500"
                  >
                    <option value="GOALKEEPER">Goalkeeper</option>
                    <option value="DEFENDER">Defender</option>
                    <option value="MIDFIELDER">Midfielder</option>
                    <option value="LEFT_WING">Left Wing</option>
                    <option value="RIGHT_WING">Right Wing</option>
                    <option value="STRIKER">Striker</option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                    Category
                  </label>
                  <select
                    value={playerCategory}
                    onChange={(e) => setPlayerCategory(e.target.value as PlayerCategory)}
                    className="w-full h-11 bg-slate-950 border border-white/10 rounded-xl px-3 text-slate-300 text-xs font-semibold focus:outline-none focus:border-amber-500"
                  >
                    <option value="GK">GK (Goalkeeper)</option>
                    <option value="ICON">ICON</option>
                    <option value="YOUNG">YOUNG</option>
                    <option value="LEGEND">LEGEND</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Age */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                    Age (Years)
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="number"
                      required
                      min={15}
                      max={50}
                      value={playerAge || ''}
                      onChange={(e) => setPlayerAge(Number(e.target.value))}
                      className="w-full h-11 bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3 text-slate-200 text-sm font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Place */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                    Home Place
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Malappuram"
                      value={playerPlace}
                      onChange={(e) => setPlayerPlace(e.target.value)}
                      className="w-full h-11 bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3 text-slate-200 text-sm font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Base Price */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                    Base Price (₹)
                  </label>
                  <div className="relative">
                    <Coins className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="number"
                      required
                      min={50}
                      step={50}
                      value={playerBasePrice || ''}
                      onChange={(e) => setPlayerBasePrice(Number(e.target.value))}
                      className="w-full h-11 bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3 text-slate-200 text-sm font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Photo Upload Section (Cloudinary) */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Player Photo (Cloudinary - Optional)
                </label>
                <div className="flex items-center gap-3 bg-slate-950/60 border border-white/10 rounded-xl p-3">
                  <div className="w-12 h-12 rounded-full border border-white/10 bg-slate-900 shrink-0 overflow-hidden flex items-center justify-center relative">
                    {isUploadingCreatePhoto ? (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : null}
                    <img 
                      src={playerPhoto || '/players/default.png'} 
                      alt="Player preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <input 
                      type="file" 
                      accept="image/*"
                      id="create-player-photo-upload"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadCreatePhoto(file);
                      }}
                    />
                    <label 
                      htmlFor="create-player-photo-upload"
                      className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
                    >
                      {isUploadingCreatePhoto ? 'Uploading...' : 'Choose Photo File'}
                    </label>
                    <p className="text-[9px] text-slate-500 mt-1">Upload player photo. Cloudinary optimized.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreatePlayerOpen(false)}
                  className="flex-1 h-11 rounded-xl bg-slate-900 border border-white/5 hover:bg-slate-800 text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPlayerMutation.isPending}
                  className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-black text-slate-950 shadow transition-all disabled:opacity-50 cursor-pointer"
                >
                  {createPlayerMutation.isPending ? 'Registering...' : 'Add Player to Pool'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Player */}
      {editingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="glass-card rounded-2xl p-6 sm:p-8 max-w-2xl w-full border-amber-500/20 shadow-2xl relative my-8">
            <button 
              onClick={() => setEditingPlayer(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Edit className="w-5 h-5 text-amber-500" />
              <span>Edit Player: {editingPlayer.playerName}</span>
            </h2>

            <form onSubmit={handleEditPlayerSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Player Name */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                    Player Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPlayer.playerName}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, playerName: e.target.value })}
                    className="w-full h-11 bg-slate-950 border border-white/10 rounded-xl px-3 text-slate-200 text-sm font-medium focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="tel"
                      required
                      value={editingPlayer.phoneNumber}
                      onChange={(e) => setEditingPlayer({ ...editingPlayer, phoneNumber: e.target.value })}
                      className="w-full h-11 bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3 text-slate-200 text-sm font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Position */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                    Position
                  </label>
                  <select
                    value={editingPlayer.position}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, position: e.target.value as PlayerPosition })}
                    className="w-full h-11 bg-slate-950 border border-white/10 rounded-xl px-3 text-slate-300 text-xs font-semibold focus:outline-none focus:border-amber-500"
                  >
                    <option value="GOALKEEPER">Goalkeeper</option>
                    <option value="DEFENDER">Defender</option>
                    <option value="MIDFIELDER">Midfielder</option>
                    <option value="LEFT_WING">Left Wing</option>
                    <option value="RIGHT_WING">Right Wing</option>
                    <option value="STRIKER">Striker</option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                    Category
                  </label>
                  <select
                    value={editingPlayer.category}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, category: e.target.value as PlayerCategory })}
                    className="w-full h-11 bg-slate-950 border border-white/10 rounded-xl px-3 text-slate-300 text-xs font-semibold focus:outline-none focus:border-amber-500"
                  >
                    <option value="GK">GK (Goalkeeper)</option>
                    <option value="ICON">ICON</option>
                    <option value="YOUNG">YOUNG</option>
                    <option value="LEGEND">LEGEND</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Age */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                    Age (Years)
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="number"
                      required
                      min={15}
                      max={50}
                      value={editingPlayer.age}
                      onChange={(e) => setEditingPlayer({ ...editingPlayer, age: Number(e.target.value) })}
                      className="w-full h-11 bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3 text-slate-200 text-sm font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Place */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                    Home Place
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={editingPlayer.place}
                      onChange={(e) => setEditingPlayer({ ...editingPlayer, place: e.target.value })}
                      className="w-full h-11 bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3 text-slate-200 text-sm font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Base Price */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                    Base Price (₹)
                  </label>
                  <div className="relative">
                    <Coins className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="number"
                      required
                      min={50}
                      step={50}
                      value={editingPlayer.basePrice}
                      onChange={(e) => setEditingPlayer({ ...editingPlayer, basePrice: Number(e.target.value) })}
                      className="w-full h-11 bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3 text-slate-200 text-sm font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Photo Upload Section (Cloudinary) */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Player Photo (Cloudinary)
                </label>
                <div className="flex items-center gap-3 bg-slate-950/60 border border-white/10 rounded-xl p-3">
                  <div className="w-12 h-12 rounded-full border border-white/10 bg-slate-900 shrink-0 overflow-hidden flex items-center justify-center relative">
                    {isUploadingPhoto ? (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : null}
                    <img 
                      src={editingPlayer.photo || '/players/default.png'} 
                      alt="Player preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <input 
                      type="file" 
                      accept="image/*"
                      id="edit-player-photo-upload"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadPhoto(file);
                      }}
                    />
                    <label 
                      htmlFor="edit-player-photo-upload"
                      className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
                    >
                      {isUploadingPhoto ? 'Uploading...' : 'Choose Photo File'}
                    </label>
                    <p className="text-[9px] text-slate-500 mt-1">Upload player photo. Cloudinary optimized.</p>
                  </div>
                </div>
              </div>

              {/* Auction Status Sync */}
              <div className="border-t border-white/5 pt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editIsSold"
                    checked={editingPlayer.isSold}
                    onChange={(e) => setEditingPlayer({ 
                      ...editingPlayer, 
                      isSold: e.target.checked,
                      soldPrice: e.target.checked ? (editingPlayer.soldPrice || editingPlayer.basePrice) : 0,
                      soldTo: e.target.checked ? (editingPlayer.soldTo || '') : null
                    })}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <label htmlFor="editIsSold" className="text-xs font-bold text-slate-200 uppercase tracking-wide cursor-pointer">
                    Player Sold (Acquired in Auction)
                  </label>
                </div>

                {editingPlayer.isSold && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-950/60 border border-white/10 rounded-xl animate-slide-in">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                        Sold to Team
                      </label>
                      <select
                        value={typeof editingPlayer.soldTo === 'object' && editingPlayer.soldTo ? editingPlayer.soldTo._id : (editingPlayer.soldTo as string || '')}
                        onChange={(e) => setEditingPlayer({ ...editingPlayer, soldTo: e.target.value })}
                        required
                        className="w-full h-10 bg-slate-950 border border-white/10 rounded-xl px-2.5 text-slate-300 text-xs font-semibold focus:outline-none focus:border-amber-500"
                      >
                        <option value="">-- Choose Buying Club --</option>
                        {teams?.map((team) => (
                          <option key={team._id} value={team._id}>
                            {team.teamName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                        Sold Price (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={editingPlayer.soldPrice}
                        onChange={(e) => setEditingPlayer({ ...editingPlayer, soldPrice: Number(e.target.value) })}
                        className="w-full h-10 bg-slate-950 border border-white/10 rounded-xl px-3 text-slate-200 text-xs font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingPlayer(null)}
                  className="flex-1 h-11 rounded-xl bg-slate-900 border border-white/5 hover:bg-slate-800 text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatePlayerMutation.isPending}
                  className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-black text-slate-950 shadow transition-all disabled:opacity-50 cursor-pointer"
                >
                  {updatePlayerMutation.isPending ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
