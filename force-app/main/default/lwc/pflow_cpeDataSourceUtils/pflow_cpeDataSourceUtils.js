/**
 * Shared data-source resolution for core Flow choice components (collections, picklist wire, visual cards).
 * Pure transforms only — no wire/Apex in this module.
 */

/** Display labels used by Flow and the CPE (must match meta defaults / QuickChoice lineage). */
export const INPUT_MODE_LABELS = {
    SINGLE_COLLECTION: 'Single String Collection',
    DUAL_COLLECTIONS: 'Dual String Collections',
    PICKLIST_FIELD: 'Picklist Field',
    VISUAL_TEXT_BOX: 'Visual Text Box',
    SOQL_LOOKUP: 'SOQL Lookup',
    SOSL_SEARCH: 'SOSL Search'
};

/** Normalized keys for branching in code */
export const DATA_SOURCE_MODES = {
    SINGLE_COLLECTION: 'SINGLE_COLLECTION',
    DUAL_COLLECTIONS: 'DUAL_COLLECTIONS',
    PICKLIST_FIELD: 'PICKLIST_FIELD',
    VISUAL_TEXT_BOX: 'VISUAL_TEXT_BOX',
    SOQL_LOOKUP: 'SOQL_LOOKUP',
    SOSL_SEARCH: 'SOSL_SEARCH'
};

/** Maps user-facing inputMode string (from Flow) to DATA_SOURCE_MODES */
export function normalizeInputMode(label) {
    if (!label || typeof label !== 'string') {
        return DATA_SOURCE_MODES.SINGLE_COLLECTION;
    }
    const t = label.trim();
    if (t === INPUT_MODE_LABELS.DUAL_COLLECTIONS) return DATA_SOURCE_MODES.DUAL_COLLECTIONS;
    if (t === INPUT_MODE_LABELS.PICKLIST_FIELD) return DATA_SOURCE_MODES.PICKLIST_FIELD;
    if (t === INPUT_MODE_LABELS.VISUAL_TEXT_BOX) return DATA_SOURCE_MODES.VISUAL_TEXT_BOX;
    if (t === INPUT_MODE_LABELS.SOQL_LOOKUP) return DATA_SOURCE_MODES.SOQL_LOOKUP;
    if (t === INPUT_MODE_LABELS.SOSL_SEARCH) return DATA_SOURCE_MODES.SOSL_SEARCH;
    return DATA_SOURCE_MODES.SINGLE_COLLECTION;
}

export const DISPLAY_MODE_LABELS = {
    PICKLIST: 'Picklist',
    RADIO: 'Radio',
    VISUAL: 'Visual',
    CARD: 'Card'
};

/** @param {unknown} arr */
function toStringArray(arr) {
    if (!Array.isArray(arr)) {
        return [];
    }
    return arr.map((x) => (x == null ? '' : String(x)));
}

/**
 * Single collection: label and value are the same.
 * @param {unknown} values
 * @returns {{ label: string, value: string }[]}
 */
export function resolveFromSingleCollection(values) {
    const a = toStringArray(values);
    return a.map((v) => ({ label: v, value: v }));
}

/**
 * Zip labels and values by index (mismatched lengths: stop at shorter).
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
 * Alphabetical sort by label (case-insensitive).
 * @param {{ label: string, value: string }[]} options
 * @param {boolean} sortFlag
 */
export function doSort(options, sortFlag) {
    if (!sortFlag || !Array.isArray(options) || options.length === 0) {
        return options || [];
    }
    const copy = [...options];
    copy.sort((a, b) => {
        const A = (a.label || '').toUpperCase();
        const B = (b.label || '').toUpperCase();
        if (A < B) return -1;
        if (A > B) return 1;
        return 0;
    });
    return copy;
}

/**
 * Prepend a None entry (QuickChoice convention: value "None").
 * @param {{ label: string, value: string }[]} options
 * @param {boolean} allowNone
 */
export function addNoneOption(options, allowNone) {
    if (!allowNone || !Array.isArray(options)) {
        return options || [];
    }
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
    if (!picklistFieldValues || !fieldApiName) {
        return null;
    }
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
    if (!Array.isArray(values) || values.length === 0) {
        return [];
    }
    if (!controllerValues || typeof controllerValues !== 'object') {
        return values;
    }
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
    if (ctrlIndex < 0) {
        return [];
    }
    return values.filter((entry) => {
        if (!entry.validFor) {
            return true;
        }
        try {
            const validFor = atob(entry.validFor);
            const byteIndex = Math.floor(ctrlIndex / 8);
            const bit = 7 - (ctrlIndex % 8);
            if (byteIndex < 0 || byteIndex >= validFor.length) {
                return false;
            }
            const code = validFor.charCodeAt(byteIndex);
            return (code & (1 << bit)) !== 0;
        } catch {
            return true;
        }
    });
}

/**
 * Build visual card items for QuickChoice-style display.
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
    const base = staticResourceBaseUrl && !staticResourceBaseUrl.endsWith('/')
        ? `${staticResourceBaseUrl}/`
        : staticResourceBaseUrl || '';
    const items = [];
    for (let i = 0; i < n; i += 1) {
        const name = ta[i];
        const description = da[i] != null ? da[i] : '';
        let icon = ia[i] != null ? ia[i] : '';
        if (!includeIcons || !icon) {
            icon = name;
        }
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
 * allLabels / allValues from options array
 * @param {{ label: string, value: string }[]} options
 */
export function allLabelsAndValuesFromOptions(options) {
    if (!Array.isArray(options)) {
        return { allLabels: [], allValues: [] };
    }
    const allLabels = [];
    const allValues = [];
    for (let oi = 0; oi < options.length; oi += 1) {
        const o = options[oi];
        allLabels.push(o.label != null ? String(o.label) : '');
        allValues.push(o.value != null ? String(o.value) : '');
    }
    return { allLabels, allValues };
}
