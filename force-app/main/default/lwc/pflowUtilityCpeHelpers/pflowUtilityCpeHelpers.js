/**
 * Professor Flow | CPE Helpers
 *
 * Merged utility module for the CPE Toolkit. Three logical sections:
 *   1. Field metadata cache  — stateful LRU cache around getObjectFields
 *   2. Merge-field helpers   — pure functions for {!...} reference detection and formatting
 *   3. Data source helpers   — pure transforms for the six data-source modes
 *
 * Usage:
 *   import {
 *       fetchFields, iconForFieldType, isReference, formattedValue, normalizeInputMode
 *   } from 'c/pflowUtilityCpeHelpers';
 *
 * Attribution: merge-field helpers adapted from UnofficialSF fsc_flowComboboxUtils
 * (Apache-2.0). See repo LICENSE and NOTICE.
 */

import getObjectFields from '@salesforce/apex/PFlowCpeChoiceEngineController.getObjectFields';

// ═════════════════════════════════════════════════════════════════
// 1. FIELD METADATA CACHE
// ═════════════════════════════════════════════════════════════════

const MAX_CACHE_SIZE = 10;

/** @type {Map<string, {name:string, label:string, type:string, relationshipName:string}[]>} */
const _fieldCache = new Map();

/** @type {Map<string, Promise>} */
const _fieldInflight = new Map();

/** @type {string[]} LRU order — most-recent at end */
const _fieldLru = [];

function touchLru(key) {
    const idx = _fieldLru.indexOf(key);
    if (idx > -1) {
        _fieldLru.splice(idx, 1);
    }
    _fieldLru.push(key);
    while (_fieldLru.length > MAX_CACHE_SIZE) {
        const evict = _fieldLru.shift();
        _fieldCache.delete(evict);
    }
}

/**
 * Fetch fields for an SObject, returning cached results when available.
 * Dedupes concurrent callers by returning the same in-flight Promise.
 * @param {string} objectApiName
 * @returns {Promise<{name:string, label:string, type:string, relationshipName:string}[]>}
 */
export function fetchFields(objectApiName) {
    if (!objectApiName) {
        return Promise.resolve([]);
    }
    const key = objectApiName.trim().toLowerCase();
    if (_fieldCache.has(key)) {
        touchLru(key);
        return Promise.resolve(_fieldCache.get(key));
    }
    if (_fieldInflight.has(key)) {
        return _fieldInflight.get(key);
    }
    const p = getObjectFields({ objectName: objectApiName.trim() })
        .then((fields) => {
            const result = Array.isArray(fields) ? fields : [];
            _fieldCache.set(key, result);
            touchLru(key);
            _fieldInflight.delete(key);
            return result;
        })
        .catch(() => {
            _fieldInflight.delete(key);
            return [];
        });
    _fieldInflight.set(key, p);
    return p;
}

/** Clear all cached field metadata. */
export function clearFieldCache() {
    _fieldCache.clear();
    _fieldInflight.clear();
    _fieldLru.length = 0;
}

/** Clear cache for a specific object (useful when a custom field is added mid-session). */
export function clearFieldCacheFor(objectApiName) {
    if (!objectApiName) return;
    const key = objectApiName.trim().toLowerCase();
    _fieldCache.delete(key);
    _fieldInflight.delete(key);
    const idx = _fieldLru.indexOf(key);
    if (idx > -1) _fieldLru.splice(idx, 1);
}

/** Diagnostics for tests/debugging. */
export function getFieldCacheStats() {
    return {
        size: _fieldCache.size,
        inflight: _fieldInflight.size,
        lru: [..._fieldLru]
    };
}

// ── Field type → SLDS icon mapping ────────────────────────────────

const TYPE_ICON_MAP = Object.freeze({
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
});

const FALLBACK_ICON = 'utility:text';

/**
 * Return the SLDS utility icon name for a Salesforce field type.
 * @param {string} fieldType — Schema.DisplayType name (e.g. "STRING", "CURRENCY")
 * @returns {string}
 */
export function iconForFieldType(fieldType) {
    if (!fieldType) return FALLBACK_ICON;
    return TYPE_ICON_MAP[fieldType.toUpperCase()] || FALLBACK_ICON;
}

/**
 * Format a field type for display (title case).
 * @param {string} fieldType — e.g. "MULTIPICKLIST" → "Multi-Picklist"
 * @returns {string}
 */
export function formatFieldType(fieldType) {
    if (!fieldType) return '';
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
    if (map[upper]) return map[upper];
    return upper.charAt(0) + upper.slice(1).toLowerCase();
}

/**
 * Transform raw Field[] from Apex into lookup-compatible option objects.
 * @param {Array} fields — from getObjectFields
 * @returns {{id:string, title:string, subtitle:string, icon:string, type:string, relationshipName:string}[]}
 */
export function fieldsToOptions(fields) {
    if (!Array.isArray(fields)) return [];
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
 * Filter field options by search term (matches against label, API name, or subtitle).
 * @param {Array} options — from fieldsToOptions
 * @param {string} term
 */
export function filterFieldOptions(options, term) {
    const t = (term || '').trim().toLowerCase();
    if (!t) return options;
    return options.filter(
        (o) =>
            (o.title || '').toLowerCase().includes(t) ||
            (o.id || '').toLowerCase().includes(t) ||
            (o.subtitle || '').toLowerCase().includes(t)
    );
}

// ═════════════════════════════════════════════════════════════════
// 2. MERGE-FIELD / FLOW RESOURCE HELPERS
// ═════════════════════════════════════════════════════════════════
// Adapted from UnofficialSF fsc_flowComboboxUtils (Apache-2.0).

export const flowComboboxDefaults = Object.freeze({
    stringDataType: 'String',
    referenceDataType: 'reference',
    defaultKeyPrefix: 'flowCombobox-',
    defaultGlobalVariableKeyPrefix: 'flowCombobox-globalVariable-',
    recordLookupsType: 'recordLookups',
    recordCreatesType: 'recordCreates',
    recordUpdatesType: 'recordUpdates',
    dataTypeSObject: 'SObject',
    isCollectionField: 'isCollection',
    actionType: 'actionCalls',
    screenComponentType: 'screenComponent',
    screenActionType: 'screenAction',
    regionContainerName: 'Screen_Section'
});

/**
 * Detect the {!...} Flow merge-field syntax.
 * @param {string} value
 * @returns {boolean}
 */
export function isReference(value) {
    if (!value) return false;
    return value.indexOf('{!') === 0 && value.lastIndexOf('}') === value.length - 1;
}

/**
 * @param {string} currentText
 * @returns {'String' | 'reference'}
 */
export function getDataType(currentText) {
    return isReference(currentText)
        ? flowComboboxDefaults.referenceDataType
        : flowComboboxDefaults.stringDataType;
}

/**
 * Wrap a value in {!...} when dataType is reference; otherwise return it unchanged.
 * @param {string} value
 * @param {string} dataType
 */
export function formattedValue(value, dataType) {
    if (isReference(value)) return value;
    return dataType === flowComboboxDefaults.referenceDataType ? `{!${value}}` : value;
}

/**
 * Strip the {!...} wrapping, returning the bare reference path.
 * Idempotent on plain values.
 * @param {string} value
 */
export function removeFormatting(value) {
    if (!value) return value;
    if (!isReference(value)) return value;
    return value.substring(0, value.lastIndexOf('}')).replace('{!', '');
}

// ═════════════════════════════════════════════════════════════════
// 3. DATA SOURCE MODE RESOLUTION
// ═════════════════════════════════════════════════════════════════
// Pure transforms — no wire/Apex in this section.

/** Display labels used by Flow and the CPE (must match meta defaults / QuickChoice lineage). */
export const INPUT_MODE_LABELS = Object.freeze({
    SINGLE_COLLECTION: 'Single String Collection',
    DUAL_COLLECTIONS: 'Dual String Collections',
    PICKLIST_FIELD: 'Picklist Field',
    VISUAL_TEXT_BOX: 'Visual Text Box',
    SOQL_LOOKUP: 'SOQL Lookup',
    SOSL_SEARCH: 'SOSL Search'
});

/** Normalized keys for branching in code. */
export const DATA_SOURCE_MODES = Object.freeze({
    SINGLE_COLLECTION: 'SINGLE_COLLECTION',
    DUAL_COLLECTIONS: 'DUAL_COLLECTIONS',
    PICKLIST_FIELD: 'PICKLIST_FIELD',
    VISUAL_TEXT_BOX: 'VISUAL_TEXT_BOX',
    SOQL_LOOKUP: 'SOQL_LOOKUP',
    SOSL_SEARCH: 'SOSL_SEARCH'
});

export const DISPLAY_MODE_LABELS = Object.freeze({
    PICKLIST: 'Picklist',
    RADIO: 'Radio',
    VISUAL: 'Visual',
    CARD: 'Card'
});

/**
 * Map a user-facing inputMode label (from Flow) to a DATA_SOURCE_MODES key.
 * Defaults to SINGLE_COLLECTION on unknown/empty input.
 * @param {string} label
 */
export function normalizeInputMode(label) {
    if (!label || typeof label !== 'string') return DATA_SOURCE_MODES.SINGLE_COLLECTION;
    const t = label.trim();
    if (t === INPUT_MODE_LABELS.DUAL_COLLECTIONS) return DATA_SOURCE_MODES.DUAL_COLLECTIONS;
    if (t === INPUT_MODE_LABELS.PICKLIST_FIELD) return DATA_SOURCE_MODES.PICKLIST_FIELD;
    if (t === INPUT_MODE_LABELS.VISUAL_TEXT_BOX) return DATA_SOURCE_MODES.VISUAL_TEXT_BOX;
    if (t === INPUT_MODE_LABELS.SOQL_LOOKUP) return DATA_SOURCE_MODES.SOQL_LOOKUP;
    if (t === INPUT_MODE_LABELS.SOSL_SEARCH) return DATA_SOURCE_MODES.SOSL_SEARCH;
    return DATA_SOURCE_MODES.SINGLE_COLLECTION;
}

/** @param {unknown} arr */
function toStringArray(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.map((x) => (x == null ? '' : String(x)));
}

/**
 * Single collection: label and value are the same string.
 * @param {unknown} values
 * @returns {{ label: string, value: string }[]}
 */
export function resolveFromSingleCollection(values) {
    const a = toStringArray(values);
    return a.map((v) => ({ label: v, value: v }));
}

/**
 * Zip labels and values by index. Stops at the shorter array's length.
 * @param {unknown} labels
 * @param {unknown} values
 * @returns {{ label: string, value: string }[]}
 */
export function resolveFromDualCollections(labels, values) {
    const la = toStringArray(labels);
    const va = toStringArray(values);
    const n = Math.min(la.length, va.length);
    const out = [];
    for (let i = 0; i < n; i += 1) {
        out.push({ label: la[i], value: va[i] });
    }
    return out;
}

/**
 * Alphabetical sort by label (case-insensitive). Returns a new array.
 * @param {{ label: string, value: string }[]} options
 * @param {boolean} sortFlag
 */
export function doSort(options, sortFlag) {
    if (!sortFlag || !Array.isArray(options) || options.length === 0) {
        return options || [];
    }
    return [...options].sort((a, b) => {
        const A = (a.label || '').toUpperCase();
        const B = (b.label || '').toUpperCase();
        if (A < B) return -1;
        if (A > B) return 1;
        return 0;
    });
}

/**
 * Prepend a "--None--" option (QuickChoice convention: value "None").
 * @param {{ label: string, value: string }[]} options
 * @param {boolean} allowNone
 */
export function addNoneOption(options, allowNone) {
    if (!allowNone || !Array.isArray(options)) return options || [];
    return [{ label: '--None--', value: 'None' }, ...options];
}

/**
 * Build combobox/radio options from getPicklistValues-style wire data (single field).
 * @param {{ values?: { label: string, value: string }[] } | null | undefined} fieldPicklistData
 * @param {boolean} allowNone
 * @param {boolean} sortList
 */
export function resolveFromPicklistFieldWire(fieldPicklistData, allowNone, sortList) {
    let options = [];
    if (fieldPicklistData && Array.isArray(fieldPicklistData.values)) {
        options = fieldPicklistData.values.map((v) => ({
            label: v.label != null ? String(v.label) : '',
            value: v.value != null ? String(v.value) : ''
        }));
    }
    options = doSort(options, sortList);
    options = addNoneOption(options, allowNone);
    return options;
}

/**
 * Extract one field's picklist payload from getPicklistValuesByRecordType result.
 * @param {Record<string, unknown> | null | undefined} picklistFieldValues
 * @param {string} fieldApiName e.g. "Type" (not Account.Type)
 */
export function getFieldPicklistFromByRecordType(picklistFieldValues, fieldApiName) {
    if (!picklistFieldValues || !fieldApiName) return null;
    const row = picklistFieldValues[fieldApiName];
    return row && typeof row === 'object' ? row : null;
}

/**
 * Filter dependent picklist values using validFor + controller value (standard LDS pattern).
 * @param {{ label: string, value: string, validFor?: string }[]} values
 * @param {unknown} controllingValue
 * @param {Record<string, unknown> | null} controllerValues map index -> api value
 */
export function filterDependentPicklistValues(values, controllingValue, controllerValues) {
    if (!Array.isArray(values) || values.length === 0) return [];
    if (!controllerValues || typeof controllerValues !== 'object') return values;
    const ctrlStr = controllingValue == null ? '' : String(controllingValue);
    let ctrlIndex = -1;
    const ctrlKeys = Object.keys(controllerValues);
    for (let ki = 0; ki < ctrlKeys.length; ki += 1) {
        const k = ctrlKeys[ki];
        if (String(controllerValues[k]) === ctrlStr) {
            ctrlIndex = Number(k);
            break;
        }
    }
    if (ctrlIndex < 0) return [];
    return values.filter((entry) => {
        if (!entry.validFor) return true;
        try {
            const validFor = atob(entry.validFor);
            const byteIndex = Math.floor(ctrlIndex / 8);
            const bit = 7 - (ctrlIndex % 8);
            if (byteIndex < 0 || byteIndex >= validFor.length) return false;
            const code = validFor.charCodeAt(byteIndex);
            return (code & (1 << bit)) !== 0;
        } catch {
            return true;
        }
    });
}

/**
 * Build visual card items for QuickChoice-style card display.
 * @param {unknown} titles
 * @param {unknown} descriptions
 * @param {unknown} icons
 * @param {boolean} includeIcons
 * @param {string} staticResourceBaseUrl URL prefix for image filenames (e.g. from static resource)
 */
export function buildVisualCardItems(
    titles,
    descriptions,
    icons,
    includeIcons,
    staticResourceBaseUrl
) {
    const ta = toStringArray(titles);
    const da = toStringArray(descriptions);
    const ia = toStringArray(icons);
    const n = ta.length;
    const base =
        staticResourceBaseUrl && !staticResourceBaseUrl.endsWith('/')
            ? `${staticResourceBaseUrl}/`
            : staticResourceBaseUrl || '';
    const items = [];
    for (let i = 0; i < n; i += 1) {
        const name = ta[i];
        const description = da[i] != null ? da[i] : '';
        let icon = ia[i] != null ? ia[i] : '';
        if (!includeIcons || !icon) icon = name;
        const isLightningIcon = icon.includes(':');
        const resolvedIcon = !isLightningIcon && base && icon ? `${base}${icon}` : icon;
        items.push({
            name,
            description,
            icon: resolvedIcon,
            isLightningIcon,
            value: name,
            showIcon: includeIcons === true && Boolean(icon)
        });
    }
    return items;
}

/**
 * Split options into parallel label / value arrays.
 * @param {{ label: string, value: string }[]} options
 * @returns {{ allLabels: string[], allValues: string[] }}
 */
export function allLabelsAndValuesFromOptions(options) {
    if (!Array.isArray(options)) return { allLabels: [], allValues: [] };
    const allLabels = [];
    const allValues = [];
    for (let oi = 0; oi < options.length; oi += 1) {
        const o = options[oi];
        allLabels.push(o.label != null ? String(o.label) : '');
        allValues.push(o.value != null ? String(o.value) : '');
    }
    return { allLabels, allValues };
}
