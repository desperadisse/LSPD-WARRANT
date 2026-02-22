import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_PATH, 'db.json');

export interface User {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  roles: string[]; // 'police', 'doj', or both
}

export interface RpUser {
  discordId: string;
  rpName: string;
}

export interface Warrant {
  id: string;
  type: 'perquisition' | 'arrestation' | 'requisition';
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  officerId: string;
  officerName: string;
  targetName: string;
  reason: string;
  details: string;
  location?: string; // For perquisition
  judgeId?: string;
  judgeName?: string;
  rejectionReason?: string;
  pdfToken?: string;
}

interface DatabaseSchema {
  warrants: Warrant[];
  users: RpUser[];
}

// Ensure data directory exists
if (!fs.existsSync(DB_PATH)) {
  fs.mkdirSync(DB_PATH, { recursive: true });
}

// Initialize DB file if not exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ warrants: [], users: [] }, null, 2));
}

function getDb(): DatabaseSchema {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const db = JSON.parse(data) as DatabaseSchema;
    if (!db.users) db.users = [];
    return db;
  } catch {
    return { warrants: [], users: [] };
  }
}

function saveDb(db: DatabaseSchema): void {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

export function getRpUser(discordId: string): RpUser | undefined {
  const db = getDb();
  return db.users.find((u) => u.discordId === discordId);
}

export function saveRpUser(user: RpUser): void {
  const db = getDb();
  const index = db.users.findIndex((u) => u.discordId === user.discordId);
  if (index >= 0) {
    db.users[index] = user;
  } else {
    db.users.push(user);
  }
  saveDb(db);
}

export function getWarrants(): Warrant[] {
  return getDb().warrants;
}

export function saveWarrant(warrant: Warrant): void {
  const db = getDb();
  const index = db.warrants.findIndex((w) => w.id === warrant.id);
  if (index >= 0) {
    db.warrants[index] = warrant;
  } else {
    db.warrants.push(warrant);
  }
  saveDb(db);
}

export function getWarrantById(id: string): Warrant | undefined {
  const warrants = getWarrants();
  return warrants.find((w) => w.id === id);
}
