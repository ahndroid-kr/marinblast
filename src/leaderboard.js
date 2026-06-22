import { createClient } from '@supabase/supabase-js';
import { LEADERBOARD_LIMIT } from './config.js';

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const LS_KEY = 'marine_blast_local_scores';

let client = null;
let enabled = false;

if (URL && KEY && !URL.includes('your-project')) {
  client = createClient(URL, KEY);
  enabled = true;
}

export function isRemoteEnabled() {
  return enabled;
}

export async function submitScore(name, score) {
  const cleanName = (name || 'Player').trim().slice(0, 12) || 'Player';
  saveLocal(cleanName, score);
  if (!enabled) return { local: true };
  try {
    const { error } = await client
      .from('marine_blast_scores')
      .insert({ name: cleanName, score });
    if (error) {
      console.warn('Supabase insert error:', error.message);
      return { error: error.message, local: true };
    }
    return { ok: true };
  } catch (err) {
    console.warn('Supabase exception:', err);
    return { error: String(err), local: true };
  }
}

export async function getTopScores(limit = LEADERBOARD_LIMIT) {
  if (!enabled) return getLocalScores(limit);
  try {
    const { data, error } = await client
      .from('marine_blast_scores')
      .select('name, score, created_at')
      .order('score', { ascending: false })
      .limit(limit);
    if (error) {
      console.warn('Supabase select error:', error.message);
      return getLocalScores(limit);
    }
    return data || [];
  } catch (err) {
    console.warn('Supabase exception:', err);
    return getLocalScores(limit);
  }
}

function saveLocal(name, score) {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.push({ name, score, created_at: new Date().toISOString() });
    arr.sort((a, b) => b.score - a.score);
    localStorage.setItem(LS_KEY, JSON.stringify(arr.slice(0, 50)));
  } catch (e) { /* noop */ }
}

function getLocalScores(limit) {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    return JSON.parse(raw).slice(0, limit);
  } catch (e) { return []; }
}
