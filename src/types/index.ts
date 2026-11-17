export type Mood = 'idle' | 'happy' | 'hungry' | 'sleepy' | 'excited' | 'sleeping';
export type PetVisual = Mood | 'playing' | 'eating' | 'petted';
export interface Prefs { messages?: boolean; pet?: boolean; rewards?: boolean; pairing?: boolean }
export interface Profile {
  displayName: string; photoURL: string | null; roomId?: string | null; pendingRoomId?: string | null;
  ownPendingRoomId?: string | null; prefs?: Prefs;
}
export interface Person { uid: string; displayName: string; photoURL: string | null }
export type Equipped = { head: string | null; back: string | null; cape: string | null; companion: string | null };
export interface LastAction { by: string; byName: string; type: string; detail?: string | null; seq: number; atMs: number }
export interface PetDoc {
  name: string; fullness: number; happiness: number; energy: number; mood: Mood; sleeping: boolean;
  equipped: Equipped; lastAction: LastAction | null; seq: number; updatedAtMs: number;
}
export interface RoomDoc {
  status: 'pending' | 'active' | 'unlinked'; creatorUid: string; members: string[];
  memberProfiles?: Record<string, { displayName: string; photoURL: string | null }>;
  pendingJoin?: { uid: string; displayName: string; photoURL: string | null; requestedAt: number } | null;
  affection?: { points: number; cooldowns: Record<string, number> }; codeExpiresAt?: number;
}
export interface BedroomDoc {
  wallpaper: string; floor: string; bed: string; rug: string; lighting: string; window: string; theme: string;
  items: string[]; lastChange?: { by: string; byName: string; atMs: number; what: string } | null;
}
export interface InventoryDoc { foods: Record<string, number>; unlocked: string[] }
export interface Message { id: string; from: string; text: string; imageUrl?: string; createdAtMs: number | null; pending: boolean }
export interface Memory {
  id: string; authorId: string; authorName: string; imageUrl: string; storagePath: string;
  caption: string; note: string; date: string; createdAtMs: number | null;
}
export interface Activity { id: string; by: string; byName: string; type: string; detail?: string | null; atMs: number; points: number }
export type PresenceState = 'online' | 'recent' | 'offline';
export interface ActionResult { awarded: number; newUnlocks: string[] }
