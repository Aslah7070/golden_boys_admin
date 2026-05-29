import { Team, Player, AuctionFilters } from '@/types';

export async function fetchTeams(): Promise<Team[]> {
  const response = await fetch('/api/teams');
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch teams');
  }
  return response.json();
}

export async function fetchTeamDetails(id: string): Promise<Team> {
  const response = await fetch(`/api/teams/${id}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch team details');
  }
  return response.json();
}

export async function fetchPlayers(filters: AuctionFilters): Promise<Player[]> {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.position) params.append('position', filters.position);
  if (filters.category) params.append('category', filters.category);
  if (filters.status && filters.status !== 'all') params.append('status', filters.status);

  const response = await fetch(`/api/players?${params.toString()}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch players');
  }
  return response.json();
}

interface BuyPlayerParams {
  playerId: string;
  teamId: string;
  bidAmount: number;
}

export async function buyPlayer(params: BuyPlayerParams) {
  const response = await fetch('/api/auction/buy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to buy player');
  }

  return response.json();
}

export async function seedDatabase() {
  const response = await fetch('/api/seed', {
    method: 'POST',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to seed database');
  }

  return response.json();
}

export async function updateTeam(id: string, params: Partial<Team>): Promise<Team> {
  const response = await fetch(`/api/teams/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update team');
  }
  return response.json();
}

export async function deleteTeam(id: string): Promise<{ message: string }> {
  const response = await fetch(`/api/teams/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete team');
  }
  return response.json();
}

export async function updatePlayer(id: string, params: Partial<Player>): Promise<Player> {
  const response = await fetch(`/api/players/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update player');
  }
  return response.json();
}

export async function deletePlayer(id: string): Promise<{ message: string }> {
  const response = await fetch(`/api/players/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete player');
  }
  return response.json();
}
