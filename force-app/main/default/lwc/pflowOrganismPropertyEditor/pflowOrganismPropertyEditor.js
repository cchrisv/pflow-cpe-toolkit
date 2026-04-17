import { LightningElement, api, track } from 'lwc';

/**
 * @typedef {object} SchemaProperty
 * @property {string} name          API name; matches the consumer LWC's @api property.
 * @property {string} type          'String' | 'Integer' | 'Boolean' | 'Date' | 'DateTime'.
 * @property {string} label         Display label rendered above the input.
 * @property {string=} description  Optional help text below the input.
 * @property {string=} placeholder  Optional placeholder for text/integer inputs.
 * @property {boolean=} editorRequired  Flag as required in the CPE.
 * @property {boolean=} supportsResource  If true, render a resource-picker instead of a plain input.
 * @property {boolean=} compact     For Boolean types: render in a grid of small toggles at the bottom of the section.
 * @property {{label:string,value:string}[]=} options  If provided, render a picklist instead of a text input.
 */

/**
 * @typedef {object} SchemaSection
 * @property {string} key           Stable section id (e.g. 'display').
 * @property {string} label         Section header label.
 * @property {boolean=} expanded    Whether this section is open by default.
 * @property {SchemaProperty[]} properties
 * @property {string=} component    Optional embedded sub-editor name (e.g. 'pflowOrganismDataSource').
 * @property {object=} componentConfig  Optional config forwarded to the embedded component.
 */

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

export default class PflowOrganismPropertyEditor extends LightningElement {
    @track _inputValues = {};

    /** Open section keys; synced from defaults on schema change and from sectiontoggle when the user expands/collapses. */
    @track _accordionOpenKeys = null;

    /** Local only: sample text to test the pattern (HTML pattern semantics). Cleared when the screen field changes. */
    @track _patternSampleText = '';

    _patternSampleSchemaSignature;

    _inputVariables;

    /** Backs @api schema; used to detect schema changes for accordion default-open reset. */
    _schema = [];

    _accordionSchemaSignature;

    /** Backs @api builderContext; reference changes bump _cpeRenderVersion. */
    _builderContext;

    /**
     * Incremented when builderContext/inputVariables change so getters re-run
     * (Flow often hydrates screens after the first paint or mutates context in place).
     */
    @track _cpeRenderVersion = 0;

    @api automaticOutputVariables;

    /**
     * Schema describing the sections and properties to render.
     * Each consuming wrapper-CPE passes its own schema here — no shared schemaData.js.
     * @type {SchemaSection[]}
     */
    @api
    get schema() {
        return this._schema;
    }

    set schema(value) {
        this._schema = Array.isArray(value) ? value : [];
        this._cpeRenderVersion++;
    }

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

    /** Establishes a reactive dependency on {@link _cpeRenderVersion} for LWC. */
    _scopedRenderGen() {
        return this._cpeRenderVersion;
    }

    /**
     * Stable signature used to detect schema changes for accordion-default-open reset.
     * @returns {string}
     */
    _computeSchemaSignature() {
        if (!Array.isArray(this._schema)) {
            return '';
        }
        return this._schema.map((s) => s && s.key ? String(s.key) : '').join('|');
    }

    get preparedSections() {
        this._scopedRenderGen();
        if (!Array.isArray(this._schema) || this._schema.length === 0) {
            return [];
        }
        return this._schema.map((section) => {
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
                isCpeDataSource: section.component === 'pflowOrganismDataSource',
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
        const signature = this._computeSchemaSignature();
        if (signature !== this._accordionSchemaSignature) {
            this._accordionSchemaSignature = signature;
            this._accordionOpenKeys = signature ? this._defaultAccordionKeys() : null;
        }
        if (signature !== this._patternSampleSchemaSignature) {
            this._patternSampleSchemaSignature = signature;
            this._patternSampleText = '';
        }
    }

    /** Sections where `expanded === true` open by default. */
    _defaultAccordionKeys() {
        if (!Array.isArray(this._schema)) {
            return [];
        }
        return this._schema
            .filter((s) => s && s.expanded === true && s.key)
            .map((s) => String(s.key));
    }

    get activeSectionNames() {
        if (this._accordionOpenKeys != null) {
            return this._accordionOpenKeys;
        }
        return this._defaultAccordionKeys();
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
        const pickers = this.template.querySelectorAll('c-pflow-organism-resource-picker');
        pickers.forEach((picker) => {
            if (typeof picker.reportValidity === 'function' && !picker.reportValidity()) {
                errors.push({
                    key: 'mergeField',
                    errorString: 'Fix invalid merge field references before saving.'
                });
            }
        });
        this.template.querySelectorAll('c-pflow-organism-data-source').forEach((el) => {
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
        if (Array.isArray(this._schema)) {
            this._schema.forEach((section) => {
                const props = (section && section.properties) || [];
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
