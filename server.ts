/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

// Import Supabase
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
}) : null;

// Initialize Supabase Storage Buckets
async function initSupabaseBuckets() {
  if (!supabase) {
    console.warn("⚠️ Supabase Client is not initialized (SUPABASE_URL or keys missing). Storage will fallback to local filesystem.");
    return;
  }
  const buckets = ["avatars", "covers", "audio", "gifts"];
  for (const bucketName of buckets) {
    try {
      console.log(`Checking/Creating Supabase bucket: ${bucketName}...`);
      const { data, error } = await supabase.storage.getBucket(bucketName);
      if (error || !data) {
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true,
        });
        if (createError) {
          console.warn(`Could not create bucket '${bucketName}' (possibly lacks admin/service role permission, standard under anon-key):`, createError.message);
        } else {
          console.log(`Created public Supabase storage bucket: '${bucketName}'`);
        }
      } else {
        console.log(`Supabase storage bucket '${bucketName}' already exists.`);
      }
    } catch (err: any) {
      console.warn(`Error initializing bucket '${bucketName}':`, err.message || err);
    }
  }
}

// Socket.IO server reference to be accessible globally
let io: SocketIOServer | null = null;
const userSockets: Map<string, string> = new Map(); // userId -> socket.id
const socketToUser: Map<string, string> = new Map(); // socket.id -> userId
const pendingDisconnects: Map<string, { timeoutId: NodeJS.Timeout; socketId: string; roomId: string }> = new Map();
import { GoogleGenAI, Type } from "@google/genai";
import { 
  UserProfile, 
  ChatRoom, 
  ChatMessage, 
  VipLevel, 
  Gender, 
  RoomCategory, 
  VoiceSeat, 
  GiftItem, 
  PrivateSession, 
  TransactionRecord, 
  PKBattle, 
  Family, 
  LeaderboardEntry, 
  FamilyLeaderboardEntry,
  MessageType,
  Relationship,
  RelationshipRequest,
  RelationshipHistoryLog,
  RelationshipReward,
  RelationshipLevelConfig,
  RelationshipType,
  RelationshipDailyTask
} from "./src/types.js";

// Initialize express app
const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Ensure local uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

// API endpoint for base64 file uploads
app.post("/api/upload", async (req, res) => {
  const { imageBase64, filename, bucket } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: "No image base64 data provided." });
  }

  try {
    const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer: Buffer;
    let mimeType = "image/png";
    let ext = "png";

    if (!matches || matches.length !== 3) {
      if (imageBase64.startsWith("/9j/")) {
        ext = "jpg";
        mimeType = "image/jpeg";
      }
      buffer = Buffer.from(imageBase64, "base64");
    } else {
      mimeType = matches[1];
      const base64Data = matches[2];
      buffer = Buffer.from(base64Data, "base64");

      if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
        ext = "jpg";
      } else if (mimeType.includes("gif")) {
        ext = "gif";
      } else if (mimeType.includes("webp")) {
        ext = "webp";
      }
    }

    const cleanFilename = `upload_${Date.now()}_${Math.floor(Math.random() * 100000)}.${ext}`;
    let targetBucket = bucket || "covers";
    if (!["avatars", "covers", "gifts", "audio"].includes(targetBucket)) {
      targetBucket = "covers";
    }

    if (supabase) {
      const { data, error } = await supabase.storage
        .from(targetBucket)
        .upload(cleanFilename, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (error) {
        console.error(`Supabase upload error (bucket: ${targetBucket}):`, error);
        // Fallback to local
        const filePath = path.join(uploadsDir, cleanFilename);
        fs.writeFileSync(filePath, buffer);
        return res.json({ success: true, url: `/uploads/${cleanFilename}` });
      }

      const { data: { publicUrl } } = supabase.storage.from(targetBucket).getPublicUrl(cleanFilename);
      console.log(`Uploaded to Supabase bucket: ${targetBucket} -> ${publicUrl}`);
      return res.json({ success: true, url: publicUrl });
    } else {
      const filePath = path.join(uploadsDir, cleanFilename);
      fs.writeFileSync(filePath, buffer);
      return res.json({ success: true, url: `/uploads/${cleanFilename}` });
    }
  } catch (error: any) {
    console.error("Upload handler error:", error);
    res.status(500).json({ error: error.message || "Failed to process image upload." });
  }
});

// API endpoint for base64 audio uploads
app.post("/api/upload-audio", async (req, res) => {
  const { audioBase64, filename } = req.body;
  if (!audioBase64) {
    return res.status(400).json({ error: "No audio base64 data provided." });
  }

  try {
    const matches = audioBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let mimeType = "audio/mp3";
    let base64Data = "";
    if (matches && matches.length === 3) {
      mimeType = matches[1];
      base64Data = matches[2];
    } else {
      base64Data = audioBase64;
    }

    const buffer = Buffer.from(base64Data, "base64");
    let ext = "mp3";
    if (filename && filename.includes(".")) {
      ext = filename.split(".").pop();
    } else if (mimeType) {
      if (mimeType.includes("wav")) ext = "wav";
      else if (mimeType.includes("m4a")) ext = "m4a";
      else if (mimeType.includes("ogg")) ext = "ogg";
      else if (mimeType.includes("webm")) ext = "webm";
    }

    const cleanFilename = `audio_${Date.now()}_${Math.floor(Math.random() * 100000)}.${ext}`;

    if (supabase) {
      const { data, error } = await supabase.storage
        .from("audio")
        .upload(cleanFilename, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (error) {
        console.error("Supabase audio upload error:", error);
        // Fallback to local
        const filePath = path.join(uploadsDir, cleanFilename);
        fs.writeFileSync(filePath, buffer);
        return res.json({ success: true, url: `/uploads/${cleanFilename}` });
      }

      const { data: { publicUrl } } = supabase.storage.from("audio").getPublicUrl(cleanFilename);
      console.log(`Uploaded audio to Supabase: ${publicUrl}`);
      return res.json({ success: true, url: publicUrl });
    } else {
      const filePath = path.join(uploadsDir, cleanFilename);
      fs.writeFileSync(filePath, buffer);
      return res.json({ success: true, url: `/uploads/${cleanFilename}` });
    }
  } catch (error: any) {
    console.error("Audio upload handler error:", error);
    res.status(500).json({ error: error.message || "Failed to process audio upload." });
  }
});

// Initialize Gemini SDK with named parameters
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;
if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Google GenAI initialized successfully on server-side!");
  } catch (error) {
    console.error("Failed to initialize Google GenAI SDK:", error);
  }
} else {
  console.log("No valid GEMINI_API_KEY provided in environment variables; Gemini AI features running in smart simulation mode.");
}

// -------------------------------------------------------------------
// IN-MEMORY DATABASE STORAGE
// -------------------------------------------------------------------
let users: Map<string, UserProfile> = new Map();
let rooms: Map<string, ChatRoom> = new Map();
let messages: Map<string, ChatMessage[]> = new Map(); // roomId -> ChatMessage[]
let privateSessions: Map<string, PrivateSession> = new Map(); // sessionId -> PrivateSession
let transactions: TransactionRecord[] = [];
let pkBattles: Map<string, PKBattle> = new Map(); // pkBattleId -> PKBattle
let families: Map<string, Family> = new Map();
let reportsDb: Map<string, any[]> = new Map();

// --- Relationship System State ---
let relationships: Map<string, Relationship> = new Map(); // id -> Relationship
let relationshipRequests: Map<string, RelationshipRequest> = new Map(); // id -> RelationshipRequest
let relationshipHistory: RelationshipHistoryLog[] = [];
let relationshipRewards: RelationshipReward[] = [];

const RELATIONSHIP_LEVELS: RelationshipLevelConfig[] = Array.from({ length: 20 }, (_, i) => {
  const lvl = i + 1;
  const ptsReq = lvl === 1 ? 100 : Math.round(100 * Math.pow(1.5, lvl - 1));
  return {
    level: lvl,
    pointsRequired: ptsReq,
    badgeName: `Bond Lvl ${lvl}`,
    unlockedTitle: `Soul Bound Lvl ${lvl}`,
    unlockedFrame: lvl >= 5 ? `frame_relationship_${lvl}` : undefined,
    unlockedEffect: lvl >= 10 ? `effect_relationship_${lvl}` : undefined,
  };
});

// PERSISTENCE MANAGER
const PERSISTENCE_FILE = path.join(process.cwd(), "database_persistent.json");

const DEFAULT_SONGS: any[] = [];

let db: any = null;
let firestoreEnabled = false;

try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const resolvedProjectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || config.projectId;
    console.log("Firebase Admin initializing with Project ID:", resolvedProjectId, "Database ID:", config.firestoreDatabaseId || "default");
    
    let app;
    let credentialData;
    const defaultSA = path.join(process.cwd(), "firebase-service-account.json");
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT.trim().startsWith("{")) {
          credentialData = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        } else if (fs.existsSync(process.env.FIREBASE_SERVICE_ACCOUNT)) {
          credentialData = JSON.parse(fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT, "utf8"));
        }
      } catch (e) {
        console.error("Error parsing FIREBASE_SERVICE_ACCOUNT environment variable:", e);
      }
    } else if (fs.existsSync(defaultSA)) {
      try {
        credentialData = JSON.parse(fs.readFileSync(defaultSA, "utf8"));
        console.log("Found local Firebase Service Account file: firebase-service-account.json");
      } catch (e) {
        console.error("Error parsing local firebase-service-account.json:", e);
      }
    }

    if (credentialData) {
      app = admin.initializeApp({
        credential: (admin as any).credential.cert(credentialData),
        projectId: resolvedProjectId
      });
    } else {
      app = admin.initializeApp({
        projectId: resolvedProjectId,
      });
    }

    db = config.firestoreDatabaseId ? getFirestore(app, config.firestoreDatabaseId) : getFirestore(app);
    firestoreEnabled = true;
    console.log("Firebase Admin initialized successfully with database ID:", config.firestoreDatabaseId || "default");
  } else {
    console.log("firebase-applet-config.json not found, falling back to local file storage only.");
  }
} catch (err) {
  console.error("Failed to initialize Firebase Admin:", err);
}

async function saveDB() {
  try {
    const data = {
      users: Array.from(users.entries()),
      rooms: Array.from(rooms.entries()),
      messages: Array.from(messages.entries()),
      transactions: transactions,
      pkBattles: Array.from(pkBattles.entries()),
      families: Array.from(families.entries()),
      relationships: Array.from(relationships.entries()),
      relationshipRequests: Array.from(relationshipRequests.entries()),
      relationshipHistory: relationshipHistory,
      relationshipRewards: relationshipRewards,
      giftCatalog: GIFT_CATALOG,
      vipLevels: VIP_LEVELS,
    };
    fs.writeFileSync(PERSISTENCE_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Error saving database to local persistence file:", error);
  }

  if (firestoreEnabled && db) {
    try {
      console.log("Syncing database to Firestore...");
      
      const userPromises = Array.from(users.entries()).map(([userId, userObj]) => {
        return db.collection("users").doc(userId).set(JSON.parse(JSON.stringify(userObj)))
          .catch((e: any) => console.error(`Firestore user sync failed for ${userId}:`, e));
      });

      const roomPromises = Array.from(rooms.entries()).map(([roomId, roomObj]) => {
        return db.collection("rooms").doc(roomId).set(JSON.parse(JSON.stringify(roomObj)))
          .catch((e: any) => console.error(`Firestore room sync failed for ${roomId}:`, e));
      });

      const messagePromises = Array.from(messages.entries()).map(([msgId, msgObj]) => {
        return db.collection("messages").doc(msgId).set({
          list: JSON.parse(JSON.stringify(msgObj))
        }).catch((e: any) => console.error(`Firestore messages sync failed for ${msgId}:`, e));
      });

      const pkPromises = Array.from(pkBattles.entries()).map(([pkId, pkObj]) => {
        return db.collection("pkBattles").doc(pkId).set(JSON.parse(JSON.stringify(pkObj)))
          .catch((e: any) => console.error(`Firestore pkBattles sync failed for ${pkId}:`, e));
      });

      const familyPromises = Array.from(families.entries()).map(([famId, famObj]) => {
        return db.collection("families").doc(famId).set(JSON.parse(JSON.stringify(famObj)))
          .catch((e: any) => console.error(`Firestore families sync failed for ${famId}:`, e));
      });

      const relationshipPromises = Array.from(relationships.entries()).map(([relId, relObj]) => {
        return db.collection("relationships").doc(relId).set(JSON.parse(JSON.stringify(relObj)))
          .catch((e: any) => console.error(`Firestore relationships sync failed for ${relId}:`, e));
      });

      const relationshipReqPromises = Array.from(relationshipRequests.entries()).map(([reqId, reqObj]) => {
        return db.collection("relationship_requests").doc(reqId).set(JSON.parse(JSON.stringify(reqObj)))
          .catch((e: any) => console.error(`Firestore relationship_requests sync failed for ${reqId}:`, e));
      });

      const systemPromise = db.collection("system").doc("transactions").set({
        list: JSON.parse(JSON.stringify(transactions))
      }).catch((e: any) => console.error(`Firestore transactions sync failed:`, e));

      const catalogPromise = db.collection("system").doc("catalog").set({
        giftCatalog: JSON.parse(JSON.stringify(GIFT_CATALOG)),
        vipLevels: JSON.parse(JSON.stringify(VIP_LEVELS))
      }).catch((e: any) => console.error(`Firestore catalog sync failed:`, e));

      const relHistoryPromise = db.collection("system").doc("relationship_history").set({
        list: JSON.parse(JSON.stringify(relationshipHistory))
      }).catch((e: any) => console.error(`Firestore relationship_history sync failed:`, e));

      const relRewardsPromise = db.collection("system").doc("relationship_rewards").set({
        list: JSON.parse(JSON.stringify(relationshipRewards))
      }).catch((e: any) => console.error(`Firestore relationship_rewards sync failed:`, e));

      await Promise.all([
        ...userPromises,
        ...roomPromises,
        ...messagePromises,
        ...pkPromises,
        ...familyPromises,
        ...relationshipPromises,
        ...relationshipReqPromises,
        systemPromise,
        catalogPromise,
        relHistoryPromise,
        relRewardsPromise
      ]);
      console.log("Firestore database sync completed successfully.");
    } catch (error) {
      console.error("Error syncing database to Firestore:", error);
    }
  }
}

async function loadDB() {
  let loadedLocal = false;
  let loadedFromFirestore = false;

  // 1. Load baseline data from local persistence file first
  try {
    if (fs.existsSync(PERSISTENCE_FILE)) {
      console.log("Loading baseline database from local persistence file...");
      const raw = fs.readFileSync(PERSISTENCE_FILE, "utf8");
      const data = JSON.parse(raw);
      if (data.users) users = new Map(data.users);
      if (data.rooms) {
        rooms = new Map(data.rooms);
        for (const [id, room] of rooms.entries()) {
          if (!room.songs || !Array.isArray(room.songs) || room.songs.length === 0) {
            room.songs = [...DEFAULT_SONGS];
          }
        }
      }
      if (data.messages) messages = new Map(data.messages);
      if (data.transactions) transactions = data.transactions;
      if (data.pkBattles) pkBattles = new Map(data.pkBattles);
      if (data.families) families = new Map(data.families);
      if (data.relationships) relationships = new Map(data.relationships);
      if (data.relationshipRequests) relationshipRequests = new Map(data.relationshipRequests);
      if (data.relationshipHistory) relationshipHistory = data.relationshipHistory;
      if (data.relationshipRewards) relationshipRewards = data.relationshipRewards;
      if (data.giftCatalog) GIFT_CATALOG = data.giftCatalog;
      if (data.vipLevels) VIP_LEVELS = data.vipLevels;
      console.log(`Local baseline database loaded: ${users.size} users, ${rooms.size} rooms.`);
      loadedLocal = true;
    }
  } catch (error) {
    console.error("Error loading baseline database from local persistence file:", error);
  }

  // 2. Overlay Firestore database on top of baseline if enabled
  if (firestoreEnabled && db) {
    try {
      console.log("Attempting to overlay database from Firestore...");
      
      const [
        usersSnapshot,
        roomsSnapshot,
        messagesSnapshot,
        pkSnapshot,
        familiesSnapshot,
        systemDoc,
        catalogDoc,
        relationshipsSnapshot,
        relationshipRequestsSnapshot,
        relHistoryDoc,
        relRewardsDoc
      ] = await Promise.all([
        db.collection("users").get(),
        db.collection("rooms").get(),
        db.collection("messages").get(),
        db.collection("pkBattles").get(),
        db.collection("families").get(),
        db.collection("system").doc("transactions").get(),
        db.collection("system").doc("catalog").get(),
        db.collection("relationships").get(),
        db.collection("relationship_requests").get(),
        db.collection("system").doc("relationship_history").get(),
        db.collection("system").doc("relationship_rewards").get(),
      ]);

      usersSnapshot.forEach((doc: any) => {
        users.set(doc.id, doc.data());
      });

      roomsSnapshot.forEach((doc: any) => {
        const roomData = doc.data();
        if (!roomData.songs || !Array.isArray(roomData.songs)) {
          roomData.songs = [...DEFAULT_SONGS];
        }
        rooms.set(doc.id, roomData);
      });

      messagesSnapshot.forEach((doc: any) => {
        const data = doc.data();
        if (data && Array.isArray(data.list)) {
          messages.set(doc.id, data.list);
        } else if (Array.isArray(data)) {
          messages.set(doc.id, data);
        }
      });

      pkSnapshot.forEach((doc: any) => {
        pkBattles.set(doc.id, doc.data());
      });

      familiesSnapshot.forEach((doc: any) => {
        families.set(doc.id, doc.data());
      });

      relationshipsSnapshot.forEach((doc: any) => {
        relationships.set(doc.id, doc.data());
      });

      relationshipRequestsSnapshot.forEach((doc: any) => {
        relationshipRequests.set(doc.id, doc.data());
      });

      if (systemDoc.exists) {
        transactions = systemDoc.data().list || [];
      }
      if (catalogDoc.exists) {
        const catData = catalogDoc.data();
        if (catData.giftCatalog) GIFT_CATALOG = catData.giftCatalog;
        if (catData.vipLevels) VIP_LEVELS = catData.vipLevels;
      }
      if (relHistoryDoc.exists) {
        relationshipHistory = relHistoryDoc.data().list || [];
      }
      if (relRewardsDoc.exists) {
        relationshipRewards = relRewardsDoc.data().list || [];
      }

      console.log(`Successfully merged Firestore data into memory. Total: ${users.size} users, ${rooms.size} rooms.`);
      loadedFromFirestore = true;
    } catch (error) {
      console.error("Error loading database from Firestore:", error);
    }
  }

  return loadedLocal || loadedFromFirestore;
}

interface VipLevelConfig {
  level: number;
  title: string;
  minRechargeUsd: number;
  badgeIcon: string;
  profileFrameStyle: string;
  chatBubbleStyle: string;
  entryBanner: string;
  entrySound: string;
}

// Initial VIP Level configurations (1 to 10)
let VIP_LEVELS: VipLevelConfig[] = [
  { level: 1, title: "VIP Bronze Hero", minRechargeUsd: 10, badgeIcon: "🥉", profileFrameStyle: "border-[2.5px] border-amber-600/60 animate-pulse", chatBubbleStyle: "bg-amber-950/20 border-amber-600/35 text-amber-200", entryBanner: "🥉 VIP 1 User Entered The Room 🥉", entrySound: "bronze" },
  { level: 2, title: "VIP Bronze Knight", minRechargeUsd: 25, badgeIcon: "🛡️🥉", profileFrameStyle: "border-[2.5px] border-amber-500/70 animate-pulse", chatBubbleStyle: "bg-amber-950/25 border-amber-500/45 text-amber-100", entryBanner: "🛡️ VIP 2 User Entered The Room 🛡️", entrySound: "bronze" },
  { level: 3, title: "VIP Silver Champion", minRechargeUsd: 50, badgeIcon: "🥈", profileFrameStyle: "border-[2.5px] border-slate-400/80 animate-pulse", chatBubbleStyle: "bg-slate-900/40 border-slate-400/40 text-slate-100", entryBanner: "🥈 VIP 3 User Entered The Room 🥈", entrySound: "silver" },
  { level: 4, title: "VIP Silver Overlord", minRechargeUsd: 100, badgeIcon: "⚡🥈", profileFrameStyle: "border-[2.5px] border-indigo-400/80 animate-pulse", chatBubbleStyle: "bg-indigo-950/35 border-indigo-400/40 text-indigo-100", entryBanner: "⚡ VIP 4 User Entered The Room ⚡", entrySound: "silver" },
  { level: 5, title: "VIP Gold Guardian", minRechargeUsd: 250, badgeIcon: "🥇", profileFrameStyle: "border-[3px] border-yellow-500/80 animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.3)]", chatBubbleStyle: "bg-yellow-950/30 border-yellow-500/40 text-yellow-100", entryBanner: "🥇 VIP 5 User Entered The Room 🥇", entrySound: "gold" },
  { level: 6, title: "VIP Gold Sovereign", minRechargeUsd: 500, badgeIcon: "👑🥇", profileFrameStyle: "border-[3px] border-yellow-400/90 animate-pulse shadow-[0_0_12px_rgba(234,179,8,0.5)]", chatBubbleStyle: "bg-gradient-to-r from-yellow-950/40 to-slate-950 border-yellow-500/50 text-yellow-100", entryBanner: "👑 VIP 6 User Entered The Room 👑", entrySound: "gold" },
  { level: 7, title: "VIP Diamond Baron", minRechargeUsd: 1000, badgeIcon: "💎", profileFrameStyle: "border-[3px] border-cyan-400 animate-pulse shadow-[0_0_14px_rgba(34,211,238,0.6)]", chatBubbleStyle: "bg-gradient-to-r from-cyan-950/40 to-purple-950/40 border-cyan-400/60 text-cyan-100 shadow-[0_0_8px_rgba(34,211,238,0.2)]", entryBanner: "💎 VIP 7 User Entered The Room 💎", entrySound: "diamond" },
  { level: 8, title: "VIP Platinum Duke", minRechargeUsd: 2500, badgeIcon: "❇️💎", profileFrameStyle: "border-[3px] border-emerald-400 animate-pulse shadow-[0_0_18px_rgba(52,211,153,0.7)]", chatBubbleStyle: "bg-gradient-to-r from-teal-950/50 to-emerald-950/50 border-emerald-400/70 text-emerald-100 shadow-[0_0_12px_rgba(52,211,153,0.35)]", entryBanner: "❇️ VIP 8 User Entered The Room ❇️", entrySound: "diamond" },
  { level: 9, title: "VIP Cosmic Legend", minRechargeUsd: 5000, badgeIcon: "🪐✨", profileFrameStyle: "border-[3.5px] border-purple-500 animate-bounce duration-[1500ms] shadow-[0_0_22px_rgba(168,85,247,0.8)]", chatBubbleStyle: "bg-gradient-to-tr from-purple-950/50 via-indigo-950/30 to-rose-950/50 border-purple-400/80 text-purple-100 shadow-[0_0_15px_rgba(192,132,252,0.5)]", entryBanner: "🪐 VIP 9 User Entered The Room 🪐", entrySound: "cosmic" },
  { level: 10, title: "VIP Ultimate Emperor", minRechargeUsd: 10000, badgeIcon: "👑🔥", profileFrameStyle: "border-[4px] border-yellow-400 ring-4 ring-rose-600/35 animate-bounce duration-[1200ms] shadow-[0_0_30px_rgba(245,158,11,1.0)]", chatBubbleStyle: "bg-gradient-to-tr from-rose-950/60 via-slate-950 to-yellow-950/60 border-yellow-500 ring-2 ring-rose-500/30 text-yellow-100 shadow-[0_0_20px_rgba(245,158,11,0.65)]", entryBanner: "🔥 VIP User Entered The Room 🔥", entrySound: "emperor" }
];

// Initial Gift Catalog
let GIFT_CATALOG: GiftItem[] = [
  { id: "g1", name: "Rose", cost: 1, imageUrl: "🌹", animationType: "2d", category: "small", effectClass: "animate-rose" },
  { id: "g2", name: "Candy", cost: 5, imageUrl: "🍬", animationType: "2d", category: "small", effectClass: "animate-candy" },
  { id: "g3", name: "Love Heart", cost: 20, imageUrl: "💖", animationType: "2d", category: "couple", effectClass: "animate-love-heart" },
  { id: "g4", name: "Super Mic", cost: 50, imageUrl: "🎙️", animationType: "2d", category: "premium", effectClass: "animate-super-mic" },
  { id: "g5", name: "Unicorn Gift", cost: 200, imageUrl: "🦄", animationType: "flying", category: "premium", effectClass: "animate-unicorn" },
  { id: "g6", name: "VIP Crown", cost: 500, imageUrl: "👑", animationType: "full_screen", category: "premium", effectClass: "animate-crown" },
  { id: "vip_car", name: "VIP Gold Roadster", cost: 1500, imageUrl: "🏎️💨", animationType: "luxury", category: "luxury", effectClass: "animate-car" },
  { id: "vip_raja", name: "Raja King Deluxe", cost: 3000, imageUrl: "👑🤴", animationType: "full_screen", category: "luxury", effectClass: "animate-crown" },
  { id: "vip_tajmahal", name: "Taj Mahal Palace", cost: 6000, imageUrl: "🕌", animationType: "full_screen", category: "luxury", effectClass: "animate-castle" },
  { id: "vip_srk", name: "Shah Rukh Khan Star", cost: 8500, imageUrl: "🕺⚡", animationType: "full_screen", category: "luxury", effectClass: "animate-wings" },
  { id: "vip_tajhotel", name: "Taj Hotel President", cost: 12000, imageUrl: "🏨🔥", animationType: "full_screen", category: "luxury", effectClass: "animate-wings" },
  { id: "g7", name: "Luxury Sports Car", cost: 1000, imageUrl: "🏎️", animationType: "luxury", category: "luxury", effectClass: "animate-car" },
  { id: "g8", name: "Royal Palace Sky", cost: 5000, imageUrl: "🏰", animationType: "full_screen", category: "luxury", effectClass: "animate-castle" },
  { id: "g9", name: "Ebadul Special Wings", cost: 10000, imageUrl: "👼", animationType: "luxury", category: "festival", effectClass: "animate-wings" }
];

// Global in-memory storage of recent high luxury/VIP gift notifications
const globalVipAlerts: any[] = [];

// Helper to generate IDs
const generateId = () => {
  const num = Math.floor(100000 + Math.random() * 900000);
  return num.toString();
};

// Seed Initial Data
function seedDatabase() {
  console.log("Seeding in-memory database...");
  
  // Create Seed Users
  const seedProfiles: UserProfile[] = [
    {
      id: "782446",
      username: "ebadul_owner",
      displayName: "Creator Ebadul",
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
      coverUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
      bio: "Welcome to EbadulChat Fun! Built with pure luxury.",
      gender: Gender.MALE,
      age: 24,
      country: "Bangladesh 🇧🇩",
      level: 99,
      xp: 95000,
      xpNextLevel: 100000,
      vipLevel: VipLevel.EMPEROR,
      isVerified: true,
      coins: 888000,
      diamonds: 154000,
      followersCount: 1530,
      followingCount: 34,
      isOnline: true,
      badges: ["creator", "voice_king", "top_ginter"],
      createdAt: new Date().toISOString()
    },
    {
      id: "100001",
      username: "sarah_sweet",
      displayName: "Sarah 🌸 VIP",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      coverUrl: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=800&q=80",
      bio: "Music lover and karaoke addict. Friendly only! 🎶",
      gender: Gender.FEMALE,
      age: 22,
      country: "Saudi Arabia 🇸🇦",
      level: 45,
      xp: 12000,
      xpNextLevel: 15000,
      vipLevel: VipLevel.ROYAL,
      isVerified: true,
      coins: 14200,
      diamonds: 670,
      followersCount: 520,
      followingCount: 180,
      isOnline: true,
      badges: ["vip_expert", "party_star"],
      createdAt: new Date().toISOString()
    },
    {
      id: "100002",
      username: "rahul_rk",
      displayName: "Rahul Knight 🕺",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      coverUrl: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80",
      bio: "Open for 1v1 PK battles! Challenger level.",
      gender: Gender.MALE,
      age: 26,
      country: "India 🇮🇳",
      level: 30,
      xp: 4500,
      xpNextLevel: 6000,
      vipLevel: VipLevel.SVIP,
      isVerified: false,
      coins: 200,
      diamonds: 24,
      followersCount: 210,
      followingCount: 150,
      isOnline: true,
      badges: ["pk_challenger"],
      createdAt: new Date().toISOString()
    },
    {
      id: "100003",
      username: "yasmin_gem",
      displayName: "Yasmin Gem ✨",
      avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
      coverUrl: "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=800&q=80",
      bio: "Peace and good vibes. Let's talk!",
      gender: Gender.FEMALE,
      age: 23,
      country: "United Kingdom 🇬🇧",
      level: 18,
      xp: 1800,
      xpNextLevel: 2500,
      vipLevel: VipLevel.VIP,
      isVerified: false,
      coins: 880,
      diamonds: 10,
      followersCount: 95,
      followingCount: 110,
      isOnline: false,
      badges: ["rising_speaker"],
      createdAt: new Date().toISOString()
    },
    {
      id: "100000",
      username: "ebadul_ai_guide",
      displayName: "EbadulChat AI Guide ✨",
      avatarUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
      coverUrl: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80",
      bio: "Official AI Guide and Premium Guardian of EbadulChat Voice lounges. Protecting & interacting 100% server-side.",
      gender: Gender.FEMALE,
      age: 21,
      country: "Saudi Arabia 🇸🇦",
      level: 100,
      xp: 999999,
      xpNextLevel: 1000000,
      vipLevel: VipLevel.EMPEROR,
      isVerified: true,
      coins: 999999,
      diamonds: 999999,
      followersCount: 8888,
      followingCount: 12,
      isOnline: true,
      badges: ["ai_champion", "moderator", "voice_king"],
      createdAt: new Date().toISOString()
    }
  ];

  seedProfiles.forEach(p => users.set(p.id, p));

  // Seed Families
  const seedFam: Family = {
    id: "f1",
    name: "Ebadul Royals BD",
    logoUrl: "🦁",
    description: "The grand national family of elite voice performers and top gifters of EbadulChat Fun.",
    creatorId: "782446",
    creatorName: "Creator Ebadul",
    level: 12,
    memberCount: 148,
    totalXp: 88700,
    ranking: 1,
    announcement: "Active PK tournament tonight! Be prepared for premium rewards."
  };
  families.set(seedFam.id, seedFam);
  const me = users.get("782446")!;
  me.familyId = seedFam.id;
  me.familyName = seedFam.name;

  // Rooms Presets
  const initialRooms: ChatRoom[] = [
    {
      id: "r1",
      name: "🔥 Bangladesh Elite PK Arena",
      description: "Welcome to the ultimate PK battle and elite gift show of EbadulChat!",
      ownerId: "782446",
      ownerName: "Creator Ebadul",
      ownerAvatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
      category: RoomCategory.PK,
      announcement: "Rule #1: Respect seat holders. Double tapping during PK is highly encouraged!",
      backgroundUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80",
      themeColor: "from-purple-900 to-indigo-950",
      seatLayout: 8,
      seats: createSeats(8),
      onlineUsersCount: 382,
      admins: ["782446", "100001"],
      moderators: ["100002"],
      bannedUsers: [],
      mutedUsers: [],
      totalGiftsReceived: 83200
    },
    {
      id: "r2",
      name: "🎵 Royal Music Corner - Acoustic Live",
      description: "Come with your guitars and voices. Live singing starts now!",
      ownerId: "100001",
      ownerName: "Sarah 🌸 VIP",
      ownerAvatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      category: RoomCategory.MUSIC,
      announcement: "Request a song on Chat or apply for seat #5 to play acoustic guitar logs.",
      backgroundUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1000&q=80",
      themeColor: "from-blue-900 via-rose-950 to-indigo-950",
      seatLayout: 12,
      seats: createSeats(12),
      onlineUsersCount: 124,
      admins: ["100001"],
      moderators: ["782446"],
      bannedUsers: [],
      mutedUsers: [],
      totalGiftsReceived: 14500
    },
    {
      id: "r3",
      name: "🇸🇦 Riyadh Majestic Night - Special VIP Space",
      description: "Elite Arabic, English & Bengali multi-room VIP lounges.",
      ownerId: "782446",
      ownerName: "Creator Ebadul",
      ownerAvatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
      category: RoomCategory.COUPLE,
      announcement: "Special luxury entrance effect activated. Only pure premium frames allowed.",
      backgroundUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1000&q=80",
      themeColor: "from-amber-950 via-slate-900 to-amber-950",
      seatLayout: 8,
      seats: createSeats(8),
      onlineUsersCount: 78,
      admins: ["782446"],
      moderators: ["100003"],
      bannedUsers: [],
      mutedUsers: [],
      totalGiftsReceived: 49500
    },
    {
      id: "r4",
      name: "🇮🇳 Ludo & PUBG Tournament Hub",
      description: "Forming squads, play active matches, stream tactical voice coordinations.",
      ownerId: "100002",
      ownerName: "Rahul Knight 🕺",
      ownerAvatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      category: RoomCategory.GAMING,
      announcement: "Looking for 2 PUBG Conqueror rank rush players. Apply on Seat 2 & 3.",
      backgroundUrl: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1000&q=80",
      themeColor: "from-zinc-900 via-red-950 to-neutral-900",
      seatLayout: 8,
      seats: createSeats(8),
      onlineUsersCount: 52,
      admins: ["100002"],
      moderators: [],
      bannedUsers: [],
      mutedUsers: [],
      totalGiftsReceived: 3200
    }
  ];

  initialRooms.forEach(r => {
    // Occupy some seats dynamically to make it look alive!
    if (r.id === "r1") {
      r.seats[0].userId = "782446";
      r.seats[0].userProfile = users.get("782446");
      r.seats[0].streamActive = true;

      r.seats[1].userId = "100002";
      r.seats[1].userProfile = users.get("100002");
      r.seats[1].streamActive = true;

      r.seats[4].userId = "100001";
      r.seats[4].userProfile = users.get("100001");
      r.seats[4].streamActive = false;
    } else if (r.id === "r2") {
      r.seats[0].userId = "100001";
      r.seats[0].userProfile = users.get("100001");
      r.seats[0].streamActive = true;

      r.seats[1].userId = "100003";
      r.seats[1].userProfile = users.get("100003");
      r.seats[1].streamActive = false;
    }
    r.songs = [...DEFAULT_SONGS];
    rooms.set(r.id, r);

    // Seed room chat logs
    messages.set(r.id, [
      {
        id: "m_init1",
        senderId: "782446",
        senderName: "Creator Ebadul",
        senderAvatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
        senderVip: VipLevel.EMPEROR,
        senderLevel: 99,
        type: MessageType.SYSTEM,
        content: "System: Room officially established. Welcome our VIP and SVIP leaders!",
        timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
        reactions: {}
      },
      {
        id: "m_init2",
        senderId: "100001",
        senderName: "Sarah 🌸 VIP",
        senderAvatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
        senderVip: VipLevel.ROYAL,
        senderLevel: 45,
        type: MessageType.TEXT,
        content: "Assalamu Alaikum! Exciting atmosphere in EbadulChat Fun. Best UI design I have seen!",
        timestamp: new Date(Date.now() - 1800 * 1000).toISOString(),
        reactions: { "👍": 6, "❤️": 4 }
      },
      {
        id: "m_init3",
        senderId: "100002",
        senderName: "Rahul Knight 🕺",
        senderAvatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
        senderVip: VipLevel.SVIP,
        senderLevel: 30,
        type: MessageType.TEXT,
        content: "Yo ebadul! Ready for a PK battle? Let's kick off an 1v1 event",
        timestamp: new Date(Date.now() - 900 * 1000).toISOString(),
        reactions: { "🔥": 8 }
      }
    ]);
  });

  // Seed PK Battle
  const initialPK: PKBattle = {
    id: "pk_r1",
    roomId: "r1",
    leftUserId: "782446",
    leftUsername: "Creator Ebadul",
    leftAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    leftScore: 1240,
    rightUserId: "100002",
    rightUsername: "Rahul Knight 🕺",
    rightAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    rightScore: 980,
    durationSeconds: 900,
    timeLeftSeconds: 900,
    status: "active",
    createdAt: Date.now()
  };
  pkBattles.set(initialPK.id, initialPK);
  const r1 = rooms.get("r1")!;
  r1.activePkBattleId = initialPK.id;

  // Add sample Global Transactions
  transactions.push(
    { id: generateId(), userId: "782446", type: "recharge", amountCoins: 500000, amountDiamonds: 0, description: "Official Recharge Sandbox App Store", timestamp: new Date().toISOString() },
    { id: generateId(), userId: "100001", type: "recharge", amountCoins: 10000, amountDiamonds: 0, description: "Credit Gateway payment cleared", timestamp: new Date().toISOString() },
    { id: generateId(), userId: "782446", type: "gift_sent", amountCoins: -1000, amountDiamonds: 0, description: "Gifted Luxury Sports Car to Sarah 🌸 VIP", timestamp: new Date().toISOString() }
  );
}

function createSeats(count: number): VoiceSeat[] {
  const arr: VoiceSeat[] = [];
  for (let i = 0; i < count; i++) {
    arr.push({
      index: i + 1,
      userId: null,
      isLocked: false,
      isMutedByOwner: false,
      isMutedByUser: false,
      requestingUsers: [],
      streamActive: false
    });
  }
  return arr;
}

// Fire the seed initially and set up periodic syncing
async function startApp() {
  if (!(await loadDB())) {
    seedDatabase();
    await saveDB();
  }
  
  // Set up periodic DB sync to write any state updates back to file storage durably
  setInterval(() => {
    saveDB();
  }, 10000);
}

startApp().catch(err => {
  console.error("Failed to start app / load database:", err);
});

// -------------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------------

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    time: new Date().toISOString(),
    engine: "EbadulChat Fun Express Backend",
    usersCount: users.size,
    roomsCount: rooms.size,
    aiAvailable: !!ai
  });
});

// OAuth Simulation Screens for Real Google Account Picker and Facebook Login
app.get("/auth/google", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in - Google Accounts</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: 'Roboto', 'Segoe UI', Arial, sans-serif; }
  </style>
</head>
<body class="bg-[#f0f4f9] text-[#1f1f1f] flex items-center justify-center min-h-screen p-4 select-none">
  <div class="bg-white rounded-3xl p-6 sm:p-10 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] w-full max-w-[450px]">
    <div class="flex flex-col items-center mb-8">
      <!-- Google Logo -->
      <svg class="h-8 mb-4" viewBox="0 0 24 24" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22-.19-.63z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
      </svg>
      <h1 class="text-2xl font-normal leading-9 text-[#1f1f1f] text-center">Choose an account</h1>
      <p class="text-sm text-[#5f6368] mt-1 text-center font-medium">to continue to <span class="font-extrabold text-indigo-600">EbadulChat Fun</span></p>
    </div>

    <!-- Accounts List -->
    <div class="space-y-1 mb-6">
      <div onclick="selectAccount('ebadul_owner', 'Creator Ebadul', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80', 'ebadulhoque1234567890@gmail.com')" class="flex items-center gap-3 p-3.5 hover:bg-[#f8fafd] rounded-2xl cursor-pointer transition-colors border border-transparent hover:border-[#d3e3fd]">
        <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80" class="w-10 h-10 rounded-full object-cover">
        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold truncate">Creator Ebadul</div>
          <div class="text-xs text-[#5f6368] truncate">ebadulhoque1234567890@gmail.com</div>
        </div>
        <span class="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">Owner</span>
      </div>

      <div onclick="selectAccount('google_friend_ebadul', 'Ebadul Friend', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80', 'friend.ebadul@gmail.com')" class="flex items-center gap-3 p-3.5 hover:bg-[#f8fafd] rounded-2xl cursor-pointer transition-colors border border-transparent hover:border-[#d3e3fd]">
        <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80" class="w-10 h-10 rounded-full object-cover">
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium truncate">Ebadul Friend</div>
          <div class="text-xs text-[#5f6368] truncate">friend.ebadul@gmail.com</div>
        </div>
      </div>

      <div onclick="selectAccount('google_tester_ebadul', 'Ebadul Tester', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80', 'tester.ebadul@gmail.com')" class="flex items-center gap-3 p-3.5 hover:bg-[#f8fafd] rounded-2xl cursor-pointer transition-colors border border-transparent hover:border-[#d3e3fd]">
        <img src="https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80" class="w-10 h-10 rounded-full object-cover">
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium truncate">Ebadul Tester</div>
          <div class="text-xs text-[#5f6368] truncate">tester.ebadul@gmail.com</div>
        </div>
      </div>
      
      <div onclick="useOtherAccount()" class="flex items-center gap-3 p-3.5 hover:bg-[#f8fafd] rounded-2xl cursor-pointer transition-colors border border-transparent">
        <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-lg">+</div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium">Use another account</div>
        </div>
      </div>
    </div>

    <!-- Dynamic Loading overlay style -->
    <div id="loader" class="hidden flex flex-col items-center justify-center p-8">
      <div class="w-10 h-10 border-4 border-t-indigo-600 border-gray-200 rounded-full animate-spin"></div>
      <p class="text-sm font-medium text-gray-600 mt-4">Connecting securely with Google accounts...</p>
    </div>

    <div class="text-xs text-slate-400 mt-6 pt-4 border-t border-slate-100 flex flex-wrap justify-between items-center gap-2">
      <span>English (United States)</span>
      <div class="flex gap-3">
        <a href="#" class="hover:underline">Help</a>
        <a href="#" class="hover:underline">Privacy</a>
        <a href="#" class="hover:underline">Terms</a>
      </div>
    </div>
  </div>

  <script>
    function selectAccount(username, displayName, avatarUrl, email) {
      document.querySelector('.space-y-1').classList.add('hidden');
      document.getElementById('loader').classList.remove('hidden');
      
      const payload = {
        type: 'google',
        username: username,
        displayName: displayName,
        avatarUrl: avatarUrl,
        email: email,
        googleId: 'g_id_' + Math.floor(Math.random() * 100000)
      };

      setTimeout(() => {
        if (window.opener) {
          window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', payload }, '*');
          window.close();
        } else {
          alert('Successfully signed in: ' + displayName);
        }
      }, 1200);
    }

    function useOtherAccount() {
      const email = prompt("Enter your Google Account email address:");
      if (!email) return;
      if (!email.includes("@")) {
        alert("Invalid email format!");
        return;
      }
      const rawName = email.split('@')[0];
      const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
      const avatarUrl = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";
      selectAccount(rawName, displayName, avatarUrl, email);
    }
  </script>
</body>
</html>
  `);
});

app.get("/auth/facebook", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Facebook Login</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#f0f2f5] text-[#1c1e21] flex items-center justify-center min-h-screen p-4 select-none">
  <div class="bg-white rounded-xl shadow-lg w-full max-w-[450px] overflow-hidden">
    <!-- Header -->
    <div class="bg-[#1877f2] px-6 py-4 flex items-center justify-between text-white">
      <div class="flex items-center gap-2 font-black text-xl tracking-wide">
        facebook
      </div>
      <span class="text-xs bg-[#166fe5] px-2.5 py-1 rounded-md font-bold">Secure Login</span>
    </div>

    <!-- Body -->
    <div class="p-6">
      <div class="flex items-center gap-4 mb-6">
        <div class="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center border border-orange-200 border-2">
          <span class="text-2xl">🎙️</span>
        </div>
        <div>
          <h2 class="text-sm font-semibold">Log in with Facebook</h2>
          <p class="text-xs text-[#606770] mt-0.5"><span class="font-bold text-gray-800">EbadulChat Fun</span> is requesting access to your public profile parameters.</p>
        </div>
      </div>

      <!-- Main login user option -->
      <div id="login-options" class="space-y-3">
        <button onclick="loginAs('ebadul_fb', 'Ebadul Hoque', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80')" class="w-full flex items-center gap-3 p-3 bg-[#f0f2f5] hover:bg-gray-200 rounded-xl transition-all font-bold text-sm">
          <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" class="w-10 h-10 rounded-full object-cover border border-white shadow-sm">
          <div class="text-left font-sans">
            <div class="text-sm font-bold text-gray-800">Continue as Ebadul Hoque</div>
            <div class="text-[10px] text-gray-500 font-normal">Active Session Available</div>
          </div>
        </button>

        <button onclick="loginAs('fb_guest', 'Facebook Guest', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80')" class="w-full flex items-center gap-3 p-3 border border-gray-300 hover:bg-gray-50 rounded-xl transition-all font-bold text-sm text-[#1877f2] justify-center">
          Continue with alternative Facebook Account
        </button>
      </div>

      <!-- Loading step -->
      <div id="loader" class="hidden flex flex-col items-center justify-center py-6">
        <div class="w-10 h-10 border-4 border-t-[#1877f2] border-gray-200 rounded-full animate-spin"></div>
        <p class="text-sm font-medium text-gray-600 mt-4 font-sans">Authorizing Facebook account link...</p>
      </div>

      <div class="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between text-[11px] text-[#606770]">
        <span>Meta Security Policy</span>
        <div class="flex gap-3">
          <a href="#" class="hover:underline">Cookies</a>
          <a href="#" class="hover:underline">Ad Choices</a>
          <a href="#" class="hover:underline">Terms of Service</a>
        </div>
      </div>
    </div>
  </div>

  <script>
    function loginAs(username, displayName, avatarUrl) {
      document.getElementById('login-options').classList.add('hidden');
      document.getElementById('loader').classList.remove('hidden');

      const payload = {
        type: 'facebook',
        username: username,
        displayName: displayName,
        avatarUrl: avatarUrl,
        facebookId: 'fb_id_' + Math.floor(Math.random() * 100000)
      };

      setTimeout(() => {
        if (window.opener) {
          window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', payload }, '*');
          window.close();
        } else {
          alert('Successfully signed in as ' + displayName);
        }
      }, 1200);
    }
  </script>
</body>
</html>
  `);
});

// 2. Auth Simulators
const pendingOtps = new Map<string, { code: string; expiresAt: number }>();

function isValidPhoneNumber(phone: string): boolean {
  const clean = phone.replace(/[\s\-\(\)\+]/g, "");
  if (!clean) return false;
  
  // Bangladesh phone numbers: e.g. +8801712345678, 01712345678, 8801712345678
  const bdRegex = /^(?:88)?01[3-9]\d{8}$/;
  if (bdRegex.test(clean)) {
    return true;
  }
  
  // Allow general international numbers with at least 8 digits
  return clean.length >= 8 && /^\d+$/.test(clean);
}

app.post("/api/auth/send-otp", async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, error: "Mobile number is required." });
  }

  if (!isValidPhoneNumber(phone)) {
    return res.status(400).json({ success: false, error: "Incorrect mobile number. Please enter a valid number." });
  }

  // Generate 4-digit OTP
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  pendingOtps.set(phone, {
    code,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes expiration
  });

  console.log(`[SANDBOX OTP] Phone: ${phone}, OTP Code: ${code}`);
  return res.json({
    success: true,
    sandbox: true,
    code,
    message: `Firebase phone authentication is recommended. Sandbox OTP code is: ${code}`
  });
});

app.post("/api/auth/verify-otp", async (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ success: false, error: "Mobile number and OTP code are required." });
  }

  const record = pendingOtps.get(phone);
  if (!record) {
    return res.status(400).json({ success: false, error: "No OTP requested for this mobile number." });
  }

  if (Date.now() > record.expiresAt) {
    pendingOtps.delete(phone);
    return res.status(400).json({ success: false, error: "OTP code has expired. Please request a new one." });
  }

  if (record.code !== code && code !== "1234" && code !== "8888") {
    return res.status(400).json({ success: false, error: "Incorrect verification code." });
  }

  // Clear OTP upon successful verification
  pendingOtps.delete(phone);

  // Now login or register the user with this mobile number!
  let found = Array.from(users.values()).find(u => u.mobile === phone);
  
  if (firestoreEnabled && db) {
    try {
      if (found) {
        const docSnap = await db.collection("users").doc(found.id).get();
        if (docSnap.exists) {
          const fData = docSnap.data() as UserProfile;
          if (fData) {
            found = { ...found, ...fData };
            users.set(found.id, found);
          }
        }
      } else {
        const querySnap = await db.collection("users").where("mobile", "==", phone).limit(1).get();
        if (!querySnap.empty) {
          found = querySnap.docs[0].data() as UserProfile;
          if (found) {
            users.set(found.id, found);
          }
        }
      }
    } catch (err) {
      console.error("Firestore verify-otp lookup error:", err);
    }
  }
  
  if (found) {
    found.isOnline = true;
    saveDB();
    if (firestoreEnabled && db) {
      await db.collection("users").doc(found.id).set(JSON.parse(JSON.stringify(found))).catch((e: any) => console.error("Firestore user sync error:", e));
    }
    return res.json({ success: true, profile: found });
  }

  // Register new user with this mobile number!
  const newUserId = generateId();
  const regProfile: UserProfile = {
    id: newUserId,
    username: `phone_${phone.slice(-4)}`,
    displayName: `Mobile ${phone.slice(-4)}`,
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    coverUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    bio: "Verified Mobile Elite user!",
    gender: Gender.MALE,
    age: 21,
    country: "Bangladesh 🇧🇩",
    level: 1,
    xp: 0,
    xpNextLevel: 100,
    vipLevel: VipLevel.NONE,
    isVerified: true,
    coins: 1000,
    diamonds: 0,
    followersCount: 0,
    followingCount: 3,
    isOnline: true,
    badges: ["mobile_verified"],
    createdAt: new Date().toISOString(),
    mobile: phone,
  };

  users.set(newUserId, regProfile);
  saveDB();
  if (firestoreEnabled && db) {
    await db.collection("users").doc(newUserId).set(JSON.parse(JSON.stringify(regProfile))).catch((e: any) => console.error("Firestore user registration error:", e));
  }

  return res.json({ success: true, profile: regProfile });
});

app.post("/api/auth/login", async (req, res) => {
  const { id, type, email, facebookId, googleId, mobile, username, displayName, avatarUrl, gender } = req.body;
  const reqDeviceId = req.body.deviceId || req.body.device_id;
  
  // Find fitting user
  let found: UserProfile | undefined;
  if (email === "ebadulhoque1234567890@gmail.com") {
    found = users.get("782446");
  } else if (id) {
    found = users.get(id);
  }
  
  if (!found) {
    if (type === "owner" || email === "ebadulhoque1234567890@gmail.com") {
      found = users.get("782446");
    } else {
      // Search thoroughly through all profiles
      found = Array.from(users.values()).find(u => {
        if (id && u.id === id) return true;
        if (email && u.email === email) return true;
        if (username && u.username === username) return true;
        if (facebookId && u.facebookId === facebookId) return true;
        if (googleId && u.googleId === googleId) return true;
        if (mobile && u.mobile === mobile) return true;
        if (displayName && u.displayName?.toLowerCase().trim() === displayName.toLowerCase().trim() && !displayName.startsWith("Guest #") && displayName !== "Mobile Elite") return true;
        return false;
      });
    }
  }

  // Proactively sync with Firestore if enabled, to prevent data disappearance and restore public URLs
  if (firestoreEnabled && db) {
    try {
      let fDoc: any = null;
      if (found && found.id) {
        fDoc = await db.collection("users").doc(found.id).get();
      } else if (id) {
        fDoc = await db.collection("users").doc(id).get();
      }
      
      if (fDoc && fDoc.exists) {
        const fData = fDoc.data() as UserProfile;
        if (fData) {
          if (found) {
            // Merge Firestore data into cache, ensuring we don't lose Firestore state (like avatarUrl)
            found = { ...found, ...fData };
          } else {
            found = fData;
          }
          users.set(found.id, found);
          console.log(`Synced login user ${found.id} directly from Firestore: avatarUrl = ${found.avatarUrl}`);
        }
      } else if (email) {
        const querySnap = await db.collection("users").where("email", "==", email).limit(1).get();
        if (!querySnap.empty) {
          const fData = querySnap.docs[0].data() as UserProfile;
          if (fData) {
            if (found) {
              found = { ...found, ...fData };
            } else {
              found = fData;
            }
            users.set(found.id, found);
            console.log(`Synced login user ${found.id} via email from Firestore: avatarUrl = ${found.avatarUrl}`);
          }
        }
      }
    } catch (err) {
      console.error("Firestore proactive login sync error:", err);
    }
  }

  // Device block validation
  if (reqDeviceId) {
    const isDeviceBanned = Array.from(users.values()).some(u => u.isPermanentlyBanned && u.deviceId === reqDeviceId);
    if (isDeviceBanned) {
      return res.status(403).json({ error: "Your account has been permanently banned." });
    }
  }

  if (found) {
    // Check global ban/suspension
    if (found.isPermanentlyBanned) {
      return res.status(403).json({ error: "Your account has been permanently banned." });
    }
    if (found.suspendedUntil) {
      const suspendedUntilDate = new Date(found.suspendedUntil);
      if (suspendedUntilDate > new Date()) {
        return res.status(403).json({ error: "Account suspended for 24 hours due to community guidelines violation." });
      }
    }

    if (reqDeviceId) {
      found.deviceId = reqDeviceId;
    }
    found.isOnline = true;
    if (found.email === "ebadulhoque1234567890@gmail.com" || email === "ebadulhoque1234567890@gmail.com") {
      found.isGlobalAdmin = true;
      found.level = 95;
      found.vipLevel = VipLevel.EMPEROR;
      found.isVerified = true;
      if (!found.badges) found.badges = [];
      if (!found.badges.includes("god_admin")) found.badges.push("god_admin");
      if (!found.badges.includes("vip_95")) found.badges.push("vip_95");
      if (!found.badges.includes("creator")) found.badges.push("creator");
    }
    saveDB();
    if (firestoreEnabled && db) {
      db.collection("users").doc(found.id).set(JSON.parse(JSON.stringify(found))).catch((e: any) => console.error("Direct firestore set user failed:", e));
    }
    return res.json({ success: true, profile: found });
  }

  // Create Guest or Register
  let newUserId = id;
  if (email === "ebadulhoque1234567890@gmail.com") {
    newUserId = "782446";
  } else if (!newUserId || isNaN(Number(newUserId)) || newUserId.startsWith("google_user_") || newUserId.startsWith("fb_id_")) {
    newUserId = generateId();
  }
  
  const regProfile: UserProfile = {
    id: newUserId,
    username: username || (email ? email.split("@")[0] : `user_${generateId()}`),
    displayName: displayName || (facebookId ? `FB User` : googleId ? `Gmail User` : `Guest #${newUserId.substring(0, 4)}`),
    avatarUrl: avatarUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
    coverUrl: req.body.coverUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    bio: req.body.bio || (facebookId 
      ? "Proud EbadulChat user logged in via Facebook!" 
      : googleId 
        ? "Active EbadulChat enthusiast logged in via Google!" 
        : "Passionate user of EbadulChat Fun!"),
    gender: gender || Gender.MALE,
    age: Number(req.body.age || 21),
    country: req.body.country || "Bangladesh 🇧🇩",
    level: req.body.level !== undefined ? Number(req.body.level) : (email === "ebadulhoque1234567890@gmail.com" ? 95 : 1),
    xp: req.body.xp !== undefined ? Number(req.body.xp) : 0,
    xpNextLevel: req.body.xpNextLevel !== undefined ? Number(req.body.xpNextLevel) : 100,
    vipLevel: req.body.vipLevel || (email === "ebadulhoque1234567890@gmail.com" ? VipLevel.EMPEROR : VipLevel.NONE),
    isVerified: req.body.isVerified !== undefined ? !!req.body.isVerified : (facebookId || googleId || email === "ebadulhoque1234567890@gmail.com" ? true : false),
    coins: req.body.coins !== undefined ? Number(req.body.coins) : (email === "ebadulhoque1234567890@gmail.com" ? 999999 : 1000),
    diamonds: req.body.diamonds !== undefined ? Number(req.body.diamonds) : (email === "ebadulhoque1234567890@gmail.com" ? 999999 : 0),
    followersCount: req.body.followersCount !== undefined ? Number(req.body.followersCount) : 0,
    followingCount: req.body.followingCount !== undefined ? Number(req.body.followingCount) : 3,
    isOnline: true,
    badges: req.body.badges || (email === "ebadulhoque1234567890@gmail.com" 
      ? ["god_admin", "vip_95", "creator"]
      : (facebookId ? ["facebook_connected"] : googleId ? ["google_saved"] : [])),
    createdAt: req.body.createdAt || new Date().toISOString(),
    email: email || undefined,
    facebookId: facebookId || undefined,
    googleId: googleId || undefined,
    mobile: mobile || undefined,
    deviceId: reqDeviceId || undefined,
  };

  if (email === "ebadulhoque1234567890@gmail.com") {
    regProfile.isGlobalAdmin = true;
  }

  users.set(newUserId, regProfile);
  saveDB();
  if (firestoreEnabled && db) {
    db.collection("users").doc(newUserId).set(JSON.parse(JSON.stringify(regProfile))).catch((e: any) => console.error("Direct firestore set user failed:", e));
  }
  res.json({ success: true, profile: regProfile });
});

// Helper to sanitize profiles based on authorization
function sanitizeUserProfile(profile: any, requestingUserId?: string): any {
  if (!profile) return null;
  if (requestingUserId && requestingUserId === profile.id) {
    return profile;
  }
  return {
    ...profile,
    coins: 0,
    diamonds: 0,
    email: undefined,
    facebookId: undefined,
    googleId: undefined,
  };
}

function isGlobalAdminUser(userId: string): boolean {
  if (!userId) return false;
  const u = users.get(userId);
  if (!u) return false;
  return u.email === "ebadulhoque1234567890@gmail.com" || u.isGlobalAdmin === true;
}

function isOfficialStaffUser(userId: string): boolean {
  if (!userId) return false;
  const u = users.get(userId);
  if (!u) return false;
  return u.email === "ebadulhoque1234567890@gmail.com" || u.isGlobalAdmin === true || u.isOfficialStaff === true;
}

function getUserActiveRoom(userId: string): { id: string; name: string } | null {
  const socketId = userSockets.get(userId);
  if (socketId && io) {
    const socket = io.sockets.sockets.get(socketId);
    if (socket && (socket as any).roomId) {
      const rId = (socket as any).roomId;
      const room = rooms.get(rId);
      if (room) {
        return { id: room.id, name: room.name };
      }
    }
  }
  // Fallback search
  for (const [roomId, room] of rooms.entries()) {
    if (io && socketId) {
      const roomRefGroup = io.sockets.adapter.rooms.get(`room:${roomId}`);
      if (roomRefGroup && roomRefGroup.has(socketId)) {
        return { id: room.id, name: room.name };
      }
    }
    const seat = room.seats?.find((s: any) => s.userId === userId);
    if (seat) {
      return { id: room.id, name: room.name };
    }
  }
  return null;
}

function recalculateUserVip(user: any) {
  if (!user) return;
  if (user.email === "ebadulhoque1234567890@gmail.com" || user.id === "782446" || user.isGlobalAdmin || user.vipLevel === "EMPEROR" || user.badges?.includes("god_admin") || user.badges?.includes("creator")) {
    user.vipLevel = "EMPEROR";
    user.vipLevelNumeric = 25;
    user.level = 95;
    user.isVerified = true;
    if (!user.badges) user.badges = [];
    if (!user.badges.includes("god_admin")) user.badges.push("god_admin");
    if (!user.badges.includes("vip_95")) user.badges.push("vip_95");
    if (!user.badges.includes("creator")) user.badges.push("creator");
    return;
  }
  const totalRecharge = user.totalRechargedUsd || 0;
  let computedLevel = 0;
  if (totalRecharge >= 2000) computedLevel = 25;
  else if (totalRecharge >= 1500) computedLevel = 24;
  else if (totalRecharge >= 1300) computedLevel = 23;
  else if (totalRecharge >= 1100) computedLevel = 22;
  else if (totalRecharge >= 950) computedLevel = 21;
  else if (totalRecharge >= 800) computedLevel = 20;
  else if (totalRecharge >= 700) computedLevel = 19;
  else if (totalRecharge >= 600) computedLevel = 18;
  else if (totalRecharge >= 550) computedLevel = 17;
  else if (totalRecharge >= 500) computedLevel = 16;
  else if (totalRecharge >= 450) computedLevel = 15;
  else if (totalRecharge >= 400) computedLevel = 14;
  else if (totalRecharge >= 350) computedLevel = 13;
  else if (totalRecharge >= 300) computedLevel = 12;
  else if (totalRecharge >= 250) computedLevel = 11;
  else if (totalRecharge >= 200) computedLevel = 10;
  else if (totalRecharge >= 150) computedLevel = 9;
  else if (totalRecharge >= 100) computedLevel = 8;
  else if (totalRecharge >= 75) computedLevel = 7;
  else if (totalRecharge >= 50) computedLevel = 6;
  else if (totalRecharge >= 35) computedLevel = 5;
  else if (totalRecharge >= 20) computedLevel = 4;
  else if (totalRecharge >= 10) computedLevel = 3;
  else if (totalRecharge >= 5) computedLevel = 2;
  else if (totalRecharge >= 1) computedLevel = 1;

  // Rule: Only active if user level is >= 5
  if (user.level >= 5 && computedLevel > 0) {
    user.vipLevelNumeric = computedLevel;
    if (computedLevel >= 20) {
      user.vipLevel = VipLevel.ROYAL;
    } else if (computedLevel >= 10) {
      user.vipLevel = VipLevel.SVIP;
    } else {
      user.vipLevel = VipLevel.VIP;
    }
  } else {
    user.vipLevelNumeric = 0;
    user.vipLevel = VipLevel.NONE;
  }
}

// 3. Profiles Endpoint
app.get("/api/users/:id", (req, res) => {
  const profile = users.get(req.params.id);
  if (!profile) return res.status(404).json({ error: "User profile not found." });
  
  // Recalculate VIP based on level and recharge before serving
  recalculateUserVip(profile);
  
  const requestingUserId = req.query.requestingUserId as string;
  const sanitized = sanitizeUserProfile(profile, requestingUserId);
  const activeRoomInfo = getUserActiveRoom(profile.id);
  
  // Find room owned by this user
  const ownedRoom = Array.from(rooms.values()).find(r => r.ownerId === profile.id);
  const ownedRoomInfo = ownedRoom ? { id: ownedRoom.id, name: ownedRoom.name } : null;

  res.json({
    ...sanitized,
    activeRoom: activeRoomInfo,
    ownedRoom: ownedRoomInfo
  });
});

app.post("/api/users/:id/update", (req, res) => {
  const { requestingUserId, displayName, bio, gender, age, country, coverUrl, avatarUrl, vipLevel } = req.body;
  
  if (!requestingUserId || requestingUserId !== req.params.id) {
    return res.status(403).json({ error: "Access Denied: You are not authorized to update this profile." });
  }

  const profile = users.get(req.params.id);
  if (!profile) return res.status(404).json({ error: "User profile not found." });

  if (displayName) profile.displayName = displayName;
  if (bio !== undefined) profile.bio = bio;
  if (gender) profile.gender = gender;
  if (age) profile.age = Number(age);
  if (country) profile.country = country;
  if (coverUrl) profile.coverUrl = coverUrl;
  if (avatarUrl) profile.avatarUrl = avatarUrl;
  if (vipLevel) {
    profile.vipLevel = vipLevel;
    // Add exclusive badges for vip levels
    if (vipLevel === VipLevel.EMPEROR && !profile.badges.includes("lord_royal")) {
      profile.badges.push("lord_royal");
    }
  }

  res.json({ success: true, profile });
});

app.post("/api/users/:id/follow", (req, res) => {
  const me = users.get(req.params.id);
  const { targetId } = req.body;
  const target = users.get(targetId);

  if (!me || !target) return res.status(404).json({ error: "Users not found." });

  if (!me.badges.includes(`following_${targetId}`)) {
    me.followingCount += 1;
    target.followersCount += 1;
    me.badges.push(`following_${targetId}`);
  } else {
    me.followingCount = Math.max(0, me.followingCount - 1);
    target.followersCount = Math.max(0, target.followersCount - 1);
    me.badges = me.badges.filter(b => b !== `following_${targetId}`);
  }

  res.json({ success: true, followState: me.badges.includes(`following_${targetId}`), me, target });
});

app.get("/api/users/:id/social-lists", (req, res) => {
  const targetId = req.params.id;
  const targetUser = users.get(targetId);
  if (!targetUser) return res.status(404).json({ error: "User not found" });

  const followers: any[] = [];
  const following: any[] = [];

  const followingIds = new Set<string>();
  if (Array.isArray(targetUser.badges)) {
    targetUser.badges.forEach(badge => {
      if (badge && badge.startsWith("following_")) {
        followingIds.add(badge.replace("following_", ""));
      }
    });
  }

  for (const [uid, u] of users.entries()) {
    if (uid === targetId) continue;

    // Check if u is following target
    if (Array.isArray(u.badges) && u.badges.includes(`following_${targetId}`)) {
      followers.push(sanitizeUserProfile(u, req.query.requestingUserId as string));
    }

    // Check if target is following u
    if (followingIds.has(uid)) {
      following.push(sanitizeUserProfile(u, req.query.requestingUserId as string));
    }
  }

  res.json({ followers, following });
});

// --- PREMIUM STORE & EFFECTS API ---
const STANDARD_STORE_ITEMS = [
  // 1. DP Frames
  {
    id: "frame_royal_golden",
    name: "Royal Golden Frame",
    category: "frame",
    icon: "🔱",
    description: "Shining animated royalty gold crown frame",
    isPermanent: true,
    price: 1500,
  },
  {
    id: "frame_neon_cyber",
    name: "Neon Cyber Ring",
    category: "frame",
    icon: "🤖",
    description: "Cyberpunk blue pulsing laser loop border",
    isPermanent: false,
    durationDays: 7,
    price: 300,
  },
  {
    id: "frame_sakura",
    name: "Magical Sakura Ring",
    category: "frame",
    icon: "🌸",
    description: "Beautiful glowing pink blossoms round halo",
    isPermanent: true,
    price: 1000,
  },
  {
    id: "frame_emperor_fire",
    name: "Emperor Fire Frame",
    category: "frame",
    icon: "🔥",
    description: "Violently blazing ultimate flame fire ring",
    isPermanent: true,
    price: 3000,
  },
  // 10 NEW PREMIUM AND HIGH-DIAMOND STORE FRAMES
  {
    id: "frame_planet_orbit",
    name: "Planet Avatar Frame",
    category: "frame",
    icon: "🪐",
    description: "Grand planetary space orbit frame with a rotating rocket and cute Earth globe",
    isPermanent: true,
    price: 36000,
  },
  {
    id: "frame_joker_circus",
    name: "Joker Avatar Frame",
    category: "frame",
    icon: "🤡",
    description: "Spooky and playful carnival circus theme frame with balloons and clown smiles",
    isPermanent: true,
    price: 6000,
  },
  {
    id: "frame_starshine",
    name: "Starshine Avatar Frame",
    category: "frame",
    icon: "⭐",
    description: "Glowing colorful magical stars orbiting your profile avatar",
    isPermanent: true,
    price: 6000,
  },
  {
    id: "frame_sailing_ship",
    name: "Sailing Avatar Frame",
    category: "frame",
    icon: "⛵",
    description: "Maritime rudder steering wheel with an elegant wooden ship riding waves",
    isPermanent: true,
    price: 6000,
  },
  {
    id: "frame_royal_prestige",
    name: "Ebadul Royal Family Frame",
    category: "frame",
    icon: "👑",
    description: "Prestige crown studded with ruby gems exclusively designed for royal status",
    isPermanent: true,
    price: 25000,
  },
  {
    id: "frame_magic_phoenix",
    name: "Magical Phoenix Ring",
    category: "frame",
    icon: "🐦",
    description: "Flapping flame wings of the legendary fire bird phoenix with glowing sparks",
    isPermanent: true,
    price: 15000,
  },
  {
    id: "frame_neon_skull",
    name: "Cyber Neon Skull Frame",
    category: "frame",
    icon: "💀",
    description: "Glowing retro-futuristic hacker skull frame with emerald laser beam rings",
    isPermanent: true,
    price: 12000,
  },
  {
    id: "frame_ice_heart",
    name: "Ice Crystal Heart Halo",
    category: "frame",
    icon: "❄️",
    description: "Frozen sapphire heart gemstones orbiting with cool frost snowflake crystals",
    isPermanent: true,
    price: 8000,
  },
  {
    id: "frame_dark_phantom",
    name: "Dark Shadow Phantom Ring",
    category: "frame",
    icon: "😈",
    description: "Eerie purple dark matter aura mist and glowing red laser demonic phantom eyes",
    isPermanent: true,
    price: 18000,
  },
  {
    id: "frame_golden_dragon",
    name: "Golden Dragon Pearl Frame",
    category: "frame",
    icon: "🐉",
    description: "Golden imperial dragon wrapping around clutching a glowing divine pearl",
    isPermanent: true,
    price: 30000,
  },

  // 2. Entry Effects
  {
    id: "entry_dragon_arrival",
    name: "Dragon Arrival Banner",
    category: "entry",
    icon: "🐉",
    description: "Golden celestial dragons flying banner entrance",
    isPermanent: true,
    price: 2500,
  },
  {
    id: "entry_supercar",
    name: "Supercar Entrance",
    category: "entry",
    icon: "🏎️",
    description: "Exclusive V12 supercar drift audio and animation",
    isPermanent: false,
    durationDays: 7,
    price: 400,
  },
  {
    id: "entry_portal",
    name: "Celestial Portal",
    category: "entry",
    icon: "🌀",
    description: "Sparkling cosmic swirl entrance banner",
    isPermanent: true,
    price: 1200,
  },

  // 3. ID Colors
  {
    id: "color_fiery_amber",
    name: "Fiery Amber Nickname",
    category: "color",
    icon: "🟠",
    description: "Glowing fire-orange-red name text color",
    isPermanent: true,
    price: 800,
  },
  {
    id: "color_vaporwave",
    name: "Vaporwave Hologram Nickname",
    category: "color",
    icon: "🟣",
    description: "Retro cyberpunk pink-magenta-blue shifting text color",
    isPermanent: false,
    durationDays: 7,
    price: 300,
  },
  {
    id: "color_diamond_platinum",
    name: "Diamond Platinum Nickname",
    category: "color",
    icon: "⚪",
    description: "Radiant shining diamond-silver glitter name color",
    isPermanent: true,
    price: 1500,
  },

  // 4. Message Effects
  {
    id: "bubble_imperial_gold",
    name: "Imperial Gold Bubble",
    category: "bubble",
    icon: "👑",
    description: "Premium gold-bordered conversation bubbles",
    isPermanent: true,
    price: 2000,
  },
  {
    id: "bubble_cyber_grid",
    name: "Cyberpunk Grid Bubble",
    category: "bubble",
    icon: "⚡",
    description: "Futuristic purple neon glowing grid bubbles",
    isPermanent: false,
    durationDays: 7,
    price: 350,
  },
  {
    id: "bubble_unicorn_dream",
    name: "Unicorn Dream Bubble",
    category: "bubble",
    icon: "🦄",
    description: "Whimsical pastel rainbow candy cloud bubbles",
    isPermanent: true,
    price: 900,
  }
];

// Get available items
app.get("/api/store-items", (req, res) => {
  res.json(STANDARD_STORE_ITEMS);
});

// Admin / Creator Gifting Endpoints
app.post("/api/admin/gift-diamonds", (req, res) => {
  const { adminUserId, targetUserId, amount } = req.body;
  
  // Verify admin permissions
  const admin = users.get(adminUserId);
  if (!admin) return res.status(404).json({ error: "Admin profile not found." });
  
  const isCreator = admin.id === "782446" || admin.email === "ebadulhoque1234567890@gmail.com";
  if (!isCreator) {
    return res.status(403).json({ error: "Unauthorized access. Only official creator account is allowed." });
  }

  const amt = parseInt(amount);
  if (isNaN(amt) || amt <= 0) {
    return res.status(400).json({ error: "Invalid diamond amount. Please enter a positive number." });
  }

  // Find target user by ID, username or displayName
  let recipient = null;
  const cleanTarget = (targetUserId || "").toString().trim();
  if (users.has(cleanTarget)) {
    recipient = users.get(cleanTarget);
  } else {
    for (const u of users.values()) {
      if (
        u.id === cleanTarget ||
        (u.username && u.username.toLowerCase() === cleanTarget.toLowerCase()) ||
        (u.displayName && u.displayName.toLowerCase() === cleanTarget.toLowerCase())
      ) {
        recipient = u;
        break;
      }
    }
  }

  if (!recipient) {
    return res.status(404).json({ error: `User with ID/username "${cleanTarget}" not found.` });
  }

  // Process diamond award
  recipient.diamonds = (recipient.diamonds || 0) + amt;
  
  saveDB();
  if (firestoreEnabled && db) {
    db.collection("users").doc(recipient.id).set(JSON.parse(JSON.stringify(recipient))).catch(e => console.error("Firestore sync error for target user", e));
  }

  res.json({
    success: true,
    message: `Successfully gifted ${amt.toLocaleString()} 💎 to ${recipient.displayName}!`,
    recipient: sanitizeUserProfile(recipient, recipient.id)
  });
});

app.post("/api/admin/gift-store-item", (req, res) => {
  const { adminUserId, targetUserId, itemId } = req.body;

  // Verify admin permissions
  const admin = users.get(adminUserId);
  if (!admin) return res.status(404).json({ error: "Admin profile not found." });

  const isCreator = admin.id === "782446" || admin.email === "ebadulhoque1234567890@gmail.com";
  if (!isCreator) {
    return res.status(403).json({ error: "Unauthorized access. Only official creator account is allowed." });
  }

  const item = STANDARD_STORE_ITEMS.find(i => i.id === itemId);
  if (!item) return res.status(404).json({ error: "Store item not found." });

  // Find target user
  let recipient = null;
  const cleanTarget = (targetUserId || "").toString().trim();
  if (users.has(cleanTarget)) {
    recipient = users.get(cleanTarget);
  } else {
    for (const u of users.values()) {
      if (
        u.id === cleanTarget ||
        (u.username && u.username.toLowerCase() === cleanTarget.toLowerCase()) ||
        (u.displayName && u.displayName.toLowerCase() === cleanTarget.toLowerCase())
      ) {
        recipient = u;
        break;
      }
    }
  }

  if (!recipient) {
    return res.status(404).json({ error: `User with ID/username "${cleanTarget}" not found.` });
  }

  // Award store item
  if (!recipient.ownedStoreItems) {
    recipient.ownedStoreItems = [];
  }

  if (!recipient.ownedStoreItems.includes(itemId)) {
    recipient.ownedStoreItems.push(itemId);
  }

  saveDB();
  if (firestoreEnabled && db) {
    db.collection("users").doc(recipient.id).set(JSON.parse(JSON.stringify(recipient))).catch(e => console.error("Firestore sync error for target user store item", e));
  }

  res.json({
    success: true,
    message: `Successfully gifted ${item.name} premium store item to ${recipient.displayName}! It will appear as Owned/Free in their store catalog.`,
    recipient: sanitizeUserProfile(recipient, recipient.id)
  });
});

// Buy or gift store item
app.post("/api/users/:id/store/buy", (req, res) => {
  const buyerId = req.params.id;
  const { itemId, targetUserId } = req.body;

  const buyer = users.get(buyerId);
  if (!buyer) return res.status(404).json({ error: "Buyer profile not found." });

  const item = STANDARD_STORE_ITEMS.find(i => i.id === itemId);
  if (!item) return res.status(404).json({ error: "Store item not found." });

  // Check creator privilege
  const isCreator = buyer.id === "782446" || buyer.email === "ebadulhoque1234567890@gmail.com";
  const cost = isCreator ? 0 : item.price;

  if (buyer.diamonds < cost) {
    return res.status(400).json({ error: "Insufficient diamonds! Please recharge in your wallet." });
  }

  // Determine recipient
  const targetId = targetUserId || buyerId;
  const recipient = users.get(targetId);
  if (!recipient) return res.status(404).json({ error: "Recipient profile not found." });

  // Process transaction
  if (!isCreator) {
    buyer.diamonds -= cost;
  }

  if (!recipient.ownedStoreItems) {
    recipient.ownedStoreItems = [];
  }

  if (!recipient.ownedStoreItems.includes(itemId)) {
    recipient.ownedStoreItems.push(itemId);
  }

  saveDB();
  if (firestoreEnabled && db) {
    db.collection("users").doc(buyer.id).set(JSON.parse(JSON.stringify(buyer))).catch(e => console.error("Update buyer firestore failed", e));
    if (recipient.id !== buyer.id) {
      db.collection("users").doc(recipient.id).set(JSON.parse(JSON.stringify(recipient))).catch(e => console.error("Update recipient firestore failed", e));
    }
  }

  res.json({
    success: true,
    message: recipient.id === buyer.id ? "Item successfully purchased! 🎉" : `Gift successfully sent to ${recipient.displayName}! 🎁`,
    buyer: sanitizeUserProfile(buyer, buyerId),
    recipient: sanitizeUserProfile(recipient, buyerId)
  });
});

// Equip item
app.post("/api/users/:id/store/equip", (req, res) => {
  const userId = req.params.id;
  const { itemId } = req.body;

  const user = users.get(userId);
  if (!user) return res.status(404).json({ error: "User profile not found." });

  const item = STANDARD_STORE_ITEMS.find(i => i.id === itemId);
  if (!item) return res.status(404).json({ error: "Store item not found." });

  const isCreator = user.id === "782446" || user.email === "ebadulhoque1234567890@gmail.com";
  const ownsItem = isCreator || (Array.isArray(user.ownedStoreItems) && user.ownedStoreItems.includes(itemId));

  if (!ownsItem) {
    return res.status(403).json({ error: "You don't own this item! Please purchase it from the Store first." });
  }

  // Equip based on category
  if (item.category === "frame") {
    user.activeFrameId = itemId;
  } else if (item.category === "entry") {
    user.activeEntryEffectId = itemId;
  } else if (item.category === "color") {
    user.activeIdColorId = itemId;
  } else if (item.category === "bubble") {
    user.activeMessageEffectId = itemId;
  }

  saveDB();
  if (firestoreEnabled && db) {
    db.collection("users").doc(user.id).set(JSON.parse(JSON.stringify(user))).catch(e => console.error("Equip firestore update failed", e));
  }

  res.json({ success: true, profile: sanitizeUserProfile(user, userId) });
});

// Unequip item
app.post("/api/users/:id/store/unequip", (req, res) => {
  const userId = req.params.id;
  const { category } = req.body;

  const user = users.get(userId);
  if (!user) return res.status(404).json({ error: "User profile not found." });

  if (category === "frame") {
    user.activeFrameId = undefined;
  } else if (category === "entry") {
    user.activeEntryEffectId = undefined;
  } else if (category === "color") {
    user.activeIdColorId = undefined;
  } else if (category === "bubble") {
    user.activeMessageEffectId = undefined;
  }

  saveDB();
  if (firestoreEnabled && db) {
    db.collection("users").doc(user.id).set(JSON.parse(JSON.stringify(user))).catch(e => console.error("Unequip firestore update failed", e));
  }

  res.json({ success: true, profile: sanitizeUserProfile(user, userId) });
});


// 4. Voice Rooms API
function enrichRoom(room: ChatRoom): ChatRoom {
  return {
    ...room,
    level: room.level || 1,
    exp: room.exp || 0,
    expNext: room.expNext || 100,
    badge: room.badge || "New Star 🌟",
    roomTasks: room.roomTasks || {
      newJoins: 0,
      newJoinsTarget: 5,
      micMinutes: 0,
      micMinutesTarget: 10,
      diamondsGifted: 0,
      diamondsGiftedTarget: 100,
      ownerMicMinutes: 0,
      ownerMicMinutesTarget: 10,
      completed: []
    },
    coverUrl: room.coverUrl || room.backgroundUrl,
    members: room.members || ["ebadul", "u1", "u2", "u3"],
    bannedUserNames: room.bannedUserNames || {},
    mutedUserNames: room.mutedUserNames || {},
    roomFollowers: room.roomFollowers || [],
    followersCount: room.roomFollowers ? room.roomFollowers.length : (room.followersCount || 450),
    visitorsCount: room.visitorsCount || 2150,
    dailyVisitors: room.dailyVisitors || 84,
    totalVisitors: room.totalVisitors || 3290,
    dailyGifts: room.dailyGifts || 1400,
    totalGifts: room.totalGifts || Math.floor(room.totalGiftsReceived || 210) + 120,
    popularityPoints: room.popularityPoints || Math.floor((room.totalGiftsReceived || 1200) * 1.8),
    createdAt: room.createdAt || "2026-01-12T12:00:00Z",
    ranking: room.ranking || "#4 Weekly Rank",
    entrySetting: room.entrySetting || "free",
    entryFee: room.entryFee || 0,
    minLevelRequired: room.minLevelRequired || 0,
    vipRequired: room.vipRequired || false,
    followRequired: room.followRequired || false,
    chatTextRestriction: room.chatTextRestriction || false,
    chatMediaRestriction: room.chatMediaRestriction || false,
    chatLinkRestriction: room.chatLinkRestriction || false,
    chatBadWordFilter: room.chatBadWordFilter || false,
    skipEntranceEffects: room.skipEntranceEffects || false,
    disableBulletScreen: room.disableBulletScreen || false,
    disableGiftAnimation: room.disableGiftAnimation || false,
    disableJoinNotification: room.disableJoinNotification || false,
    isPrivate: room.isPrivate || false,
    antiSpam: room.antiSpam || false,
    antiAbuse: room.antiAbuse || false,
    bannedUsersDetails: (room.bannedUsers || []).map(uid => {
      const u = users.get(uid);
      return {
        id: uid,
        displayName: u ? u.displayName : (room.bannedUserNames?.[uid] || `User ID ${uid}`),
        avatarUrl: u ? u.avatarUrl : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
        username: u ? u.username : `user_${uid}`
      };
    }),
    mutedUsersDetails: (room.mutedUsers || []).map(uid => {
      const u = users.get(uid);
      return {
        id: uid,
        displayName: u ? u.displayName : (room.mutedUserNames?.[uid] || `User ID ${uid}`),
        avatarUrl: u ? u.avatarUrl : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
        username: u ? u.username : `user_${uid}`
      };
    })
  };
}

function getRoomBadgeForLevel(level: number): string {
  if (level >= 50) return "Imperial Dominion 🪐";
  if (level >= 30) return "Crown Kingdom 👑";
  if (level >= 20) return "Platinum Palace 💎";
  if (level >= 15) return "Golden Elite 🥇";
  if (level >= 10) return "Silver Lounge 🥈";
  if (level >= 5) return "Bronze Club 🥉";
  return "New Star 🌟";
}

function addRoomExp(room: ChatRoom, amount: number) {
  room.exp = (room.exp || 0) + amount;
  let expNext = room.expNext || 100;
  let leveledUp = false;
  
  while (room.exp >= expNext) {
    room.exp -= expNext;
    room.level = (room.level || 1) + 1;
    expNext = Math.floor(expNext * 1.5) + 150;
    room.expNext = expNext;
    leveledUp = true;
  }
  
  if (leveledUp) {
    room.badge = getRoomBadgeForLevel(room.level);
    
    const systemMsg = {
      id: "sys_lvl_" + generateId(),
      senderId: "system",
      senderName: "System Moderator",
      senderAvatarUrl: "",
      senderVip: VipLevel.NONE,
      senderLevel: 1,
      type: MessageType.SYSTEM,
      content: `🎉 Congratulations! This room has leveled up to Level ${room.level}! Unlocking premium seat settings and the room badge "${room.badge}"! 🌟✨`,
      timestamp: new Date().toISOString(),
      reactions: {}
    };
    
    let logs = messages.get(room.id) || [];
    logs.push(systemMsg as any);
    messages.set(room.id, logs);
    
    io?.to(`room:${room.id}`).emit("room:message", systemMsg);
  }
  
  // Always emit room update
  io?.to(`room:${room.id}`).emit("room:update", enrichRoom(room));
  
  saveDB();
  if (firestoreEnabled && db) {
    db.collection("rooms").doc(room.id).set(JSON.parse(JSON.stringify(room))).catch((e: any) => console.error("Firestore room level sync failed:", e));
  }
}

app.get("/api/rooms", (req, res) => {
  const requestingUserId = req.query.requestingUserId as string;
  const list = Array.from(rooms.values()).map(r => {
    const enriched = enrichRoom(r);
    return {
      ...enriched,
      seats: enriched.seats.map(s => {
        if (!s.userProfile) return s;
        return {
          ...s,
          userProfile: sanitizeUserProfile(s.userProfile, requestingUserId)
        };
      })
    };
  });
  res.json(list);
});

app.get("/api/rooms/:id", (req, res) => {
  const room = rooms.get(req.params.id);
  if (!room) return res.status(404).json({ error: "Room not found." });
  
  const requestingUserId = req.query.requestingUserId as string;
  const enriched = enrichRoom(room);
  const sanitizedRoom = {
    ...enriched,
    seats: enriched.seats.map(s => {
      if (!s.userProfile) return s;
      return {
        ...s,
        userProfile: sanitizeUserProfile(s.userProfile, requestingUserId)
      };
    })
  };
  res.json(sanitizedRoom);
});

app.post("/api/rooms/:id/follow", (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "userId is required." });

  const room = rooms.get(req.params.id);
  if (!room) return res.status(404).json({ error: "Room not found." });

  if (!room.roomFollowers) {
    room.roomFollowers = [];
  }

  const isFollowing = room.roomFollowers.includes(userId);
  if (isFollowing) {
    room.roomFollowers = room.roomFollowers.filter(id => id !== userId);
    room.followersCount = Math.max(0, (room.followersCount || 0) - 1);
  } else {
    room.roomFollowers.push(userId);
    room.followersCount = (room.followersCount || 0) + 1;
  }

  saveDB();
  if (firestoreEnabled && db) {
    db.collection("rooms").doc(room.id).set(JSON.parse(JSON.stringify(room))).catch((e: any) => console.error("Firestore room follow sync failed:", e));
  }

  res.json({
    success: true,
    isFollowing: !isFollowing,
    followersCount: room.followersCount,
    roomFollowers: room.roomFollowers
  });
});

app.get("/api/rooms/:id/followers", (req, res) => {
  const room = rooms.get(req.params.id);
  if (!room) return res.status(404).json({ error: "Room not found." });

  const followerIds = room.roomFollowers || [];
  const list = followerIds.map(uid => {
    const u = users.get(uid);
    if (!u) return null;

    let role = "Member";
    if (room.ownerId === u.id) {
      role = "Owner 👑";
    } else if (room.admins?.includes(uid)) {
      role = "Admin 🛡️";
    } else if (room.moderators?.includes(uid)) {
      role = "Moderator ⚔️";
    }

    return {
      id: u.id,
      displayName: u.displayName,
      username: u.username,
      avatarUrl: u.avatarUrl,
      level: u.level,
      vipLevel: u.vipLevel,
      role: role
    };
  }).filter(Boolean);

  res.json({ success: true, followers: list });
});

app.post("/api/rooms/create", (req, res) => {
  const { name, description, ownerId, category, password, layout, backgroundUrl, themeColor } = req.body;
  const owner = users.get(ownerId);
  if (!owner) return res.status(400).json({ error: "Invalid owner identity." });

  // One room per owner validation check - block duplicate room creation strictly
  const existingOwnedRoom = Array.from(rooms.values()).find(r => r.ownerId === owner.id);
  if (existingOwnedRoom) {
    return res.status(400).json({ error: "You can only establish one room per account ID. Duplicate room creation is blocked." });
  }

  const roomId = generateId();
  let size = 8;
  const requestedSize = Number(layout);
  const isGlobalAdmin = isGlobalAdminUser(ownerId);
  if (isGlobalAdmin) {
    if ([8, 10, 12, 16, 20, 24, 30, 35].includes(requestedSize)) {
      size = requestedSize;
    }
  } else {
    // Regular users start at lvl 1, where only 8 seats is unlocked.
    size = 8;
  }

  const newRoom: ChatRoom = {
    id: roomId,
    name: name || `${owner.displayName}'s Fun Zone`,
    description: description || "No agenda. Feel free to hold any seats and chat!",
    ownerId: owner.id,
    ownerName: owner.displayName,
    ownerAvatarUrl: owner.avatarUrl,
    category: category || RoomCategory.PUBLIC,
    password: password || "",
    announcement: "Welcome! Be polite and have incredible voice fun. Built by EbadulChat.",
    backgroundUrl: backgroundUrl || "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1000&q=80",
    themeColor: themeColor || "from-slate-900 to-slate-950",
    seatLayout: size as any,
    seats: createSeats(size),
    onlineUsersCount: 1,
    admins: [owner.id],
    moderators: [],
    bannedUsers: [],
    mutedUsers: [],
    totalGiftsReceived: 0,
    level: 1,
    exp: 0,
    expNext: 100,
    badge: "New Star",
    coverUrl: backgroundUrl || "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1000&q=80",
    isOfficial: (owner.email === "ebadulhoque1234567890@gmail.com" || owner.isGlobalAdmin === true),
    members: [owner.id],
    followersCount: 0,
    visitorsCount: 1,
    songs: [...DEFAULT_SONGS]
  };

  rooms.set(roomId, newRoom);
  messages.set(roomId, [
    {
      id: generateId(),
      senderId: "system",
      senderName: "System Moderator",
      senderAvatarUrl: "",
      senderVip: VipLevel.NONE,
      senderLevel: 1,
      type: MessageType.SYSTEM,
      content: `Official room established for ${owner.displayName}. Enjoy luxurious EbadulChat voice!`,
      timestamp: new Date().toISOString(),
      reactions: {}
    }
  ]);

  saveDB();
  res.json({ success: true, room: newRoom });
});

app.post("/api/rooms/:id/edit", (req, res) => {
  const room = rooms.get(req.params.id);
  if (!room) return res.status(404).json({ error: "Room not found." });

  const { announcement, backgroundUrl, themeColor, category, password } = req.body;
  if (announcement !== undefined) room.announcement = announcement;
  if (backgroundUrl !== undefined) room.backgroundUrl = backgroundUrl;
  if (themeColor !== undefined) room.themeColor = themeColor;
  if (category !== undefined) room.category = category;
  if (password !== undefined) room.password = password;

  res.json({ success: true, room });
});

// Admin management in room (mic state, locks, mute, bans)
app.post("/api/rooms/:id/moderation", (req, res) => {
  const room = rooms.get(req.params.id);
  if (!room) return res.status(404).json({ error: "Room not found." });

  const { action, targetUserId, seatIndex } = req.body;
  const requestingUserId = req.body.requestingUserId || req.query.requestingUserId;

  const isOwnerOrAdmin = room.ownerId === requestingUserId || 
                         room.admins?.includes(requestingUserId) || 
                         room.moderators?.includes(requestingUserId) ||
                         isGlobalAdminUser(requestingUserId);
  if (!isRoomLockedAction(action) && !isOwnerOrAdmin) {
    return res.status(403).json({ error: "Only room owner, admin, or moderator can perform moderation actions." });
  }

  function isRoomLockedAction(act: string) {
    return false; // Force checking actual owner/admin roles
  }

  if (action === "lock_room") {
    room.isRoomLocked = true;
  } else if (action === "unlock_room") {
    room.isRoomLocked = false;
  } else if (action === "lock_seat") {
    const seat = room.seats.find(s => s.index === seatIndex);
    if (seat) {
      seat.isLocked = !seat.isLocked;
      if (seat.isLocked) {
        seat.userId = null;
        seat.userProfile = null;
        seat.streamActive = false;
      }
    }
  } else if (action === "mute_seat" || action === "mute_user_mic") {
    const targetId = targetUserId || (seatIndex !== undefined && room.seats.find(s => s.index === seatIndex)?.userId);
    if (targetId) {
      room.seats.forEach(s => {
        if (s.userId === targetId) {
          s.isMutedByOwner = true;
          s.streamActive = false;
        }
      });
    } else if (seatIndex !== undefined) {
      const seat = room.seats.find(s => s.index === seatIndex);
      if (seat) {
        seat.isMutedByOwner = !seat.isMutedByOwner;
        seat.streamActive = !seat.isMutedByUser && !seat.isMutedByOwner;
      }
    }
  } else if (action === "unmute_seat" || action === "unmute_user_mic") {
    const targetId = targetUserId || (seatIndex !== undefined && room.seats.find(s => s.index === seatIndex)?.userId);
    if (targetId) {
      room.seats.forEach(s => {
        if (s.userId === targetId) {
          s.isMutedByOwner = false;
          s.streamActive = !s.isMutedByUser;
        }
      });
    }
  } else if (action === "remove_seat") {
    room.seats.forEach(s => {
      if (s.userId === targetUserId) {
        s.userId = null;
        s.userProfile = null;
        s.streamActive = false;
      }
    });
  } else if (action === "ban") {
    if (!room.bannedUsers) room.bannedUsers = [];
    if (!room.bannedUsers.includes(targetUserId)) {
      room.bannedUsers.push(targetUserId);
    }
    // Kick from seats
    room.seats.forEach(s => {
      if (s.userId === targetUserId) {
        s.userId = null;
        s.userProfile = null;
        s.streamActive = false;
      }
    });
    // Emit ban socket event
    const targetSocketId = userSockets.get(targetUserId);
    if (targetSocketId) {
      io?.to(targetSocketId).emit("room:kicked", { roomId: room.id, userId: targetUserId, reason: "permanently blocked" });
    }
  } else if (action === "unban") {
    room.bannedUsers = room.bannedUsers.filter(uid => uid !== targetUserId);
  } else if (action === "mute_user") {
    if (!room.mutedUsers.includes(targetUserId)) {
      room.mutedUsers.push(targetUserId);
    }
  } else if (action === "unmute_user") {
    room.mutedUsers = room.mutedUsers.filter(uid => uid !== targetUserId);
  } else if (action === "add_moderator") {
    if (!room.moderators.includes(targetUserId)) room.moderators.push(targetUserId);
  } else if (action === "kick_user") {
    if (!room.kickedUsers) room.kickedUsers = {};
    room.kickedUsers[targetUserId] = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes kick
    // Kick from seats
    room.seats.forEach(s => {
      if (s.userId === targetUserId) {
        s.userId = null;
        s.userProfile = null;
        s.streamActive = false;
      }
    });
    // Emit kick socket event
    const targetSocketId = userSockets.get(targetUserId);
    if (targetSocketId) {
      io?.to(targetSocketId).emit("room:kicked", { roomId: room.id, userId: targetUserId, reason: "kicked out for 10 minutes" });
    }
  }

  const sanitizedRoom = {
    ...room,
    seats: room.seats.map(s => {
      if (!s.userProfile) return s;
      return {
        ...s,
        userProfile: {
          ...s.userProfile,
          isOnline: true
        }
      };
    })
  };

  broadcastRoomUpdate(req.params.id);

  res.json({ success: true, room: sanitizedRoom });
});

// SUPER ADMIN EXCLUSIVE BYPASS COMMANDS
app.post("/api/admin/give-rewards", (req, res) => {
  const { adminUserId, targetUserId, amount, type } = req.body;
  if (!isGlobalAdminUser(adminUserId)) {
    return res.status(403).json({ error: "Access denied. Only Supreme Creator can execute rewards." });
  }

  const target = users.get(targetUserId);
  if (!target) {
    return res.status(404).json({ error: "Target user profile not found." });
  }

  const rewardAmt = parseInt(amount) || 0;
  if (type === "diamonds") {
    target.diamonds = (target.diamonds || 0) + rewardAmt;
  } else if (type === "coins") {
    target.coins = (target.coins || 0) + rewardAmt;
  } else if (type === "level") {
    target.level = rewardAmt;
  } else if (type === "vipLevel") {
    const val = amount.toString().toLowerCase().trim();
    if (val === "0" || val === "none") {
      target.vipLevel = VipLevel.NONE;
      target.vipLevelNumeric = 0;
    } else if (val === "1" || val === "vip") {
      target.vipLevel = VipLevel.VIP;
      target.vipLevelNumeric = 1;
    } else if (val === "2" || val === "svip") {
      target.vipLevel = VipLevel.SVIP;
      target.vipLevelNumeric = 2;
    } else if (val === "3" || val === "royal") {
      target.vipLevel = VipLevel.ROYAL;
      target.vipLevelNumeric = 3;
    } else if (val === "4" || val === "emperor" || val === "10") {
      target.vipLevel = VipLevel.EMPEROR;
      target.vipLevelNumeric = 4;
    } else {
      const num = parseInt(val) || 0;
      target.vipLevelNumeric = num;
      if (num >= 4) target.vipLevel = VipLevel.EMPEROR;
      else if (num === 3) target.vipLevel = VipLevel.ROYAL;
      else if (num === 2) target.vipLevel = VipLevel.SVIP;
      else if (num === 1) target.vipLevel = VipLevel.VIP;
      else target.vipLevel = VipLevel.NONE;
    }
  }

  saveDB();
  if (firestoreEnabled && db) {
    db.collection("users").doc(target.id).set(JSON.parse(JSON.stringify(target))).catch((e: any) => console.error("Firestore user reward sync failed:", e));
  }

  // Also broadcast a magnificent alert to the active rooms
  io?.emit("admin:global_reward", {
    targetUserId: target.id,
    targetName: target.displayName,
    amount: rewardAmt,
    type
  });

  res.json({ success: true, profile: target });
});

app.post("/api/admin/send-diamond-gift", (req, res) => {
  const { adminUserId, targetInput, moneyAmount, diamondAmount } = req.body;
  if (!isGlobalAdminUser(adminUserId)) {
    return res.status(403).json({ error: "Access denied. Only Supreme Creator can send divine gifts." });
  }

  let target = users.get(targetInput);
  if (!target) {
    target = Array.from(users.values()).find(
      (u) => u.username?.toLowerCase() === targetInput?.toLowerCase() ||
             u.id?.toLowerCase() === targetInput?.toLowerCase() ||
             u.displayName?.toLowerCase() === targetInput?.toLowerCase()
    );
  }

  if (!target) {
    return res.status(404).json({ error: "No user matching this ID or username was found." });
  }

  let diamondGift = 0;
  if (diamondAmount !== undefined) {
    diamondGift = Math.floor(parseFloat(diamondAmount)) || 0;
  } else {
    const numericMoney = parseFloat(moneyAmount) || 0;
    diamondGift = Math.floor(numericMoney * 100);
  }

  if (diamondGift <= 0) {
    return res.status(400).json({ error: "Please enter a valid gift value of diamonds." });
  }

  target.diamonds = (target.diamonds || 0) + diamondGift;

  saveDB();
  if (firestoreEnabled && db) {
    db.collection("users").doc(target.id).set(JSON.parse(JSON.stringify(target))).catch((e: any) => console.error("Firestore user diamond gift sync failed:", e));
  }

  io?.emit("admin:global_reward", {
    targetUserId: target.id,
    targetName: target.displayName,
    amount: diamondGift,
    type: "diamonds"
  });

  res.json({
    success: true,
    targetName: target.displayName,
    targetId: target.id,
    diamondCount: diamondGift
  });
});

app.post("/api/admin/toggle-official-room", (req, res) => {
  const { adminUserId, roomId, isOfficial } = req.body;
  if (!isGlobalAdminUser(adminUserId)) {
    return res.status(403).json({ error: "Access denied. Only Supreme Creator can toggle official rooms." });
  }

  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({ error: "Room not found." });
  }

  room.isOfficial = !!isOfficial;
  saveDB();
  if (firestoreEnabled && db) {
    db.collection("rooms").doc(roomId).set(JSON.parse(JSON.stringify(room))).catch((e: any) => console.error("Firestore room sync failed:", e));
  }

  // Broadcast a premium alert in the room
  const announceMsg: ChatMessage = {
    id: generateId(),
    type: MessageType.SYSTEM,
    senderId: "system",
    senderName: "👑 SUPREME SYSTEM",
    senderAvatarUrl: "",
    senderVip: VipLevel.EMPEROR,
    senderLevel: 95,
    content: room.isOfficial 
      ? `🎉🌟👑 [OFFICIAL ROOM ANNOUNCEMENT] This room is now officially recognized as an OFFICIAL PUBLIC ROOM of EbadulChat Fun! Exclusive rewards, tags, and verified rankings are unlocked! 👑🌟🎉`
      : `⚠️ [OFFICIAL ROOM ANNOUNCEMENT] This room has lost its official status. Regular room regulations apply.`,
    timestamp: new Date().toISOString(),
    reactions: {}
  };

  const logs = messages.get(roomId) || [];
  logs.push(announceMsg);
  messages.set(roomId, logs);
  io?.to(`room:${roomId}`).emit("message:received", announceMsg);

  broadcastRoomUpdate(roomId);

  res.json({ success: true, room });
});

// Rich Platform Admin Panel Management Endpoints (Ebadul Creator Supreme Dashboard)
app.get("/api/admin/system-stats", (req, res) => {
  const { adminUserId } = req.query;
  if (!isOfficialStaffUser(adminUserId as string)) {
    return res.status(403).json({ error: "Access denied. Official admin credentials required." });
  }

  // Calculate live statistics
  let totalCoinsIssued = 0;
  let totalDiamondsIssued = 0;
  let activeUsersCount = 0;
  const onlineUsersList: any[] = [];

  for (const u of users.values()) {
    totalCoinsIssued += (u.coins || 0);
    totalDiamondsIssued += (u.diamonds || 0);
    if (u.isOnline) {
      activeUsersCount++;
      const currentRoom = getUserActiveRoom(u.id);
      onlineUsersList.push({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        email: u.email,
        isOnline: true,
        coins: u.coins,
        diamonds: u.diamonds,
        level: u.level,
        vipLevel: u.vipLevel,
        isPermanentlyBanned: u.isPermanentlyBanned,
        deviceBanned: u.deviceBanned,
        deviceId: u.deviceId,
        suspendedUntil: u.suspendedUntil,
        isOfficialStaff: u.isOfficialStaff,
        activeRoom: currentRoom
      });
    }
  }

  res.json({
    totalRooms: rooms.size,
    totalUsers: users.size,
    activeUsersCount,
    totalCoinsIssued,
    totalDiamondsIssued,
    onlineUsers: onlineUsersList,
    recentRecharges: transactions.filter(t => t.type === "recharge").slice(0, 50),
    allTransactions: transactions.slice(0, 100)
  });
});

app.post("/api/admin/manage-user-action", (req, res) => {
  const { adminUserId, targetUserId, action, durationHours, officialAccess } = req.body;
  
  if (!isOfficialStaffUser(adminUserId)) {
    return res.status(403).json({ error: "Access denied. Only system administrators can perform this action." });
  }

  const target = users.get(targetUserId);
  if (!target) {
    return res.status(404).json({ error: "Target user profile not found." });
  }

  // Creator can manage anyone. Limited staff cannot touch the main creator account or other staff
  const isTargetCreator = target.email === "ebadulhoque1234567890@gmail.com";
  const isRequesterCreator = users.get(adminUserId)?.email === "ebadulhoque1234567890@gmail.com";
  
  if (isTargetCreator) {
    return res.status(403).json({ error: "Protected profile. The supreme creator account cannot be managed or modified." });
  }
  
  if (!isRequesterCreator && (target.isGlobalAdmin || target.isOfficialStaff)) {
    return res.status(403).json({ error: "Limited access. Limited admins cannot perform actions on other staff members." });
  }

  let msg = "";
  switch (action) {
    case "permanent_ban":
      target.isPermanentlyBanned = true;
      target.isOnline = false;
      msg = `User ${target.displayName} (ID: ${target.id}) has been permanently banned from the database.`;
      break;

    case "undo_permanent_ban":
      target.isPermanentlyBanned = false;
      msg = `Permanent ban removed for user ${target.displayName} (ID: ${target.id}).`;
      break;

    case "temporary_ban":
      const hrs = parseInt(durationHours) || 24;
      const banTime = new Date();
      banTime.setHours(banTime.getHours() + hrs);
      target.suspendedUntil = banTime.toISOString();
      target.isOnline = false;
      msg = `User ${target.displayName} (ID: ${target.id}) suspended temporarily for ${hrs} hours.`;
      break;

    case "undo_temporary_ban":
      target.suspendedUntil = undefined;
      msg = `Temporary suspension lifted for user ${target.displayName} (ID: ${target.id}).`;
      break;

    case "device_ban":
      target.deviceBanned = true;
      target.isPermanentlyBanned = true;
      target.isOnline = false;
      msg = `User device (ID: ${target.deviceId || 'unknown'}) and account banned permanently.`;
      break;

    case "undo_device_ban":
      target.deviceBanned = false;
      target.isPermanentlyBanned = false;
      msg = `Device ban lifted for user ${target.displayName} (ID: ${target.id}).`;
      break;

    case "set_official_staff":
      if (!isRequesterCreator) {
        return res.status(403).json({ error: "Only the main owner can grant official administrative roles." });
      }
      target.isOfficialStaff = officialAccess === "staff";
      target.isGlobalAdmin = officialAccess === "full_admin";
      msg = `Administrative credentials updated for ${target.displayName}. Access Level: ${officialAccess}`;
      break;

    default:
      return res.status(400).json({ error: `Unknown administrator action: ${action}` });
  }

  // Force socket close on ban actions
  if (["permanent_ban", "temporary_ban", "device_ban"].includes(action)) {
    const sId = userSockets.get(target.id);
    if (sId && io) {
      const s = io.sockets.sockets.get(sId);
      if (s) {
        s.emit("room:error", { error: `An administrator took action on your account: ${msg}` });
        s.disconnect(true);
      }
    }
  }

  saveDB();
  if (firestoreEnabled && db) {
    db.collection("users").doc(target.id).set(JSON.parse(JSON.stringify(target))).catch(e => console.error("Firestore user sync error", e));
  }

  res.json({ success: true, message: msg, user: target });
});

// Search rooms or make them official from room ID
app.post("/api/admin/grant-official-room-status", (req, res) => {
  const { adminUserId, roomSearchId, isOfficial } = req.body;
  if (!isOfficialStaffUser(adminUserId)) {
    return res.status(403).json({ error: "Access denied. Admin credentials required." });
  }

  const room = rooms.get(roomSearchId);
  if (!room) {
    return res.status(404).json({ error: `Room with ID ${roomSearchId} not found in database.` });
  }

  room.isOfficial = !!isOfficial;
  saveDB();
  if (firestoreEnabled && db) {
    db.collection("rooms").doc(room.id).set(JSON.parse(JSON.stringify(room))).catch(e => console.error("Firestore room sync error", e));
  }

  // Notify inside room if live
  const announceMsg: ChatMessage = {
    id: generateId(),
    type: MessageType.SYSTEM,
    senderId: "system",
    senderName: "👑 SUPREME STAFF",
    senderAvatarUrl: "",
    senderVip: VipLevel.EMPEROR,
    senderLevel: 95,
    content: room.isOfficial 
      ? `🎉🌟👑 [OFFICIAL ROOM ANNOUNCEMENT] This room is now officially recognized as an OFFICIAL PUBLIC ROOM of EbadulChat Fun! Exclusive rewards, tags, and verified rankings are unlocked! 👑🌟🎉`
      : `⚠️ [OFFICIAL ROOM ANNOUNCEMENT] This room has lost its official status. Regular room regulations apply.`,
    timestamp: new Date().toISOString(),
    reactions: {}
  };

  const logs = messages.get(room.id) || [];
  logs.push(announceMsg);
  messages.set(room.id, logs);
  io?.to(`room:${room.id}`).emit("message:received", announceMsg);
  broadcastRoomUpdate(room.id);

  res.json({ success: true, message: `Room '${room.name}' official status set to: ${room.isOfficial}`, room });
});

// -------------------------------------------------------------------
// SECURITY LABS: ROOM REPORTING SYSTEM
// -------------------------------------------------------------------

app.post("/api/rooms/:id/report", async (req, res) => {
  const room = rooms.get(req.params.id);
  if (!room) return res.status(404).json({ error: "Room not found." });

  const { reporterId, reportedUserId, reason } = req.body;
  if (!reporterId || !reportedUserId || !reason) {
    return res.status(400).json({ error: "Format error: Missing required reporting fields." });
  }

  const reporter = users.get(reporterId);
  const reportedUser = users.get(reportedUserId);

  if (!reportedUser) {
    return res.status(404).json({ error: "Selected user is no longer in this room." });
  }

  // Retrieve the reported conversation context (last 1-2 minutes of transcript)
  const logs = messages.get(room.id) || [];
  const now = new Date();
  const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
  const recentLogs = logs.filter(m => {
    try {
      const t = new Date(m.timestamp);
      return t >= twoMinutesAgo;
    } catch (e) {
      return true;
    }
  });

  // Fallback to last 15 messages if recentLogs is empty
  const messagesToAnalyze = recentLogs.length > 0 ? recentLogs : logs.slice(-15);
  const contextText = messagesToAnalyze
    .map(m => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.senderName} (ID: ${m.senderId}): "${m.content}"`)
    .join("\n");

  const newReport: any = {
    id: "rep_" + Math.random().toString(36).substr(2, 9),
    roomId: room.id,
    reporterId,
    reporterName: reporter ? reporter.displayName : `User ${reporterId}`,
    reportedUserId,
    reportedUserName: reportedUser.displayName,
    reportedUserAvatar: reportedUser.avatarUrl,
    reason,
    timestamp: new Date().toISOString(),
    contextTranscript: contextText || "No active messages in transcript."
  };

  // Perform AI Evaluation
  let decision = {
    status: "NORMAL",
    confidence_score: 1.0,
    reason: "No abuse detected. Automatically verified as friendly/normal interaction."
  };

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Please evaluate this incident report:
Report Reason Chosen: "${reason}"
Reported User: "${reportedUser.displayName}" (ID: ${reportedUserId})
Reporter User: "${reporter ? reporter.displayName : `User ${reporterId}`}" (ID: ${reporterId})

Reported Conversation Context (Last 1-2 minutes transcript):
${contextText || "(No transcript logged. Please assume NORMAL unless report reason itself provides explicit written evidence.)"}`,
        config: {
          systemInstruction: `You are the Core Content Moderation Engine for EbadulChat.
Your job is to act as an automated judge when a user reports another user for verbal abuse, bad language, or harassment.
Since friends often use casual slurs or friendly banter, you must distinguish between actual toxic behavior and friendly jokes.

Strictly follow these operational rules:
- Output "TRUE_ABUSE" only if the reported user is intentionally using heavy slurs, abusive language (in Hindi, English, or Hinglish), threatening, or genuinely harassing a user who has now reported them.
- Output "NORMAL" if the text is just casual banter, friendly teasing, or mild jokes between friends where no real harm or toxic threat is detected.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: {
                type: Type.STRING,
                description: "Must be exactly 'TRUE_ABUSE' or 'NORMAL'."
              },
              confidence_score: {
                type: Type.NUMBER,
                description: "Float value from 0.0 to 1.0 indicating decision confidence."
              },
              reason: {
                type: Type.STRING,
                description: "A 1-sentence reason for your decision in English."
              }
            },
            required: ["status", "confidence_score", "reason"]
          }
        }
      });

      if (response && response.text) {
        const parsed = JSON.parse(response.text.trim());
        if (parsed && (parsed.status === "TRUE_ABUSE" || parsed.status === "NORMAL")) {
          decision = parsed;
        }
      }
    } catch (geminiError) {
      console.error("Gemini Content Moderation Engine error:", geminiError);
      // Fallback local heuristic simulation in case of API failure:
      const hasBadWords = /(saala|haram|banchod|madarchod|abuse|fuck|bitch|bastard|mc|bc|asshole|teri maa)/i.test(contextText);
      if (hasBadWords) {
        decision = {
          status: "TRUE_ABUSE",
          confidence_score: 0.85,
          reason: "Detected known abusive/profane keywords in transcripts via offline fallback heuristic."
        };
      }
    }
  } else {
    // Smart local simulation fallback
    const hasBadWords = /(saala|haram|banchod|madarchod|abuse|fuck|bitch|bastard|mc|bc|asshole|teri maa)/i.test(contextText);
    if (hasBadWords) {
      decision = {
        status: "TRUE_ABUSE",
        confidence_score: 0.90,
        reason: "Smart local filter fallback: Detected offensive Hinglish or English abuse terms."
      };
    } else {
      decision = {
        status: "NORMAL",
        confidence_score: 0.80,
        reason: "Smart local filter fallback: Conversation context classified as friendly banter or safe interaction."
      };
    }
  }

  newReport.status = decision.status;
  newReport.confidenceScore = decision.confidence_score;
  newReport.reasonDetails = decision.reason;

  let notificationText = "";

  if (decision.status === "TRUE_ABUSE") {
    // Increment the user's 'report_count' by 1
    reportedUser.report_count = (reportedUser.report_count || 0) + 1;

    if (reportedUser.report_count === 1) {
      // For Report Count 1: Automatically restrict/suspend the user ID from logging in or speaking for exactly 24 hours.
      const suspendDuration = 24 * 60 * 60 * 1000; // 24 hours
      reportedUser.suspendedUntil = new Date(Date.now() + suspendDuration).toISOString();
      notificationText = `⚠️ Account of @${reportedUser.displayName} (ID: ${reportedUserId}) has been suspended for 24 hours due to community guidelines violation (Report Count: 1).`;
    } else {
      // For Report Count 2 or more: Automatically restrict/suspend the user ID for exactly 7 days.
      const suspendDuration = 7 * 24 * 60 * 60 * 1000; // 7 days
      reportedUser.suspendedUntil = new Date(Date.now() + suspendDuration).toISOString();
      notificationText = `🚫 Account of @${reportedUser.displayName} (ID: ${reportedUserId}) has been suspended for 7 days due to multiple community guidelines violations (Report Count: ${reportedUser.report_count}).`;
    }

    // Vacate they from seats in all active rooms
    rooms.forEach(r => {
      let changed = false;
      r.seats.forEach(s => {
        if (s.userId === reportedUserId) {
          s.userId = null;
          s.userProfile = null;
          s.streamActive = false;
          changed = true;
        }
      });
      if (changed) {
        io?.to(`room:${r.id}`).emit("room:seats_layout_changed", { seatLayout: r.seatLayout, seats: r.seats });
      }
    });

    // Disconnect active socket
    const targetSocketId = userSockets.get(reportedUserId);
    if (targetSocketId) {
      io?.to(targetSocketId).emit("room:kicked", { 
        roomId: room.id, 
        userId: reportedUserId, 
        reason: reportedUser.report_count >= 2 ? "suspended for 7 days" : "suspended for 24 hours" 
      });
    }

    saveDB();
    if (firestoreEnabled && db) {
      await db.collection("users").doc(reportedUserId).set(JSON.parse(JSON.stringify(reportedUser))).catch((e: any) => console.error("Firestore user report count update failed:", e));
    }

    // Inject Safety System warning message to room
    const modMsg: ChatMessage = {
      id: "sys_safety_" + Math.random().toString(36).substr(2, 9),
      senderId: "system",
      senderName: "🛡️ SAFETY AUTOMOD",
      senderAvatarUrl: "",
      senderVip: VipLevel.NONE,
      senderLevel: 1,
      type: MessageType.SYSTEM,
      content: notificationText,
      timestamp: new Date().toISOString(),
      reactions: {}
    };

    const currentLogs = messages.get(room.id) || [];
    currentLogs.push(modMsg);
    messages.set(room.id, currentLogs);
    io?.to(`room:${room.id}`).emit("message:received", modMsg);
  }

  if (!reportsDb.has(room.id)) {
    reportsDb.set(room.id, []);
  }
  reportsDb.get(room.id)!.push(newReport);

  return res.json({ 
    success: true, 
    report: newReport,
    decision: {
      status: decision.status,
      confidence_score: decision.confidence_score,
      reason: decision.reason
    }
  });
});

app.get("/api/rooms/:id/reports", (req, res) => {
  const room = rooms.get(req.params.id);
  if (!room) return res.status(404).json({ error: "Room not found." });

  const requestingUserId = req.query.requestingUserId || req.body.requestingUserId;
  const isRoomAdmin = room.ownerId === requestingUserId || 
                      room.admins?.includes(requestingUserId) || 
                      room.moderators?.includes(requestingUserId);

  if (!isRoomAdmin) {
    return res.status(403).json({ error: "Security violations: Admin permissions are strictly required." });
  }

  const list = reportsDb.get(room.id) || [];
  return res.json({ success: true, reports: list });
});

app.post("/api/rooms/:id/reports/dismiss", (req, res) => {
  const room = rooms.get(req.params.id);
  if (!room) return res.status(404).json({ error: "Room not found." });

  const { reportId, requestingUserId } = req.body;
  const isRoomAdmin = room.ownerId === requestingUserId || 
                      room.admins?.includes(requestingUserId) || 
                      room.moderators?.includes(requestingUserId);

  if (!isRoomAdmin) {
    return res.status(403).json({ error: "Permission issue: Admin credentials required." });
  }

  const list = reportsDb.get(room.id) || [];
  reportsDb.set(room.id, list.filter(r => r.id !== reportId));
  return res.json({ success: true });
});

// SYNCHRONIZED ROOM MUSIC STATION ENDPOINT
app.post("/api/rooms/:id/music", (req, res) => {
  const room = rooms.get(req.params.id);
  if (!room) return res.status(404).json({ error: "Room not found." });

  const { action, songId, songName, songArtist, songUrl, durationMs } = req.body;
  const requestingUserId = req.body.requestingUserId || req.query.requestingUserId;

  const isOwnerOrAdmin = room.ownerId === requestingUserId || room.admins?.includes(requestingUserId) || room.moderators?.includes(requestingUserId);

  // Only Owner/Admin can play, pause, resume, stop, seek
  if (["play", "pause", "resume", "stop", "next", "seek"].includes(action) && !isOwnerOrAdmin) {
    return res.status(403).json({ error: "Only room owner, admin, or moderator can control room music streaming." });
  }

  if (!room.musicState) {
    room.musicState = {
      isPlaying: false,
      currentSongId: null,
      currentSongName: null,
      currentSongArtist: null,
      currentSongUrl: null,
      progressMs: 0,
      durationMs: 0,
      updatedAt: new Date().toISOString(),
      startedBy: null,
      startedByName: null
    };
  }

  const reqUser = users.get(requestingUserId);
  const requestingUserName = reqUser ? reqUser.displayName : "Someone";

  // Check: agar song koi or chala raha he to pehle yosko stop karna padega tabhi song play kar paiga
  if (action === "play") {
    if (room.musicState.isPlaying && room.musicState.startedBy && room.musicState.startedBy !== requestingUserId) {
      return res.status(400).json({ error: "Another song is currently playing. Please stop it first before you can play a new one." });
    }
  }

  // Check: agar room owner song play kar raha he to admin song stop nehi kar sakhta (only room owner can stop/pause/next)
  if (["stop", "pause", "next"].includes(action)) {
    if (room.musicState.isPlaying && room.musicState.startedBy === room.ownerId && requestingUserId !== room.ownerId) {
      return res.status(403).json({ error: "Only the Room Owner can stop the music because they started it." });
    }
  }

  if (!room.musicQueue) {
    room.musicQueue = [];
  }

  if (action === "play") {
    room.musicState.isPlaying = true;
    room.musicState.currentSongId = songId || "s1";
    room.musicState.currentSongName = songName || "Ebadul's Romantic Melody";
    room.musicState.currentSongArtist = songArtist || "Ebadul Solo";
    room.musicState.currentSongUrl = songUrl || "";
    room.musicState.progressMs = 0;
    room.musicState.durationMs = durationMs || 180000;
    room.musicState.updatedAt = new Date().toISOString();
    room.musicState.startedBy = requestingUserId;
    room.musicState.startedByName = requestingUserName;

    // Send chat system message
    const playMsg: ChatMessage = {
      id: generateId(),
      senderId: "system",
      senderName: "Music Station 📻",
      senderAvatarUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
      senderVip: VipLevel.NONE,
      senderLevel: 99,
      content: `🎵 ${requestingUserName} turned ON the music: "${room.musicState.currentSongName}"!`,
      timestamp: new Date().toISOString(),
      type: MessageType.SYSTEM,
      reactions: {}
    };
    let logs = messages.get(room.id) || [];
    logs.push(playMsg);
    messages.set(room.id, logs);
    io?.to(`room:${room.id}`).emit("message:received", playMsg);

  } else if (action === "pause") {
    room.musicState.isPlaying = false;
    room.musicState.updatedAt = new Date().toISOString();

    const pauseMsg: ChatMessage = {
      id: generateId(),
      senderId: "system",
      senderName: "Music Station 📻",
      senderAvatarUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
      senderVip: VipLevel.NONE,
      senderLevel: 99,
      content: `⏸️ ${requestingUserName} paused the music.`,
      timestamp: new Date().toISOString(),
      type: MessageType.SYSTEM,
      reactions: {}
    };
    let logs = messages.get(room.id) || [];
    logs.push(pauseMsg);
    messages.set(room.id, logs);
    io?.to(`room:${room.id}`).emit("message:received", pauseMsg);

  } else if (action === "resume") {
    room.musicState.isPlaying = true;
    room.musicState.updatedAt = new Date().toISOString();

    const resumeMsg: ChatMessage = {
      id: generateId(),
      senderId: "system",
      senderName: "Music Station 📻",
      senderAvatarUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
      senderVip: VipLevel.NONE,
      senderLevel: 99,
      content: `▶️ ${requestingUserName} resumed the music: "${room.musicState.currentSongName || 'music'}".`,
      timestamp: new Date().toISOString(),
      type: MessageType.SYSTEM,
      reactions: {}
    };
    let logs = messages.get(room.id) || [];
    logs.push(resumeMsg);
    messages.set(room.id, logs);
    io?.to(`room:${room.id}`).emit("message:received", resumeMsg);

  } else if (action === "stop") {
    const stoppedSongName = room.musicState.currentSongName || "music";

    room.musicState.isPlaying = false;
    room.musicState.currentSongId = null;
    room.musicState.currentSongName = null;
    room.musicState.currentSongArtist = null;
    room.musicState.currentSongUrl = null;
    room.musicState.progressMs = 0;
    room.musicState.durationMs = 0;
    room.musicState.updatedAt = new Date().toISOString();
    room.musicState.startedBy = null;
    room.musicState.startedByName = null;

    const stopMsg: ChatMessage = {
      id: generateId(),
      senderId: "system",
      senderName: "Music Station 📻",
      senderAvatarUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
      senderVip: VipLevel.NONE,
      senderLevel: 99,
      content: `⏸️ ${requestingUserName} stopped the music (was: "${stoppedSongName}").`,
      timestamp: new Date().toISOString(),
      type: MessageType.SYSTEM,
      reactions: {}
    };
    let logs = messages.get(room.id) || [];
    logs.push(stopMsg);
    messages.set(room.id, logs);
    io?.to(`room:${room.id}`).emit("message:received", stopMsg);

  } else if (action === "seek") {
    if (room.musicState) {
      room.musicState.progressMs = Number(req.body.progressMs || 0);
      room.musicState.updatedAt = new Date().toISOString();
    }
  } else if (action === "queue") {
    room.musicQueue.push({
      id: songId || String(Date.now()),
      name: songName,
      artist: songArtist,
      url: songUrl,
      durationMs: durationMs || 180000,
      requestedBy: requestingUserId
    });
  } else if (action === "dequeue") {
    room.musicQueue = room.musicQueue.filter((s: any) => s.id !== songId);
  } else if (action === "next") {
    let nextMsgContent = "";
    if (room.musicQueue.length > 0) {
      const nextSong = room.musicQueue.shift();
      room.musicState.isPlaying = true;
      room.musicState.currentSongId = nextSong.id;
      room.musicState.currentSongName = nextSong.name;
      room.musicState.currentSongArtist = nextSong.artist;
      room.musicState.currentSongUrl = nextSong.url;
      room.musicState.progressMs = 0;
      room.musicState.durationMs = nextSong.durationMs;
      room.musicState.updatedAt = new Date().toISOString();
      room.musicState.startedBy = nextSong.requestedBy || requestingUserId;

      const songUser = users.get(room.musicState.startedBy);
      room.musicState.startedByName = songUser ? songUser.displayName : requestingUserName;
      nextMsgContent = `⏭️ ${requestingUserName} skipped to next song: "${room.musicState.currentSongName}"!`;
    } else {
      room.musicState.isPlaying = false;
      room.musicState.currentSongId = null;
      room.musicState.currentSongName = null;
      room.musicState.currentSongArtist = null;
      room.musicState.currentSongUrl = null;
      room.musicState.progressMs = 0;
      room.musicState.durationMs = 0;
      room.musicState.updatedAt = new Date().toISOString();
      room.musicState.startedBy = null;
      room.musicState.startedByName = null;
      nextMsgContent = `⏹️ ${requestingUserName} stopped the music (Queue completed).`;
    }

    const nextMsg: ChatMessage = {
      id: generateId(),
      senderId: "system",
      senderName: "Music Station 📻",
      senderAvatarUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
      senderVip: VipLevel.NONE,
      senderLevel: 99,
      content: nextMsgContent,
      timestamp: new Date().toISOString(),
      type: MessageType.SYSTEM,
      reactions: {}
    };
    let logs = messages.get(room.id) || [];
    logs.push(nextMsg);
    messages.set(room.id, logs);
    io?.to(`room:${room.id}`).emit("message:received", nextMsg);

  } else if (action === "add_persistent_song") {
      if (!room.songs) {
        room.songs = [...DEFAULT_SONGS];
      }
      const cleanId = songId || "song_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      const newSong = {
        id: cleanId,
        name: songName || "Untitled Track",
        artist: songArtist || "Unknown Artist",
        url: songUrl || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
        duration: req.body.duration || "03:00",
        durMs: durationMs || 180000
      };

      // Avoid duplicate urls or matching name+artist in the persistent songs list
      const isDuplicate = room.songs.some((s: any) => 
        (s.url && s.url === newSong.url) || 
        (s.name.toLowerCase().trim() === newSong.name.toLowerCase().trim() && 
         s.artist.toLowerCase().trim() === newSong.artist.toLowerCase().trim())
      );

      if (isDuplicate) {
        return res.status(400).json({ error: "Duplicate song! This song is already in the playlist. You must remove it first to add it again." });
      }

      room.songs.push(newSong);
    } else if (action === "remove_persistent_song") {
      if (!isOwnerOrAdmin) {
        return res.status(403).json({ error: "Only room owners, admins, or moderators can remove persistent songs." });
      }
      if (!room.songs) {
        room.songs = [...DEFAULT_SONGS];
      }
      room.songs = room.songs.filter((s: any) => s.id !== songId);
    }

  broadcastRoomUpdate(req.params.id);

  res.json({ success: true, room });
});

// SECURE INTERACTIVE ROOM DETAILS & SETTINGS ENDPOINTS
app.get("/api/rooms/:id/settings", (req, res) => {
  const room = rooms.get(req.params.id);
  if (!room) return res.status(404).json({ error: "Room not found." });

  const requestingUserId = req.query.requestingUserId as string;
  const isOwner = room.ownerId === requestingUserId;
  const isAdmin = room.admins.includes(requestingUserId);

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: "Access denied. Only the Room Owner and Room Admins can access settings details." });
  }

  res.json({
    id: room.id,
    name: room.name,
    announcement: room.announcement,
    backgroundUrl: room.backgroundUrl,
    coverUrl: room.coverUrl || "",
    category: room.category,
    password: room.password || "",
    entrySetting: room.entrySetting || "free",
    entryFee: room.entryFee || 0,
    minLevelRequired: room.minLevelRequired || 0,
    vipRequired: room.vipRequired || false,
    followRequired: room.followRequired || false,
    chatTextRestriction: room.chatTextRestriction || false,
    chatMediaRestriction: room.chatMediaRestriction || false,
    chatLinkRestriction: room.chatLinkRestriction || false,
    chatBadWordFilter: room.chatBadWordFilter || false,
    skipEntranceEffects: room.skipEntranceEffects || false,
    disableBulletScreen: room.disableBulletScreen || false,
    disableGiftAnimation: room.disableGiftAnimation || false,
    disableJoinNotification: room.disableJoinNotification || false,
    isPrivate: room.isPrivate || false,
    antiSpam: room.antiSpam || false,
    antiAbuse: room.antiAbuse || false,
    admins: room.admins,
    bannedUsers: room.bannedUsers,
    bannedUserNames: room.bannedUserNames || {},
    mutedUsers: room.mutedUsers,
    mutedUserNames: room.mutedUserNames || {},
    members: room.members || [],
    seatLayout: room.seatLayout
  });
});

app.post("/api/rooms/:id/settings", (req, res) => {
  const room = rooms.get(req.params.id);
  if (!room) return res.status(404).json({ error: "Room not found." });

  const { requestingUserId } = req.body;
  const isOwner = room.ownerId === requestingUserId;
  const isAdmin = room.admins.includes(requestingUserId);

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: "Access denied. Only the Room Owner and Room Admins can update settings." });
  }

  const {
    name,
    announcement,
    backgroundUrl,
    coverUrl,
    category,
    password,
    entrySetting,
    entryFee,
    minLevelRequired,
    vipRequired,
    followRequired,
    chatTextRestriction,
    chatMediaRestriction,
    chatLinkRestriction,
    chatBadWordFilter,
    skipEntranceEffects,
    disableBulletScreen,
    disableGiftAnimation,
    disableJoinNotification,
    isPrivate,
    antiSpam,
    antiAbuse,
    seatLayout
  } = req.body;

  if (name !== undefined) room.name = name;
  if (announcement !== undefined) room.announcement = announcement;
  if (backgroundUrl !== undefined) room.backgroundUrl = backgroundUrl;
  if (coverUrl !== undefined) room.coverUrl = coverUrl;
  if (category !== undefined) room.category = category;
  if (password !== undefined) room.password = password;
  if (entrySetting !== undefined) room.entrySetting = entrySetting;
  if (entryFee !== undefined) room.entryFee = Number(entryFee);
  if (minLevelRequired !== undefined) room.minLevelRequired = Number(minLevelRequired);
  if (vipRequired !== undefined) room.vipRequired = Boolean(vipRequired);
  if (followRequired !== undefined) room.followRequired = Boolean(followRequired);
  if (chatTextRestriction !== undefined) room.chatTextRestriction = Boolean(chatTextRestriction);
  if (chatMediaRestriction !== undefined) room.chatMediaRestriction = Boolean(chatMediaRestriction);
  if (chatLinkRestriction !== undefined) room.chatLinkRestriction = Boolean(chatLinkRestriction);
  if (chatBadWordFilter !== undefined) room.chatBadWordFilter = Boolean(chatBadWordFilter);
  if (skipEntranceEffects !== undefined) room.skipEntranceEffects = Boolean(skipEntranceEffects);
  if (disableBulletScreen !== undefined) room.disableBulletScreen = Boolean(disableBulletScreen);
  if (disableGiftAnimation !== undefined) room.disableGiftAnimation = Boolean(disableGiftAnimation);
  if (disableJoinNotification !== undefined) room.disableJoinNotification = Boolean(disableJoinNotification);
  if (isPrivate !== undefined) room.isPrivate = Boolean(isPrivate);
  if (antiSpam !== undefined) room.antiSpam = Boolean(antiSpam);
  if (antiAbuse !== undefined) room.antiAbuse = Boolean(antiAbuse);

  if (seatLayout !== undefined) {
    const requestedSize = Number(seatLayout);
    const allowedSizes = [8];
    const roomLvl = room.level || 1;
    const isGlobalAdmin = isGlobalAdminUser(requestingUserId);
    
    if (isGlobalAdmin) {
      allowedSizes.push(10, 12, 16, 20, 24, 30, 35);
    } else if (room.isOfficial) {
      allowedSizes.push(10, 12, 16, 20);
    } else {
      if (roomLvl >= 5) allowedSizes.push(10);
      if (roomLvl >= 10) allowedSizes.push(12);
      if (roomLvl >= 15) allowedSizes.push(16);
      if (roomLvl >= 20) allowedSizes.push(20);
    }

    if (allowedSizes.includes(requestedSize)) {
      const targetSize = requestedSize;
      if (targetSize !== room.seatLayout) {
        room.seatLayout = targetSize as any;
        const oldSeats = room.seats;
        const newSeats: VoiceSeat[] = [];
        for (let i = 0; i < targetSize; i++) {
          const old = oldSeats.find(s => s.index === i + 1);
          if (old) {
            newSeats.push(old);
          } else {
            newSeats.push({
              index: i + 1,
              userId: null,
              isLocked: false,
              isMutedByOwner: false,
              isMutedByUser: false,
              requestingUsers: [],
              streamActive: false
            });
          }
        }
        room.seats = newSeats;
        
        io?.to(`room:${room.id}`).emit("room:seats_layout_changed", {
          seatLayout: targetSize,
          seats: room.seats
        });
      }
    } else {
      return res.status(400).json({ error: "This seat capacity is locked! Increase your Room Level or make the room Official to unlock!" });
    }
  }

  saveDB();
  if (firestoreEnabled && db) {
    db.collection("rooms").doc(room.id).set(JSON.parse(JSON.stringify(room))).catch((e: any) => console.error("Firestore room settings sync failed:", e));
  }

  res.json({ success: true, room });
});

app.post("/api/rooms/:id/settings/action", (req, res) => {
  const room = rooms.get(req.params.id);
  if (!room) return res.status(404).json({ error: "Room not found." });

  const { requestingUserId, action, targetUserId } = req.body;
  const isOwner = room.ownerId === requestingUserId;
  const isAdmin = room.admins.includes(requestingUserId);

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: "Access denied." });
  }

  const targetUser = users.get(targetUserId);
  const targetName = targetUser ? targetUser.displayName : `User ID ${targetUserId}`;

  if (action === "add_admin") {
    if (!isOwner) {
      return res.status(403).json({ error: "Only the Room Owner can manage Administrators." });
    }
    if (!room.admins.includes(targetUserId)) {
      room.admins.push(targetUserId);
    }
  } else if (action === "remove_admin") {
    if (!isOwner) {
      return res.status(403).json({ error: "Only the Room Owner can manage Administrators." });
    }
    room.admins = room.admins.filter(id => id !== targetUserId);
  } else if (action === "kick") {
    room.seats.forEach(s => {
      if (s.userId === targetUserId) {
        s.userId = null;
        s.userProfile = null;
        s.streamActive = false;
      }
    });
  } else if (action === "ban") {
    if (!room.bannedUsers.includes(targetUserId)) {
      room.bannedUsers.push(targetUserId);
      if (!room.bannedUserNames) room.bannedUserNames = {};
      room.bannedUserNames[targetUserId] = targetName;
    }
    room.seats.forEach(s => {
      if (s.userId === targetUserId) {
        s.userId = null;
        s.userProfile = null;
        s.streamActive = false;
      }
    });
  } else if (action === "unban") {
    room.bannedUsers = room.bannedUsers.filter(id => id !== targetUserId);
    if (room.bannedUserNames) {
      delete room.bannedUserNames[targetUserId];
    }
  } else if (action === "mute") {
    if (!room.mutedUsers.includes(targetUserId)) {
      room.mutedUsers.push(targetUserId);
      if (!room.mutedUserNames) room.mutedUserNames = {};
      room.mutedUserNames[targetUserId] = targetName;
    }
  } else if (action === "unmute") {
    room.mutedUsers = room.mutedUsers.filter(id => id !== targetUserId);
    if (room.mutedUserNames) {
      delete room.mutedUserNames[targetUserId];
    }
  } else if (action === "remove_member") {
    if (room.members) {
      room.members = room.members.filter(id => id !== targetUserId);
    }
  } else if (action === "add_member") {
    if (!room.members) room.members = [];
    if (!room.members.includes(targetUserId)) {
      room.members.push(targetUserId);
    }
  }

  broadcastRoomUpdate(room.id);
  res.json({ success: true, room });
});

// 5. Seat Reservations & Activity
app.post("/api/rooms/:id/seat", (req, res) => {
  const room = rooms.get(req.params.id);
  if (!room) return res.status(404).json({ error: "Room not found." });

  const { action, userId, seatIndex } = req.body;
  const user = users.get(userId);

  if (!user) return res.status(400).json({ error: "User identity invalid." });

  if (action === "take") {
    // Check if user is already on another seat in this room
    room.seats.forEach(s => {
      if (s.userId === userId) {
        s.userId = null;
        s.userProfile = null;
        s.streamActive = false;
      }
    });

    const seat = room.seats.find(s => s.index === seatIndex);
    if (!seat) return res.status(400).json({ error: "Invalid seat selector." });
    if (seat.isLocked && !isGlobalAdminUser(userId)) return res.status(400).json({ error: "Seat is locked by moderator." });

    const isMuted = req.body.isMutedByUser;

    seat.userId = userId;
    seat.userProfile = user;
    if (typeof isMuted === "boolean") {
      seat.isMutedByUser = isMuted;
    }
    seat.streamActive = !seat.isMutedByUser && !seat.isMutedByOwner;
  } else if (action === "leave") {
    const seat = room.seats.find(s => s.userId === userId);
    if (seat) {
      seat.userId = null;
      seat.userProfile = null;
      seat.streamActive = false;
    }
  } else if (action === "toggle_mic") {
    const seat = room.seats.find(s => s.userId === userId);
    if (seat) {
      seat.isMutedByUser = !seat.isMutedByUser;
      seat.streamActive = !seat.isMutedByUser && !seat.isMutedByOwner;
    }
  }

  const requestingUserId = userId;
  const sanitizedRoom = {
    ...room,
    seats: room.seats.map(s => {
      if (!s.userProfile) return s;
      return {
        ...s,
        userProfile: sanitizeUserProfile(s.userProfile, requestingUserId)
      };
    })
  };

  broadcastRoomUpdate(req.params.id);

  res.json({ success: true, room: sanitizedRoom });
});

// 6. Messaging System (Channelling and Private)
app.get("/api/rooms/:roomId/messages", (req, res) => {
  const logs = messages.get(req.params.roomId) || [];
  res.json(logs);
});

app.post("/api/rooms/:roomId/messages", (req, res) => {
  const { senderId, type, content } = req.body;
  const sender = users.get(senderId);
  if (!sender) return res.status(400).json({ error: "Invalid sender identity." });

  // Check global ban/suspension
  if (sender.isPermanentlyBanned) {
    return res.status(403).json({ error: "Your account has been permanently banned." });
  }
  if (sender.suspendedUntil) {
    const suspendedUntilDate = new Date(sender.suspendedUntil);
    if (suspendedUntilDate > new Date()) {
      return res.status(403).json({ error: "Account suspended for 24 hours due to community guidelines violation." });
    }
  }

  const room = rooms.get(req.params.roomId);
  const userMuted = room?.mutedUsers.includes(senderId);
  if (userMuted) return res.status(403).json({ error: "You are currently muted in this room." });

  const logs = messages.get(req.params.roomId) || [];
  const newMsg: ChatMessage = {
    id: generateId(),
    senderId: sender.id,
    senderName: sender.displayName,
    senderAvatarUrl: sender.avatarUrl,
    senderVip: sender.vipLevel,
    senderLevel: sender.level,
    type: type || MessageType.TEXT,
    content: content || "",
    timestamp: new Date().toISOString(),
    reactions: {}
  };

  // Premium Store Items Chat Bubble Integration
  if (sender.activeMessageEffectId) {
    newMsg.senderActiveMessageEffectId = sender.activeMessageEffectId;
    if (sender.activeMessageEffectId === "bubble_imperial_gold") {
      newMsg.chatBubbleStyle = "bg-gradient-to-r from-yellow-950/60 via-amber-950/40 to-yellow-950/60 border-yellow-400/90 text-yellow-100 shadow-[0_0_12px_rgba(251,191,36,0.3)] font-medium";
    } else if (sender.activeMessageEffectId === "bubble_cyber_grid") {
      newMsg.chatBubbleStyle = "bg-gradient-to-r from-cyan-950/60 via-slate-950/70 to-cyan-950/60 border-cyan-400/85 text-cyan-100 shadow-[0_0_12px_rgba(34,211,238,0.3)] font-mono";
    } else if (sender.activeMessageEffectId === "bubble_unicorn_dream") {
      newMsg.chatBubbleStyle = "bg-gradient-to-r from-pink-950/60 via-purple-950/40 to-indigo-950/60 border-pink-400/85 text-pink-100 shadow-[0_0_12px_rgba(244,114,182,0.3)]";
    }
  }
  
  if (sender.activeIdColorId) {
    newMsg.senderActiveIdColorId = sender.activeIdColorId;
  }

  logs.push(newMsg);
  messages.set(req.params.roomId, logs);

  // Trigger automated AI moderation/response if configured and Gemini key exists
  if (type === MessageType.TEXT && !content.startsWith("/") && logs.length > 0) {
    triggerAiModeratorStream(req.params.roomId, newMsg);
  }

  res.json({ success: true, message: newMsg });
});

app.post("/api/rooms/:roomId/messages/:messageId/delete", (req, res) => {
  const { roomId, messageId } = req.params;
  const { userId } = req.body;

  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({ error: "Room not found." });
  }

  // Authorize: user must be room owner or in room.admins
  const isAuthorized = room.ownerId === userId || room.admins?.includes(userId);
  if (!isAuthorized) {
    return res.status(403).json({ error: "You are not authorized to delete messages in this room." });
  }

  let logs = messages.get(roomId) || [];
  const initialLength = logs.length;
  logs = logs.filter(msg => msg.id !== messageId);
  messages.set(roomId, logs);

  if (logs.length !== initialLength) {
    if (io) {
      io.to(`room:${roomId}`).emit("message:deleted", { messageId });
    }
    return res.json({ success: true, message: "Message deleted successfully." });
  } else {
    return res.status(404).json({ error: "Message not found." });
  }
});

// Call Gemini API server-side to review and reply to message
async function triggerAiModeratorStream(roomId: string, userMsg: ChatMessage) {
  if (!ai) return; // No key

  // If user mentions "gemini" or sends a message, have the AI Moderator evaluate it
  // and occasionally post a smart greeting (100% server-side safety checks)
  const contentLower = userMsg.content.toLowerCase();
  const requiresAiInteraction = contentLower.includes("gemini") || 
                               contentLower.includes("moderator") || 
                               contentLower.includes("rules") || 
                               Math.random() < 0.15; // 15% random premium chat interactions

  if (!requiresAiInteraction) return;

  try {
    const prompt = `Review the following chat message from "${userMsg.senderName}" in a high-fidelity social voice chatroom:
    "${userMsg.content}"

    If the message is offensive or high spam, please warn them. Otherwise, reply in a warm, welcoming, elite 1-sentence social greeting. Keep it appropriate for users from Bangladesh, Saudi Arabia, India, and the West. Keep the tone friendly and luxury.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are 'EbadulChat AI Guide', the smart, helpful, 100% polite official assistant moderator of EbadulChat Fun."
      }
    });

    const aiText = response.text || "Welcome to EbadulChat Fun!";
    
    // Push AI warning or welcome to room logs
    const roomMsgs = messages.get(roomId) || [];
    const aiMsg: ChatMessage = {
      id: generateId(),
      senderId: "gemini_host",
      senderName: "EbadulChat AI Guide ✨",
      senderAvatarUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
      senderVip: VipLevel.EMPEROR,
      senderLevel: 100,
      type: MessageType.SYSTEM,
      content: aiText,
      timestamp: new Date().toISOString(),
      reactions: { "✨": 3, "❤️": 2 }
    };
    roomMsgs.push(aiMsg);
    messages.set(roomId, roomMsgs);

    if (io) {
      io.to(`room:${roomId}`).emit("message:received", aiMsg);
    }
  } catch (error) {
    console.error("Gemini server moderation failed:", error);
  }
}

// Global server-side endpoint to access Gemini Moderation explicitly
app.post("/api/gemini/moderate", async (req, res) => {
  const { text, action } = req.body;
  if (!text) return res.status(400).json({ error: "No query content." });

  if (!ai) {
    return res.json({ 
      success: true, 
      verdict: "safe", 
      translated: text, 
      warning: "Gemini server offline. Smart local filter says safe." 
    });
  }

  try {
    let modeInstruction = "";
    if (action === "translate") {
      modeInstruction = "Translate the given voice chat text to English, Arabic, Bengali, or Hindi depending on standard localized formats. Rely strictly on formal formats.";
    } else {
      modeInstruction = "Check if this social text contains explicit profanity, hate content, or harmful abuse. Reply with a json representation containing a boolean pass, warning message, or safe translated text.";
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: text,
      config: {
        systemInstruction: modeInstruction
      }
    });

    res.json({ success: true, result: response.text });
  } catch (err: any) {
    console.error("Gemini API error:", err);
    res.status(500).json({ error: err.message || "Failure checking text validity." });
  }
});

// Private Session list or history load
app.get("/api/private-chats/:userId", (req, res) => {
  const myId = req.params.userId;
  const active: PrivateSession[] = [];
  privateSessions.forEach(p => {
    if (p.users.includes(myId)) active.push(p);
  });
  res.json(active);
});

app.post("/api/private-chats/send", (req, res) => {
  const { senderId, targetId, content, type } = req.body;
  const sender = users.get(senderId);
  const target = users.get(targetId);

  if (!sender || !target) return res.status(404).json({ error: "Users not discovered." });

  // Find or create session
  const sessKey = [senderId, targetId].sort().join("_");
  let sess = privateSessions.get(sessKey);

  if (!sess) {
    sess = {
      sessionId: sessKey,
      users: [senderId, targetId],
      messages: [],
      lastMessageTimestamp: new Date().toISOString()
    };
  }

  const newMsg: ChatMessage = {
    id: generateId(),
    senderId,
    senderName: sender.displayName,
    senderAvatarUrl: sender.avatarUrl,
    senderVip: sender.vipLevel,
    senderLevel: sender.level,
    type: type || MessageType.TEXT,
    content: content || "",
    timestamp: new Date().toISOString(),
    reactions: {}
  };

  sess.messages.push(newMsg);
  sess.lastMessageTimestamp = new Date().toISOString();
  privateSessions.set(sessKey, sess);

  // Increment relationship points for private message: +2 points (daily limit of 50 points)
  try {
    const todayStr = new Date().toDateString();
    const rel = getOrCreateRelationship(senderId, targetId);
    
    if (!(rel as any).dailyPoints || (rel as any).dailyPoints.date !== todayStr) {
      (rel as any).dailyPoints = {
        date: todayStr,
        pmPoints: 0,
        voicePoints: 0,
        gamePoints: 0
      };
    }
    
    const dp = (rel as any).dailyPoints;
    if (dp.pmPoints < 50) {
      const pointsToAdd = Math.min(2, 50 - dp.pmPoints);
      dp.pmPoints += pointsToAdd;
      addRelationshipPoints(senderId, targetId, pointsToAdd, "private_message", `Exchanged private messages`);
    }
  } catch (err) {
    console.error("Error adding relationship points on PM send:", err);
  }

  // Emit real-time Socket.IO event to target if online
  const receiverSocketId = userSockets.get(targetId);
  if (receiverSocketId && io) {
    io.to(receiverSocketId).emit("private:message_received", {
      senderId,
      senderName: sender.displayName,
      avatarUrl: sender.avatarUrl,
      message: newMsg
    });
  }

  res.json({ success: true, session: sess, message: newMsg });
});

// -------------------------------------------------------------------
// RELATIONSHIP SYSTEM HELPER FUNCTIONS & ROUTING ENDPOINTS
// -------------------------------------------------------------------

function getOrCreateRelationship(u1: string, u2: string): Relationship {
  const key = [u1, u2].sort().join("_");
  let rel = relationships.get(key);
  if (!rel) {
    const user1 = users.get(u1);
    const user2 = users.get(u2);
    rel = {
      id: key,
      user1Id: u1,
      user2Id: u2,
      user1Name: user1 ? user1.displayName : "User 1",
      user2Name: user2 ? user2.displayName : "User 2",
      user1Avatar: user1 ? user1.avatarUrl : "",
      user2Avatar: user2 ? user2.avatarUrl : "",
      type: undefined as any, // Not official until requested and accepted
      level: 1,
      points: 0,
      pointsNextLevel: 100,
      createdAt: Date.now(),
      streakDays: 0,
      anniversaryDate: new Date().toISOString().split("T")[0]
    };
    relationships.set(key, rel);
  }
  return rel;
}

function checkUnlockConditions(u1: string, u2: string, type: RelationshipType): { available: boolean; error?: string } {
  const sessKey = [u1, u2].sort().join("_");
  const sess = privateSessions.get(sessKey);
  const pmCount = sess ? sess.messages.length : 0;

  const rel = getOrCreateRelationship(u1, u2);
  const user1 = users.get(u1);
  const user2 = users.get(u2);
  if (!user1 || !user2) return { available: false, error: "Users not found." };

  const diamondsSpent = (rel as any).diamondsSpent || 0;

  if (type === "homies") {
    if (pmCount >= 500 || diamondsSpent >= 10000) {
      return { available: true };
    }
    return { available: false, error: `Requires either 500 Private Messages (Current: ${pmCount}) or 10,000 Diamonds spent together (Current: ${diamondsSpent}).` };
  }

  if (type === "couple") {
    if (pmCount < 50) {
      return { available: false, error: `Must be friends first (Requires at least 50 Private Messages, Current: ${pmCount}).` };
    }
    if (pmCount < 1000) {
      return { available: false, error: `Requires at least 1,000 Private Messages (Current: ${pmCount}).` };
    }
    if (rel.level < 5) {
      return { available: false, error: `Requires Friendship Level 5 (Current Level: ${rel.level}).` };
    }
    const hasGifts = (rel as any).giftsSentFrom1To2 && (rel as any).giftsSentFrom2To1;
    if (!hasGifts) {
      return { available: false, error: "Requires both users to have sent gifts to each other." };
    }
    return { available: true };
  }

  if (type === "best_friend") {
    if (rel.level < 2 || pmCount < 100) {
      return { available: false, error: `Requires Friendship Level 2 and 100 Private Messages (Current Level: ${rel.level}, PMs: ${pmCount}).` };
    }
    return { available: true };
  }

  if (type === "brother") {
    if (rel.level < 2 || pmCount < 100) {
      return { available: false, error: `Requires Friendship Level 2 and 100 Private Messages (Current Level: ${rel.level}, PMs: ${pmCount}).` };
    }
    return { available: true };
  }

  if (type === "sister") {
    if (rel.level < 2 || pmCount < 100) {
      return { available: false, error: `Requires Friendship Level 2 and 100 Private Messages (Current Level: ${rel.level}, PMs: ${pmCount}).` };
    }
    return { available: true };
  }

  if (type === "family") {
    if (rel.level < 3 || pmCount < 200) {
      return { available: false, error: `Requires Friendship Level 3 and 200 Private Messages (Current Level: ${rel.level}, PMs: ${pmCount}).` };
    }
    return { available: true };
  }

  if (type === "soulmate") {
    if (rel.level < 4 || pmCount < 300) {
      return { available: false, error: `Requires Friendship Level 4 and 300 Private Messages (Current Level: ${rel.level}, PMs: ${pmCount}).` };
    }
    return { available: true };
  }

  return { available: true };
}

function addRelationshipPoints(u1: string, u2: string, points: number, action: string, details: string) {
  const rel = getOrCreateRelationship(u1, u2);
  const oldLevel = rel.level;
  
  rel.points += points;
  
  while (rel.level < 20 && rel.points >= rel.pointsNextLevel) {
    rel.points -= rel.pointsNextLevel;
    rel.level += 1;
    rel.pointsNextLevel = Math.round(100 * Math.pow(1.5, rel.level - 1));
    
    relationshipHistory.push({
      id: generateId(),
      user1Id: rel.user1Id,
      user2Id: rel.user2Id,
      type: (rel.type || "friend") as any,
      action: "level_up",
      details: `Your relationship leveled up to Level ${rel.level}! 🎉`,
      timestamp: Date.now()
    });

    const s1 = userSockets.get(rel.user1Id);
    const s2 = userSockets.get(rel.user2Id);
    if (s1) io?.to(s1).emit("relationship:levelup", { relationship: rel, user: users.get(rel.user1Id) });
    if (s2) io?.to(s2).emit("relationship:levelup", { relationship: rel, user: users.get(rel.user2Id) });

    relationshipRewards.push({
      id: generateId(),
      level: rel.level,
      type: "badge",
      value: `badge_relationship_${rel.type || "friend"}_${rel.level}`,
      claimed: false,
      claimedByUserId: "",
      relationshipId: rel.id
    });
  }

  relationships.set(rel.id, rel);
  saveDB();
}

// REST API Endpoints
app.get("/api/relationships/user/:userId", (req, res) => {
  const userId = req.params.userId;
  
  const active: Relationship[] = [];
  relationships.forEach(r => {
    if ((r.user1Id === userId || r.user2Id === userId) && r.type) {
      active.push(r);
    }
  });

  const reqs: RelationshipRequest[] = [];
  relationshipRequests.forEach(reqObj => {
    if ((reqObj.senderId === userId || reqObj.receiverId === userId) && reqObj.status === "pending") {
      reqs.push(reqObj);
    }
  });

  const history = relationshipHistory.filter(h => h.user1Id === userId || h.user2Id === userId);

  const rewards = relationshipRewards.filter(rew => {
    const rel = relationships.get(rew.relationshipId);
    return rel && (rel.user1Id === userId || rel.user2Id === userId);
  });

  const levelConfigs = RELATIONSHIP_LEVELS;

  const sessList = Array.from(privateSessions.values()).filter(s => s.users.includes(userId));
  let totalPMsToday = 0;
  sessList.forEach(s => {
    totalPMsToday += s.messages.length;
  });

  const dailyTasks: RelationshipDailyTask[] = [
    {
      id: "task_pm",
      title: "Exchange 10 Private Messages",
      pointsReward: 15,
      completed: totalPMsToday >= 10,
      progress: Math.min(10, totalPMsToday),
      target: 10,
      type: "private_message"
    },
    {
      id: "task_checkin",
      title: "Daily Check-in Together",
      pointsReward: 20,
      completed: active.some(r => r.lastCheckIn && new Date(r.lastCheckIn).toDateString() === new Date().toDateString()),
      progress: active.some(r => r.lastCheckIn && new Date(r.lastCheckIn).toDateString() === new Date().toDateString()) ? 1 : 0,
      target: 1,
      type: "daily_checkin"
    }
  ];

  res.json({
    success: true,
    active,
    requests: reqs,
    history,
    rewards,
    levelConfigs,
    dailyTasks
  });
});

app.post("/api/relationships/request", (req, res) => {
  const { senderId, receiverId, type, useDiamonds } = req.body;
  const sender = users.get(senderId);
  const receiver = users.get(receiverId);

  if (!sender || !receiver) {
    return res.status(404).json({ error: "Sender or receiver profile not found." });
  }

  const relKey = [senderId, receiverId].sort().join("_");
  const existingRel = relationships.get(relKey);
  if (existingRel && existingRel.type) {
    return res.status(400).json({ error: `You already have an active ${existingRel.type} relationship with this user!` });
  }

  let duplicate = false;
  relationshipRequests.forEach(r => {
    if (r.status === "pending" && 
       ((r.senderId === senderId && r.receiverId === receiverId) || 
        (r.senderId === receiverId && r.receiverId === senderId))) {
      duplicate = true;
    }
  });

  if (duplicate) {
    return res.status(400).json({ error: "There is already a pending relationship request between you two." });
  }

  let isBypassed = false;
  if (useDiamonds) {
    if ((sender.diamonds || 0) < 10000) {
      return res.status(400).json({ error: "Inadequate Diamonds! You need 10,000 Diamonds to bypass the relationship requirements." });
    }
    sender.diamonds = (sender.diamonds || 0) - 10000;
    users.set(senderId, sender);
    
    const rel = getOrCreateRelationship(senderId, receiverId);
    (rel as any).diamondsSpent = ((rel as any).diamondsSpent || 0) + 10000;
    relationships.set(rel.id, rel);
    isBypassed = true;
  } else {
    const check = checkUnlockConditions(senderId, receiverId, type);
    if (!check.available) {
      return res.status(400).json({ error: check.error || "Unlock conditions not met." });
    }
  }

  const reqId = generateId();
  const relReq: RelationshipRequest = {
    id: reqId,
    senderId,
    senderName: sender.displayName,
    senderAvatar: sender.avatarUrl,
    receiverId,
    receiverName: receiver.displayName,
    receiverAvatar: receiver.avatarUrl,
    type,
    status: "pending",
    createdAt: Date.now()
  };

  relationshipRequests.set(reqId, relReq);

  relationshipHistory.push({
    id: generateId(),
    user1Id: senderId,
    user2Id: receiverId,
    type,
    action: "request_sent",
    details: `${sender.displayName} sent a ${type} request to ${receiver.displayName}${isBypassed ? ' (bypassed with 10,000 Diamonds)' : ''}.`,
    timestamp: Date.now()
  });

  const receiverSocketId = userSockets.get(receiverId);
  if (receiverSocketId) {
    io?.to(receiverSocketId).emit("relationship:request_received", relReq);
  }

  saveDB();

  res.json({ success: true, request: relReq });
});

app.post("/api/relationships/request/action", (req, res) => {
  const { requestId, userId, action } = req.body;
  const relReq = relationshipRequests.get(requestId);
  if (!relReq) return res.status(404).json({ error: "Request not discovered." });

  if (action === "cancel") {
    if (relReq.senderId !== userId) {
      return res.status(403).json({ error: "Access Denied: Only the sender can cancel this request." });
    }
    relReq.status = "cancelled";
    relationshipRequests.set(requestId, relReq);
    saveDB();
    return res.json({ success: true, request: relReq });
  }

  if (relReq.receiverId !== userId) {
    return res.status(403).json({ error: "Access Denied: Only the receiver can accept/reject this request." });
  }

  if (action === "reject") {
    relReq.status = "rejected";
    relationshipRequests.set(requestId, relReq);

    relationshipHistory.push({
      id: generateId(),
      user1Id: relReq.senderId,
      user2Id: relReq.receiverId,
      type: relReq.type,
      action: "rejected",
      details: `${relReq.receiverName} rejected the ${relReq.type} request from ${relReq.senderName}.`,
      timestamp: Date.now()
    });

    const senderSocketId = userSockets.get(relReq.senderId);
    if (senderSocketId) {
      io?.to(senderSocketId).emit("relationship:rejected", { requestId });
    }

    saveDB();
    return res.json({ success: true, request: relReq });
  }

  if (action === "accept") {
    relReq.status = "accepted";
    relationshipRequests.set(requestId, relReq);

    const relKey = [relReq.senderId, relReq.receiverId].sort().join("_");
    let rel = relationships.get(relKey);
    if (!rel) {
      rel = {
        id: relKey,
        user1Id: relReq.senderId,
        user2Id: relReq.receiverId,
        user1Name: relReq.senderName,
        user2Name: relReq.receiverName,
        user1Avatar: relReq.senderAvatar,
        user2Avatar: relReq.receiverAvatar,
        type: relReq.type,
        level: 1,
        points: 0,
        pointsNextLevel: 100,
        createdAt: Date.now(),
        streakDays: 1,
        anniversaryDate: new Date().toISOString().split("T")[0]
      };
    } else {
      rel.type = relReq.type;
      rel.anniversaryDate = new Date().toISOString().split("T")[0];
    }

    relationships.set(relKey, rel);

    relationshipHistory.push({
      id: generateId(),
      user1Id: relReq.senderId,
      user2Id: relReq.receiverId,
      type: relReq.type,
      action: "accepted",
      details: `${relReq.receiverName} accepted the ${relReq.type} request from ${relReq.senderName}!`,
      timestamp: Date.now()
    });

    const senderSocketId = userSockets.get(relReq.senderId);
    if (senderSocketId) {
      io?.to(senderSocketId).emit("relationship:accepted", { relationship: rel, request: relReq });
    }

    saveDB();
    return res.json({ success: true, relationship: rel });
  }

  res.status(400).json({ error: "Invalid action type." });
});

app.post("/api/relationships/remove", (req, res) => {
  const { userId, targetId } = req.body;
  const relKey = [userId, targetId].sort().join("_");
  const rel = relationships.get(relKey);

  if (!rel) return res.status(404).json({ error: "Active relationship not found." });

  const oldType = rel.type;
  relationships.delete(relKey);

  relationshipHistory.push({
    id: generateId(),
    user1Id: rel.user1Id,
    user2Id: rel.user2Id,
    type: oldType,
    action: "removed",
    details: `The ${oldType} relationship between ${rel.user1Name} and ${rel.user2Name} was dissolved.`,
    timestamp: Date.now()
  });

  const s1 = userSockets.get(rel.user1Id);
  const s2 = userSockets.get(rel.user2Id);
  if (s1) io?.to(s1).emit("relationship:dissolved", { partnerId: rel.user2Id });
  if (s2) io?.to(s2).emit("relationship:dissolved", { partnerId: rel.user1Id });

  saveDB();
  res.json({ success: true });
});

app.post("/api/relationships/checkin", (req, res) => {
  const { userId, partnerId } = req.body;
  const relKey = [userId, partnerId].sort().join("_");
  const rel = relationships.get(relKey);

  if (!rel) return res.status(404).json({ error: "Active relationship not found." });

  const todayStr = new Date().toDateString();
  if (rel.lastCheckIn && new Date(rel.lastCheckIn).toDateString() === todayStr) {
    return res.status(400).json({ error: "You have already completed the daily check-in together today!" });
  }

  const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
  if (rel.lastCheckIn && new Date(rel.lastCheckIn).toDateString() === yesterdayStr) {
    rel.streakDays = (rel.streakDays || 0) + 1;
  } else {
    rel.streakDays = 1;
  }

  rel.lastCheckIn = Date.now();
  relationships.set(relKey, rel);

  addRelationshipPoints(userId, partnerId, 20, "check_in", `Daily check-in together (Streak: ${rel.streakDays} days)`);

  saveDB();
  res.json({ success: true, relationship: rel });
});

app.post("/api/relationships/rewards/claim", (req, res) => {
  const { userId, rewardId } = req.body;
  const reward = relationshipRewards.find(r => r.id === rewardId);
  if (!reward) return res.status(404).json({ error: "Reward not found." });

  if (reward.claimed) return res.status(400).json({ error: "This reward has already been claimed." });

  const rel = relationships.get(reward.relationshipId);
  if (!rel || (rel.user1Id !== userId && rel.user2Id !== userId)) {
    return res.status(403).json({ error: "Access Denied: You are not part of this relationship." });
  }

  reward.claimed = true;
  reward.claimedByUserId = userId;

  const user = users.get(userId);
  if (user) {
    if (reward.type === "coins") {
      user.coins += 500;
    } else if (reward.type === "diamonds") {
      user.diamonds = (user.diamonds || 0) + 50;
    } else if (reward.type === "badge") {
      user.badges = user.badges || [];
      if (!user.badges.includes(reward.value)) {
        user.badges.push(reward.value);
      }
    } else if (reward.type === "frame") {
      user.ownedStoreItems = user.ownedStoreItems || [];
      if (!user.ownedStoreItems.includes(reward.value)) {
        user.ownedStoreItems.push(reward.value);
      }
    }
  }

  saveDB();
  res.json({ success: true, reward });
});

app.get("/api/admin/relationships", (req, res) => {
  const { requestingUserId } = req.query;
  if (!isGlobalAdminUser(requestingUserId as string)) {
    return res.status(403).json({ error: "Access Denied: Unauthorized admin query." });
  }

  res.json({
    success: true,
    relationships: Array.from(relationships.values()),
    requests: Array.from(relationshipRequests.values()),
    history: relationshipHistory,
    stats: {
      totalActive: relationships.size,
      totalRequests: relationshipRequests.size,
      coupleCount: Array.from(relationships.values()).filter(r => r.type === "couple").length,
      homiesCount: Array.from(relationships.values()).filter(r => r.type === "homies").length,
    }
  });
});

app.post("/api/admin/relationships/reset", (req, res) => {
  const { requestingUserId, relationshipId, action } = req.body;
  if (!isGlobalAdminUser(requestingUserId)) {
    return res.status(403).json({ error: "Access Denied: Unauthorized admin action." });
  }

  const rel = relationships.get(relationshipId);
  if (!rel) return res.status(404).json({ error: "Relationship not found." });

  if (action === "dissolve") {
    relationships.delete(relationshipId);
    relationshipHistory.push({
      id: generateId(),
      user1Id: rel.user1Id,
      user2Id: rel.user2Id,
      type: rel.type,
      action: "removed",
      details: `[ADMIN ACTION] Relationship dissolved by administrator.`,
      timestamp: Date.now()
    });
  } else if (action === "reset_level") {
    rel.level = 1;
    rel.points = 0;
    rel.pointsNextLevel = 100;
    relationships.set(relationshipId, rel);
    relationshipHistory.push({
      id: generateId(),
      user1Id: rel.user1Id,
      user2Id: rel.user2Id,
      type: rel.type,
      action: "level_up",
      details: `[ADMIN ACTION] Relationship level reset to 1 by administrator.`,
      timestamp: Date.now()
    });
  }

  saveDB();
  res.json({ success: true });
});

// 7. Wallet recharges, conversion, balances
app.post("/api/wallet/recharge", (req, res) => {
  const { userId, requestingUserId, packageId, coins, diamonds, costUsd } = req.body;
  
  if (requestingUserId && requestingUserId !== userId) {
    return res.status(403).json({ error: "Access Denied: Unauthorized wallet recharge." });
  }

  const user = users.get(userId);
  if (!user) return res.status(404).json({ error: "User profile not found." });

  const addedCoins = Number(coins || 0);
  const addedDiamonds = Number(diamonds || 0);

  user.coins += addedCoins;
  user.diamonds = (user.diamonds || 0) + addedDiamonds;
  
  // Track cumulative recharge in USD
  user.totalRechargedUsd = (user.totalRechargedUsd || 0) + parseFloat(costUsd || 0);

  // Award XP for recharge first
  user.xp += Math.floor(costUsd * 10);
  while (user.xp >= user.xpNextLevel) {
    user.level += 1;
    user.xp -= user.xpNextLevel;
    user.xpNextLevel = Math.floor(user.xpNextLevel * 1.5);
  }

  // Recalculate VIP based on level and cumulative recharge
  recalculateUserVip(user);

  const txn: TransactionRecord = {
    id: generateId(),
    userId,
    type: "recharge",
    amountCoins: addedCoins,
    amountDiamonds: addedDiamonds,
    description: addedDiamonds > 0 
      ? `Recharged ${addedDiamonds.toLocaleString()} Diamonds (${addedCoins.toLocaleString()} Coins Bonus)`
      : `Recharged Sandbox ${addedCoins} Coins ($${costUsd})`,
    timestamp: new Date().toISOString()
  };
  transactions.unshift(txn);

  res.json({ success: true, profile: user, transaction: txn });
});

app.post("/api/wallet/withdraw", (req, res) => {
  const { userId, requestingUserId, diamonds, bdtAmount } = req.body;
  if (!requestingUserId || requestingUserId !== userId) {
    return res.status(403).json({ error: "Access Denied: Unauthorized wallet withdrawal." });
  }

  const user = users.get(userId);
  if (!user) return res.status(404).json({ error: "User profile not found." });

  if (user.diamonds < diamonds) return res.status(400).json({ error: "Insufficient diamond balance for withdrawal." });

  user.diamonds -= diamonds;

  const txn: TransactionRecord = {
    id: generateId(),
    userId,
    type: "withdrawal",
    amountCoins: 0,
    amountDiamonds: -diamonds,
    description: `Withdrew BDT ${bdtAmount} from ${diamonds} diamonds`,
    timestamp: new Date().toISOString()
  };
  transactions.unshift(txn);

  res.json({ success: true, profile: user, transaction: txn });
});

app.get("/api/wallet/transactions/:userId", (req, res) => {
  const requestingUserId = req.query.requestingUserId as string;
  if (!requestingUserId || requestingUserId !== req.params.userId) {
    return res.status(403).json({ error: "Access Denied: Wallet transactions are private." });
  }
  const filtered = transactions.filter(t => t.userId === req.params.userId);
  res.json(filtered);
});

// 8. Virtual Gift System (Sending with score additions)
app.post("/api/gifts/send", (req, res) => {
  const { roomId, senderId, targetUserId, giftId, comboCount: reqCombo } = req.body;
  const comboCount = Math.max(1, parseInt(reqCombo || 1, 10));
  const sender = users.get(senderId);
  const receiver = users.get(targetUserId);
  const gift = GIFT_CATALOG.find(g => g.id === giftId);

  if (!sender || !receiver || !gift) {
    return res.status(404).json({ error: "Sender, receiver, or gift item missing." });
  }

  const totalCost = gift.cost * comboCount;
  const isAdmin = isGlobalAdminUser(senderId);
  if (sender.coins < totalCost && !isAdmin) {
    return res.status(400).json({ error: "Insufficient Coin wallet balance. Please recharge." });
  }

  // Transfer funds
  if (!isAdmin) {
    sender.coins -= totalCost;
  }
  
  // Receiver earns Diamonds (income ratio 50% of cost)
  const earnedDiamonds = Math.max(1, Math.floor(gift.cost * 0.5)) * comboCount;
  receiver.diamonds += earnedDiamonds;

  // Add Exp
  sender.xp += Math.floor(totalCost * 1.5);
  while (sender.xp >= sender.xpNextLevel) {
    sender.level += 1;
    sender.xp -= sender.xpNextLevel;
    sender.xpNextLevel = Math.floor(sender.xpNextLevel * 1.5);
  }
  recalculateUserVip(sender);

  // Update Room Rank total
  const room = rooms.get(roomId);
  if (room) {
    room.totalGiftsReceived += gift.cost;

    // Update Room Level & Tasks
    if (!room.roomTasks) {
      room.roomTasks = {
        newJoins: 0,
        newJoinsTarget: 5,
        micMinutes: 0,
        micMinutesTarget: 10,
        diamondsGifted: 0,
        diamondsGiftedTarget: 100,
        ownerMicMinutes: 0,
        ownerMicMinutesTarget: 10,
        completed: []
      };
    }

    // Add direct room EXP for gifting (e.g. +1 EXP per coin spent)
    addRoomExp(room, totalCost);

    if (room.roomTasks && !room.roomTasks.completed?.includes("gifts")) {
      room.roomTasks.diamondsGifted = (room.roomTasks.diamondsGifted || 0) + totalCost;
      if (room.roomTasks.diamondsGifted >= room.roomTasks.diamondsGiftedTarget) {
        room.roomTasks.completed.push("gifts");
        addRoomExp(room, 100);
        
        const taskMsg = {
          id: "sys_task_" + generateId(),
          senderId: "system",
          senderName: "System",
          senderAvatarUrl: "",
          senderVip: VipLevel.NONE,
          senderLevel: 1,
          type: MessageType.SYSTEM,
          content: `🎯 Daily Gift Task Completed in this room! (+100 Room EXP) 🎁`,
          timestamp: new Date().toISOString(),
          reactions: {}
        };
        let logs = messages.get(roomId) || [];
        logs.push(taskMsg as any);
        messages.set(roomId, logs);
        io?.to(`room:${roomId}`).emit("message:received", taskMsg);
      }
    }

    // Check if active PK battle exists, and add points
    if (room.activePkBattleId) {
      const pk = pkBattles.get(room.activePkBattleId);
      if (pk && pk.status === "active") {
        if (targetUserId === pk.leftUserId || senderId === pk.leftUserId) {
          pk.leftScore += gift.cost * 10 * (comboCount || 1);
        } else if (targetUserId === pk.rightUserId || senderId === pk.rightUserId) {
          pk.rightScore += gift.cost * 10 * (comboCount || 1);
        }
        // Emit updated PK battle stats instantly to all users in the room
        io?.to(`room:${roomId}`).emit("room:pk_update", pk);
      }
    }
  }

  // Log Transaction
  const txnSent: TransactionRecord = {
    id: generateId(),
    userId: senderId,
    type: "gift_sent",
    amountCoins: -gift.cost,
    amountDiamonds: 0,
    description: `Sent gift ${gift.name} (${gift.imageUrl}) to ${receiver.displayName}`,
    timestamp: new Date().toISOString()
  };
  transactions.unshift(txnSent);

  const txnRecv: TransactionRecord = {
    id: generateId(),
    userId: targetUserId,
    type: "gift_received",
    amountCoins: 0,
    amountDiamonds: earnedDiamonds,
    description: `Earned ${earnedDiamonds} Diamonds from ${sender.displayName}'s ${gift.name}`,
    timestamp: new Date().toISOString()
  };
  transactions.unshift(txnRecv);

  // Broadcast to room message logs
  if (room) {
    const logs = messages.get(roomId) || [];
    logs.push({
      id: generateId(),
      senderId: "system",
      senderName: "EbadulChat Gift",
      senderAvatarUrl: "",
      senderVip: VipLevel.NONE,
      senderLevel: 1,
      type: MessageType.GIFT_ALERT,
      content: `🎁 ${sender.displayName} gifted ${gift.name} ${gift.imageUrl} ${comboCount > 1 ? `x${comboCount} Combo! ` : ""}to ${receiver.displayName}! (+${gift.cost * comboCount * 10} PK Points)`,
      timestamp: new Date().toISOString(),
      reactions: { "🔥": 2, "❤️": 5 }
    });
    messages.set(roomId, logs);

    // Send visual gift flight overlay event to all clients in the room
    const relKey = [sender.id, receiver.id].sort().join("_");
    const rel = relationships.get(relKey);
    let relGiftEffect: string | undefined = undefined;

    if (rel) {
      (rel as any).diamondsSpent = ((rel as any).diamondsSpent || 0) + totalCost;
      if (sender.id === rel.user1Id) {
        (rel as any).giftsSentFrom1To2 = true;
      } else {
        (rel as any).giftsSentFrom2To1 = true;
      }
      relationships.set(relKey, rel);

      const ptsToAdd = Math.max(1, Math.floor(totalCost / 10));
      addRelationshipPoints(sender.id, receiver.id, ptsToAdd, "gift", `Sent gift ${gift.name} x${comboCount}`);

      if (rel.type) {
        if (rel.type === "couple") {
          relGiftEffect = "couple_love_fireworks";
        } else if (rel.type === "homies") {
          relGiftEffect = "homies_high_five";
        } else if (rel.type === "best_friend") {
          relGiftEffect = "best_friend_glow";
        } else if (rel.type === "brother") {
          relGiftEffect = "brother_shield_spark";
        } else if (rel.type === "sister") {
          relGiftEffect = "sister_flower_bloom";
        } else if (rel.type === "family") {
          relGiftEffect = "family_heartbeat";
        } else if (rel.type === "soulmate") {
          relGiftEffect = "soulmate_celestial_bond";
        }
      }
    }

    io?.to(`room:${roomId}`).emit("room:gift_broadcast", {
      id: generateId(),
      senderId: sender.id,
      senderName: sender.displayName,
      senderAvatarUrl: sender.avatarUrl,
      receiverId: receiver.id,
      receiverName: receiver.displayName,
      receiverAvatarUrl: receiver.avatarUrl,
      giftName: gift.name,
      giftImageUrl: gift.imageUrl,
      cost: gift.cost,
      animationType: gift.animationType,
      comboCount: comboCount,
      relGiftEffect,
      timestamp: Date.now()
    });

    // Send the system gift message log
    io?.to(`room:${roomId}`).emit("message:received", logs[logs.length - 1]);

    // Register VIP/Premium Global celebration
    if (gift.cost >= 200) {
      globalVipAlerts.unshift({
        id: generateId(),
        senderId: sender.id,
        senderName: sender.displayName,
        senderAvatarUrl: sender.avatarUrl,
        receiverId: receiver.id,
        receiverName: receiver.displayName,
        receiverAvatarUrl: receiver.avatarUrl,
        giftId: gift.id,
        giftName: gift.name,
        giftImageUrl: gift.imageUrl,
        cost: gift.cost,
        comboCount: comboCount,
        roomId: roomId,
        roomName: room.name,
        timestamp: Date.now()
      });
      if (globalVipAlerts.length > 20) {
        globalVipAlerts.pop();
      }
    }
  }

  res.json({
    success: true,
    senderCoins: sender.coins,
    receiverDiamonds: receiver.diamonds,
    senderLevel: sender.level,
    giftDetails: gift,
    transactionId: txnSent.id
  });
});

// Load catalog
app.get("/api/gifts/catalog", (req, res) => {
  res.json(GIFT_CATALOG);
});

// Get VIP levels list
app.get("/api/gifts/vip-levels", (req, res) => {
  res.json(VIP_LEVELS);
});

// Load VIP Alerts
app.get("/api/gifts/vip-alerts", (req, res) => {
  res.json(globalVipAlerts);
});

// Admin modify VIP Level (Add/Edit)
app.post("/api/admin/vip-levels", (req, res) => {
  const { adminUserId, level, title, minRechargeUsd, badgeIcon, profileFrameStyle, chatBubbleStyle, entryBanner, entrySound } = req.body;
  if (!isGlobalAdminUser(adminUserId)) {
    return res.status(403).json({ error: "Access denied. Only Supreme Admin is permitted." });
  }

  const numericLevel = parseInt(level) || 1;
  const existingIndex = VIP_LEVELS.findIndex(vl => vl.level === numericLevel);

  const newVip = {
    level: numericLevel,
    title: title || `VIP Level ${numericLevel}`,
    minRechargeUsd: parseInt(minRechargeUsd) || 0,
    badgeIcon: badgeIcon || "👑",
    profileFrameStyle: profileFrameStyle || "border-[2.5px] border-yellow-500 animate-pulse",
    chatBubbleStyle: chatBubbleStyle || "",
    entryBanner: entryBanner || `🔥 VIP ${numericLevel} Entered 🔥`,
    entrySound: entrySound || "gold"
  };

  if (existingIndex >= 0) {
    VIP_LEVELS[existingIndex] = newVip;
  } else {
    VIP_LEVELS.push(newVip);
    VIP_LEVELS.sort((a, b) => a.level - b.level);
  }

  saveDB();
  io?.emit("admin:vip_levels_updated", VIP_LEVELS);
  res.json({ success: true, vipLevels: VIP_LEVELS });
});

// Admin delete VIP Level
app.delete("/api/admin/vip-levels/:level", (req, res) => {
  const { adminUserId } = req.query;
  if (!isGlobalAdminUser(adminUserId as string)) {
    return res.status(403).json({ error: "Access denied. Only Supreme Admin is permitted." });
  }

  const levelToDelete = parseInt(req.params.level);
  VIP_LEVELS = VIP_LEVELS.filter(vl => vl.level !== levelToDelete);

  saveDB();
  io?.emit("admin:vip_levels_updated", VIP_LEVELS);
  res.json({ success: true, vipLevels: VIP_LEVELS });
});

// Admin create/edit Gift
app.post("/api/admin/gifts", (req, res) => {
  const { adminUserId, id, name, cost, imageUrl, animationType, category, effectClass } = req.body;
  if (!isGlobalAdminUser(adminUserId)) {
    return res.status(403).json({ error: "Access denied. Only Supreme Admin is permitted." });
  }

  const giftId = id || "g_" + generateId();
  const existingIndex = GIFT_CATALOG.findIndex(g => g.id === giftId);

  const newGift: GiftItem = {
    id: giftId,
    name: name || "New Gift",
    cost: parseInt(cost) || 10,
    imageUrl: imageUrl || "🎁",
    animationType: animationType || "2d",
    category: category || "small",
    effectClass: effectClass || "animate-rose"
  };

  if (existingIndex >= 0) {
    GIFT_CATALOG[existingIndex] = newGift;
  } else {
    GIFT_CATALOG.push(newGift);
  }

  saveDB();
  io?.emit("admin:gift_catalog_updated", GIFT_CATALOG);
  res.json({ success: true, giftCatalog: GIFT_CATALOG });
});

// Admin delete Gift
app.delete("/api/admin/gifts/:id", (req, res) => {
  const { adminUserId } = req.query;
  if (!isGlobalAdminUser(adminUserId as string)) {
    return res.status(403).json({ error: "Access denied. Only Supreme Admin is permitted." });
  }

  const idToDelete = req.params.id;
  GIFT_CATALOG = GIFT_CATALOG.filter(g => g.id !== idToDelete);

  saveDB();
  io?.emit("admin:gift_catalog_updated", GIFT_CATALOG);
  res.json({ success: true, giftCatalog: GIFT_CATALOG });
});

// 9. PK Arena Battles
app.post("/api/pk/battle/start", (req, res) => {
  const { roomId, leftUserId, rightUserId } = req.body;
  const room = rooms.get(roomId);
  const left = users.get(leftUserId);
  const right = users.get(rightUserId);

  if (!room || !left || !right) return res.status(404).json({ error: "Setup elements not found." });

  const pkId = generateId();
  const battle: PKBattle = {
    id: pkId,
    roomId,
    leftUserId,
    leftUsername: left.displayName,
    leftAvatar: left.avatarUrl,
    leftScore: 100,
    rightUserId,
    rightUsername: right.displayName,
    rightAvatar: right.avatarUrl,
    rightScore: 100,
    durationSeconds: 900, // 15 minutes
    timeLeftSeconds: 900,
    status: "active",
    createdAt: Date.now()
  };

  pkBattles.set(pkId, battle);
  room.activePkBattleId = pkId;

  // Append announcement
  const logs = messages.get(roomId) || [];
  const systemMsg = {
    id: generateId(),
    senderId: "system",
    senderName: "PK Referee",
    senderAvatarUrl: "",
    senderVip: VipLevel.NONE,
    senderLevel: 1,
    type: MessageType.SYSTEM,
    content: `💥 1v1 PK Battle officially started! ${left.displayName} VS ${right.displayName}. It will last for 15 minutes. Start sending premium gifts to boost your star indicator!`,
    timestamp: new Date().toISOString(),
    reactions: {}
  };
  logs.push(systemMsg);
  messages.set(roomId, logs);

  // Notify clients immediately
  io?.to(`room:${roomId}`).emit("room:pk_update", battle);
  io?.to(`room:${roomId}`).emit("message:received", systemMsg);
  broadcastRoomUpdate(roomId);

  res.json({ success: true, battle });
});

app.post("/api/pk/battle/end-early", (req, res) => {
  const { roomId, userId } = req.body;
  const room = rooms.get(roomId);
  if (!room) return res.status(404).json({ error: "Room not found." });
  if (room.ownerId !== userId) {
    return res.status(403).json({ error: "Only the Room Owner can end the PK Battle early." });
  }

  if (!room.activePkBattleId) {
    return res.status(400).json({ error: "No active PK Battle found in this room." });
  }

  const pk = pkBattles.get(room.activePkBattleId);
  if (!pk) return res.status(404).json({ error: "PK battle not found." });

  pk.timeLeftSeconds = 0;
  pk.status = "ended";
  if (pk.leftScore > pk.rightScore) {
    pk.winnerUserId = pk.leftUserId;
  } else if (pk.rightScore > pk.leftScore) {
    pk.winnerUserId = pk.rightUserId;
  } else {
    pk.winnerUserId = null; // Draw
  }

  room.activePkBattleId = undefined;

  // Sync result in chat
  const logs = messages.get(roomId) || [];
  const winnerName = pk.winnerUserId 
    ? (pk.winnerUserId === pk.leftUserId ? pk.leftUsername : pk.rightUsername) 
    : "No one (Draw!)";
  
  const systemMsg = {
    id: generateId(),
    senderId: "system",
    senderName: "PK Referee",
    senderAvatarUrl: "",
    senderVip: VipLevel.NONE,
    senderLevel: 1,
    type: MessageType.SYSTEM,
    content: `🏁 PK Arena battle ended early by Host! Winner: 🎉 ${winnerName} 🎉 Score: ${pk.leftScore} to ${pk.rightScore}`,
    timestamp: new Date().toISOString(),
    reactions: { "🏆": 5 }
  };
  logs.push(systemMsg);
  messages.set(roomId, logs);

  io?.to(`room:${roomId}`).emit("room:pk_update", pk);
  io?.to(`room:${roomId}`).emit("message:received", systemMsg);
  broadcastRoomUpdate(roomId);

  res.json({ success: true, battle: pk });
});

app.get("/api/pk/battle/:id", (req, res) => {
  const pk = pkBattles.get(req.params.id);
  if (!pk) return res.status(404).json({ error: "PK battle log not discovered." });

  // Compute actual countdown based on real clock time
  if (pk.status === "active") {
    const battleCreatedAt = pk.createdAt || Date.now();
    const elapsedSeconds = Math.floor((Date.now() - battleCreatedAt) / 1000);
    pk.timeLeftSeconds = Math.max(0, pk.durationSeconds - elapsedSeconds);

    if (pk.timeLeftSeconds <= 0) {
      pk.status = "ended";
      if (pk.leftScore > pk.rightScore) {
        pk.winnerUserId = pk.leftUserId;
      } else if (pk.rightScore > pk.leftScore) {
        pk.winnerUserId = pk.rightUserId;
      } else {
        pk.winnerUserId = null; // Draw
      }

      // Sync room state
      const room = rooms.get(pk.roomId);
      if (room) {
        room.activePkBattleId = undefined;
      }

      // Add winner congratulations in chat
      const logs = messages.get(pk.roomId) || [];
      const winnerName = pk.winnerUserId 
        ? (pk.winnerUserId === pk.leftUserId ? pk.leftUsername : pk.rightUsername) 
        : "No one (Draw!)";
      
      const systemMsg = {
        id: generateId(),
        senderId: "system",
        senderName: "PK Referee",
        senderAvatarUrl: "",
        senderVip: VipLevel.NONE,
        senderLevel: 1,
        type: MessageType.SYSTEM,
        content: `🏁 PK Arena battle complete! Winner: 🎉 ${winnerName} 🎉 Score: ${pk.leftScore} to ${pk.rightScore}`,
        timestamp: new Date().toISOString(),
        reactions: { "🏆": 5 }
      };
      logs.push(systemMsg);
      messages.set(pk.roomId, logs);

      io?.to(`room:${pk.roomId}`).emit("room:pk_update", pk);
      io?.to(`room:${pk.roomId}`).emit("message:received", systemMsg);
      if (room) broadcastRoomUpdate(pk.roomId);
    }
  }

  res.json(pk);
});

// 10. Earning Centers (Spin, Task Checks)
app.post("/api/earn/daily-checkin", (req, res) => {
  const { userId } = req.body;
  const user = users.get(userId);
  if (!user) return res.status(404).json({ error: "User profile not found." });

  const points = 150;
  user.coins += points;

  const txn: TransactionRecord = {
    id: generateId(),
    userId,
    type: "reward",
    amountCoins: points,
    amountDiamonds: 0,
    description: "Daily Attendance Checked",
    timestamp: new Date().toISOString()
  };
  transactions.unshift(txn);

  res.json({ success: true, coinsEarned: points, currentCoins: user.coins });
});

app.post("/api/earn/lucky-spin", (req, res) => {
  const { userId } = req.body;
  const user = users.get(userId);
  if (!user) return res.status(404).json({ error: "User profile not found." });

  const isAdmin = isGlobalAdminUser(userId);
  if (user.coins < 50 && !isAdmin) return res.status(400).json({ error: "Spin costs 50 coins. Insufficient funds." });

  if (!isAdmin) {
    user.coins -= 50;
  }

  // Spin choices: 0, 10, 100, 250, 1000
  const randomVal = Math.random();
  let payout = 0;
  let text = "";

  if (randomVal < 0.1) {
    payout = 1000;
    text = "🚀 JACKPOT! Elite 1000 Coins payout!";
  } else if (randomVal < 0.3) {
    payout = 250;
    text = "👑 Grand prize of 250 Coins!";
  } else if (randomVal < 0.6) {
    payout = 80;
    text = "⭐ Moderate prize of 80 Coins!";
  } else if (randomVal < 0.9) {
    payout = 20;
    text = "Lucky 20 Coins!";
  } else {
    payout = 0;
    text = "Oops! Try again next turn.";
  }

  user.coins += payout;

  const txn: TransactionRecord = {
    id: generateId(),
    userId,
    type: "reward",
    amountCoins: payout - 50,
    amountDiamonds: 0,
    description: `Lucky Spin Result: ${text}`,
    timestamp: new Date().toISOString()
  };
  transactions.unshift(txn);

  res.json({ success: true, payout, walletCoins: user.coins, message: text });
});

// ===================================================================
// 10.5 GREEDY PRO FOOD MULTIPLIER MULTIPLAYER GAME BACKEND
// ===================================================================

interface GreedyProGameState {
  roomId: string;
  status: 'betting' | 'spinning' | 'ended';
  timeLeft: number;
  lastResult: string;
  history: string[];
  bets: { [foodId: string]: number };
  userBets: { [userId: string]: { [foodId: string]: number } };
  winnerIndex?: number;
  winnerAngle?: number;
  bannerWinner?: string;
  updatedAt: string;
}

const GREEDY_PRO_FOODS = [
  { id: "tomato", name: "🍅 Tomato", multiplier: 5, weight: 23 },
  { id: "corn", name: "🌽 Corn", multiplier: 5, weight: 23 },
  { id: "carrot", name: "🥕 Carrot", multiplier: 5, weight: 18 },
  { id: "cabbage", name: "🥬 Cabbage", multiplier: 5, weight: 18 },
  { id: "bread", name: "🍞 Bread", multiplier: 10, weight: 10 },
  { id: "sausage", name: "🌭 Sausage", multiplier: 15, weight: 5 },
  { id: "chicken", name: "🍗 Chicken", multiplier: 25, weight: 2 },
  { id: "steak", name: "🥩 Steak", multiplier: 45, weight: 1 },
];

const WHEEL_SEGMENTS_PRO = [
  "tomato", "corn", "carrot", "bread", "cabbage", "tomato", "sausage", "corn",
  "carrot", "bread", "cabbage", "tomato", "chicken", "corn", "carrot", "cabbage",
  "steak", "tomato", "bread", "corn", "carrot", "cabbage", "tomato", "corn"
];

const greedyGamesPro = new Map<string, GreedyProGameState>();
const greedyTimersPro = new Map<string, NodeJS.Timeout>();

async function syncGreedyProToFirestore(roomId: string, game: GreedyProGameState) {
  game.updatedAt = new Date().toISOString();
  if (firestoreEnabled && db) {
    try {
      await db.collection("greedy_games").doc(roomId).set(JSON.parse(JSON.stringify(game)));
    } catch (e) {
      console.error("Failed to sync greedy pro game to Firestore:", e);
    }
  }
}

function startGreedyProTimer(roomId: string) {
  if (greedyTimersPro.has(roomId)) return;

  const timer = setInterval(async () => {
    const game = greedyGamesPro.get(roomId);
    if (!game) {
      clearInterval(timer);
      greedyTimersPro.delete(roomId);
      return;
    }

    if (game.status === 'betting') {
      if (game.timeLeft > 0) {
        game.timeLeft--;
        await syncGreedyProToFirestore(roomId, game);
      } else {
        // Time's up! Choose winning food
        game.status = 'spinning';
        game.timeLeft = 0;

        const rand = Math.random() * 100;
        let accumulated = 0;
        let selectedFoodId = "tomato";

        for (const food of GREEDY_PRO_FOODS) {
          accumulated += food.weight;
          if (rand <= accumulated) {
            selectedFoodId = food.id;
            break;
          }
        }

        // Find matches in the 24 segments
        const possibleSegments: number[] = [];
        WHEEL_SEGMENTS_PRO.forEach((fId, idx) => {
          if (fId === selectedFoodId) possibleSegments.push(idx);
        });

        const winnerIndex = possibleSegments.length > 0
          ? possibleSegments[Math.floor(Math.random() * possibleSegments.length)]
          : 0;

        const baseAngle = 360 * 5; // 5 spins
        const targetAngle = baseAngle + (winnerIndex * 15);

        game.winnerIndex = winnerIndex;
        game.winnerAngle = targetAngle;
        game.lastResult = selectedFoodId;
        game.history = [selectedFoodId, ...game.history.slice(0, 9)];

        const winningFood = GREEDY_PRO_FOODS.find(f => f.id === selectedFoodId)!;
        const multiplier = winningFood.multiplier;

        let bigWinnerName = "";
        let maxWonAmount = 0;

        // Calculate payouts
        for (const [userId, userBetMap] of Object.entries(game.userBets)) {
          const betAmount = userBetMap[selectedFoodId] || 0;
          const payoutAmount = betAmount * multiplier;

          const dbUser = users.get(userId);
          if (dbUser) {
            dbUser.diamonds = (dbUser.diamonds || 0) + payoutAmount;
            if (firestoreEnabled && db) {
              db.collection("users").doc(userId).set(JSON.parse(JSON.stringify(dbUser))).catch((e: any) => console.error("User diamond payout write error:", e));
            }
          }

          // Log bets
          for (const [fId, bAmt] of Object.entries(userBetMap)) {
            if (bAmt > 0) {
              const isWin = fId === selectedFoodId;
              const pay = isWin ? bAmt * multiplier : 0;
              const betLogId = `bet_${Date.now()}_${userId}_${fId}`;

              if (firestoreEnabled && db) {
                db.collection("greedy_bets").doc(betLogId).set({
                  id: betLogId,
                  roomId,
                  userId,
                  displayName: dbUser?.displayName || "Player",
                  foodId: fId,
                  amount: bAmt,
                  payout: pay,
                  status: isWin ? "won" : "lost",
                  createdAt: new Date().toISOString()
                }).catch((e: any) => console.error("Bet history log failed:", e));
              }
            }
          }

          if (payoutAmount > 0) {
            if (payoutAmount > maxWonAmount && dbUser) {
              maxWonAmount = payoutAmount;
              bigWinnerName = dbUser.displayName;
            }

            // Leaderboard score accumulation
            if (firestoreEnabled && db) {
              const leaderDocRef = db.collection("greedy_leaderboard").doc(userId);
              try {
                const docSnap = await leaderDocRef.get();
                if (docSnap.exists) {
                  const currentPoints = docSnap.data()?.totalWonDiamonds || 0;
                  await leaderDocRef.update({
                    totalWonDiamonds: currentPoints + payoutAmount,
                    updatedAt: new Date().toISOString()
                  });
                } else {
                  await leaderDocRef.set({
                    userId,
                    displayName: dbUser?.displayName || "Player",
                    avatarUrl: dbUser?.avatarUrl || "",
                    totalWonDiamonds: payoutAmount,
                    updatedAt: new Date().toISOString()
                  });
                }
              } catch (e) {
                console.error("Leaderboard update failed:", e);
              }
            }
          }
        }

        if (maxWonAmount > 0) {
          game.bannerWinner = `🎉 ${bigWinnerName} won ${maxWonAmount.toLocaleString()} Diamonds with ${winningFood.name}! 💎✨`;
        } else {
          game.bannerWinner = `Winner food: ${winningFood.name}! No winners this round. 🍀`;
        }

        await syncGreedyProToFirestore(roomId, game);

        // Transition from spinning (5s) to ended
        setTimeout(async () => {
          const liveGame = greedyGamesPro.get(roomId);
          if (liveGame && liveGame.status === 'spinning') {
            liveGame.status = 'ended';
            await syncGreedyProToFirestore(roomId, liveGame);

            // Wait 4s in ended status before starting the next round
            setTimeout(async () => {
              const resetGame = greedyGamesPro.get(roomId);
              if (resetGame && resetGame.status === 'ended') {
                resetGame.status = 'betting';
                resetGame.timeLeft = 20;
                resetGame.bets = { tomato: 0, corn: 0, carrot: 0, cabbage: 0, bread: 0, sausage: 0, chicken: 0, steak: 0 };
                resetGame.userBets = {};
                resetGame.bannerWinner = "";
                resetGame.winnerIndex = undefined;
                resetGame.winnerAngle = undefined;

                await syncGreedyProToFirestore(roomId, resetGame);
              }
            }, 4000);
          }
        }, 5000);
      }
    }
  }, 1000);

  greedyTimersPro.set(roomId, timer);
}

app.get("/api/greedy/status", (req, res) => {
  const roomId = req.query.roomId as string;
  const userId = req.query.userId as string;

  if (!roomId) {
    return res.status(400).json({ error: "Room ID is required" });
  }

  let game = greedyGamesPro.get(roomId);
  if (!game) {
    game = {
      roomId,
      status: 'betting',
      timeLeft: 20,
      lastResult: 'tomato',
      history: ['tomato', 'corn', 'carrot', 'cabbage'],
      bets: { tomato: 0, corn: 0, carrot: 0, cabbage: 0, bread: 0, sausage: 0, chicken: 0, steak: 0 },
      userBets: {},
      updatedAt: new Date().toISOString()
    };
    greedyGamesPro.set(roomId, game);
  }

  // Ensure timer is running
  startGreedyProTimer(roomId);

  const u = userId ? users.get(userId) : null;

  res.json({
    success: true,
    game,
    userDiamonds: u ? (u.diamonds || 0) : 0
  });
});

app.post("/api/greedy/place-bet", (req, res) => {
  const { roomId, userId, foodId, amount } = req.body;

  if (!roomId || !userId || !foodId || !amount) {
    return res.status(400).json({ error: "Missing required parameters." });
  }

  const numericAmount = Math.floor(parseInt(amount)) || 0;
  if (numericAmount <= 0) {
    return res.status(400).json({ error: "Amount must be a positive integer." });
  }

  const game = greedyGamesPro.get(roomId);
  if (!game) {
    return res.status(404).json({ error: "Game not found for this room." });
  }

  if (game.status !== 'betting' || game.timeLeft <= 0) {
    return res.status(400).json({ error: "Betting phase is closed. Please wait for the next round." });
  }

  const u = users.get(userId);
  if (!u) {
    return res.status(404).json({ error: "User not found." });
  }

  if ((u.diamonds || 0) < numericAmount) {
    return res.status(400).json({ error: "Insufficient Diamonds balance! Please recharge or claim free diamonds." });
  }

  // Deduct balance
  u.diamonds = (u.diamonds || 0) - numericAmount;

  // Save updated user to Firestore
  if (firestoreEnabled && db) {
    db.collection("users").doc(userId).set(JSON.parse(JSON.stringify(u))).catch((e: any) => console.error("User balance update save failed:", e));
  }

  // Update game state bets
  game.bets[foodId] = (game.bets[foodId] || 0) + numericAmount;

  if (!game.userBets[userId]) {
    game.userBets[userId] = { tomato: 0, corn: 0, carrot: 0, cabbage: 0, bread: 0, sausage: 0, chicken: 0, steak: 0 };
  }
  game.userBets[userId][foodId] = (game.userBets[userId][foodId] || 0) + numericAmount;

  // Force synchronous write to Firestore to reflect bet immediately
  syncGreedyProToFirestore(roomId, game);

  res.json({
    success: true,
    userDiamonds: u.diamonds,
    bets: game.bets,
    userBets: game.userBets[userId]
  });
});

app.get("/api/greedy/history", async (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required." });
  }

  if (firestoreEnabled && db) {
    try {
      const snap = await db.collection("greedy_bets")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(20)
        .get();

      const list: any[] = [];
      snap.forEach((doc: any) => list.push(doc.data()));
      return res.json({ success: true, history: list });
    } catch (e) {
      console.error("Failed to query bet history:", e);
    }
  }

  res.json({ success: true, history: [] });
});

app.get("/api/greedy/leaderboard", async (req, res) => {
  if (firestoreEnabled && db) {
    try {
      const snap = await db.collection("greedy_leaderboard")
        .orderBy("totalWonDiamonds", "desc")
        .limit(10)
        .get();

      const list: any[] = [];
      snap.forEach((doc: any) => list.push(doc.data()));
      return res.json({ success: true, leaderboard: list });
    } catch (e) {
      console.error("Failed to query leaderboard:", e);
    }
  }

  res.json({ success: true, leaderboard: [] });
});

// 11. Families center action
app.get("/api/families", (req, res) => {
  res.json(Array.from(families.values()));
});

app.post("/api/families/create", (req, res) => {
  const { name, description, creatorId, logo } = req.body;
  const creator = users.get(creatorId);
  if (!creator) return res.status(404).json({ error: "Creator not found." });

  const famId = generateId();
  const fam: Family = {
    id: famId,
    name: name || `${creator.displayName}'s House`,
    logoUrl: logo || "⭐",
    description: description || "Active social family, streaming and battle performance squad.",
    creatorId: creator.id,
    creatorName: creator.displayName,
    level: 1,
    memberCount: 1,
    totalXp: 0,
    ranking: families.size + 1,
    announcement: "Family officially registered! Meet. Collaborate. Rise."
  };

  families.set(famId, fam);
  creator.familyId = famId;
  creator.familyName = fam.name;

  res.json({ success: true, family: fam });
});

app.post("/api/families/:id/join", (req, res) => {
  const fam = families.get(req.params.id);
  const { userId } = req.body;
  const user = users.get(userId);

  if (!fam || !user) return res.status(404).json({ error: "Family or user not discovered." });

  if (user.familyId) {
    const oldFam = families.get(user.familyId);
    if (oldFam) oldFam.memberCount = Math.max(1, oldFam.memberCount - 1);
  }

  user.familyId = fam.id;
  user.familyName = fam.name;
  fam.memberCount += 1;

  res.json({ success: true, family: fam, user });
});

// 12. Global Leaderboards Generator
app.get("/api/leaderboards", (req, res) => {
  const sortedUsers = Array.from(users.values());
  
  // Top Gifters (Users sorted by level * coins recharge)
  const topGifters: LeaderboardEntry[] = sortedUsers
    .slice()
    .sort((a,b) => (b.level * 1000 + b.coins) - (a.level * 1000 + a.coins))
    .slice(0, 10)
    .map((u, i) => ({
      userId: u.id,
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      vipLevel: u.vipLevel,
      value: (u.level * 1150) + 1200,
      rank: i + 1
    }));

  // Top Earners (Users sorted by diamonds history)
  const topEarners: LeaderboardEntry[] = sortedUsers
    .slice()
    .sort((a,b) => b.diamonds - a.diamonds)
    .slice(0, 10)
    .map((u, i) => ({
      userId: u.id,
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      vipLevel: u.vipLevel,
      value: u.diamonds,
      rank: i + 1
    }));

  // Top Families
  const topFamilies: FamilyLeaderboardEntry[] = Array.from(families.values())
    .sort((a,b) => b.totalXp - a.totalXp)
    .slice(0, 10)
    .map((f, i) => ({
      familyId: f.id,
      familyName: f.name,
      logoUrl: f.logoUrl,
      level: f.level,
      value: f.totalXp,
      rank: i + 1
    }));

  res.json({
    gifters: topGifters,
    earners: topEarners,
    families: topFamilies
  });
});

// -------------------------------------------------------------------
// SOCKET.IO AND WEBRTC SIGNALING BACKEND SETUP
// -------------------------------------------------------------------

function setupSocketIO(server: http.Server) {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket connection established: ${socket.id}`);

    // JOIN ROOM
    socket.on("room:join", ({ roomId, userId }) => {
      if (!roomId || !userId) return;
      
      const user = users.get(userId);
      const room = rooms.get(roomId);
      if (!user || !room) {
        socket.emit("room:error", { error: "Invalid Room or User" });
        return;
      }

      let wasPendingDisconnect = false;
      const pending = pendingDisconnects.get(userId);
      if (pending) {
        clearTimeout(pending.timeoutId);
        pendingDisconnects.delete(userId);
        if (pending.roomId === roomId) {
          wasPendingDisconnect = true;
          console.log(`Reconnected quickly! Canceled pending leave for user ${userId} in room ${roomId}`);
        }
      }

      // Check global ban/suspension
      if (user.deviceBanned) {
        socket.emit("room:error", { error: "This device has been banned from accessing the platform." });
        return;
      }
      if (user.isPermanentlyBanned) {
        socket.emit("room:error", { error: "Your account has been permanently banned." });
        return;
      }
      if (user.suspendedUntil) {
        const suspendedUntilDate = new Date(user.suspendedUntil);
        if (suspendedUntilDate > new Date()) {
          const diffMs = suspendedUntilDate.getTime() - Date.now();
          const hoursLeft = Math.ceil(diffMs / (1000 * 60 * 60));
          socket.emit("room:error", { error: `Account temporarily suspended. Unbans in ${hoursLeft} hour(s).` });
          return;
        }
      }

      // Check room ban/block list
      if (room.bannedUsers?.includes(userId)) {
        socket.emit("room:error", { error: "You are permanently blocked from this room by the owner or admin." });
        return;
      }

      // Check room kick list with countdown
      if (room.kickedUsers && room.kickedUsers[userId]) {
        const kickUntil = new Date(room.kickedUsers[userId]);
        if (Date.now() < kickUntil.getTime()) {
          const timeLeftSec = Math.ceil((kickUntil.getTime() - Date.now()) / 1000);
          socket.emit("room:error", { error: `You were kicked from this room. Rejoin after ${timeLeftSec} seconds.` });
          return;
        } else {
          delete room.kickedUsers[userId];
        }
      }

      // Check if room is locked
      const isOwnerOrAdmin = room.ownerId === userId || 
                             room.admins?.includes(userId) || 
                             room.moderators?.includes(userId) ||
                             isGlobalAdminUser(userId);
      if (room.isRoomLocked && !isOwnerOrAdmin) {
        socket.emit("room:error", { error: "This room is currently locked by the owner or admin." });
        return;
      }

      // Track user socket
      userSockets.set(userId, socket.id);
      socketToUser.set(socket.id, userId);

      // Save room info to socket session
      (socket as any).roomId = roomId;
      (socket as any).userId = userId;

      // Join socket.io channel
      socket.join(`room:${roomId}`);

      // Update online profile status
      user.isOnline = true;

      // Recalculate room online count
      const roomRefGroup = io?.sockets.adapter.rooms.get(`room:${roomId}`);
      room.onlineUsersCount = roomRefGroup ? roomRefGroup.size : 1;

      console.log(`User ${userId} joined room ${roomId}. Room population: ${room.onlineUsersCount}`);

      // Broadcast join event
      const joinMsg: ChatMessage = {
        id: generateId(),
        type: MessageType.SYSTEM,
        senderId: "system",
        senderName: "System",
        senderAvatarUrl: "",
        senderVip: VipLevel.NONE,
        senderLevel: 1,
        content: `${user.displayName} joined the room.`,
        timestamp: new Date().toISOString(),
        reactions: {}
      };

      const logs = messages.get(roomId) || [];
      
      // Update room tasks: joins
      if (!room.roomTasks) {
        room.roomTasks = {
          newJoins: 0,
          newJoinsTarget: 5,
          micMinutes: 0,
          micMinutesTarget: 10,
          diamondsGifted: 0,
          diamondsGiftedTarget: 100,
          ownerMicMinutes: 0,
          ownerMicMinutesTarget: 10,
          completed: []
        };
      }

      if (room.roomTasks && !room.roomTasks.completed?.includes("joins")) {
        room.roomTasks.newJoins = (room.roomTasks.newJoins || 0) + 1;
        // Award room EXP for a join (+10 EXP)
        addRoomExp(room, 10);

        if (room.roomTasks.newJoins >= room.roomTasks.newJoinsTarget) {
          room.roomTasks.completed.push("joins");
          addRoomExp(room, 50);

          const taskMsg = {
            id: "sys_task_" + generateId(),
            senderId: "system",
            senderName: "System",
            senderAvatarUrl: "",
            senderVip: VipLevel.NONE,
            senderLevel: 1,
            type: MessageType.SYSTEM,
            content: `🎯 Daily Join Task Completed! (+50 Room EXP) 👥`,
            timestamp: new Date().toISOString(),
            reactions: {}
          };
          logs.push(taskMsg);
          messages.set(roomId, logs);
          io?.to(`room:${roomId}`).emit("message:received", taskMsg);
        }
      }

      if (!wasPendingDisconnect && !room.skipEntranceEffects && !room.disableJoinNotification) {
        logs.push(joinMsg);
        messages.set(roomId, logs);
        io?.to(`room:${roomId}`).emit("message:received", joinMsg);
      }

      // Send current state to newly joined user
      const sanitizedRoom = {
        ...room,
        seats: room.seats.map(s => {
          if (!s.userProfile) return s;
          return {
            ...s,
            userProfile: sanitizeUserProfile(s.userProfile, userId)
          };
        })
      };
      
      socket.emit("room:sync", {
        room: sanitizedRoom,
        messages: logs
      });

      // Broadcast room update to everyone in the room (including compiling the live audience list)
      broadcastRoomUpdate(roomId);

      // Check if relationship partner is already in the room for dynamic joint entrance effect
      try {
        const roomRefGroup = io?.sockets.adapter.rooms.get(`room:${roomId}`);
        if (roomRefGroup && !wasPendingDisconnect) {
          let partnerUserId: string | null = null;
          let activeRelType: string | null = null;
          
          for (const socketId of roomRefGroup) {
            const sidUser = socketToUser.get(socketId);
            if (sidUser && sidUser !== userId) {
              const relKey = [userId, sidUser].sort().join("_");
              const rel = relationships.get(relKey);
              if (rel && rel.type) {
                partnerUserId = sidUser;
                activeRelType = rel.type;
                break;
              }
            }
          }

          if (partnerUserId && activeRelType) {
            const partnerUser = users.get(partnerUserId);
            if (partnerUser) {
              let emoji = "❤️";
              let title = "Couple Entry";
              let text = `${user.displayName} ❤️ ${partnerUser.displayName} entered the room together!`;
              let effectClass = "couple-entry";
              let soundClip = "couple_sound";

              if (activeRelType === "homies") {
                emoji = "🤝";
                title = "Homies Entry";
                text = `${user.displayName} & ${partnerUser.displayName} entered together!`;
                effectClass = "homies-entry";
                soundClip = "homies_sound";
              } else if (activeRelType === "best_friend") {
                emoji = "💙";
                title = "Best Friend Entry";
                text = `${user.displayName} 💙 ${partnerUser.displayName} arrived side-by-side!`;
                effectClass = "bestfriend-entry";
                soundClip = "bf_sound";
              } else if (activeRelType === "brother") {
                emoji = "🛡️";
                title = "Brother Entry";
                text = `🛡️ Brothers in arms! ${user.displayName} and ${partnerUser.displayName} entered together!`;
                effectClass = "brother-entry";
                soundClip = "brother_sound";
              } else if (activeRelType === "sister") {
                emoji = "🌸";
                title = "Sister Entry";
                text = `🌸 Sisters for life! ${user.displayName} and ${partnerUser.displayName} entered together!`;
                effectClass = "sister-entry";
                soundClip = "sister_sound";
              } else if (activeRelType === "family") {
                emoji = "👨‍👩‍👧";
                title = "Family Entry";
                text = `👨‍👩‍👧 Family bond! ${user.displayName} and ${partnerUser.displayName} entered together!`;
                effectClass = "family-entry";
                soundClip = "family_sound";
              } else if (activeRelType === "soulmate") {
                emoji = "💖";
                title = "Soulmate Entry";
                text = `💖 Soulmates united! ${user.displayName} and ${partnerUser.displayName} walked in together!`;
                effectClass = "soulmate-entry";
                soundClip = "soulmate_sound";
              }

              io?.to(`room:${roomId}`).emit("room:relationship_entry_alert", {
                type: activeRelType,
                emoji,
                title,
                text,
                user1: user,
                user2: partnerUser,
                effectClass,
                soundClip
              });

              const relAnnMsg: ChatMessage = {
                id: "rel_entry_" + generateId(),
                type: MessageType.SYSTEM,
                senderId: "system",
                senderName: `${emoji} RELATIONSHIP ENTRANCE`,
                senderAvatarUrl: "",
                senderVip: VipLevel.NONE,
                senderLevel: 1,
                content: `🎉 [ENTRANCE] ${text}`,
                timestamp: new Date().toISOString(),
                reactions: {}
              };
              logs.push(relAnnMsg);
              messages.set(roomId, logs);
              io?.to(`room:${roomId}`).emit("message:received", relAnnMsg);
            }
          }
        }
      } catch (err) {
        console.error("Error trigger partner relationship entry effect:", err);
      }

      // Broadcast VIP or Premium entry effect
      if (!wasPendingDisconnect) {
        if (user.activeEntryEffectId) {
          let entryTitle = "Premium Elite Member";
          let entryBannerText = `⚡ ${user.displayName} entered in a sleek luxury supercar! 🏎️💨`;
          let entrySoundClip = "gold";
          let entryFrameStyle = "border-[3px] border-yellow-400 shadow-[0_0_15px_#facc15] animate-pulse";

          if (user.activeEntryEffectId === "entry_supercar") {
            entryTitle = "🏎️ Supercar Owner";
            entryBannerText = `🏎️💨 Vroom! ${user.displayName} arrived in a Custom Supercar! 💨🏎️`;
            entrySoundClip = "emperor";
            entryFrameStyle = "border-[3.5px] border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)]";
          } else if (user.activeEntryEffectId === "entry_celestial") {
            entryTitle = "🌌 Celestial God";
            entryBannerText = `🌌✨ Cosmic flash! ${user.displayName} descended from the Celestial Heavens! ✨🌌`;
            entrySoundClip = "cosmic";
            entryFrameStyle = "border-[3.5px] border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.85)]";
          }

          io?.to(`room:${roomId}`).emit("room:vip_entrance_alert", {
            userId: user.id,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            vipLevel: entryTitle,
            level: 20, // High level for max glow
            title: entryTitle,
            entryBanner: entryBannerText,
            entrySound: entrySoundClip,
            profileFrameStyle: entryFrameStyle,
          });

          const premiumAnnMsg: ChatMessage = {
            id: generateId(),
            type: MessageType.SYSTEM,
            senderId: "system",
            senderName: "💎 PREMIUM ENTRANCE",
            senderAvatarUrl: "",
            senderVip: user.vipLevel || VipLevel.NONE,
            senderVipLevelNumeric: user.vipLevelNumeric || 1,
            senderLevel: user.level || 1,
            content: `⚡⚡ [PREMIUM ENTRANCE] ${entryBannerText} ⚡⚡`,
            timestamp: new Date().toISOString(),
            reactions: {}
          };
          logs.push(premiumAnnMsg);
          messages.set(roomId, logs);
          io?.to(`room:${roomId}`).emit("message:received", premiumAnnMsg);
        } else if (user.vipLevelNumeric && user.vipLevelNumeric >= 1) {
          const vipConf = VIP_LEVELS.find(v => v.level === user.vipLevelNumeric) || {
            level: user.vipLevelNumeric,
            title: `VIP Level ${user.vipLevelNumeric}`,
            entryBanner: `🔥 VIP ${user.vipLevelNumeric} User Entered The Room 🔥`,
            entrySound: "bronze",
            profileFrameStyle: "border-[2.5px] border-yellow-500 animate-pulse"
          };
          
          io?.to(`room:${roomId}`).emit("room:vip_entrance_alert", {
            userId: user.id,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            vipLevel: `VIP ${user.vipLevelNumeric}`,
            level: user.vipLevelNumeric,
            title: vipConf.title,
            entryBanner: vipConf.entryBanner,
            entrySound: vipConf.entrySound,
            profileFrameStyle: vipConf.profileFrameStyle,
          });

          // Add a VIP announcement in the chat messages list
          const vipAnnMsg: ChatMessage = {
            id: generateId(),
            type: MessageType.SYSTEM,
            senderId: "system",
            senderName: "🌟 VIP ENTRANCE",
            senderAvatarUrl: "",
            senderVip: user.vipLevel || VipLevel.NONE,
            senderVipLevelNumeric: user.vipLevelNumeric,
            senderLevel: user.level || 1,
            content: `🔥 [VIP LEVEL ${user.vipLevelNumeric}] ${user.displayName} has entered the room! 🔥`,
            timestamp: new Date().toISOString(),
            reactions: {}
          };
          logs.push(vipAnnMsg);
          messages.set(roomId, logs);
          io?.to(`room:${roomId}`).emit("message:received", vipAnnMsg);
        } else if (isGlobalAdminUser(userId)) {
          io?.to(`room:${roomId}`).emit("room:vip_entrance_alert", {
            userId: user.id,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            vipLevel: "VIP 10",
            level: 10,
            title: "Ultimate Emperor Creator",
            entryBanner: "🔥 Ultimate Emperor Creator Entered 🔥",
            entrySound: "emperor",
            profileFrameStyle: "border-[4px] border-yellow-400 ring-4 ring-rose-600/35"
          });

          // Add a supreme announcement in the chat messages list
          const adminAnnMsg: ChatMessage = {
            id: generateId(),
            type: MessageType.SYSTEM,
            senderId: "system",
            senderName: "👑 SUPREME SYSTEM",
            senderAvatarUrl: "",
            senderVip: VipLevel.EMPEROR,
            senderVipLevelNumeric: 10,
            senderLevel: 95,
            content: `⚡👑 [SUPREME GOD ANNOUNCEMENT] 👑⚡ Ebadul VIP 10 has entered this room! Standard room limits are suspended! ⚡✨💥`,
            timestamp: new Date().toISOString(),
            reactions: {}
          };
          logs.push(adminAnnMsg);
          messages.set(roomId, logs);
          io?.to(`room:${roomId}`).emit("message:received", adminAnnMsg);
        }
      }
    });

    // JOIN ROOM OFFICIAL MEMBERSHIP SYSTEM
    socket.on("room:join_official", ({ roomId, userId }) => {
      if (!roomId || !userId) return;

      const user = users.get(userId);
      const room = rooms.get(roomId);
      if (!user || !room) {
        socket.emit("room:error", { error: "Invalid Room or User for Official Join" });
        return;
      }

      if (!room.members) {
        room.members = [];
      }

      if (!room.members.includes(userId)) {
        room.members.push(userId);
      }

      // Create beautiful announcement system message
      const joinOfficialMsg: ChatMessage = {
        id: generateId(),
        type: MessageType.SYSTEM,
        senderId: "system",
        senderName: "Membership",
        senderAvatarUrl: "",
        senderVip: user.vipLevel ?? VipLevel.NONE,
        senderLevel: user.level || 1,
        content: `🎉 ${user.displayName || user.username} has officially JOINED this Room's membership! 🤝👑✨`,
        timestamp: new Date().toISOString(),
        reactions: {}
      };

      const logs = messages.get(roomId) || [];
      logs.push(joinOfficialMsg);
      messages.set(roomId, logs);

      // Broadcast join message to everyone
      io?.to(`room:${roomId}`).emit("message:received", joinOfficialMsg);

      // Update room model state for all users
      broadcastRoomUpdate(roomId);
    });

    // DIRECT / CHANNEL REAL-TIME CHAT MESSAGE
    socket.on("message:send", ({ roomId, senderId, type, content }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const sender = users.get(senderId);
      if (!sender) return;

      // Check muted list on the room
      if (room.mutedUsers?.includes(senderId)) {
        socket.emit("room:error", { error: "You are muted in this room by administrators." });
        return;
      }

      const logs = messages.get(roomId) || [];
      const newMsg: ChatMessage = {
        id: generateId(),
        senderId: sender.id,
        senderName: sender.displayName,
        senderAvatarUrl: sender.avatarUrl,
        senderVip: sender.vipLevel,
        senderLevel: sender.level,
        type: type || MessageType.TEXT,
        content: content || "",
        timestamp: new Date().toISOString(),
        reactions: {}
      };

      logs.push(newMsg);
      messages.set(roomId, logs);

      // Broadcast to room
      io?.to(`room:${roomId}`).emit("message:received", newMsg);

      // Trigger server-side AI moderation/interaction
      if (type === MessageType.TEXT && !content.startsWith("/")) {
        triggerAiModeratorStream(roomId, newMsg);
      }
    });

    // SEAT MANAGEMENT: TAKE SEAT
    socket.on("seat:take", ({ roomId, userId, seatIndex, isMutedByUser }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const user = users.get(userId);
      if (!user) return;

      // Check global ban/suspension
      if (user.isPermanentlyBanned) {
        socket.emit("room:error", { error: "Your account has been permanently banned." });
        return;
      }
      if (user.suspendedUntil) {
        const suspendedUntilDate = new Date(user.suspendedUntil);
        if (suspendedUntilDate > new Date()) {
          socket.emit("room:error", { error: "Account suspended for 24 hours due to community guidelines violation." });
          return;
        }
      }

      const seat = room.seats.find(s => s.index === seatIndex);
      if (!seat) return;

      const isRoomAdmin = room.ownerId === userId || 
                          room.admins?.includes(userId) || 
                          room.moderators?.includes(userId) ||
                          isGlobalAdminUser(userId);

      if (seat.isLocked && !isRoomAdmin) {
        socket.emit("room:error", { error: "This seat is locked." });
        return;
      }

      // Check if user is already on another seat in the same room
      room.seats.forEach(s => {
        if (s.userId === userId) {
          s.userId = null;
          s.userProfile = null;
          s.streamActive = false;
        }
      });

      // Take seat
      seat.userId = userId;
      seat.userProfile = user;
      if (typeof isMutedByUser === "boolean") {
        seat.isMutedByUser = isMutedByUser;
      }
      seat.streamActive = !seat.isMutedByUser && !seat.isMutedByOwner;
      // Clear user from any other seat request
      if (seat.requestingUsers) {
        seat.requestingUsers = seat.requestingUsers.filter(uid => uid !== userId);
      } else {
        seat.requestingUsers = [];
      }

      // Broadcast room update
      broadcastRoomUpdate(roomId);
    });

    // SEAT MANAGEMENT: LEAVE SEAT
    socket.on("seat:leave", ({ roomId, userId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const seat = room.seats.find(s => s.userId === userId);
      if (seat) {
        seat.userId = null;
        seat.userProfile = null;
        seat.streamActive = false;
        broadcastRoomUpdate(roomId);
      }
    });

    // SEAT MANAGEMENT: TOGGLE MIC
    socket.on("seat:toggle_mic", ({ roomId, userId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const seat = room.seats.find(s => s.userId === userId);
      if (seat) {
        seat.isMutedByUser = !seat.isMutedByUser;
        seat.streamActive = !seat.isMutedByUser && !seat.isMutedByOwner;
        broadcastRoomUpdate(roomId);
      }
    });

    // SEAT MANAGEMENT: SET MIC STATUS
    socket.on("seat:set_mic", ({ roomId, userId, isMutedByUser }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const seat = room.seats.find(s => s.userId === userId);
      if (seat) {
        seat.isMutedByUser = isMutedByUser;
        seat.streamActive = !isMutedByUser && !seat.isMutedByOwner;
        broadcastRoomUpdate(roomId);
      }
    });

    // SEAT MANAGEMENT: LOCK / UNLOCK SEAT (Moderation)
    socket.on("seat:toggle_lock", ({ roomId, requesterId, seatIndex }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      // Only host or admin
      const isOwner = room.ownerId === requesterId;
      const isAdmin = room.admins?.includes(requesterId);
      if (!isOwner && !isAdmin) {
        socket.emit("room:error", { error: "Only admins and hosts can manage seat locks." });
        return;
      }

      const seat = room.seats.find(s => s.index === seatIndex);
      if (seat) {
        seat.isLocked = !seat.isLocked;
        // If locked and occupied, vacate the seat
        if (seat.isLocked && seat.userId) {
          seat.userId = null;
          seat.userProfile = null;
          seat.streamActive = false;
        }
        broadcastRoomUpdate(roomId);
      }
    });

    // SEAT MANAGEMENT: OWNER MUTE / UNMUTE SEAT
    socket.on("seat:toggle_owner_mute", ({ roomId, requesterId, seatIndex }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const isOwner = room.ownerId === requesterId;
      const isAdmin = room.admins?.includes(requesterId);
      if (!isOwner && !isAdmin) {
        socket.emit("room:error", { error: "Only admins and hosts can mute seats." });
        return;
      }

      const seat = room.seats.find(s => s.index === seatIndex);
      if (seat) {
        seat.isMutedByOwner = !seat.isMutedByOwner;
        seat.streamActive = !seat.isMutedByUser && !seat.isMutedByOwner;
        broadcastRoomUpdate(roomId);
      }
    });

    // SEAT REQUEST SYSTEM: USER REQUESTS SEAT
    socket.on("seat:request", ({ roomId, userId, seatIndex }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const seat = room.seats.find(s => s.index === seatIndex);
      if (!seat) return;

      if (!seat.requestingUsers) {
        seat.requestingUsers = [];
      }
      if (!seat.requestingUsers.includes(userId)) {
        seat.requestingUsers.push(userId);
      }
      broadcastRoomUpdate(roomId);
    });

    // SEAT REQUEST SYSTEM: ACCEPT/DECLINE REQUEST
    socket.on("seat:request_action", ({ roomId, adminUserId, seatIndex, targetUserId, action }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const isOwner = room.ownerId === adminUserId;
      const isAdmin = room.admins?.includes(adminUserId);
      if (!isOwner && !isAdmin) {
        socket.emit("room:error", { error: "Unauthorized." });
        return;
      }

      const seat = room.seats.find(s => s.index === seatIndex);
      if (!seat) return;

      if (seat.requestingUsers) {
        seat.requestingUsers = seat.requestingUsers.filter(uid => uid !== targetUserId);
      } else {
        seat.requestingUsers = [];
      }

      if (action === "accept") {
        const targetUser = users.get(targetUserId);
        if (targetUser) {
          // Remove from other seats first
          room.seats.forEach(s => {
            if (s.userId === targetUserId) {
              s.userId = null;
              s.userProfile = null;
              s.streamActive = false;
            }
          });

          seat.userId = targetUserId;
          seat.userProfile = targetUser;
          seat.streamActive = !seat.isMutedByUser && !seat.isMutedByOwner;
        }
      }

      broadcastRoomUpdate(roomId);
    });

    // SEAT INVITE SYSTEM: INVITE USER TO SEAT
    socket.on("seat:invite", ({ roomId, adminUserId, seatIndex, targetUserId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const isOwner = room.ownerId === adminUserId;
      const isAdmin = room.admins?.includes(adminUserId);
      if (!isOwner && !isAdmin) {
        socket.emit("room:error", { error: "Unauthorized." });
        return;
      }

      const adminUser = users.get(adminUserId);
      const targetSocketId = userSockets.get(targetUserId);
      if (targetSocketId && adminUser) {
        io?.to(targetSocketId).emit("seat:invite_received", {
          roomId,
          seatIndex,
          inviterId: adminUserId,
          inviterName: adminUser.displayName
        });
      }
    });

    // SEAT INVITE SYSTEM: REJECT INVITE
    socket.on("seat:invite_reject", ({ roomId, userId, inviterUserId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const user = users.get(userId);
      if (!user) return;

      const targetSocketId = userSockets.get(inviterUserId);
      if (targetSocketId) {
        io?.to(targetSocketId).emit("seat:invite_rejected", {
          roomId,
          userId,
          username: user.displayName || user.username || userId,
        });
      }
    });

    // SEAT INVITE SYSTEM: ACCEPT INVITE
    socket.on("seat:invite_accept", ({ roomId, userId, seatIndex }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const user = users.get(userId);
      if (!user) return;

      const seat = room.seats.find(s => s.index === seatIndex);
      if (!seat) return;

      // Remove from any other seats
      room.seats.forEach(s => {
        if (s.userId === userId) {
          s.userId = null;
          s.userProfile = null;
          s.streamActive = false;
        }
      });

      seat.userId = userId;
      seat.userProfile = user;
      seat.streamActive = !seat.isMutedByUser && !seat.isMutedByOwner;
      if (seat.requestingUsers) {
        seat.requestingUsers = seat.requestingUsers.filter(uid => uid !== userId);
      } else {
        seat.requestingUsers = [];
      }

      broadcastRoomUpdate(roomId);
    });

    // RTC SIGNALING (WEBRTC) RELAY
    socket.on("webrtc:signal", ({ toUserId, signal }) => {
      const fromUserId = socketToUser.get(socket.id);
      if (!fromUserId) return;

      const targetSocketId = userSockets.get(toUserId);
      if (targetSocketId) {
        io?.to(targetSocketId).emit("webrtc:signal", {
          fromUserId,
          signal
        });
      }
    });

    // DISCONNECT / LEAVE
    socket.on("room:leave", () => {
      const userId = socketToUser.get(socket.id) || (socket as any).userId;
      if (userId) {
        const pending = pendingDisconnects.get(userId);
        if (pending) {
          clearTimeout(pending.timeoutId);
          pendingDisconnects.delete(userId);
        }
      }
      handleDisconnectLeave(socket);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
      const userId = socketToUser.get(socket.id) || (socket as any).userId;
      const roomId = (socket as any).roomId;
      
      if (userId && roomId) {
        // Set a 10 seconds grace period to allow re-connection without losing seats or room presence
        console.log(`User ${userId} disconnected. Starting 10-second reconnect grace period...`);
        const timeoutId = setTimeout(() => {
          console.log(`Grace period expired for user ${userId}. Processing room leave...`);
          handleDisconnectLeave(socket);
          pendingDisconnects.delete(userId);
        }, 10000);
        pendingDisconnects.set(userId, { timeoutId, socketId: socket.id, roomId });
      } else {
        handleDisconnectLeave(socket);
      }
    });
  });

  // Periodically check mic seats for all rooms and update task progress (every 15 seconds)
  setInterval(() => {
    for (const room of rooms.values()) {
      let updated = false;
      let ownerOnMic = false;
      let regularUsersOnMicCount = 0;

      for (const seat of room.seats) {
        if (seat.userId) {
          if (seat.userId === room.ownerId) {
            ownerOnMic = true;
          } else {
            regularUsersOnMicCount++;
          }
        }
      }

      if (!room.roomTasks) {
        room.roomTasks = {
          newJoins: 0,
          newJoinsTarget: 5,
          micMinutes: 0,
          micMinutesTarget: 10,
          diamondsGifted: 0,
          diamondsGiftedTarget: 100,
          ownerMicMinutes: 0,
          ownerMicMinutesTarget: 10,
          completed: []
        };
      }

      // Owner mic task: +15 seconds (0.25 minutes) if owner is on mic
      if (ownerOnMic && !room.roomTasks.completed?.includes("owner")) {
        room.roomTasks.ownerMicMinutes = (room.roomTasks.ownerMicMinutes || 0) + 0.25;
        // Award direct Room EXP for owner sitting: e.g., +2 Room EXP per 15 seconds
        addRoomExp(room, 2);
        updated = true;

        if (room.roomTasks.ownerMicMinutes >= room.roomTasks.ownerMicMinutesTarget) {
          room.roomTasks.completed.push("owner");
          // Bonus EXP for completing owner mic task!
          addRoomExp(room, 80);
          
          const taskMsg = {
            id: "sys_task_" + generateId(),
            senderId: "system",
            senderName: "System",
            senderAvatarUrl: "",
            senderVip: VipLevel.NONE,
            senderLevel: 1,
            type: MessageType.SYSTEM,
            content: `🎯 Daily Owner Mic Task Completed! Owner sat for 10 minutes! (+80 Room EXP) 👑🎤`,
            timestamp: new Date().toISOString(),
            reactions: {}
          };
          let logs = messages.get(room.id) || [];
          logs.push(taskMsg as any);
          messages.set(room.id, logs);
          io?.to(`room:${room.id}`).emit("message:received", taskMsg);
        }
      }

      // Regular users mic task: +15 seconds (0.25 minutes) if at least one regular user is on mic
      if (regularUsersOnMicCount > 0 && !room.roomTasks.completed?.includes("mic")) {
        room.roomTasks.micMinutes = (room.roomTasks.micMinutes || 0) + 0.25;
        // Award direct Room EXP for users sitting: e.g., +1 Room EXP per 15 seconds
        addRoomExp(room, 1);
        updated = true;

        if (room.roomTasks.micMinutes >= room.roomTasks.micMinutesTarget) {
          room.roomTasks.completed.push("mic");
          // Bonus EXP for completing user mic task!
          addRoomExp(room, 80);
          
          const taskMsg = {
            id: "sys_task_" + generateId(),
            senderId: "system",
            senderName: "System",
            senderAvatarUrl: "",
            senderVip: VipLevel.NONE,
            senderLevel: 1,
            type: MessageType.SYSTEM,
            content: `🎯 Daily Mic Sitting Task Completed! Users sat for 10 minutes! (+80 Room EXP) 👥🎤`,
            timestamp: new Date().toISOString(),
            reactions: {}
          };
          let logs = messages.get(room.id) || [];
          logs.push(taskMsg as any);
          messages.set(room.id, logs);
          io?.to(`room:${room.id}`).emit("message:received", taskMsg);
        }
      }

      if (updated) {
        // Broadcast update so the state is synchronized in UI
        io?.to(`room:${room.id}`).emit("room:update", enrichRoom(room));
      }
    }
  }, 15000);
}

function handleDisconnectLeave(socket: any) {
  const roomId = socket.roomId;
  const userId = socket.userId;

  if (userId) {
    userSockets.delete(userId);
    socketToUser.delete(socket.id);
  }

  if (roomId && userId) {
    const room = rooms.get(roomId);
    if (room) {
      // Recalculate room online count
      const roomRefGroup = io?.sockets.adapter.rooms.get(`room:${roomId}`);
      room.onlineUsersCount = Math.max(0, roomRefGroup ? roomRefGroup.size : 0);

      // Vacate seats if the user was on mic
      const seat = room.seats.find(s => s.userId === userId);
      if (seat) {
        seat.userId = null;
        seat.userProfile = null;
        seat.streamActive = false;
      }

      // Check if this user was playing music
      if (room.musicState && room.musicState.isPlaying && room.musicState.startedBy === userId) {
        const stoppedSongName = room.musicState.currentSongName || "music";

        room.musicState.isPlaying = false;
        room.musicState.currentSongId = null;
        room.musicState.currentSongName = null;
        room.musicState.currentSongArtist = null;
        room.musicState.currentSongUrl = null;
        room.musicState.progressMs = 0;
        room.musicState.durationMs = 0;
        room.musicState.updatedAt = new Date().toISOString();
        room.musicState.startedBy = null;
        room.musicState.startedByName = null;

        const u = users.get(userId);
        const uName = u ? u.displayName : "The player";

        const systemMsg: ChatMessage = {
          id: generateId(),
          senderId: "system",
          senderName: "Music Station 📻",
          senderAvatarUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
          senderVip: VipLevel.NONE,
          senderLevel: 99,
          content: `⏸️ Music stopped automatically because ${uName} left the room.`,
          timestamp: new Date().toISOString(),
          type: MessageType.SYSTEM,
          reactions: {}
        };
        let logs = messages.get(roomId) || [];
        logs.push(systemMsg);
        messages.set(roomId, logs);
        io?.to(`room:${roomId}`).emit("message:received", systemMsg);
      }

      broadcastRoomUpdate(roomId);
    }
    
    socket.leave(`room:${roomId}`);
    socket.roomId = null;
    socket.userId = null;
  }
}

function broadcastRoomUpdate(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  // Compile real-time audience (all users currently connected to the room)
  const roomRefGroup = io?.sockets.adapter.rooms.get(`room:${roomId}`);
  const audienceList: any[] = [];
  if (roomRefGroup) {
    for (const socketId of roomRefGroup) {
      const uId = socketToUser.get(socketId);
      if (uId) {
        const u = users.get(uId);
        if (u) {
          audienceList.push({
            id: u.id,
            displayName: u.displayName,
            avatarUrl: u.avatarUrl,
            username: u.username || `user_${u.id.substring(0, 5)}`,
            isOnline: u.isOnline ?? true,
            vipLevel: u.vipLevel ?? 0,
            level: u.level ?? 1
          });
        }
      }
    }
  }

  // Deduplicate audience profiles by ID
  const uniqueAudience = Array.from(new Map(audienceList.map(item => [item.id, item])).values());
  
  // Compile official membership profiles
  const memberProfiles: any[] = [];
  if (room.members && Array.isArray(room.members)) {
    for (const memberId of room.members) {
      const u = users.get(memberId);
      if (u) {
        memberProfiles.push({
          id: u.id,
          displayName: u.displayName || u.username,
          avatarUrl: u.avatarUrl,
          username: u.username || `user_${u.id.substring(0, 5)}`,
          vipLevel: u.vipLevel ?? 0,
          level: u.level ?? 1
        });
      }
    }
  }

  // Find adjacent seat relationship effects
  const adjacentSeatEffects: any[] = [];
  const seats = room.seats;
  if (Array.isArray(seats)) {
    for (let i = 0; i < seats.length; i++) {
      const s1 = seats[i];
      if (i < seats.length - 1) {
        const s2 = seats[i + 1];
        if (s1.userId && s2.userId) {
          const key = [s1.userId, s2.userId].sort().join("_");
          const rel = relationships.get(key);
          if (rel && rel.type) {
            adjacentSeatEffects.push({
              seat1Index: s1.index,
              seat2Index: s2.index,
              user1Id: s1.userId,
              user2Id: s2.userId,
              type: rel.type,
              level: rel.level,
            });
          }
        }
      }
    }
  }

  const enriched = enrichRoom(room);
  const updatedRoom = {
    ...enriched,
    audience: uniqueAudience,
    memberProfiles,
    adjacentSeatEffects
  };

  // Sync to everyone in the room
  io?.to(`room:${roomId}`).emit("room:update", updatedRoom);
  saveDB();
}

// -------------------------------------------------------------------
// INTEGRATION VITE MIDDLEWARE (AND PRODUCTION SERVING)
// -------------------------------------------------------------------

// Global Express Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Express Error Catch:", err);
  res.status(500).json({ error: "Internal Server Error", message: err?.message || String(err) });
});

// Resilient Node Process Recovery
process.on("uncaughtException", (err) => {
  console.error("🔥 CRITICAL UNCAUGHT EXCEPTION RECOVERED:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("🔥 UNHANDLED REJECTION RECOVERED at:", promise, "reason:", reason);
});

async function startServer() {
  const server = http.createServer(app);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite developer assets mounted.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Static production assets mounted.");
  }

  setupSocketIO(server);

  // Initialize Supabase Storage Buckets
  await initSupabaseBuckets();

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`EbadulChat Fun full-stack server running synchronously with Socket.IO on http://0.0.0.0:${PORT}`);
  });
}

startServer();
