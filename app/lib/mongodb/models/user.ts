import { Schema, model, models } from "mongoose";
import crypto from 'crypto';

export interface UserDocument {
    email: string;
    emailVerified: boolean;
    emailToken: string;
    password: string;
    name: string;
    authMethod: string;
    subscription: string;
    _id: string;
    createdAt: Date;
    updatedAt: Date;
    credits: Number;
    favorites: string[];
    favoriteModels: string[];
    referralCode: string;
    referredBy: string;
    referredByTime: Date;
    referrals: string[];
    referralsTime: [Date];
    visitedSocials: string[];
    feedbackSubmitted: boolean;
    feedbackSubmittedTime : Date;
    feedbackRating: Number;
    feedback1: string;
    feedback2: string;
    serviceModalShown: boolean;
    subscriptionId?: string;
    subscriptionEndDate?: Date;
    stripeSubscription?: boolean;
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
    subscriptionGtmSent?: boolean;
    registrationGtmSent?: boolean;
    fingerprintId?: string;
  }

  const UserSchema = new Schema<UserDocument>({
    email: {
      type: String,
      unique: true,
      required: [true, "Email is required"],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email is invalid"],
    },
    password: {
      type: String,
      select: false,
      minLength: [8, "Password must be at least 8 characters long"],
    },
    name: {
      type: String,
      required: [true, "Fullname is required"],
    },
    authMethod: {
      type: String,
      required: true,
      enum: ['google', 'email'],
    },
    subscription: {
      type: String,
      required: [true, "Subscription type is required"],
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailToken: {
      type: String,
      default: null,
    },
    credits: {
      type: Number,
      default: null,
    },
    favorites: {
      type: [String],
      default: []
  },
    favoriteModels: {
      type: [String],
      default: []
  },
    referralCode: {
      type: String,
      required: true,
      default: () => crypto.randomBytes(8).toString('hex'),
    },
    referredBy: {
      type: String,
      default: null,
    },
    referredByTime: {
      type: Date,
      default: null,
    },
    referrals: {
      type: [String],
      default: []
    },
    referralsTime: {
      type: [Date],
      default: [],
    },
    visitedSocials: {
      type: [String],
      default: []
    }, 
    feedbackSubmitted: {
      type: Boolean,
      default: false,
    },
    feedbackSubmittedTime: {   
      type: Date,           
      default: null         
    },
    feedbackRating: {
      type: Number,
      default: null,
    },
    feedback1: {
      type: String,
      default: null,
    },
    feedback2: {
      type: String,
      default: null,
    },
    serviceModalShown: {
      type: Boolean,
      default: false,
    },
    subscriptionId: {
      type: String,
      default: null,
    },
    subscriptionEndDate: { type: Date, default: null },
    stripeSubscription: {
      type: Boolean,
      default: false,
    },
    subscriptionGtmSent: {
      type: Boolean,
      default: false,
    },
    registrationGtmSent: {
      type: Boolean,
      default: false,
    },
    stripeSubscriptionId: {
      type: String,
      default: null,
    },
    stripeCustomerId: {
      type: String,
      default: null,
    },
    fingerprintId: {
      type: String,
      default: null,
    },
  }, {
    timestamps: true,
  });

const User = models.User || model<UserDocument>('User', UserSchema);
export default User;