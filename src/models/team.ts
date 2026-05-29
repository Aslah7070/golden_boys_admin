import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITeam extends Document {
  teamName: string;
  shortName?: string;
  managerName?: string;
  managerImage?: string;
  coverImage?: string;
  remainingSlots?: number;
  logo: string;
  balance: number;
  totalSpent: number;
  buyedPlayers: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema: Schema<ITeam> = new Schema(
  {
    teamName: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
    },
    shortName: {
      type: String,
      trim: true,
    },
    managerName: {
      type: String,
      trim: true,
    },
    managerImage: {
      type: String,
      default: '/managers/default.png',
    },
    coverImage: {
      type: String,
      default: '/teams/covers/default.jpg',
    },
    remainingSlots: {
      type: Number,
      default: 10,
    },
    logo: {
      type: String,
      default: '/teams/default.png',
    },
    balance: {
      type: Number,
      required: true,
      default: 50000,
    },
    totalSpent: {
      type: Number,
      required: true,
      default: 0,
    },
    buyedPlayers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Player',
        default: [],
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Prevent compilations errors in hot reloads
const Team: Model<ITeam> = mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);

export default Team;
