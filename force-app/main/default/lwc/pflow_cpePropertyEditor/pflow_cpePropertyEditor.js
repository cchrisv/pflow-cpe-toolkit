import { LightningElement, api, track } from 'lwc';
import {
    getActiveSections,
    getDefaultAccordionOpenKeys,
    resolveSchemaKey
} from './schemaData';

/** Max animation frames to wait for Flow Builder to populate builderContext.screens for a new canvas field */
const SCHEMA_RESOLVE_MAX_FRAMES = 24;

const PATTERN_PRESET_CUSTOM = '__custom__';

const PATTERN_PRESET_OPTIONS = [
    { label: '— No format check —', value: '' },
    { label: 'Any digits (one or more)', value: '[0-9]+' },
    { label: 'Exactly 5 digits (e.g. US ZIP)', value: '[0-9]{5}' },
    {
        label: 'US phone (10 digits; spaces, dashes, or dots OK)',
        value: '[0-9]{3}[-.\\s]?[0-9]{3}[-.\\s]?[0-9]{4}'
    },
    { label: 'Letters only (A–Z, a–z)', value: '[A-Za-z]+' },
    { label: 'Letters and numbers (no spaces)', value: '[A-Za-z0-9]+' },
    { label: 'Letters, numbers, and spaces', value: '[A-Za-z0-9 ]+' },
    { label: 'Two capital letters (e.g. state code)', value: '[A-Z]{2}' },
    {
        label: 'Looks like an email (simple check)',
        value: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}'
    },
    { label: 'Web link starting with http:// or https://', value: 'https?://.+' },
    { label: 'Custom — type in the box below', value: PATTERN_PRESET_CUSTOM }
];

/** @param {{ name?: string, label?: string, type?: string, editorRequired?: boolean }} prop @param {unknown} raw */
function isEditorRequiredValueMissing(prop, raw) {
    if (!prop || !prop.editorRequired) {
        return false;
    }
    const t = prop.type;
    if (t === 'Boolean') {
        return false;
    }
    if (t === 'Integer') {
        return raw === null || raw === undefined || raw === '';
    }
    if (t === 'Date' || t === 'DateTime') {
        return raw === null || raw === undefined || raw === '';
    }
    if (raw === null || raw === undefined) {
        return true;
    }
    if (typeof raw === 'string') {
        return raw.trim() === '';
    }
    return false;
}

function patternPresetValueFromDisplay(displayValue) {
    const s = displayValue == null ? '' : String(displayValue);
    const match = PATTERN_PRESET_OPTIONS.find((o) => o.value === s && o.value !== PATTERN_PRESET_CUSTOM);
    if (match) {
        return match.value;
    }
    if (s === '') {
        return '';
    }
    return PATTERN_PRESET_CUSTOM;
}

export default class PflowCpePropertyEditor extends LightningElement {
    @track _inputValues = {};

    /** Open section keys; synced from defaults on schema change and from sectiontoggle when the user expands/collapses. */
    @track _accordionOpenKeys = null;

    /** Local only: sample text to test the pattern (HTML pattern semantics). Cleared when the screen field changes. */
    @track _patternSampleText = '';

    _accordionSchemaKey;

    _patternSampleElementApiName;

    _inputVariables;

    /** Backs @api; bumps _cpeRenderVersion when Flow assigns a new reference. */
    _builderContext;

    /** Backs @api; bumps _cpeRenderVersion when Flow assigns a new reference. */
    _elementInfo;

    /**
     * Incremented when builderContext/elementInfo/inputVariables change or when async schema resolution
     * succeeds so getters re-run (Flow often hydrates screens after the first paint or mutates context in place).
     */
    @track _cpeRenderVersion = 0;

    _schemaRetryGeneration = 0;

    _pendingSchemaRetryInstance = null;

    @api automaticOutputVariables;

    @api
    get builderContext() {
        return this._builderContext;
    }

    set builderContext(value) {
        if (this._builderContext === value) {
            return;
        }
        this._builderContext = value;
        this._cpeRenderVersion++;
    }

    @api
    get elementInfo() {
        return this._elementInfo;
    }

    set elementInfo(value) {
        if (this._elementInfo === value) {
            return;
        }
        this._elementInfo = value;
        this._cpeRenderVersion++;
    }

    @api
    get inputVariables() {
        return this._inputVariables;
    }

    set inputVariables(value) {
        this._inputVariables = value;
        this._inputValues = {};
        if (value && Array.isArray(value)) {
            value.forEach((v) => {
                if (v && v.name !== undefined) {
                    this._inputValues[v.name] = v.value;
                }
            });
        }
        this._cpeRenderVersion++;
    }

    /**
     * SCHEMAS key for this screen field (matches the LWC folder name).
     * elementInfo.apiName is the Flow field instance API name; extensionName comes from builderContext.
     */
    get elementApiName() {
        this._scopedRenderGen();
        return resolveSchemaKey(this._elementInfo, this._builderContext);
    }

    /** Establishes a reactive dependency on {@link _cpeRenderVersion} for LWC. */
    _scopedRenderGen() {
        return this._cpeRenderVersion;
    }

    get preparedSections() {
        const schemaKey = this.elementApiName;
        if (!schemaKey) {
            return [];
        }
        return getActiveSections(schemaKey).map((section) => {
            const props = section.properties || [];
            const cfg = section.componentConfig && typeof section.componentConfig === 'object' ? section.componentConfig : {};
            const enrich = (p) => {
                const raw = this._inputValues[p.name];
                let displayValue = '';
                if (raw !== undefined && raw !== null) {
                    if (p.type === 'Boolean') {
                        displayValue = raw === true || raw === 'true' ? 'true' : String(raw);
                    } else if (p.type === 'Integer') {
                        displayValue = String(raw);
                    } else {
                        displayValue = typeof raw === 'string' ? raw : String(raw);
                    }
                }
                const checkedBool =
                    raw === true || raw === 'true' || raw === 'CB_TRUE';
                const multiline =
                    p.name === 'whereClause' ||
                    p.name === 'disabledCategories' ||
                    (p.name && p.name.endsWith('Json'));
                const isPatternField = p.name === 'pattern';
                return {
                    ...p,
                    editorRequired: p.editorRequired === true,
                    displayValue,
                    checkedBool,
                    multiline,
                    hasPicklist: Array.isArray(p.options) && p.options.length > 0,
                    picklistOptions: p.options || [],
                    pickerValueType: this.getValueDataType(p.name),
                    isBoolean: p.type === 'Boolean',
                    isInteger: p.type === 'Integer',
                    isDate: p.type === 'Date',
                    isDateTime: p.type === 'DateTime',
                    isPatternField,
                    patternPresetOptions: isPatternField ? PATTERN_PRESET_OPTIONS : [],
                    patternPresetValue: isPatternField ? patternPresetValueFromDisplay(displayValue) : ''
                };
            };
            return {
                key: section.key,
                label: section.label,
                expanded: section.expanded,
                hasComponent: typeof section.component === 'string' && section.component.length > 0,
                componentName: section.component || '',
                isCpeDataSource: section.component === 'pflow_cpeDataSource',
                allowedInputModesForCpe: Array.isArray(cfg.allowedInputModes) ? cfg.allowedInputModes : [],
                showDisplayModeForCpe: cfg.showDisplayMode === true,
                showVisualCardOptionsForCpe: cfg.showVisualCardOptions === true,
                regularProps: props.filter((p) => !(p.type === 'Boolean' && p.compact)).map(enrich),
                compactBools: props.filter((p) => p.type === 'Boolean' && p.compact).map(enrich)
            };
        });
    }

    get cpeInputValues() {
        return this._inputValues || {};
    }

    get inputVariablesResolved() {
        return this._inputVariables || [];
    }

    get patternSampleText() {
        return this._patternSampleText;
    }

    /** Tryout line for the pattern row: mirrors HTML `pattern` (whole value, like lightning-input). */
    get patternTryout() {
        const raw = this._inputValues.pattern;
        const patStr = raw == null ? '' : String(raw).trim();
        const sample = (this._patternSampleText ?? '').trim();
        const base = 'slds-m-top_x-small slds-text-body_small';
        if (!patStr) {
            return {
                show: true,
                className: `${base} slds-text-color_weak`,
                text: 'Set a pattern above to try sample text.'
            };
        }
        try {
            const re = new RegExp(`^(?:${patStr})$`);
            if (sample === '') {
                return {
                    show: true,
                    className: `${base} slds-text-color_weak`,
                    text: 'Enter sample text to see if it would pass (same rules as the live field).'
                };
            }
            const ok = re.test(sample);
            return {
                show: true,
                className: ok ? `${base} slds-text-color_success` : `${base} slds-text-color_error`,
                text: ok ? 'Would pass validation.' : 'Would not pass validation.'
            };
        } catch (e) {
            return {
                show: true,
                className: `${base} slds-text-color_error`,
                text: `Pattern is invalid: ${e.message || 'syntax error'}`
            };
        }
    }

    renderedCallback() {
        const resolvedKey = resolveSchemaKey(this._elementInfo, this._builderContext);
        const fieldInstance =
            this._elementInfo && this._elementInfo.apiName != null
                ? String(this._elementInfo.apiName)
                : '';

        if (fieldInstance && !resolvedKey) {
            if (this._pendingSchemaRetryInstance !== fieldInstance) {
                this._pendingSchemaRetryInstance = fieldInstance;
                this._requestSchemaResolutionRetries(fieldInstance);
            }
        } else {
            this._pendingSchemaRetryInstance = null;
        }

        const k = resolvedKey || '';
        if (k !== this._accordionSchemaKey) {
            this._accordionSchemaKey = k;
            this._accordionOpenKeys = k ? [...getDefaultAccordionOpenKeys(k)] : null;
        }
        if (k !== this._patternSampleElementApiName) {
            this._patternSampleElementApiName = k;
            this._patternSampleText = '';
        }
    }

    _requestSchemaResolutionRetries(expectedInstanceApiName) {
        const gen = ++this._schemaRetryGeneration;
        const tick = (frame) => {
            if (gen !== this._schemaRetryGeneration) {
                return;
            }
            const inst =
                this._elementInfo && this._elementInfo.apiName != null
                    ? String(this._elementInfo.apiName)
                    : '';
            if (inst !== expectedInstanceApiName) {
                return;
            }
            if (resolveSchemaKey(this._elementInfo, this._builderContext)) {
                this._schemaRetryGeneration++;
                this._cpeRenderVersion++;
                return;
            }
            if (frame >= SCHEMA_RESOLVE_MAX_FRAMES) {
                return;
            }
            requestAnimationFrame(() => tick(frame + 1));
        };
        requestAnimationFrame(() => tick(0));
    }

    get activeSectionNames() {
        const k = this.elementApiName;
        if (!k) {
            return [];
        }
        if (this._accordionOpenKeys != null) {
            return this._accordionOpenKeys;
        }
        return getDefaultAccordionOpenKeys(k);
    }

    handleSectionToggle(event) {
        const open = event.detail && event.detail.openSections;
        if (Array.isArray(open)) {
            this._accordionOpenKeys = [...open];
        }
    }

    get pickerMaxWidth() {
        return 280;
    }

    get hasSchema() {
        return this.preparedSections.length > 0;
    }

    get automaticOutputVariablesResolved() {
        return this.automaticOutputVariables || {};
    }

    getValueDataType(propName) {
        const row = (this._inputVariables || []).find((i) => i.name === propName);
        return row && row.valueDataType ? row.valueDataType : 'String';
    }

    dispatchFlowValueChange(name, newValue, newValueDataType) {
        this._inputValues = { ...this._inputValues, [name]: newValue };
        this.dispatchEvent(
            new CustomEvent('configuration_editor_input_value_changed', {
                bubbles: true,
                cancelable: false,
                composed: true,
                detail: {
                    name,
                    newValue: newValue ?? null,
                    newValueDataType
                }
            })
        );
    }

    handleResourceValueChanged(event) {
        event.stopPropagation();
        const { id, newValue, newValueDataType } = event.detail;
        this.dispatchFlowValueChange(id, newValue, newValueDataType || 'String');
    }

    handleDataSourceChange(event) {
        event.stopPropagation();
        const d = event.detail;
        if (!d || !d.propertyName) {
            return;
        }
        this.dispatchFlowValueChange(d.propertyName, d.newValue, d.newValueDataType || 'String');
    }

    handleTextChange(event) {
        const name = event.target.dataset.propName;
        if (!name) {
            return;
        }
        const v = event.target.value;
        if (name === 'pattern' && (v === '' || v == null)) {
            this.dispatchFlowValueChange(name, null, 'String');
            return;
        }
        this.dispatchFlowValueChange(name, v, 'String');
    }

    handlePatternPresetChange(event) {
        const v = event.detail.value;
        if (v === PATTERN_PRESET_CUSTOM) {
            return;
        }
        this.dispatchFlowValueChange('pattern', v === '' ? null : v, 'String');
    }

    handlePatternSampleChange(event) {
        this._patternSampleText = event.target.value;
    }

    handleIntegerChange(event) {
        const name = event.target.dataset.propName;
        if (!name) {
            return;
        }
        const raw = event.target.value;
        if (raw === '' || raw === null) {
            this.dispatchFlowValueChange(name, null, 'Integer');
            return;
        }
        const n = parseInt(raw, 10);
        this.dispatchFlowValueChange(name, Number.isNaN(n) ? null : n, 'Integer');
    }

    handleDateChange(event) {
        const name = event.target.dataset.propName;
        if (!name) {
            return;
        }
        this.dispatchFlowValueChange(name, event.target.value || null, 'Date');
    }

    handleDateTimeChange(event) {
        const name = event.target.dataset.propName;
        if (!name) {
            return;
        }
        this.dispatchFlowValueChange(name, event.target.value || null, 'DateTime');
    }

    handleComboboxChange(event) {
        const name = event.target.dataset.propName;
        if (!name) {
            return;
        }
        this.dispatchFlowValueChange(name, event.detail.value, 'String');
    }

    handleBooleanToggleChange(event) {
        const name = event.target.dataset.propName;
        if (!name) {
            return;
        }
        this.dispatchFlowValueChange(name, event.target.checked, 'Boolean');
    }

    @api
    validate() {
        const errors = [];
        const pickers = this.template.querySelectorAll('c-pflow-cpe-resource-picker');
        pickers.forEach((picker) => {
            if (typeof picker.reportValidity === 'function' && !picker.reportValidity()) {
                errors.push({
                    key: 'mergeField',
                    errorString: 'Fix invalid merge field references before saving.'
                });
            }
        });
        this.template.querySelectorAll('c-pflow-cpe-data-source').forEach((el) => {
            if (typeof el.validate === 'function') {
                const sub = el.validate();
                if (Array.isArray(sub)) {
                    sub.forEach((e) => errors.push(e));
                }
            }
        });
        const rawPattern = this._inputValues.pattern;
        const patTrim = rawPattern == null ? '' : String(rawPattern).trim();
        if (patTrim !== '') {
            try {
                RegExp(`^(?:${patTrim})$`);
            } catch (e) {
                errors.push({
                    key: 'pattern',
                    errorString: `Format pattern is not valid: ${e.message || 'check the expression'}.`
                });
            }
        }
        const schemaKey = this.elementApiName;
        if (schemaKey) {
            getActiveSections(schemaKey).forEach((section) => {
                const props = section.properties || [];
                props.forEach((p) => {
                    if (isEditorRequiredValueMissing(p, this._inputValues[p.name])) {
                        errors.push({
                            key: `required_${p.name}`,
                            errorString: `${p.label || p.name} is required.`
                        });
                    }
                });
            });
        }
        return errors;
    }
}
