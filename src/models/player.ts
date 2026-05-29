import mongoose, { Schema, Document, Model } from 'mongoose';

export type PlayerPosition =
  | 'GOALKEEPER'
  | 'DEFENDER'
  | 'MIDFIELDER'
  | 'LEFT_WING'
  | 'RIGHT_WING'
  | 'STRIKER';

export type PlayerCategory = 'GK' | 'ICON' | 'YOUNG' | 'LEGEND';

export interface IPlayer extends Document {
  playerName: string;
  position: PlayerPosition;
  category: PlayerCategory;
  phoneNumber: string;
  age: number;
  place: string;
  photo: string;
  basePrice: number;
  soldPrice: number;
  soldTo: mongoose.Types.ObjectId | null;
  isSold: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlayerSchema: Schema<IPlayer> = new Schema(
  {
    playerName: {
      type: String,
      required: [true, 'Player name is required'],
      trim: true,
    },
    position: {
      type: String,
      required: [true, 'Position is required'],
      enum: {
        values: ['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'LEFT_WING', 'RIGHT_WING', 'STRIKER'],
        message: '{VALUE} is not a valid player position',
      },
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['GK', 'ICON', 'YOUNG', 'LEGEND'],
        message: '{VALUE} is not a valid player category',
      },
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
    },
    place: {
      type: String,
      required: [true, 'Place is required'],
    },
    photo: {
      type: String,
      default: '/players/default.png',
    },
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Base price must be positive'],
    },
    soldPrice: {
      type: Number,
      default: 0,
    },
    soldTo: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    isSold: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Player: Model<IPlayer> = mongoose.models.Player || mongoose.model<IPlayer>('Player', PlayerSchema);

export default Player;
