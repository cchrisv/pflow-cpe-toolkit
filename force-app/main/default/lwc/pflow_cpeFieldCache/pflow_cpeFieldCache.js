/**
 * Module-level field metadata cache shared across all CPE field picker instances.
 * One Apex call per object regardless of how many pickers are on screen.
 *
 * Usage:
 *   import { fetchFields, iconForFieldType } from 'c/pflow_cpeFieldCache';
 *   const fields = await fetchFields('Account');
 */
import getObjectFields from '@salesforce/apex/PFlowCpeChoiceEngineController.getObjectFields';

const MAX_CACHE_SIZE = 10;

/** @type {Map<string, {name:string, label:string, type:string, relationshipName:string}[]>} */
const _cache = new Map();

/** @type {Map<string, Promise>} */
const _inflight = new Map();

/** @type {string[]} LRU order — most-recent at end */
const _lru = [];

function touchLru(key) {
    const idx = _lru.indexOf(key);
    if (idx > -1) {
        _lru.splice(idx, 1);
    }
    _lru.push(key);
    while (_lru.length > MAX_CACHE_SIZE) {
        const evict = _lru.shift();
        _cache.delete(evict);
    }
}

/**
 * Fetch fields for an SObject, returning cached results when available.
 * @param {string} objectApiName
 * @returns {Promise<{name:string, label:string, type:string, relationshipName:string}[]>}
 */
export function fetchFields(objectApiName) {
    if (!objectApiName) {
        return Promise.resolve([]);
    }
    const key = objectApiName.trim().toLowerCase();
    if (_cache.has(key)) {
        touchLru(key);
        return Promise.resolve(_cache.get(key));
    }
    if (_inflight.has(key)) {
        return _inflight.get(key);
    }
    const p = getObjectFields({ objectName: objectApiName.trim() })
        .then((fields) => {
            const result = Array.isArray(fields) ? fields : [];
            _cache.set(key, result);
            touchLru(key);
            _inflight.delete(key);
            return result;
        })
        .catch(() => {
            _inflight.delete(key);
            return [];
        });
    _inflight.set(key, p);
    return p;
}

/** Clear all cached data (useful when switching objects). */
export function clearCache() {
    _cache.clear();
    _inflight.clear();
    _lru.length = 0;
}

// ── Field type → SLDS icon mapping ────────────────────────────

const TYPE_ICON_MAP = {
    STRING: 'utility:text',
    TEXTAREA: 'utility:textarea',
    INTEGER: 'utility:number_input',
    LONG: 'utility:number_input',
    DOUBLE: 'utility:number_input',
    CURRENCY: 'utility:currency',
    PERCENT: 'utility:percent',
    BOOLEAN: 'utility:check',
    DATE: 'utility:date_input',
    DATETIME: 'utility:date_time',
    TIME: 'utility:clock',
    PICKLIST: 'utility:picklist_type',
    COMBOBOX: 'utility:picklist_type',
    MULTIPICKLIST: 'utility:multi_select_picklist',
    REFERENCE: 'utility:record_lookup',
    EMAIL: 'utility:email',
    PHONE: 'utility:phone_portrait',
    URL: 'utility:link',
    ID: 'utility:key',
    ADDRESS: 'utility:location',
    LOCATION: 'utility:location',
    ENCRYPTEDSTRING: 'utility:lock',
    BASE64: 'utility:image'
};

const FALLBACK_ICON = 'utility:recipe';

/**
 * Return the SLDS utility icon name for a Salesforce field type.
 * @param {string} fieldType — Schema.DisplayType name (e.g. "STRING", "CURRENCY")
 * @returns {string}
 */
export function iconForFieldType(fieldType) {
    if (!fieldType) {
        return FALLBACK_ICON;
    }
    return TYPE_ICON_MAP[fieldType.toUpperCase()] || FALLBACK_ICON;
}

/**
 * Format a field type for display (title case).
 * @param {string} fieldType — e.g. "MULTIPICKLIST" → "Multi-Picklist"
 * @returns {string}
 */
export function formatFieldType(fieldType) {
    if (!fieldType) {
        return '';
    }
    const map = {
        MULTIPICKLIST: 'Multi-Picklist',
        ENCRYPTEDSTRING: 'Encrypted Text',
        TEXTAREA: 'Text Area',
        DATETIME: 'Date/Time',
        COMBOBOX: 'Combobox',
        BOOLEAN: 'Checkbox',
        REFERENCE: 'Lookup',
        INTEGER: 'Number',
        DOUBLE: 'Number',
        LONG: 'Number',
        BASE64: 'Base64'
    };
    const upper = fieldType.toUpperCase();
    if (map[upper]) {
        return map[upper];
    }
    // Title case: "CURRENCY" → "Currency"
    return upper.charAt(0) + upper.slice(1).toLowerCase();
}

/**
 * Transform raw Field[] from Apex into lookup-compatible option objects.
 * @param {Array} fields — from getObjectFields
 * @returns {{id:string, title:string, subtitle:string, icon:string, type:string}[]}
 */
export function fieldsToOptions(fields) {
    if (!Array.isArray(fields)) {
        return [];
    }
    return fields.map((f) => ({
        id: f.name || '',
        title: f.label || f.name || '',
        subtitle: `${f.name || ''} — ${formatFieldType(f.type)}`,
        icon: iconForFieldType(f.type),
        type: f.type || '',
        relationshipName: f.relationshipName || ''
    }));
}

/**
 * Filter options by search term (matches against label, API name, or type).
 * @param {Array} options — from fieldsToOptions
 * @param {string} term
 * @returns {Array}
 */
export function filterOptions(options, term) {
    const t = (term || '').trim().toLowerCase();
    if (!t) {
        return options;
    }
    return options.filter(
        (o) =>
            (o.title || '').toLowerCase().includes(t) ||
            (o.id || '').toLowerCase().includes(t) ||
            (o.subtitle || '').toLowerCase().includes(t)
    );
}
