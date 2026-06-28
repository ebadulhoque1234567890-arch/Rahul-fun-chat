/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Gender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other"
}

export enum VipLevel {
  NONE = "none",
  VIP = "vip",
  SVIP = "svip",
  ROYAL = "royal",
  EMPEROR = "emperor"
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  coverUrl: string;
  bio: string;
  gender: Gender;
  age: number;
  country: string;
  level: number;
  xp: number;
  xpNextLevel: number;
  vipLevel: VipLevel;
  vipLevelNumeric?: number; // VIP Levels 1 to 10
  totalRechargedUsd?: number; // Accumulator of USD rechargeable payments
  profileFrameUrl?: string; // Crown frames, neon frames, glowing frames
  chatBubbleStyle?: string; // Exclusive chat styles (e.g. 'golden', 'neon_pink', 'dark_emperor')
  ownedStoreItems?: string[];
  activeFrameId?: string;
  activeEntryEffectId?: string;
  activeIdColorId?: string;
  activeMessageEffectId?: string;
  isVerified: boolean;
  coins: number;
  diamonds: number;
  followersCount: number;
  followingCount: number;
  isOnline: boolean;
  familyId?: string;
  familyName?: string;
  badges: string[]; // "gifiter_rank_1", "voice_king", etc.
  createdAt: string;
  email?: string;
  facebookId?: string;
  googleId?: string;
  mobile?: string;
  isGlobalAdmin?: boolean;
  report_count?: number;
  suspendedUntil?: string;
  isPermanentlyBanned?: boolean;
  isOfficialStaff?: boolean;
  deviceBanned?: boolean;
  deviceId?: string;
  activeRoom?: { id: string; name: string } | null;
  ownedRoom?: { id: string; name: string } | null;
}

export enum RoomCategory {
  PUBLIC = "public",
  PRIVATE = "private",
  PASSWORD = "password",
  FAMILY = "family",
  PK = "pk",
  COUPLE = "couple",
  MUSIC = "music",
  GAMING = "gaming"
}

export interface VoiceSeat {
  index: number;
  userId: string | null;
  userProfile?: UserProfile | null;
  isLocked: boolean;
  isMutedByOwner: boolean;
  isMutedByUser: boolean;
  requestingUsers: string[]; // User IDs requesting this seat
  streamActive: boolean; // Virtual mic signal status
}

export interface ChatRoom {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerName: string;
  ownerAvatarUrl: string;
  category: RoomCategory;
  password?: string;
  announcement: string;
  backgroundUrl: string;
  themeColor: string; // Tailwind hex color or class name
  seatLayout: 8 | 12;
  seats: VoiceSeat[];
  onlineUsersCount: number;
  admins: string[]; // List of user IDs
  moderators: string[]; // List of user IDs
  bannedUsers: string[]; // Banned user IDs
  mutedUsers: string[]; // Muted user IDs
  totalGiftsReceived: number; // Value in diamonds/coins for ranking
  activePkBattleId?: string;

  // PREMIUM ROOM STUFF
  level?: number;
  exp?: number;
  expNext?: number;
  badge?: string;
  coverUrl?: string;
  members?: string[]; // User IDs who are official members
  roomTasks?: {
    newJoins: number;
    newJoinsTarget: number;
    micMinutes: number;
    micMinutesTarget: number;
    diamondsGifted: number;
    diamondsGiftedTarget: number;
    ownerMicMinutes: number;
    ownerMicMinutesTarget: number;
    completed: string[];
  };
  isOfficial?: boolean;
  bannedUserNames?: { [id: string]: string }; // Map user ID to displayName
  mutedUserNames?: { [id: string]: string }; // Map user ID to displayName
  followersCount?: number;
  roomFollowers?: string[];
  visitorsCount?: number;
  dailyVisitors?: number;
  totalVisitors?: number;
  dailyGifts?: number;
  totalGifts?: number;
  popularityPoints?: number;
  createdAt?: string;
  ranking?: string;
  bannedUsersDetails?: Array<{ id: string; displayName: string; avatarUrl: string; username?: string }>;
  mutedUsersDetails?: Array<{ id: string; displayName: string; avatarUrl: string; username?: string }>;

  // ENTRY POLICY
  entrySetting?: "free" | "coins" | "vip" | "password";
  entryFee?: number; // Coin fee for entry
  minLevelRequired?: number;
  vipRequired?: boolean;
  followRequired?: boolean;

  // CHAT CONTROLS
  chatTextRestriction?: boolean;
  chatMediaRestriction?: boolean;
  chatLinkRestriction?: boolean;
  chatBadWordFilter?: boolean;

  // AUDIO/VISUAL EFFECTS
  skipEntranceEffects?: boolean;
  disableBulletScreen?: boolean;
  disableGiftAnimation?: boolean;
  disableJoinNotification?: boolean;

  // ROOM SECURITY
  isPrivate?: boolean;
  antiSpam?: boolean;
  antiAbuse?: boolean;
  isRoomLocked?: boolean;
  kickedUsers?: { [userId: string]: string };
  musicState?: {
    isPlaying: boolean;
    currentSongId: string | null;
    currentSongName: string | null;
    currentSongArtist: string | null;
    currentSongUrl: string | null;
    progressMs: number;
    durationMs: number;
    updatedAt: string;
    startedBy?: string | null;
    startedByName?: string | null;
  };
  musicQueue?: any[];
  audience?: any[];
  songs?: { id: string; name: string; artist: string; url: string; duration: string; durMs: number }[];
}

export enum MessageType {
  TEXT = "text",
  VOICE = "voice",
  IMAGE = "image",
  STICKER = "sticker",
  SYSTEM = "system",
  GIFT_ALERT = "gift_alert"
}

export interface ChatMessage {
  id: string;
  roomId?: string; // Optional if private chat
  senderId: string;
  senderName: string;
  senderAvatarUrl: string;
  senderVip: VipLevel;
  senderVipLevelNumeric?: number; // VIP Levels 1 to 10
  profileFrameUrl?: string; // Cached profile frame for the chat bubble
  chatBubbleStyle?: string; // Style code for custom bubble
  senderActiveIdColorId?: string;
  senderActiveMessageEffectId?: string;
  senderLevel: number;
  type: MessageType;
  content: string; // Message text, audioUrl, imageUrl, or sticker ID
  duration?: number; // In seconds for voice notes
  timestamp: string;
  reactions: { [emoji: string]: number }; // Emoji name -> count
}

export interface PrivateSession {
  sessionId: string;
  users: [string, string]; // User IDs
  messages: ChatMessage[];
  lastMessageTimestamp: string;
}

export interface GiftItem {
  id: string;
  name: string;
  cost: number; // in coins
  imageUrl: string;
  animationType: "2d" | "3d" | "full_screen" | "flying" | "luxury";
  senderAnimationUrl?: string;
  effectClass: string; // CSS style name
  category: "small" | "premium" | "couple" | "festival" | "luxury";
}

export interface GiftFlyover {
  id: string;
  senderName: string;
  receiverName: string;
  giftName: string;
  giftImageUrl: string;
  cost: number;
  animationType: "2d" | "3d" | "full_screen" | "flying" | "luxury";
  timestamp: number;
  senderId?: string;
  receiverId?: string;
  senderAvatarUrl?: string;
  receiverAvatarUrl?: string;
  comboCount?: number;
}

export interface PKBattle {
  id: string;
  roomId: string; // The primary room hosting
  leftUserId: string;
  leftUsername: string;
  leftAvatar: string;
  leftScore: number;
  rightUserId: string;
  rightUsername: string;
  rightAvatar: string;
  rightScore: number;
  durationSeconds: number;
  timeLeftSeconds: number;
  winnerUserId?: string | null;
  status: "active" | "ended";
  createdAt?: number;
}

export interface Family {
  id: string;
  name: string;
  logoUrl: string;
  description: string;
  creatorId: string;
  creatorName: string;
  level: number;
  memberCount: number;
  totalXp: number;
  ranking: number;
  announcement: string;
}

export interface TransactionRecord {
  id: string;
  userId: string;
  type: "recharge" | "withdrawal" | "gift_sent" | "gift_received" | "reward";
  amountCoins: number;
  amountDiamonds: number;
  description: string;
  timestamp: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  vipLevel: VipLevel;
  value: number; // Cost of gifts sent or earned
  rank: number;
}

export interface FamilyLeaderboardEntry {
  familyId: string;
  familyName: string;
  logoUrl: string;
  level: number;
  value: number; // Rank points
  rank: number;
}

// --- Relationship System Types ---
export type RelationshipType = "couple" | "homies" | "best_friend" | "brother" | "sister" | "family" | "soulmate";

export interface Relationship {
  id: string; // "user1Id_user2Id" where user1Id < user2Id alphabetically
  user1Id: string;
  user2Id: string;
  user1Name: string;
  user2Name: string;
  user1Avatar: string;
  user2Avatar: string;
  type: RelationshipType;
  level: number; // 1 to 20
  points: number;
  pointsNextLevel: number;
  createdAt: number;
  streakDays: number;
  lastCheckIn?: number; // timestamp
  anniversaryDate: string; // "YYYY-MM-DD"
}

export interface RelationshipRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar: string;
  type: RelationshipType;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  createdAt: number;
}

export interface RelationshipLevelConfig {
  level: number;
  pointsRequired: number;
  badgeName: string;
  unlockedTitle: string;
  unlockedFrame?: string;
  unlockedEffect?: string;
}

export interface RelationshipHistoryLog {
  id: string;
  user1Id: string;
  user2Id: string;
  type: RelationshipType;
  action: "request_sent" | "accepted" | "rejected" | "level_up" | "removed" | "check_in" | "streak_increment";
  details: string;
  timestamp: number;
}

export interface RelationshipReward {
  id: string;
  level: number;
  type: "frame" | "badge" | "title" | "coins" | "diamonds";
  value: string;
  claimed: boolean;
  claimedByUserId: string;
  relationshipId: string;
}

export interface RelationshipDailyTask {
  id: string;
  title: string;
  pointsReward: number;
  completed: boolean;
  progress: number;
  target: number;
  type: "private_message" | "voice_room_time" | "send_gift" | "daily_checkin";
}

