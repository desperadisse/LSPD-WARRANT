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

export interface Warrant {
  id: string;
  type: 'perquisition' | 'arrestation' | 'requisition';
  status: 'pending' | 'approved' | 'rejected';
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
}

// Ensure data directory exists
if (!fs.existsSync(DB_PATH)) {
  fs.mkdirSync(DB_PATH, { recursive: true });
}

// Initialize DB file if not exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ warrants: [] }, null, 2));
}

export function getWarrants(): Warrant[] {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const db = JSON.parse(data) as DatabaseSchema;
    return db.warrants;
  } catch (error) {
    console.error('Error reading DB:', error);
    return [];
  }
}

export function saveWarrant(warrant: Warrant): void {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const db = JSON.parse(data) as DatabaseSchema;
    const index = db.warrants.findIndex((w) => w.id === warrant.id);
    
    if (index >= 0) {
      db.warrants[index] = warrant;
    } else {
      db.warrants.push(warrant);
    }
    
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error('Error saving warrant:', error);
  }
}

export function getWarrantById(id: string): Warrant | undefined {
  const warrants = getWarrants();
  return warrants.find((w) => w.id === id);
}
