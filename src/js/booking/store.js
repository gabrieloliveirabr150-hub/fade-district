// Async data layer for the demo. Every screen reads and writes through the
// functions below, backed today by a versioned localStorage key — so the
// day this becomes a real backend (Supabase, …), only this file changes.

import { seedAppointments } from './seed.js';
import { barberIsFree, resolveBarber } from './slots.js';
import { anyBarberId } from '../../data/barbers.js';
import { todayDateKey, timeToMinutes } from './time.js';

const STORAGE_KEY = 'fd-demo-v1';

let state = null;
let storageOK = true;

function clone(value) {
  return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function freshState() {
  return { appointments: seedAppointments(todayDateKey()), blocks: [] };
}

function persist() {
  if (!storageOK) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    storageOK = false; // keeps working in memory for the rest of the session
  }
}

function loadState() {
  if (state) return state;

  if (storageOK) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        state = JSON.parse(raw);
        return state;
      }
    } catch {
      storageOK = false;
    }
  }

  state = freshState();
  persist();
  return state;
}

function matchesFilters(record, { date, from, to, barberId } = {}) {
  if (date && record.date !== date) return false;
  if (from && record.date < from) return false;
  if (to && record.date > to) return false;
  if (barberId && barberId !== 'all' && record.barberId !== barberId) return false;
  return true;
}

function normalizePhone(phone) {
  return (phone ?? '').replace(/[^\d+]/g, '');
}

export async function listAppointments(filters = {}) {
  const current = loadState();
  return current.appointments.filter((appointment) => matchesFilters(appointment, filters)).map(clone);
}

export async function createAppointment(data) {
  const current = loadState();
  const startMinutes = timeToMinutes(data.start);
  const endMinutes = timeToMinutes(data.end);

  let barberId = data.barberId;
  if (barberId === anyBarberId) {
    barberId = resolveBarber({
      barberId,
      dateKey: data.date,
      startMinutes,
      serviceMinutes: endMinutes - startMinutes,
      appointments: current.appointments,
      blocks: current.blocks,
    });
  } else if (
    !barberIsFree({
      barberId,
      dateKey: data.date,
      startMinutes,
      endMinutes,
      appointments: current.appointments,
      blocks: current.blocks,
    })
  ) {
    barberId = null;
  }

  if (!barberId) {
    throw new Error("Ce créneau n'est plus disponible. Merci de choisir un autre horaire.");
  }

  const appointment = {
    ...data,
    barberId,
    id: createId(),
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  };

  current.appointments.push(appointment);
  persist();
  return clone(appointment);
}

export async function updateAppointment(id, patch) {
  const current = loadState();
  const appointment = current.appointments.find((item) => item.id === id);
  if (!appointment) throw new Error('Marquage introuvable.');

  Object.assign(appointment, patch);
  persist();
  return clone(appointment);
}

export async function listBlocks(filters = {}) {
  const current = loadState();
  return current.blocks.filter((block) => matchesFilters(block, filters)).map(clone);
}

export async function createBlock(data) {
  const current = loadState();
  const block = { ...data, id: createId(), createdAt: new Date().toISOString() };
  current.blocks.push(block);
  persist();
  return clone(block);
}

export async function listClients() {
  const current = loadState();
  const byPhone = new Map();

  for (const appointment of current.appointments) {
    if (appointment.status === 'cancelled') continue;

    const key = normalizePhone(appointment.phone);
    const client = byPhone.get(key) ?? {
      phone: appointment.phone,
      firstName: appointment.firstName,
      lastName: appointment.lastName,
      visits: 0,
      lastVisit: null,
    };

    client.visits += 1;
    if (!client.lastVisit || appointment.date > client.lastVisit) {
      client.lastVisit = appointment.date;
      client.firstName = appointment.firstName;
      client.lastName = appointment.lastName;
    }
    byPhone.set(key, client);
  }

  return [...byPhone.values()].sort((a, b) => (a.lastVisit < b.lastVisit ? 1 : -1));
}

export async function resetDemo() {
  state = freshState();
  persist();
  return clone(state);
}
