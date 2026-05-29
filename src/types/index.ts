export type PlayerPosition =
  | 'GOALKEEPER'
  | 'DEFENDER'
  | 'MIDFIELDER'
  | 'LEFT_WING'
  | 'RIGHT_WING'
  | 'STRIKER';

export type PlayerCategory = 'GK' | 'ICON' | 'YOUNG' | 'LEGEND';

export interface Player {
  _id: string;
  playerName: string;
  name?: string; // Fallback from backend
  position: PlayerPosition;
  category: PlayerCategory;
  phoneNumber: string;
  age?: number;
  place?: string;
  photo: string;
  playerImage?: string; // Fallback from backend
  basePrice: number;
  soldPrice: number;
  currentBid?: number; // Fallback from backend
  soldTo: string | { _id: string; teamName: string; logo: string } | null;
  team?: string | { _id: string; teamName: string; logo: string } | null; // Fallback from backend
  isSold: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  _id: string;
  teamName: string;
  shortName?: string;
  managerName?: string;
  managerImage?: string;
  coverImage?: string;
  remainingSlots?: number;
  logo: string;
  balance: number;
  totalSpent: number;
  buyedPlayers: string[] | Player[];
  createdAt: string;
  updatedAt: string;
}

export interface AuctionFilters {
  search: string;
  position: string;
  category: string;
  status: 'all' | 'sold' | 'unsold';
}
