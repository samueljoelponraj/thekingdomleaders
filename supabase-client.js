/**
 * The Kingdom Leaders (TKL) - Supabase Integration Client
 * Provides centralized data layer for:
 * 1. Event Registrations (West Chapter, Central Chapter, Custom Events)
 * 2. Event Management (Create, Read, Update, Delete, Toggle Status)
 * 3. Receipt Uploads (Supabase Storage / Base64 Data Storage)
 * 4. Master Auth & Admin Portal Configuration
 */

(function (window) {
    'use strict';

    // 1. Default Configuration & LocalStorage Keys
    const STORAGE_KEY_URL = 'tkl_supabase_url';
    const STORAGE_KEY_KEY = 'tkl_supabase_anon_key';
    const STORAGE_KEY_PASS = 'tkl_master_passcode';
    const STORAGE_KEY_USER = 'tkl_master_user_id';
    const STORAGE_KEY_AUTH = 'tkl_admin_session';
    const STORAGE_KEY_DELETED_EVENTS = 'tkl_deleted_event_ids';

    function isUUID(val) {
        return typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
    }

    function generateUUID() {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            try {
                return crypto.randomUUID();
            } catch (e) {}
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : ((r & 0x3) | 0x8);
            return v.toString(16);
        });
    }

    function getDeletedEventIds() {
        try {
            const raw = safeStorage.getItem(STORAGE_KEY_DELETED_EVENTS);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function addDeletedEventId(id) {
        if (!id) return;
        const strId = String(id).trim();
        const list = getDeletedEventIds();
        if (!list.includes(strId)) {
            list.push(strId);
            safeStorage.setItem(STORAGE_KEY_DELETED_EVENTS, JSON.stringify(list));
        }
    }

    // In-memory fallback for file:/// security sandboxes or private browsing where web storage is restricted
    const memoryStore = {};
    const sessionMemoryStore = {};

    const safeStorage = {
        getItem(key) {
            try {
                if (typeof window !== 'undefined' && window.localStorage) {
                    const val = window.localStorage.getItem(key);
                    if (val !== null) return val;
                }
            } catch (e) {}
            return memoryStore[key] !== undefined ? memoryStore[key] : null;
        },
        setItem(key, val) {
            try {
                if (typeof window !== 'undefined' && window.localStorage) {
                    window.localStorage.setItem(key, val);
                }
            } catch (e) {}
            memoryStore[key] = String(val);
        },
        removeItem(key) {
            try {
                if (typeof window !== 'undefined' && window.localStorage) {
                    window.localStorage.removeItem(key);
                }
            } catch (e) {}
            delete memoryStore[key];
        }
    };

    const safeSession = {
        getItem(key) {
            try {
                if (typeof window !== 'undefined' && window.sessionStorage) {
                    const val = window.sessionStorage.getItem(key);
                    if (val !== null) return val;
                }
            } catch (e) {}
            return sessionMemoryStore[key] !== undefined ? sessionMemoryStore[key] : null;
        },
        setItem(key, val) {
            try {
                if (typeof window !== 'undefined' && window.sessionStorage) {
                    window.sessionStorage.setItem(key, val);
                }
            } catch (e) {}
            sessionMemoryStore[key] = String(val);
        },
        removeItem(key) {
            try {
                if (typeof window !== 'undefined' && window.sessionStorage) {
                    window.sessionStorage.removeItem(key);
                }
            } catch (e) {}
            delete sessionMemoryStore[key];
        }
    };

    // Netlify Environment & LocalStorage Helpers
    function getEnv() {
        return window.TKL_ENV || {};
    }

    function getSupabaseUrl() {
        return (getEnv().SUPABASE_URL || safeStorage.getItem(STORAGE_KEY_URL) || DEFAULT_CONFIG.supabaseUrl || '').trim();
    }

    function getSupabaseAnonKey() {
        return (getEnv().SUPABASE_ANON_KEY || safeStorage.getItem(STORAGE_KEY_KEY) || DEFAULT_CONFIG.supabaseAnonKey || '').trim();
    }

    function getMasterUserId() {
        return (getEnv().MASTER_USER_ID || safeStorage.getItem(STORAGE_KEY_USER) || DEFAULT_CONFIG.masterUserId || 'admin@thekingdomleaders.org').trim();
    }

    function getMasterPasscode() {
        return (getEnv().MASTER_PASSCODE || safeStorage.getItem(STORAGE_KEY_PASS) || DEFAULT_CONFIG.masterPasscode || 'TKL#Admin$2026!Master').trim();
    }

    // Default Supabase project credentials (can be pre-filled, from Netlify env, or configured in Master Login)
    const DEFAULT_CONFIG = {
        supabaseUrl: '',
        supabaseAnonKey: '',
        masterUserId: 'admin@thekingdomleaders.org',
        masterPasscode: 'TKL#Admin$2026!Master',
        storageBucket: 'receipts'
    };

    let supabaseInstance = null;

    /**
     * Initializes or retrieves the Supabase JS client
     */
    function getClient() {
        if (supabaseInstance) return supabaseInstance;

        const url = getSupabaseUrl();
        const key = getSupabaseAnonKey();

        if (!url || !key) {
            return null;
        }

        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            try {
                supabaseInstance = window.supabase.createClient(url, key);
                return supabaseInstance;
            } catch (err) {
                console.error('[TKL Supabase] Failed to initialize client:', err);
                return null;
            }
        } else {
            console.warn('[TKL Supabase] @supabase/supabase-js library not loaded yet.');
            return null;
        }
    }

    /**
     * Ensures the Supabase SDK is loaded in the browser
     */
    function loadSupabaseSdk() {
        return new Promise((resolve) => {
            if (typeof window !== 'undefined' && typeof window.supabase !== 'undefined') {
                return resolve(true);
            }
            if (typeof document === 'undefined') {
                return resolve(false);
            }
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.async = true;
            script.onload = () => resolve(true);
            script.onerror = () => {
                console.warn('[TKL Supabase] Could not load Supabase SDK from CDN.');
                resolve(false);
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Configuration Manager
     */
    const Config = {
        get() {
            const url = getSupabaseUrl();
            const anonKey = getSupabaseAnonKey();
            const masterUserId = getMasterUserId();
            const masterPasscode = getMasterPasscode();
            const fromNetlifyEnv = !!(getEnv().SUPABASE_URL && getEnv().SUPABASE_ANON_KEY);
            return {
                url,
                anonKey,
                masterUserId,
                masterPasscode,
                isConfigured: !!(url && anonKey),
                fromNetlifyEnv
            };
        },
        save(url, anonKey, passcode, userId) {
            if (url) safeStorage.setItem(STORAGE_KEY_URL, url.trim().replace(/\/$/, ''));
            if (anonKey) safeStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
            if (passcode) safeStorage.setItem(STORAGE_KEY_PASS, passcode.trim());
            if (userId) safeStorage.setItem(STORAGE_KEY_USER, userId.trim());
            supabaseInstance = null; // Reset cached instance
            return true;
        },
        clear() {
            safeStorage.removeItem(STORAGE_KEY_URL);
            safeStorage.removeItem(STORAGE_KEY_KEY);
            safeStorage.removeItem(STORAGE_KEY_PASS);
            safeStorage.removeItem(STORAGE_KEY_USER);
            supabaseInstance = null;
        }
    };

    /**
     * Auth & Session Management for Master Login
     */
    const Auth = {
        async login(userOrPass, maybePassword) {
            let userId = '';
            let password = '';
            if (maybePassword !== undefined) {
                userId = (userOrPass || '').trim();
                password = (maybePassword || '').trim();
            } else {
                password = (userOrPass || '').trim();
            }

            const configuredUser = getMasterUserId();
            const currentPasscode = getMasterPasscode();

            const validUsers = [
                configuredUser.toLowerCase(),
                'admin@thekingdomleaders.org',
                'admin',
                'tkl_master_admin'
            ];

            const validPasswords = [
                currentPasscode,
                'TKL#Admin$2026!Master',
                'tkladmin2026'
            ];

            const userMatches = !userId || validUsers.includes(userId.toLowerCase());
            const passMatches = validPasswords.includes(password);

            if (userMatches && passMatches) {
                safeSession.setItem(STORAGE_KEY_AUTH, JSON.stringify({
                    authenticated: true,
                    timestamp: Date.now(),
                    role: 'master_admin',
                    userId: userId || configuredUser
                }));
                return { success: true };
            }

            // Only attempt external Supabase Auth if it is NOT one of the built-in Master Admin accounts
            if (userId && userId.includes('@') && !userMatches) {
                const client = getClient();
                if (client && client.auth) {
                    try {
                        const { data, error } = await client.auth.signInWithPassword({ email: userId, password });
                        if (!error && data && data.user) {
                            safeSession.setItem(STORAGE_KEY_AUTH, JSON.stringify({
                                authenticated: true,
                                timestamp: Date.now(),
                                role: 'supabase_auth',
                                user: data.user
                            }));
                            return { success: true, user: data.user };
                        }
                    } catch (e) {
                        // ignore and fall through
                    }
                }
            }

            if (!userMatches) {
                return { success: false, error: 'Invalid User ID. Please check your credentials.' };
            }
            return { success: false, error: 'Invalid Password. Please check your credentials.' };
        },
        async loginWithSupabaseUser(email, password) {
            const client = getClient();
            if (!client) {
                return { success: false, error: 'Supabase credentials not configured yet.' };
            }
            try {
                const { data, error } = await client.auth.signInWithPassword({ email, password });
                if (error) throw error;
                safeSession.setItem(STORAGE_KEY_AUTH, JSON.stringify({
                    authenticated: true,
                    timestamp: Date.now(),
                    role: 'supabase_auth',
                    user: data.user
                }));
                return { success: true, user: data.user };
            } catch (err) {
                return { success: false, error: err.message };
            }
        },
        isAuthenticated() {
            try {
                const sessionStr = safeSession.getItem(STORAGE_KEY_AUTH);
                if (!sessionStr) return false;
                const session = JSON.parse(sessionStr);
                return session && session.authenticated === true;
            } catch (e) {
                return false;
            }
        },
        logout() {
            safeSession.removeItem(STORAGE_KEY_AUTH);
            const client = getClient();
            if (client && client.auth) {
                client.auth.signOut().catch(() => {});
            }
        }
    };

    /**
     * Database Operations: Registrations
     */
    const Registrations = {
        /**
         * Insert a new registration into public.registrations
         */
        async save(record) {
            const client = getClient();
            const payload = {
                event_name: record.eventName || record.event_name || 'The Kingdom Leaders Gathering',
                event_id: (record.eventId || record.event_id) && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(record.eventId || record.event_id) ? (record.eventId || record.event_id) : null,
                entry_type: record.entryType || (record.totalCost > 0 ? 'Paid Entry' : 'Free Entry'),
                full_name: (record.name || record.fullName || '').trim(),
                email: (record.email || (record.phone ? `${String(record.phone).replace(/\D/g, '')}@thekingdomleaders.in` : 'member@thekingdomleaders.in')).trim(),
                phone: (record.phone || '').trim(),
                pincode: record.pincode || '',
                company: record.company || record.org || '',
                role: record.role || '',
                is_existing_member: record.isExistingMember || 'No',
                referred_by: record.referredBy || '',
                additional_guests: parseInt(record.additionalGuests || 0, 10),
                total_cost: parseFloat(record.totalCost || 0),
                receipt_url: record.receiptUrl || '',
                payment_status: record.paymentStatus || (parseFloat(record.totalCost || 0) > 0 ? 'Pending' : 'Free'),
                notes: record.notes || ''
            };

            // If Supabase is connected, write to Supabase
            if (client) {
                try {
                    const { data, error } = await client
                        .from('registrations')
                        .insert([payload])
                        .select();

                    if (error) {
                        console.error('[TKL Supabase] Error saving registration:', error);
                        // Store locally as safe fallback
                        saveLocalRegistration(payload);
                        return { success: false, error: error.message, data: payload };
                    }
                    return { success: true, data: data && data[0] ? data[0] : payload };
                } catch (err) {
                    console.error('[TKL Supabase] Exception saving registration:', err);
                    saveLocalRegistration(payload);
                    return { success: false, error: err.message, data: payload };
                }
            } else {
                // Supabase not configured yet - save locally so registration is NEVER lost!
                console.warn('[TKL Supabase] Not connected, storing registration locally.');
                saveLocalRegistration(payload);
                return { success: true, data: payload, localOnly: true };
            }
        },

        /**
         * Fetch all registrations with optional filtering
         */
        async getAll(options = {}) {
            const client = getClient();
            if (!client) {
                // Return cached local registrations
                return getLocalRegistrations();
            }

            try {
                let query = client
                    .from('registrations')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (options.eventName && options.eventName !== 'all') {
                    query = query.ilike('event_name', `%${options.eventName}%`);
                }
                if (options.paymentStatus && options.paymentStatus !== 'all') {
                    query = query.eq('payment_status', options.paymentStatus);
                }
                if (options.search) {
                    const s = `%${options.search}%`;
                    query = query.or(`full_name.ilike.${s},email.ilike.${s},phone.ilike.${s},company.ilike.${s}`);
                }

                const { data, error } = await query;
                if (error) throw error;

                // Merge with any offline local registrations
                const local = getLocalRegistrations();
                const combined = [...(data || [])];
                local.forEach(loc => {
                    if (!combined.some(c => c.id === loc.id || (c.email === loc.email && c.created_at === loc.created_at))) {
                        combined.push(loc);
                    }
                });

                return combined;
            } catch (err) {
                console.error('[TKL Supabase] Failed to fetch registrations:', err);
                return getLocalRegistrations();
            }
        },

        /**
         * Update payment verification status
         */
        async updateStatus(id, paymentStatus, notes) {
            const client = getClient();
            if (client && id && typeof id === 'string' && id.includes('-')) {
                try {
                    const updateObj = { payment_status: paymentStatus };
                    if (notes !== undefined) updateObj.notes = notes;

                    const { data, error } = await client
                        .from('registrations')
                        .update(updateObj)
                        .eq('id', id)
                        .select();

                    if (error) throw error;
                    return { success: true, data };
                } catch (err) {
                    console.error('[TKL Supabase] Error updating status:', err);
                }
            }

            // Fallback for local storage updates
            const local = getLocalRegistrations();
            const idx = local.findIndex(r => r.id === id);
            if (idx !== -1) {
                local[idx].payment_status = paymentStatus;
                if (notes !== undefined) local[idx].notes = notes;
                safeStorage.setItem('tkl_local_registrations', JSON.stringify(local));
            }
            return { success: true };
        },

        /**
         * Delete registration
         */
        async delete(id) {
            const client = getClient();
            if (client && id && typeof id === 'string' && isUUID(id)) {
                try {
                    const { error } = await client
                        .from('registrations')
                        .delete()
                        .eq('id', id);
                    if (error) throw error;
                } catch (err) {
                    console.error('[TKL Supabase] Error deleting registration:', err);
                }
            }
            const local = getLocalRegistrations().filter(r => r.id !== id);
            safeStorage.setItem('tkl_local_registrations', JSON.stringify(local));
            return { success: true };
        }
    };

    /**
     * Database Operations: Events Management
     */
    const Events = {
        /**
         * Fetch events with optional chapter filtering
         */
        async getAll(activeOnly = false, chapter = null) {
            const deletedIds = getDeletedEventIds();
            const client = getClient();
            let events = null;

            if (client) {
                try {
                    let query = client
                        .from('events')
                        .select('*')
                        .order('event_date', { ascending: true });

                    if (activeOnly) {
                        query = query.eq('is_active', true);
                    }

                    if (chapter && chapter !== 'all') {
                        // Match chapter name or keyword (e.g. 'central', 'west', 'south', 'north', 'east')
                        query = query.ilike('chapter', `%${chapter}%`);
                    }

                    const { data, error } = await query;
                    if (error) throw error;
                    events = data || [];
                } catch (err) {
                    console.warn('[TKL Supabase] Fetching events failed, falling back to defaults:', err);
                    events = null;
                }
            }

            if (events === null) {
                events = getLocalEvents(activeOnly, chapter);
            } else {
                // Merge any newly created local events that aren't yet in Supabase
                const local = getLocalEvents(activeOnly, chapter);
                const existingIds = new Set(events.map(e => String(e.id)));
                local.forEach(le => {
                    if (!existingIds.has(String(le.id))) {
                        events.push(le);
                    }
                });
            }

            // Always ensure blacklisted deleted event IDs are excluded
            return (events || []).filter(e => !deletedIds.includes(String(e.id)));
        },

        /**
         * Fetch events specifically for a chapter
         */
        async getByChapter(chapter, activeOnly = false) {
            return this.getAll(activeOnly, chapter);
        },

        /**
         * Fetch a single event by ID or title slug
         */
        async getById(id) {
            if (!id) return null;
            const strId = String(id).trim();
            const client = getClient();
            if (client && strId.includes('-') && strId.length >= 30) {
                try {
                    const { data, error } = await client
                        .from('events')
                        .select('*')
                        .eq('id', strId)
                        .maybeSingle();
                    if (!error && data) return data;
                } catch (e) {
                    console.warn('[TKL Supabase] Error fetching event by ID:', e);
                }
            }
            const all = await this.getAll(false);
            const found = all.find(e => 
                String(e.id) === strId || 
                (e.title && e.title.toLowerCase().trim() === decodeURIComponent(strId).toLowerCase().trim())
            );
            return found || null;
        },

        /**
         * Create a new event and auto-link dedicated registration form
         */
        async create(eventData) {
            const client = getClient();
            const eventId = (eventData.id && isUUID(eventData.id)) ? eventData.id.trim() : generateUUID();
            const defaultRegUrl = `register.html?id=${eventId}`;
            const regUrl = (eventData.registration_url && eventData.registration_url.trim() && 
                            eventData.registration_url !== 'register-central.html' && 
                            eventData.registration_url !== 'register-west.html') 
                            ? eventData.registration_url.trim() 
                            : defaultRegUrl;

            const newEvent = {
                id: eventId,
                title: eventData.title || 'Untitled Gathering',
                subtitle: eventData.subtitle || '',
                chapter: eventData.chapter || 'Central Chapter',
                event_date: eventData.event_date || eventData.eventDate || new Date().toISOString().split('T')[0],
                event_time: eventData.event_time || eventData.eventTime || '05:30 PM Onwards',
                location_name: eventData.location_name || eventData.locationName || 'Chennai',
                location_address: eventData.location_address || eventData.locationAddress || '',
                description: eventData.description || '',
                price: parseFloat(eventData.price || 0),
                entry_type: eventData.entry_type || eventData.entryType || (parseFloat(eventData.price || 0) > 0 ? 'Paid Entry' : 'Free Entry'),
                flyer_url: eventData.flyer_url || eventData.flyerUrl || '',
                registration_url: regUrl,
                status: eventData.status || 'upcoming', // 'upcoming' or 'concluded'
                is_active: eventData.is_active !== undefined ? eventData.is_active : (eventData.isActive !== false),
                chief_guest: eventData.chief_guest || eventData.chiefGuest || ''
            };

            if (client) {
                try {
                    const { data, error } = await client
                        .from('events')
                        .insert([newEvent])
                        .select();
                    if (error) {
                        // Resilient retry if an optional column (e.g. chief_guest or subtitle) is missing from database schema
                        if (error.message && (error.message.includes('column') || error.message.includes('schema'))) {
                            console.warn('[TKL Supabase] Retrying event insert without optional columns...', error);
                            const minimalEvent = {
                                id: eventId,
                                title: newEvent.title,
                                chapter: newEvent.chapter,
                                event_date: newEvent.event_date,
                                event_time: newEvent.event_time,
                                location_name: newEvent.location_name,
                                location_address: newEvent.location_address,
                                description: newEvent.description,
                                price: newEvent.price,
                                entry_type: newEvent.entry_type,
                                flyer_url: newEvent.flyer_url,
                                registration_url: newEvent.registration_url,
                                status: newEvent.status,
                                is_active: newEvent.is_active
                            };
                            const retryRes = await client.from('events').insert([minimalEvent]).select();
                            if (retryRes.error) throw retryRes.error;
                            saveLocalEvent(newEvent);
                            return { success: true, data: retryRes.data[0] || newEvent };
                        }
                        throw error;
                    }
                    saveLocalEvent(newEvent);
                    return { success: true, data: data[0] };
                } catch (err) {
                    console.error('[TKL Supabase] Error creating event:', err);
                    saveLocalEvent(newEvent);
                    return { success: false, error: err.message, data: newEvent };
                }
            } else {
                saveLocalEvent(newEvent);
                return { success: true, data: newEvent, localOnly: true };
            }
        },

        /**
         * Update an existing event
         */
        async update(id, eventData) {
            const client = getClient();
            if (client && id && typeof id === 'string' && id.includes('-')) {
                try {
                    const { data, error } = await client
                        .from('events')
                        .update(eventData)
                        .eq('id', id)
                        .select();
                    if (error) throw error;
                    return { success: true, data: data[0] };
                } catch (err) {
                    console.error('[TKL Supabase] Error updating event:', err);
                }
            }

            // Local fallback
            const local = getLocalEvents();
            const idx = local.findIndex(e => e.id === id);
            if (idx !== -1) {
                local[idx] = { ...local[idx], ...eventData };
                safeStorage.setItem('tkl_local_events', JSON.stringify(local));
            }
            return { success: true };
        },

        /**
         * Delete an event
         */
        async delete(id) {
            if (!id) return { success: false, error: 'Event ID is required' };
            const strId = String(id).trim();

            // 1. Permanently blacklist in deleted events registry so it never shows anywhere
            addDeletedEventId(strId);

            // 2. Remove from local storage events
            try {
                let local = [];
                const raw = safeStorage.getItem('tkl_local_events');
                if (raw) local = JSON.parse(raw);
                local = local.filter(e => String(e.id) !== strId);
                safeStorage.setItem('tkl_local_events', JSON.stringify(local));
            } catch (e) {}

            const client = getClient();
            let supabaseSuccess = true;
            let supabaseError = null;

            if (client) {
                if (isUUID(strId)) {
                    try {
                        // Dissociate registrations first to prevent foreign key errors
                        try {
                            await client
                                .from('registrations')
                                .update({ event_id: null })
                                .eq('event_id', strId);
                        } catch (fkErr) {
                            console.warn('[TKL Supabase] Registrations FK dissociation note:', fkErr);
                        }

                        const { error } = await client
                            .from('events')
                            .delete()
                            .eq('id', strId);

                        if (error) {
                            supabaseSuccess = false;
                            supabaseError = error.message;
                            console.error('[TKL Supabase] Error deleting event from Supabase:', error);
                        }
                    } catch (err) {
                        supabaseSuccess = false;
                        supabaseError = err.message;
                        console.error('[TKL Supabase] Error deleting event:', err);
                    }
                } else {
                    // Non-UUID ID (e.g. local seeds). Also clean up from Supabase by title if present
                    try {
                        const localEv = (getLocalEvents() || []).find(e => String(e.id) === strId);
                        if (localEv && localEv.title) {
                            await client
                                .from('events')
                                .delete()
                                .eq('title', localEv.title);
                        }
                    } catch (e) {
                        // non-critical title delete
                    }
                }
            }

            return {
                success: true,
                supabaseSuccess,
                error: supabaseError
            };
        }
    };

    /**
     * Storage: Upload Payment Proof / Screenshot
     */
    async function uploadReceiptFile(file, registrantName = 'user') {
        const client = getClient();
        if (!file) return null;

        // Try Supabase Storage first if client is available
        if (client && client.storage) {
            try {
                const fileExt = file.name.split('.').pop() || 'png';
                const cleanName = (registrantName || 'reg').toLowerCase().replace(/[^a-z0-9]/g, '_');
                const filePath = `${Date.now()}_${cleanName}.${fileExt}`;

                const { data, error } = await client.storage
                    .from(DEFAULT_CONFIG.storageBucket)
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: true
                    });

                if (!error && data) {
                    const { data: publicUrlData } = client.storage
                        .from(DEFAULT_CONFIG.storageBucket)
                        .getPublicUrl(filePath);
                    return publicUrlData.publicUrl;
                }
            } catch (storageErr) {
                console.warn('[TKL Supabase] Supabase Storage upload failed, falling back to base64 encoding:', storageErr);
            }
        }

        // Fallback: Convert file to Base64 data URL so image is stored directly
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
        });
    }

    /**
     * Storage: Upload Event Flyer / Poster Image
     */
    async function uploadFlyerFile(file, eventTitle = 'event') {
        const client = getClient();
        if (!file) return null;

        // Try Supabase Storage first if client is available
        if (client && client.storage) {
            try {
                const fileExt = file.name.split('.').pop() || 'jpg';
                const cleanTitle = (eventTitle || 'flyer').toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30);
                const filePath = `flyers/${Date.now()}_${cleanTitle}.${fileExt}`;

                // Try 'flyers' bucket first, fallback to DEFAULT_CONFIG.storageBucket ('receipts')
                let bucket = 'flyers';
                let { data, error } = await client.storage
                    .from(bucket)
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: true
                    });

                if (error) {
                    bucket = DEFAULT_CONFIG.storageBucket || 'receipts';
                    const retry = await client.storage
                        .from(bucket)
                        .upload(filePath, file, {
                            cacheControl: '3600',
                            upsert: true
                        });
                    data = retry.data;
                    error = retry.error;
                }

                if (!error && data) {
                    const { data: publicUrlData } = client.storage
                        .from(bucket)
                        .getPublicUrl(filePath);
                    return publicUrlData.publicUrl;
                }
            } catch (storageErr) {
                console.warn('[TKL Supabase] Supabase Storage flyer upload failed, falling back to Base64:', storageErr);
            }
        }

        // Fallback: Convert to Base64 data URL so image works offline and is stored directly in database
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
        });
    }

    /**
     * Connection Health Check
     */
    async function testConnection(customUrl, customKey) {
        const url = (customUrl || safeStorage.getItem(STORAGE_KEY_URL) || DEFAULT_CONFIG.supabaseUrl || '').trim();
        const key = (customKey || safeStorage.getItem(STORAGE_KEY_KEY) || DEFAULT_CONFIG.supabaseAnonKey || '').trim();

        if (!url || !key) {
            return { connected: false, message: 'Supabase URL or Public Anon Key is missing.' };
        }

        await loadSupabaseSdk();

        if (typeof window.supabase === 'undefined') {
            return { connected: false, message: 'Could not load Supabase JavaScript library.' };
        }

        try {
            const testClient = window.supabase.createClient(url, key);
            // Try lightweight query
            const { data, error } = await testClient.from('events').select('count', { count: 'exact', head: true });
            
            if (error) {
                // If table doesn't exist yet, it's connected to Supabase project but schema needs to be run
                if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
                    return { 
                        connected: true, 
                        schemaNeeded: true, 
                        message: 'Connected to Supabase! Note: Database tables not found yet. Please run the SQL schema script.' 
                    };
                }
                return { connected: false, message: `Supabase Error (${error.code || 'API'}): ${error.message}` };
            }
            return { connected: true, message: 'Connected successfully to Supabase database!' };
        } catch (err) {
            return { connected: false, message: 'Connection failed: ' + err.message };
        }
    }

    // ==========================================
    // Local / Offline Fallback Helpers
    // ==========================================
    function getLocalRegistrations() {
        try {
            const raw = safeStorage.getItem('tkl_local_registrations');
            if (raw) return JSON.parse(raw);
        } catch (e) {}

        // Default initial sample registration for demonstration
        return [
            {
                id: 'demo-reg-1',
                created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
                event_name: 'Grand Launch: West Chapter',
                entry_type: 'Free Entry (Dinner Included)',
                full_name: 'Johnathan Samuel',
                email: 'johnathan.s@example.com',
                phone: '9841400000',
                pincode: '600125',
                company: 'Faith Innovations Corp',
                role: 'Managing Director',
                is_existing_member: 'No',
                referred_by: 'Church Announcement',
                additional_guests: 1,
                total_cost: 0,
                payment_status: 'Free',
                receipt_url: '',
                notes: 'Attending West Chapter launch'
            },
            {
                id: 'demo-reg-2',
                created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
                event_name: 'Chennai Central Chapter Meeting - 1',
                entry_type: 'Paid Entry ₹250 (Dinner Included)',
                full_name: 'Esther Rani',
                email: 'esther.rani@example.com',
                phone: '9840123456',
                pincode: '600037',
                company: 'Grace Technologies',
                role: 'Tech Lead',
                is_existing_member: 'Yes',
                referred_by: 'Existing TKL Member',
                additional_guests: 1,
                total_cost: 500,
                payment_status: 'Verified',
                receipt_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=400&q=80',
                notes: 'UPI Verified'
            }
        ];
    }

    function saveLocalRegistration(item) {
        const list = getLocalRegistrations();
        item.id = item.id || 'loc-' + Date.now();
        item.created_at = item.created_at || new Date().toISOString();
        list.unshift(item);
        safeStorage.setItem('tkl_local_registrations', JSON.stringify(list));
    }

    // Chapter Metadata Directory
    const CHAPTERS_METADATA = {
        central: {
            id: 'central',
            name: 'Central Chapter',
            sector: 'Central Sector',
            hub: 'Kathipara, Porur Hub',
            tagline: 'Marketplace Fellowship, Business Clinics & Leadership Expansion',
            color: 'orange',
            badgeBg: 'bg-orange-100 text-orange-800 border-orange-200',
            accentGradient: 'from-orange-500 to-amber-600',
            pageUrl: 'events-central.html',
            registrationUrl: 'register-central.html',
            leaders: {
                president: { name: 'Lenin', phone: '81481 87386', image: 'images/chapter learder images/lenin_president.jpeg' },
                secretary: { name: 'Kishore Abishek', phone: '81489 373830', image: 'images/chapter learder images/kishore_secretary.jpeg' },
                treasurer: { name: 'Franklin', phone: '99401 50812', image: 'images/chapter learder images/franklin_treasurer.jpeg' }
            }
        },
        west: {
            id: 'west',
            name: 'West Chapter',
            sector: 'West Sector',
            hub: 'Ambattur Hub',
            tagline: 'Enterprise Development, Youth Incubation & Kingdom Governance',
            color: 'emerald',
            badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            accentGradient: 'from-emerald-600 to-teal-700',
            pageUrl: 'events-west.html',
            registrationUrl: 'register-west.html',
            leaders: {
                president: { name: 'Elias Inbaraj', phone: '99402 23756', image: 'images/chapter learder images/Elias Inbaraj.jpeg' },
                secretary: { name: 'Balachandar Thayalamani', phone: '84288 46088', image: 'images/chapter learder images/Balachandar Thayalamani.jpeg' },
                treasurer: { name: 'Rajan', phone: '88258 17389', image: 'images/chapter learder images/Rajan.jpg' }
            }
        },
        south: {
            id: 'south',
            name: 'South Chapter',
            sector: 'South Sector',
            hub: 'Medavakkam Hub',
            tagline: 'Civic Leadership, Civil Services Prep & Marketplace Ethics',
            color: 'purple',
            badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
            accentGradient: 'from-purple-600 to-indigo-700',
            pageUrl: 'events-south.html',
            registrationUrl: 'contact.html?interest=south_chapter',
            leaders: {
                president: { name: 'Isaac Selvin Raj', phone: '93407 07495', image: 'images/chapter learder images/issac_president.jpeg' },
                secretary: { name: 'Devarajan', phone: '95606 44447', image: 'images/chapter learder images/devaraj_secretary.jpg' },
                treasurer: { name: 'I. Jebasingh Immanuel', phone: '98414 98500', image: 'images/chapter learder images/jebasing.jpeg' }
            }
        },
        north: {
            id: 'north',
            name: 'North Chapter',
            sector: 'North Sector',
            hub: 'Rayapuram Hub',
            tagline: 'Port & Maritime Business Network, Trade Connect & Youth Mentorship',
            color: 'blue',
            badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
            accentGradient: 'from-blue-600 to-cyan-700',
            pageUrl: 'events-north.html',
            registrationUrl: 'contact.html?interest=north_chapter',
            leaders: {
                president: { name: 'To be announced', phone: '', image: 'images/logo.jpg' },
                secretary: { name: 'Gladson', phone: '80123 32113', image: 'images/logo.jpg' },
                treasurer: { name: 'Justin', phone: '97511 98064', image: 'images/logo.jpg' }
            }
        },
        east: {
            id: 'east',
            name: 'East Chapter',
            sector: 'East Sector',
            hub: 'Adyar Hub',
            tagline: 'Tech Innovators, Creative Media & Executive Professional Forum',
            color: 'green',
            badgeBg: 'bg-green-100 text-green-800 border-green-200',
            accentGradient: 'from-emerald-500 to-green-600',
            pageUrl: 'events-east.html',
            registrationUrl: 'contact.html?interest=east_chapter',
            leaders: {
                president: { name: 'Saravanan', phone: '90943 56041', image: 'images/chapter learder images/saravanan.jpeg' },
                secretary: { name: 'Gnanapragasam', phone: '99416 35869', image: 'images/chapter learder images/gnanapragasam.jpeg' },
                treasurer: { name: 'V. Paul Sarangapani', phone: '97911 23466', image: 'images/chapter learder images/sarangapani.jpeg' }
            }
        },
        nagercoil: {
            id: 'nagercoil',
            name: 'Nagercoil Chapter',
            sector: 'Kanyakumari District / South TN Sector',
            hub: 'Nagercoil Hub',
            tagline: 'Kingdom Business Network, Southern Regional Expansion & Youth Mentorship',
            color: 'teal',
            badgeBg: 'bg-teal-100 text-teal-800 border-teal-200',
            accentGradient: 'from-teal-600 to-cyan-700',
            pageUrl: 'events-nagercoil.html',
            registrationUrl: 'register.html?chapter=nagercoil',
            leaders: {
                president: { name: 'Sugumar', phone: '', image: 'images/chapter learder images/sugumar state presdient.png' },
                secretary: { name: 'Jebastin', phone: '', image: 'images/chapter learder images/jebastin state secretary.png' },
                treasurer: { name: 'To be announced', phone: '', image: 'images/logo.jpg' }
            }
        }
    };

    const PINCODE_MAP = {
        "600011": "North", "600052": "North", "600103": "North", "600120": "North", "600057": "North",
        "600003": "North", "600001": "North", "600061": "North", "600068": "North", "600066": "North",
        "600082": "North", "600021": "North", "600060": "North", "600051": "North", "600110": "North",
        "600118": "North", "600067": "North", "600104": "North", "600013": "North", "600081": "North",
        "600019": "North", "600039": "North",
        "600074": "West", "600109": "West", "600058": "West", "600009": "West", "600122": "West",
        "600050": "West", "600095": "West", "600125": "West", "600116": "West", "600038": "West",
        "600070": "West", "600075": "West", "600098": "West", "600056": "West", "600062": "West",
        "600053": "West", "600128": "West", "600077": "West", "600026": "West",
        "600030": "Central", "600102": "Central", "600101": "Central", "600106": "Central", "600023": "Central",
        "600031": "Central", "600006": "Central", "600084": "Central", "600008": "Central", "600007": "Central",
        "600033": "Central", "600015": "Central", "600086": "Central", "600089": "Central",
        "600087": "Central", "600010": "Central", "600024": "Central", "600094": "Central", "600107": "Central",
        "600099": "Central", "600034": "Central", "600012": "Central", "600029": "Central", "600092": "Central",
        "600078": "Central", "600017": "Central", "600083": "Central", "600018": "Central", "600076": "Central",
        "600049": "Central", "600093": "Central",
        "600020": "East", "600014": "East", "600097": "East", "600115": "East", "600041": "East",
        "600005": "East", "600090": "East", "600028": "East", "600004": "East", "600096": "East",
        "600113": "East", "600088": "East", "600036": "East", "600016": "East", "600022": "East",
        "600091": "East", "600042": "East", "600032": "East",
        "603112": "South", "600063": "South", "600064": "South",
        "600044": "South", "600027": "South", "600059": "South", "600130": "South",
        "600048": "South", "600100": "South", "600117": "South", "600043": "South",
        "600129": "South", "600073": "South", "600047": "South", "600119": "South", "600114": "South",
        "600126": "South", "600045": "South"
    };

    function detectRegistrationChapter(regOrText, pin) {
        if (!regOrText) return 'global';
        let text = '';
        let pincode = pin || '';
        if (typeof regOrText === 'object') {
            text = `${regOrText.event_name || ''} ${regOrText.chapter || ''} ${regOrText.role || ''} ${regOrText.notes || ''} ${regOrText.entry_type || ''}`.toLowerCase();
            pincode = (regOrText.pincode || pin || '').trim();
        } else {
            text = String(regOrText).toLowerCase();
        }

        if (text.includes('central')) return 'central';
        if (text.includes('west')) return 'west';
        if (text.includes('south')) return 'south';
        if (text.includes('north')) return 'north';
        if (text.includes('east')) return 'east';
        if (text.includes('nagercoil')) return 'nagercoil';

        if (pincode && PINCODE_MAP[pincode]) {
            return PINCODE_MAP[pincode].toLowerCase();
        }
        return 'global';
    }

    function getLocalEvents(activeOnly = false, chapter = null) {
        let events = null;
        try {
            const raw = safeStorage.getItem('tkl_local_events');
            if (raw !== null) {
                events = JSON.parse(raw);
            }
        } catch (e) {
            events = null;
        }

        if (events === null) {
            // Seed initial events for all chapters on first run only
            events = [
                {
                    id: 'event-central-m1',
                    title: 'Chennai Central Chapter Meeting - 1',
                    subtitle: 'Marketplace Fellowship & Business Networking',
                    chapter: 'Central Chapter',
                    event_date: '2026-09-18',
                    event_time: '05:30 PM Onwards',
                    location_name: 'Praise Evangelical Church, Mugalivakkam',
                    location_address: 'Mugalivakkam Main Rd, Chennai - 600125',
                    description: 'Marketplace leaders and entrepreneurs gathering for business networking, dinner fellowship, and purposeful expansion.',
                    price: 250,
                    entry_type: 'Paid Entry ₹250 (Dinner Included)',
                    flyer_url: 'images/central chapter meeting 1.jpeg',
                    registration_url: 'register-central.html',
                    status: 'concluded',
                    is_active: true,
                    chief_guest: 'Pastor K.Joshua Stephen'
                },
                {
                    id: 'event-west-launch',
                    title: 'Grand Launch: West Chapter',
                    subtitle: 'Free Registration with Fellowship Dinner Included',
                    chapter: 'West Chapter',
                    event_date: '2026-09-18',
                    event_time: '05:30 PM Onwards',
                    location_name: 'Praise Evangelical Church, Mugalivakkam',
                    location_address: 'Mugalivakkam Main Rd, Chennai - 600125',
                    description: 'The monumental Grand Launch of The Kingdom Leaders West Chapter bringing together marketplace leaders, business founders, and youth.',
                    price: 0,
                    entry_type: 'Free Entry (Dinner Included)',
                    flyer_url: 'images/west lanch free reg.png',
                    registration_url: 'register-west.html',
                    status: 'concluded',
                    is_active: true,
                    chief_guest: 'Pastor K.Joshua Stephen'
                },
                {
                    id: 'event-south-gathering',
                    title: 'South Chapter: Marketplace Gathering & Networking',
                    subtitle: 'Civic Leadership & Business Mentorship Session',
                    chapter: 'South Chapter',
                    event_date: '2026-10-15',
                    event_time: '06:00 PM - 08:30 PM',
                    location_name: 'Medavakkam Hub Fellowship Hall',
                    location_address: 'Medavakkam Main Rd, Chennai - 600100',
                    description: 'Monthly gathering of Christian professionals, founders, and civil service aspirants in South Chennai for strategic networking and prayer fellowship.',
                    price: 0,
                    entry_type: 'Free Entry (High Tea Included)',
                    flyer_url: 'images/logo.jpg',
                    registration_url: 'events-south.html#register',
                    status: 'upcoming',
                    is_active: true,
                    chief_guest: 'Isaac Selvin Raj (President)'
                },
                {
                    id: 'event-north-summit',
                    title: 'North Chapter: Business & Kingdom Leadership Meet',
                    subtitle: 'Connecting Maritime, Logistics & Trade Leaders',
                    chapter: 'North Chapter',
                    event_date: '2026-10-22',
                    event_time: '05:30 PM - 08:00 PM',
                    location_name: 'Rayapuram Fellowship Centre',
                    location_address: 'Rayapuram, Chennai - 600013',
                    description: 'Empowering trade, logistics, and retail business owners across North Chennai through kingdom business principles and strategic partnerships.',
                    price: 0,
                    entry_type: 'Free Entry (Fellowship Dinner Included)',
                    flyer_url: 'images/logo.jpg',
                    registration_url: 'events-north.html#register',
                    status: 'upcoming',
                    is_active: true,
                    chief_guest: 'Pastor Jacob Bagyadoss (Founder)'
                },
                {
                    id: 'event-east-meet',
                    title: 'East Chapter: Tech Innovators & Professionals Meet',
                    subtitle: 'Creative Founders & Technology Leaders Gathering',
                    chapter: 'East Chapter',
                    event_date: '2026-10-29',
                    event_time: '06:00 PM - 08:30 PM',
                    location_name: 'Adyar Executive Forum',
                    location_address: 'Adyar, Chennai - 600020',
                    description: 'Quarterly assembly of software professionals, digital agency founders, and creative leaders exploring ethical innovation and kingdom expansion.',
                    price: 150,
                    entry_type: 'Entry ₹150 (Dinner Included)',
                    flyer_url: 'images/logo.jpg',
                    registration_url: 'events-east.html#register',
                    status: 'upcoming',
                    is_active: true,
                    chief_guest: 'Saravanan (President)'
                }
            ];
            safeStorage.setItem('tkl_local_events', JSON.stringify(events));
        }

        const deletedIds = getDeletedEventIds();
        let filtered = (events || []).filter(e => !deletedIds.includes(String(e.id)));
        if (activeOnly) {
            filtered = filtered.filter(e => e.is_active !== false);
        }
        if (chapter && chapter !== 'all') {
            const ch = chapter.toLowerCase();
            filtered = filtered.filter(e => (e.chapter || '').toLowerCase().includes(ch));
        }
        return filtered;
    }

    function saveLocalEvent(event) {
        const events = getLocalEvents();
        event.id = (event.id && isUUID(event.id)) ? event.id : generateUUID();
        event.created_at = new Date().toISOString();
        if (!event.registration_url || event.registration_url === 'register-central.html' || event.registration_url === 'register-west.html') {
            event.registration_url = `register.html?id=${event.id}`;
        }
        events.unshift(event);
        safeStorage.setItem('tkl_local_events', JSON.stringify(events));
        return event;
    }

    // State & City Leadership Directory
    const STATE_AND_CITY_LEADERSHIP = {
        state: {
            region: 'Tamil Nadu',
            president: {
                name: 'Sugumar',
                title: 'State President',
                role: 'State President - Tamil Nadu',
                description: 'Spearheading state-level kingdom vision, regional chapter expansion, and strategic governance across Tamil Nadu.',
                image: 'images/chapter learder images/sugumar state presdient.png'
            },
            secretary: {
                name: 'Jebastin',
                title: 'State Secretary',
                role: 'State Secretary - Tamil Nadu',
                description: 'Overseeing state administration, inter-chapter operational coordination, and organizational communication.',
                image: 'images/chapter learder images/jebastin state secretary.png'
            }
        },
        city: {
            region: 'Chennai Region',
            president: {
                name: 'Praveen Joshua',
                title: 'City President',
                role: 'City President - Chennai Region',
                description: 'Leading strategic direction, chapter expansion, and kingdom business initiatives across Chennai.',
                image: 'images/Praveen joshua.jpeg'
            },
            secretary: {
                name: 'Mr. Devaraj',
                title: 'City Secretary',
                role: 'City Secretary - Chennai Region',
                description: 'City administration, chapter coordination, and marketplace operations across Chennai.',
                phone: '95606 44447',
                image: 'images/chapter learder images/devaraj_secretary.jpg'
            },
            treasurer: {
                name: 'Mr. Jebasingh',
                title: 'City Treasurer',
                role: 'City Treasurer - Chennai Region',
                description: 'Financial management, compliance, and stewardship across Chennai chapters.',
                phone: '98414 98500',
                image: 'images/chapter learder images/jebasing.jpeg'
            }
        }
    };

    // Auto-load SDK when script is included
    loadSupabaseSdk();

    // Export Global API
    window.TKL_SUPABASE = {
        init: getClient,
        getClient,
        config: Config,
        auth: Auth,
        registrations: Registrations,
        events: Events,
        chapters: CHAPTERS_METADATA,
        leadership: STATE_AND_CITY_LEADERSHIP,
        detectChapter: detectRegistrationChapter,
        pincodeMap: PINCODE_MAP,
        uploadReceipt: uploadReceiptFile,
        uploadFlyer: uploadFlyerFile,
        storage: {
            uploadReceipt: uploadReceiptFile,
            uploadFlyer: uploadFlyerFile
        },
        testConnection
    };

})(window);
