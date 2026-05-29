'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuctionStore } from '@/store/auctionStore';
import { 
  fetchTeams, 
  updateTeam, 
  deleteTeam 
} from '@/services/api';
import { Team, Player } from '@/types';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Coins, 
  Search, 
  X, 
  ShieldAlert, 
  Check, 
  Users 
} from 'lucide-react';

export default function TeamsAdminPage() {
  const queryClient = useQueryClient();
  const showToast = useAuctionStore((state) => state.showToast);

  // Search & Modal States
  const [teamSearch, setTeamSearch] = useState('');
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  // Cloudinary Uploader States
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingManager, setIsUploadingManager] = useState(false);

  const handleUploadLogo = async (file: File) => {
    if (!editingTeam) return;
    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload logo');
      setEditingTeam({ ...editingTeam, logo: data.url });
      showToast('SUCCESS: Team logo uploaded!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleUploadManager = async (file: File) => {
    if (!editingTeam) return;
    setIsUploadingManager(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload manager image');
      setEditingTeam({ ...editingTeam, managerImage: data.url });
      showToast('SUCCESS: Manager image uploaded!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setIsUploadingManager(false);
    }
  };

  // Forms State - Create Team
  const [teamName, setTeamName] = useState('');
  const [teamBalance, setTeamBalance] = useState<number>(150000);
  const [teamLogo, setTeamLogo] = useState('');

  // Query - Fetch all teams
  const { data: teams, isLoading: isLoadingTeams } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: fetchTeams,
  });

  const filteredTeamsList = teams?.filter(team => 
    team.teamName.toLowerCase().includes(teamSearch.toLowerCase())
  ) || [];

  // Mutation - Create Team
  const createTeamMutation = useMutation({
    mutationFn: async (newTeam: { teamName: string; balance: number; logo?: string }) => {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeam),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create team');
      return data;
    },
    onSuccess: (data) => {
      showToast(`SUCCESS: ${data.teamName} registered!`, 'success');
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setIsCreateTeamOpen(false);
      setTeamName('');
      setTeamBalance(150000);
      setTeamLogo('');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to register team.', 'error');
    },
  });

  // Mutation - Update Team
  const updateTeamMutation = useMutation({
    mutationFn: ({ id, params }: { id: string; params: Partial<Team> }) => updateTeam(id, params as any),
    onSuccess: (data) => {
      showToast(`SUCCESS: ${data.teamName} updated!`, 'success');
      queryClient.invalidateQueries();
      setEditingTeam(null);
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to update team.', 'error');
    },
  });

  // Mutation - Delete Team
  const deleteTeamMutation = useMutation({
    mutationFn: (id: string) => deleteTeam(id),
    onSuccess: () => {
      showToast(`SUCCESS: Team deleted and players released!`, 'success');
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to delete team.', 'error');
    },
  });

  // Form Submissions
  const handleCreateTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName) return;
    createTeamMutation.mutate({
      teamName,
      balance: teamBalance,
      logo: teamLogo || undefined,
    });
  };

  const handleEditTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;
    
    // Logo is strictly mandatory!
    if (!editingTeam.logo || editingTeam.logo === '/teams/default.png') {
      showToast('ERROR: Team logo is mandatory! Please upload a valid club logo.', 'error');
      return;
    }

    updateTeamMutation.mutate({
      id: editingTeam._id,
      params: {
        teamName: editingTeam.teamName,
        logo: editingTeam.logo,
        balance: editingTeam.balance,
        shortName: editingTeam.shortName || undefined,
        managerName: editingTeam.managerName || undefined,
        managerImage: editingTeam.managerImage || undefined,
        coverImage: editingTeam.coverImage || undefined,
      },
    });
  };

  const handleDeleteTeam = (id: string, name: string) => {
    if (confirm(`CRITICAL WARNING:\nAre you sure you want to delete "${name}"?\nAll players currently bought by this team will be reset back to UNSOLD status and their balances will be cleared.`)) {
      deleteTeamMutation.mutate(id);
    }
  };

  // Render helpers
  const renderTeamLogo = (team: Team, className = 'w-12 h-12') => {
    if (team.logo && team.logo !== '/teams/default.png' && !team.logo.startsWith('/teams/default')) {
      return <img src={team.logo} alt={team.teamName} className={`${className} rounded-full object-cover border border-white/10`} />;
    }
    const initials = team.teamName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    return (
      <div className={`${className} rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-xs uppercase`}>
        {initials}
      </div>
    );
  };

  const renderPlayerPhoto = (player: Player, className = 'w-5 h-5') => {
    const photo = player.photo || player.playerImage;
    const pName = player.playerName || player.name || 'Unknown Player';
    if (photo && photo !== '/players/default.png' && !photo.startsWith('/players/default')) {
      return <img src={photo} alt={pName} className={`${className} rounded-full object-cover border border-white/10`} />;
    }
    const initials = pName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    return (
      <div className={`${className} rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-[8px] uppercase`}>
        {initials}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white uppercase flex items-center gap-2.5">
          <Coins className="w-8 h-8 text-amber-500" />
          <span>Manage Tournament Teams</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Add new tournament clubs, modify starting balances, edit logos, and review currently bought players.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search registered clubs..."
            value={teamSearch}
            onChange={(e) => setTeamSearch(e.target.value)}
            className="w-full h-11 bg-slate-950 border border-white/10 rounded-xl pl-10 pr-4 text-slate-200 text-xs font-medium focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <button
          onClick={() => setIsCreateTeamOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 text-xs font-black text-slate-950 shadow-md transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register Team</span>
        </button>
      </div>

      {/* Grid of Teams */}
      {isLoadingTeams ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-56 bg-slate-900/50 border border-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredTeamsList.length === 0 ? (
        <div className="p-16 text-center glass-card rounded-2xl border-white/5">
          <Coins className="w-12 h-12 text-slate-600 mb-4 mx-auto" />
          <p className="text-base text-slate-300 font-bold">No teams found</p>
          <p className="text-xs text-slate-500 mt-1">Register a team to begin setting up tournament rosters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeamsList.map((team) => (
            <div key={team._id} className="glass-card rounded-2xl p-5 border-white/5 flex flex-col justify-between hover:border-amber-500/20 transition-all duration-300 hover:translate-y-[-2px] relative group">
              <div className="space-y-4">
                {/* Logo and Name header */}
                <div className="flex items-center gap-3.5">
                  {renderTeamLogo(team, "w-12 h-12")}
                  <div>
                    <h3 className="font-extrabold text-white text-base leading-tight tracking-wide">{team.teamName}</h3>
                    <span className="text-[10px] font-mono text-slate-500">ID: {team._id.slice(-6).toUpperCase()}</span>
                  </div>
                </div>

                {/* Stats details */}
                <div className="grid grid-cols-2 gap-2 bg-slate-950/40 border border-white/5 p-3 rounded-xl">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">PURSE BALANCE</span>
                    <span className="text-sm font-black text-emerald-400 mt-0.5">₹{(2000 - team.totalSpent).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">TOTAL SPENT</span>
                    <span className="text-sm font-bold text-amber-500 mt-0.5">₹{team.totalSpent.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Bought Players Roster List */}
                <div className="pt-3 border-t border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Bought Players</span>
                    <span className="text-[10px] text-slate-500 font-bold bg-white/5 px-2 py-0.5 rounded border border-white/5">
                      {team.buyedPlayers?.length || 0} Total
                    </span>
                  </div>
                  {!team.buyedPlayers || team.buyedPlayers.length === 0 ? (
                    <div className="text-slate-600 text-xs italic py-1">No players bought yet.</div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {(team.buyedPlayers as Player[]).map((player) => (
                        <div 
                          key={player._id} 
                          className="inline-flex items-center gap-1.5 bg-slate-950/60 border border-white/5 rounded-full pl-1 pr-2.5 py-0.5 text-[10px] font-semibold text-slate-300"
                        >
                          {renderPlayerPhoto(player, "w-4 h-4")}
                          <span className="truncate max-w-[80px]">{player.playerName || player.name || 'Unknown Player'}</span>
                          <span className="font-bold text-amber-400 font-mono text-[9px]">₹{(player.soldPrice || player.currentBid || 0).toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions row */}
              <div className="flex gap-2.5 border-t border-white/5 mt-5 pt-4">
                <button
                  onClick={() => setEditingTeam(team)}
                  className="flex-1 h-9 rounded-lg bg-slate-900 border border-white/5 hover:border-amber-500/30 text-xs font-bold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5 text-amber-500" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDeleteTeam(team._id, team.teamName)}
                  className="flex-1 h-9 rounded-lg bg-red-950/20 border border-red-950 hover:bg-red-900/20 text-xs font-bold text-red-400 hover:text-red-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Modal: Register Team */}
      {isCreateTeamOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-card rounded-2xl p-6 sm:p-8 max-w-md w-full border-amber-500/20 shadow-2xl relative">
            <button 
              onClick={() => setIsCreateTeamOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-500" />
              <span>Register New Tournament Team</span>
            </h2>

            <form onSubmit={handleCreateTeamSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                  Team / Club Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kozhikode Warriors"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full h-11 bg-slate-950 border border-white/10 rounded-xl px-3 text-slate-200 text-sm font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                  Purse Starting Balance (₹)
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  step={1000}
                  value={teamBalance}
                  onChange={(e) => setTeamBalance(Number(e.target.value))}
                  className="w-full h-11 bg-slate-950 border border-white/10 rounded-xl px-3 text-slate-200 text-sm font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                  Logo Image URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. /teams/warriors.png (Fallback to initials if blank)"
                  value={teamLogo}
                  onChange={(e) => setTeamLogo(e.target.value)}
                  className="w-full h-11 bg-slate-950 border border-white/10 rounded-xl px-3 text-slate-200 text-xs font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateTeamOpen(false)}
                  className="flex-1 h-11 rounded-xl bg-slate-900 border border-white/5 hover:bg-slate-800 text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTeamMutation.isPending}
                  className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-black text-slate-950 shadow transition-all disabled:opacity-50 cursor-pointer"
                >
                  {createTeamMutation.isPending ? 'Registering...' : 'Register Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Team */}
      {editingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-card rounded-2xl p-6 sm:p-8 max-w-md w-full border-amber-500/20 shadow-2xl relative">
            <button 
              onClick={() => setEditingTeam(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <Edit className="w-5 h-5 text-amber-500" />
              <span>Edit Club: {editingTeam.teamName}</span>
            </h2>

            <form onSubmit={handleEditTeamSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                  Team Name
                </label>
                <input
                  type="text"
                  required
                  value={editingTeam.teamName}
                  onChange={(e) => setEditingTeam({ ...editingTeam, teamName: e.target.value })}
                  className="w-full h-11 bg-slate-950 border border-white/10 rounded-xl px-3 text-slate-200 text-sm font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                  Purse Balance (₹)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step={500}
                  value={editingTeam.balance}
                  onChange={(e) => setEditingTeam({ ...editingTeam, balance: Number(e.target.value) })}
                  className="w-full h-11 bg-slate-950 border border-white/10 rounded-xl px-3 text-slate-200 text-sm font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Logo Upload Section (Mandatory) */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Club Logo (Mandatory) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3 bg-slate-950/60 border border-white/10 rounded-xl p-3">
                  <div className="w-12 h-12 rounded-full border border-white/10 bg-slate-900 shrink-0 overflow-hidden flex items-center justify-center relative">
                    {isUploadingLogo ? (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : null}
                    <img 
                      src={editingTeam.logo || '/teams/default.png'} 
                      alt="Logo preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <input 
                      type="file" 
                      accept="image/*"
                      id="edit-logo-upload"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadLogo(file);
                      }}
                    />
                    <label 
                      htmlFor="edit-logo-upload"
                      className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
                    >
                      {isUploadingLogo ? 'Uploading...' : 'Choose Logo File'}
                    </label>
                    <p className="text-[9px] text-slate-500 mt-1">Upload a PNG or JPG file. Cloudinary optimized.</p>
                  </div>
                </div>
              </div>

              {/* Manager Name Input */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                  Manager Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Faris Ali"
                  value={editingTeam.managerName || ''}
                  onChange={(e) => setEditingTeam({ ...editingTeam, managerName: e.target.value })}
                  className="w-full h-11 bg-slate-950 border border-white/10 rounded-xl px-3 text-slate-200 text-sm font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Manager Image Upload Section */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Manager Profile Image
                </label>
                <div className="flex items-center gap-3 bg-slate-950/60 border border-white/10 rounded-xl p-3">
                  <div className="w-12 h-12 rounded-full border border-white/10 bg-slate-900 shrink-0 overflow-hidden flex items-center justify-center relative">
                    {isUploadingManager ? (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : null}
                    <img 
                      src={editingTeam.managerImage || '/managers/default.png'} 
                      alt="Manager preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <input 
                      type="file" 
                      accept="image/*"
                      id="edit-manager-upload"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadManager(file);
                      }}
                    />
                    <label 
                      htmlFor="edit-manager-upload"
                      className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
                    >
                      {isUploadingManager ? 'Uploading...' : 'Choose Profile Image'}
                    </label>
                    <p className="text-[9px] text-slate-500 mt-1">Upload manager profile image.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingTeam(null)}
                  className="flex-1 h-11 rounded-xl bg-slate-900 border border-white/5 hover:bg-slate-800 text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateTeamMutation.isPending}
                  className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-black text-slate-950 shadow transition-all disabled:opacity-50 cursor-pointer"
                >
                  {updateTeamMutation.isPending ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
