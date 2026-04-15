import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trade } from '@/types';

const COLLECTION = 'trades';
const LOCAL_DB_KEY = 'tradejournal_local_db_trades';

// Helper for local browser database
function getLocalTrades(): Trade[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(LOCAL_DB_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalTrades(trades: Trade[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(trades));
}

// Ensure trades have unique IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

export async function addTrade(trade: Omit<Trade, 'id' | 'createdAt'>): Promise<string> {
  const newTrade = { ...trade, createdAt: new Date().toISOString() };
  let id = generateId();

  try {
    // 1. Try to save to Firebase Cloud Database
    const docRef = await addDoc(collection(db, COLLECTION), newTrade);
    id = docRef.id;
  } catch (error) {
    console.warn('Firebase DB error, falling back to Local Database:', error);
  }

  // 2. Always save locally as a backup / local database
  const localTrades = getLocalTrades();
  localTrades.push({ id, ...newTrade } as Trade);
  saveLocalTrades(localTrades);

  return id;
}

export async function updateTrade(id: string, trade: Partial<Trade>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, trade);
  } catch (error) {
    console.warn('Firebase DB error, falling back to Local Database:', error);
  }

  const localTrades = getLocalTrades();
  const index = localTrades.findIndex(t => t.id === id);
  if (index !== -1) {
    localTrades[index] = { ...localTrades[index], ...trade };
    saveLocalTrades(localTrades);
  }
}

export async function deleteTrade(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Firebase DB error, falling back to Local Database:', error);
  }

  const localTrades = getLocalTrades();
  saveLocalTrades(localTrades.filter(t => t.id !== id));
}

export async function getUserTrades(userId: string): Promise<Trade[]> {
  let cloudTrades: Trade[] = [];
  try {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    cloudTrades = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Trade[];
  } catch (error) {
    console.warn('Firebase DB error, falling back to Local Database:', error);
  }

  const localTrades = getLocalTrades().filter(t => t.userId === userId);

  // Merge the two databases. Cloud trades overwrite local ones with the same ID.
  const map = new Map<string, Trade>();
  localTrades.forEach(t => { if (t.id) map.set(t.id, t); });
  cloudTrades.forEach(t => { if (t.id) map.set(t.id, t); });

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function getTradesByDateRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<Trade[]> {
  const allTrades = await getUserTrades(userId);
  return allTrades.filter(t => t.date >= startDate && t.date <= endDate);
}
