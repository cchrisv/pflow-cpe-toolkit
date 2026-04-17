/**
 * Data-driven property definitions for Flow screen LWCs configured via the Professor Flow CPE Property Editor. Keys match the LWC folder name. Entries below are example schemas ported from coreFlow; customise or replace with entries for your own LWCs (Custom Property Editor).
 * Section keys: display, value, dataSource, constraints, filtering, validation.
 */

/** @typedef {{ name: string, type: string, label: string, description?: string, placeholder?: string, default?: string|number|boolean, compact?: boolean, supportsResource?: boolean, editorRequired?: boolean, options?: { label: string, value: string }[], rows?: number }} FlowPropDef */

/** @typedef {{ allowedInputModes?: string[], showDisplayMode?: boolean, showVisualCardOptions?: boolean }} CpeDataSourceConfig */

/**
 * Reusable CPE data-source config for Combobox, Radio, Checkbox Group, Dual Listbox.
 * Same input modes as Quick Choice data (collections, picklist, visual text, SOQL/SOSL).
 * Visual Text Box uses title + description collections only (no card/icon grid — that stays Quick Choice + showVisualCardOptions).
 */
export const CPE_DATA_SOURCE_STANDARD = {
    allowedInputModes: [
        'Single String Collection',
        'Dual String Collections',
        'Picklist Field',
        'Visual Text Box',
        'SOQL Lookup',
        'SOSL Search'
    ],
    showDisplayMode: false,
    showVisualCardOptions: false
};

/** QuickChoice CPE: all input modes + display mode + visual card options. */
export const CPE_DATA_SOURCE_QUICK_CHOICE = {
    allowedInputModes: [
        'Single String Collection',
        'Dual String Collections',
        'Picklist Field',
        'Visual Text Box',
        'SOQL Lookup',
        'SOSL Search'
    ],
    showDisplayMode: true,
    showVisualCardOptions: true
};

/** Lookup CPE: same input modes as other choice components (collections, picklist, visual text, SOQL/SOSL). */
export const CPE_DATA_SOURCE_LOOKUP = {
    allowedInputModes: [
        'Single String Collection',
        'Dual String Collections',
        'Picklist Field',
        'Visual Text Box',
        'SOQL Lookup',
        'SOSL Search'
    ],
    showDisplayMode: false,
    showVisualCardOptions: false
};

/** Shared pattern property for text-like screen fields (HTML `pattern` attribute; whole value must match). */
export const PATTERN_PROP = {
    name: 'pattern',
    type: 'String',
    label: 'Pattern details',
    placeholder: 'Filled when you pick a preset — or type your own if you chose Custom',
    description:
        'Prefer a preset above. This is HTML “pattern” syntax: the whole answer must match. No slashes around it. In Flow, backslashes are often doubled (e.g. \\\\d). See MDN “pattern” attribute for advanced syntax.'
};

/** @type {Record<string, { sections: { key: string, label: string, expanded?: boolean, properties?: FlowPropDef[], component?: string, componentConfig?: CpeDataSourceConfig }[] }>} */
export const SCHEMAS = {
    coreFlowTextInput: {
        sections: [
            {
                key: 'display',
                label: 'Display',
                expanded: true,
                properties: [
                    {
                        name: 'label',
                        type: 'String',
                        label: 'Label',
                        supportsResource: true,
                        editorRequired: true,
                        description: 'Shown on the flow screen above the field.'
                    },
                    { name: 'questionNumber', type: 'String', label: 'Badge', default: '1', supportsResource: true },
                    { name: 'placeholder', type: 'String', label: 'Placeholder', supportsResource: true },
                    {
                        name: 'fieldLevelHelp',
                        type: 'String',
                        label: 'Help Text',
                        supportsResource: true,
                        description: 'Optional hint shown below the field on the flow screen.'
                    },
                    { name: 'required', type: 'Boolean', label: 'Required', default: false, compact: true },

                    { name: 'disabled', type: 'Boolean', label: 'Disabled', default: false, compact: true },
                    { name: 'readonly', type: 'Boolean', label: 'Read Only', default: false, compact: true }
                ]
            },
            {
                key: 'value',
                label: 'Value',
                expanded: true,
                properties: [
                    {
                        name: 'value',
                        type: 'String',
                        label: 'Value',
                        supportsResource: true,
                        description: 'Bind to a flow variable or enter a default.'
                    }
                ]
            },
            {
                key: 'constraints',
                label: 'Format & Constraints',
                expanded: false,
                properties: [
                    {
                        name: 'autocomplete',
                        type: 'Boolean',
                        label: 'Browser autocomplete',
                        default: false,
                        compact: true,
                        description: 'Allow the browser to suggest or autofill this field.'
                    },
                    { name: 'maxLength', type: 'Integer', label: 'Max Length', default: 255, supportsResource: true },
                    { name: 'minLength', type: 'Integer', label: 'Min Length', default: 0, supportsResource: true },
                    PATTERN_PROP
                ]
            },
            {
                key: 'validation',
                label: 'Error Messages',
                expanded: false,
                properties: [
                    { name: 'messageWhenValueMissing', type: 'String', label: 'Required Error', supportsResource: true },
                    { name: 'messageWhenTooShort', type: 'String', label: 'Too Short Error', supportsResource: true },
                    { name: 'messageWhenTooLong', type: 'String', label: 'Too Long Error', supportsResource: true },
                    { name: 'messageWhenPatternMismatch', type: 'String', label: 'Pattern Error', supportsResource: true },
                    { name: 'messageWhenBadInput', type: 'String', label: 'Bad Input Error', supportsResource: true }
                ]
            }
        ]
    },
    coreFlowTextArea: {
        sections: [
            {
                key: 'display',
                label: 'Display',
                expanded: true,
                properties: [
                    {
                        name: 'label',
                        type: 'String',
                        label: 'Label',
                        supportsResource: true,
                        editorRequired: true,
                        description: 'Shown on the flow screen above the field.'
                    },
                    { name: 'questionNumber', type: 'String', label: 'Badge', default: '1', supportsResource: true },
                    { name: 'placeholder', type: 'String', label: 'Placeholder', supportsResource: true },

                    { name: 'required', type: 'Boolean', label: 'Required', default: false, compact: true }
                ]
            },
            {
                key: 'value',
                label: 'Value',
                expanded: true,
                properties: [{ name: 'value', type: 'String', label: 'Value', supportsResource: true }]
            },
            {
                key: 'constraints',
                label: 'Format & Constraints',
                expanded: false,
                properties: [
                    { name: 'maxLength', type: 'Integer', label: 'Max Length', supportsResource: true },
                    { name: 'minLength', type: 'Integer', label: 'Min Length', supportsResource: true }
                ]
            },
            {
                key: 'validation',
                label: 'Error Messages',
                expanded: false,
                properties: [{ name: 'messageWhenValueMissing', type: 'String', label: 'Required Error', supportsResource: true }]
            }
        ]
    },
    coreFlowEmail: {
        sections: [
            {
                key: 'display',
                label: 'Display',
                expanded: true,
                properties: [
                    {
                        name: 'label',
                        type: 'String',
                        label: 'Label',
                        supportsResource: true,
                        editorRequired: true,
                        description: 'Shown on the flow screen above the field.'
                    },
                    { name: 'questionNumber', type: 'String', label: 'Badge', default: '1', supportsResource: true },
                    { name: 'placeholder', type: 'String', label: 'Placeholder', supportsResource: true },
                    {
                        name: 'fieldLevelHelp',
                        type: 'String',
                        label: 'Help Text',
                        supportsResource: true,
                        description: 'Optional hint shown below the field on the flow screen.'
                    },
                    { name: 'required', type: 'Boolean', label: 'Required', default: false, compact: true },

                    { name: 'disabled', type: 'Boolean', label: 'Disabled', default: false, compact: true },
                    { name: 'readonly', type: 'Boolean', label: 'Read Only', default: false, compact: true },
                    { name: 'multiple', type: 'Boolean', label: 'Allow Multiple', default: false, compact: true }
                ]
            },
            {
                key: 'value',
                label: 'Value',
                expanded: true,
                properties: [{ name: 'value', type: 'String', label: 'Value', supportsResource: true }]
            },
            {
                key: 'constraints',
                label: 'Format & Constraints',
                expanded: false,
                properties: [
                    {
                        name: 'autocomplete',
                        type: 'Boolean',
                        label: 'Browser autocomplete',
                        default: false,
                        compact: true,
                        description: 'Allow the browser to suggest or autofill this field.'
                    },
                    { name: 'maxLength', type: 'Integer', label: 'Max Length', default: 255, supportsResource: true },
                    { name: 'minLength', type: 'Integer', label: 'Min Length', default: 0, supportsResource: true }
                ]
            },
            {
                key: 'validation',
                label: 'Error Messages',
                expanded: false,
                properties: [
                    { name: 'messageWhenValueMissing', type: 'String', label: 'Required Error', supportsResource: true },
                    { name: 'messageWhenTooShort', type: 'String', label: 'Too Short Error', supportsResource: true },
                    { name: 'messageWhenTooLong', type: 'String', label: 'Too Long Error', supportsResource: true },
                    { name: 'messageWhenTypeMismatch', type: 'String', label: 'Format Error', supportsResource: true },
                    { name: 'messageWhenBadInput', type: 'String', label: 'Bad Input Error', supportsResource: true }
                ]
            }
        ]
    },
    coreFlowUrl: {
        sections: [
            {
                key: 'display',
                label: 'Display',
                expanded: true,
                properties: [
                    {
                        name: 'label',
                        type: 'String',
                        label: 'Label',
                        supportsResource: true,
                        editorRequired: true,
                        description: 'Shown on the flow screen above the field.'
                    },
                    { name: 'questionNumber', type: 'String', label: 'Badge', default: '1', supportsResource: true },
                    { name: 'placeholder', type: 'String', label: 'Placeholder', supportsResource: true },
                    {
                        name: 'fieldLevelHelp',
                        type: 'String',
                        label: 'Help Text',
                        supportsResource: true,
                        description: 'Optional hint shown below the field on the flow screen.'
                    },
                    { name: 'required', type: 'Boolean', label: 'Required', default: false, compact: true },

                    { name: 'disabled', type: 'Boolean', label: 'Disabled', default: false, compact: true },
                    { name: 'readonly', type: 'Boolean', label: 'Read Only', default: false, compact: true }
                ]
            },
            {
                key: 'value',
                label: 'Value',
                expanded: true,
                properties: [{ name: 'value', type: 'String', label: 'Value', supportsResource: true }]
            },
            {
                key: 'constraints',
                label: 'Format & Constraints',
                expanded: false,
                properties: [
                    {
                        name: 'autocomplete',
                        type: 'Boolean',
                        label: 'Browser autocomplete',
                        default: false,
                        compact: true,
                        description: 'Allow the browser to suggest or autofill this field.'
                    },
                    { name: 'maxLength', type: 'Integer', label: 'Max Length', default: 255, supportsResource: true },
                    { name: 'minLength', type: 'Integer', label: 'Min Length', default: 0, supportsResource: true },
                    PATTERN_PROP
                ]
            },
            {
                key: 'validation',
                label: 'Error Messages',
                expanded: false,
                properties: [
                    { name: 'messageWhenValueMissing', type: 'String', label: 'Required Error', supportsResource: true },
                    { name: 'messageWhenTooShort', type: 'String', label: 'Too Short Error', supportsResource: true },
                    { name: 'messageWhenTooLong', type: 'String', label: 'Too Long Error', supportsResource: true },
                    { name: 'messageWhenPatternMismatch', type: 'String', label: 'Pattern Error', supportsResource: true },
                    { name: 'messageWhenTypeMismatch', type: 'String', label: 'Format Error', supportsResource: true },
                    { name: 'messageWhenBadInput', type: 'String', label: 'Bad Input Error', supportsResource: true }
                ]
            }
        ]
    },
    coreFlowTel: {
        sections: [
            {
                key: 'display',
                label: 'Display',
                expanded: true,
                properties: [
                    {
                        name: 'label',
                        type: 'String',
                        label: 'Label',
                        supportsResource: true,
                        editorRequired: true,
                        description: 'Shown on the flow screen above the field.'
                    },
                    { name: 'questionNumber', type: 'String', label: 'Badge', default: '1', supportsResource: true },
                    { name: 'placeholder', type: 'String', label: 'Placeholder', supportsResource: true },
                    {
                        name: 'fieldLevelHelp',
                        type: 'String',
                        label: 'Help Text',
                        supportsResource: true,
                        description: 'Optional hint shown below the field on the flow screen.'
                    },
                    { name: 'required', type: 'Boolean', label: 'Required', default: false, compact: true },

                    { name: 'disabled', type: 'Boolean', label: 'Disabled', default: false, compact: true },
                    { name: 'readonly', type: 'Boolean', label: 'Read Only', default: false, compact: true }
                ]
            },
            {
                key: 'value',
                label: 'Value',
                expanded: true,
                properties: [
                    {
                        name: 'value',
                        type: 'String',
                        label: 'Value (E.164)',
                        supportsResource: true,
                        description: 'International E.164 format (e.g. +12015550123).'
                    },
                    {
                        name: 'nationalValue',
                        type: 'String',
                        label: 'National format',
                        supportsResource: true,
                        description: 'National format for the selected country.'
                    }
                ]
            },
            {
                key: 'validation',
                label: 'Error Messages',
                expanded: false,
                properties: [
                    { name: 'messageWhenValueMissing', type: 'String', label: 'Required Error', supportsResource: true },
                    {
                        name: 'messageWhenInvalidNumber',
                        type: 'String',
                        label: 'Invalid Number Error',
                        supportsResource: true,
                        description: 'Shown when the number is not valid for the selected country.'
                    }
                ]
            }
        ]
    },
    coreFlowPassword: {
        sections: [
            {
                key: 'display',
                label: 'Display',
                expanded: true,
                properties: [
                    {
                        name: 'label',
                        type: 'String',
                        label: 'Label',
                        supportsResource: true,
                        editorRequired: true,
                        description: 'Shown on the flow screen above the field.'
                    },
                    { name: 'questionNumber', type: 'String', label: 'Badge', default: '1', supportsResource: true },
                    { name: 'placeholder', type: 'String', label: 'Placeholder', supportsResource: true },
                    {
                        name: 'fieldLevelHelp',
                        type: 'String',
                        label: 'Help Text',
                        supportsResource: true,
                        description: 'Optional hint shown below the field on the flow screen.'
                    },
                    { name: 'required', type: 'Boolean', label: 'Required', default: false, compact: true },

                    { name: 'disabled', type: 'Boolean', label: 'Disabled', default: false, compact: true },
                    { name: 'readonly', type: 'Boolean', label: 'Read Only', default: false, compact: true }
                ]
            },
            {
                key: 'value',
                label: 'Value',
                expanded: true,
                properties: [{ name: 'value', type: 'String', label: 'Value', supportsResource: true }]
            },
            {
                key: 'constraints',
                label: 'Format & Constraints',
                expanded: false,
                properties: [
                    { name: 'maxLength', type: 'Integer', label: 'Max Length', default: 255, supportsResource: true },
                    { name: 'minLength', type: 'Integer', label: 'Min Length', default: 0, supportsResource: true },
                    PATTERN_PROP
                ]
            },
            {
                key: 'validation',
                label: 'Error Messages',
                expanded: false,
                properties: [
                    { name: 'messageWhenValueMissing', type: 'String', label: 'Required Error', supportsResource: true },
                    { name: 'messageWhenTooShort', type: 'String', label: 'Too Short Error', supportsResource: true },
                    { name: 'messageWhenTooLong', type: 'String', label: 'Too Long Error', supportsResource: true },
                    { name: 'messageWhenPatternMismatch', type: 'String', label: 'Pattern Error', supportsResource: true },
                    { name: 'messageWhenBadInput', type: 'String', label: 'Bad Input Error', supportsResource: true }
                ]
            }
        ]
    },
    coreFlowNumber: {
        sections: [
            {
                key: 'display',
                label: 'Display',
                expanded: true,
                properties: [
                    {
                        name: 'label',
                        type: 'String',
                        label: 'Label',
                        supportsResource: true,
                        editorRequired: true,
                        description: 'Shown on the flow screen above the field.'
                    },
                    { name: 'questionNumber', type: 'String', label: 'Badge', default: '1', supportsResource: true },
                    { name: 'placeholder', type: 'String', label: 'Placeholder', supportsResource: true },
                    {
                        name: 'fieldLevelHelp',
                        type: 'String',
                        label: 'Help Text',
                        supportsResource: true,
                        description: 'Optional hint shown below the field on the flow screen.'
                    },
                    { name: 'required', type: 'Boolean', label: 'Required', default: false, compact: true },

                    { name: 'disabled', type: 'Boolean', label: 'Disabled', default: false, compact: true },
                    { name: 'readonly', type: 'Boolean', label: 'Read Only', default: false, compact: true }
                ]
            },
            {
                key: 'value',
                label: 'Value',
                expanded: true,
                properties: [{ name: 'value', type: 'Integer', label: 'Value', supportsResource: true }]
            },
            {
                key: 'constraints',
                label: 'Format & Constraints',
                expanded: false,
                properties: [
                    {
                        name: 'formatter',
                        type: 'String',
                        label: 'Formatter',
                        options: [
                            { label: '(none)', value: '' },
                            { label: 'Currency', value: 'currency' },
                            { label: 'Percent', value: 'percent' },
                            { label: 'Percent (fixed)', value: 'percent-fixed' }
                        ]
                    },
                    { name: 'min', type: 'Integer', label: 'Minimum', supportsResource: true },
                    { name: 'max', type: 'Integer', label: 'Maximum', supportsResource: true },
                    { name: 'step', type: 'Integer', label: 'Step', supportsResource: true }
                ]
            },
            {
                key: 'validation',
                label: 'Error Messages',
                expanded: false,
                properties: [
                    { name: 'messageWhenValueMissing', type: 'String', label: 'Required Error', supportsResource: true },
                    { name: 'messageWhenRangeOverflow', type: 'String', label: 'Range Overflow Error', supportsResource: true },
                    { name: 'messageWhenRangeUnderflow', type: 'String', label: 'Range Underflow Error', supportsResource: true },
                    { name: 'messageWhenStepMismatch', type: 'String', label: 'Step Error', supportsResource: true },
                    { name: 'messageWhenBadInput', type: 'String', label: 'Bad Input Error', supportsResource: true }
                ]
            }
        ]
    },
    coreFlowDate: {
        sections: [
            {
                key: 'display',
                label: 'Display',
                expanded: true,
                properties: [
                    {
                        name: 'label',
                        type: 'String',
                        label: 'Label',
                        supportsResource: true,
                        editorRequired: true,
                        description: 'Shown on the flow screen above the field.'
                    },
                    { name: 'questionNumber', type: 'String', label: 'Badge', default: '1', supportsResource: true },
                    {
                        name: 'fieldLevelHelp',
                        type: 'String',
                        label: 'Help Text',
                        supportsResource: true,
                        description: 'Optional hint shown below the field on the flow screen.'
                    },
                    { name: 'required', type: 'Boolean', label: 'Required', default: false, compact: true },

                    { name: 'disabled', type: 'Boolean', label: 'Disabled', default: false, compact: true },
                    { name: 'readonly', type: 'Boolean', label: 'Read Only', default: false, compact: true }
                ]
            },
            {
                key: 'value',
                label: 'Value',
                expanded: true,
                properties: [{ name: 'value', type: 'Date', label: 'Value', supportsResource: true }]
            },
            {
                key: 'constraints',
                label: 'Format & Constraints',
                expanded: false,
                properties: [
                    {
                        name: 'dateStyle',
                        type: 'String',
                        label: 'Date Style',
                        options: [
                            { label: 'Short', value: 'short' },
                            { label: 'Medium', value: 'medium' },
                            { label: 'Long', value: 'long' }
                        ],
                        default: 'medium'
                    },
                    { name: 'min', type: 'Date', label: 'Min Date', supportsResource: true },
                    { name: 'max', type: 'Date', label: 'Max Date', supportsResource: true }
                ]
            },
            {
                key: 'validation',
                label: 'Error Messages',
                expanded: false,
                properties: [
                    { name: 'messageWhenValueMissing', type: 'String', label: 'Required Error', supportsResource: true },
                    { name: 'messageWhenRangeOverflow', type: 'String', label: 'Max Date Error', supportsResource: true },
                    { name: 'messageWhenRangeUnderflow', type: 'String', label: 'Min Date Error', supportsResource: true },
                    { name: 'messageWhenBadInput', type: 'String', label: 'Bad Input Error', supportsResource: true }
                ]
            }
        ]
    },
    coreFlowDateTime: {
        sections: [
            {
                key: 'display',
                label: 'Display',
                expanded: true,
                properties: [
                    {
                        name: 'label',
                        type: 'String',
                        label: 'Label',
                        supportsResource: true,
                        editorRequired: true,
                        description: 'Shown on the flow screen above the field.'
                    },
                    { name: 'questionNumber', type: 'String', label: 'Badge', default: '1', supportsResource: true },
                    {
                        name: 'fieldLevelHelp',
                        type: 'String',
                        label: 'Help Text',
                        supportsResource: true,
                        description: 'Optional hint shown below the field on the flow screen.'
                    },
                    { name: 'required', type: 'Boolean', label: 'Required', default: false, compact: true },

                    { name: 'disabled', type: 'Boolean', label: 'Disabled', default: false, compact: true },
                    { name: 'readonly', type: 'Boolean', label: 'Read Only', default: false, compact: true }
                ]
            },
            {
                key: 'value',
                label: 'Value',
                expanded: true,
                properties: [{ name: 'value', type: 'DateTime', label: 'Value', supportsResource: true }]
            },
            {
                key: 'constraints',
                label: 'Format & Constraints',
                expanded: false,
                properties: [
                    {
                        name: 'dateStyle',
                        type: 'String',
                        label: 'Date Style',
                        options: [
                            { label: 'Short', value: 'short' },
                            { label: 'Medium', value: 'medium' },
                            { label: 'Long', value: 'long' }
                        ],
                        default: 'medium'
                    },
                    {
                        name: 'timeStyle',
                        type: 'String',
                        label: 'Time Style',
                        options: [
                            { label: 'Short', value: 'short' },
                            { label: 'Medium', value: 'medium' }
                        ],
                        default: 'short'
                    },
                    { name: 'timezone', type: 'String', label: 'Timezone', supportsResource: true },
                    { name: 'timeStepMinutes', type: 'Integer', label: 'Time Step (minutes)', supportsResource: true },
                    { name: 'min', type: 'DateTime', label: 'Min Date/Time', supportsResource: true },
                    { name: 'max', type: 'DateTime', label: 'Max Date/Time', supportsResource: true }
                ]
            },
            {
                key: 'validation',
                label: 'Error Messages',
                expanded: false,
                properties: [
                    { name: 'messageWhenValueMissing', type: 'String', label: 'Required Error', supportsResource: true },
                    { name: 'messageWhenRangeOverflow', type: 'String', label: 'Max Date Error', supportsResource: true },
                    { name: 'messageWhenRangeUnderflow', type: 'String', label: 'Min Date Error', supportsResource: true },
                    { name: 'messageWhenBadInput', type: 'String', label: 'Bad Input Error', supportsResource: true }
                ]
            }
        ]
    },
    coreFlowTime: {
        sections: [
            {
                key: 'display',
                label: 'Display',
                expanded: true,
                properties: [
                    {
                        name: 'label',
                        type: 'String',
                        label: 'Label',
                        supportsResource: true,
                        editorRequired: true,
                        description: 'Shown on the flow screen above the field.'
                    },
                    { name: 'questionNumber', type: 'String', label: 'Badge', default: '1', supportsResource: true },
                    {
                        name: 'fieldLevelHelp',
                        type: 'String',
                        label: 'Help Text',
                        supportsResource: true,
                        description: 'Optional hint shown below the field on the flow screen.'
                    },
                    { name: 'required', type: 'Boolean', label: 'Required', default: false, compact: true },

                    { name: 'disabled', type: 'Boolean', label: 'Disabled', default: false, compact: true },
                    { name: 'readonly', type: 'Boolean', label: 'Read Only', default: false, compact: true }
                ]
            },
            {
                key: 'value',
                label: 'Value',
                expanded: true,
                properties: [{ name: 'value', type: 'String', label: 'Value', supportsResource: true }]
            },
            {
                key: 'constraints',
                label: 'Format & Constraints',
                expanded: false,
                properties: [
                    {
                        name: 'timeStyle',
                        type: 'String',
                        label: 'Time Style',
                        options: [
                            { label: 'Short', value: 'short' },
                            { label: 'Medium', value: 'medium' }
                        ],
                        default: 'short'
                    },
                    { name: 'timeStepMinutes', type: 'Integer', label: 'Time Step (minutes)', supportsResource: true },
                    { name: 'min', type: 'String', label: 'Min Time', supportsResource: true },
                    { name: 'max', type: 'String', label: 'Max Time', supportsResource: true }
                ]
            },
            {
                key: 'validation',
                label: 'Error Messages',
                expanded: false,
                properties: [
                    { name: 'messageWhenValueMissing', type: 'String', label: 'Required Error', supportsResource: true },
                    { name: 'messageWhenRangeOverflow', type: 'String', label: 'Max Time Error', supportsResource: true },
                    { name: 'messageWhenRangeUnderflow', type: 'String', label: 'Min Time Error', supportsResource: true },
                    { name: 'messageWhenBadInput', type: 'String', label: 'Bad Input Error', supportsResource: true }
                ]
            }
        ]
    },
    coreFlowToggle: {
        sections: [
            {
                key: 'display',
                label: 'Display',
                expanded: true,
                properties: [
                    {
                        name: 'label',
                        type: 'String',
                        label: 'Label',
                        supportsResource: true,
                        editorRequired: true,
                        description: 'Shown on the flow screen above the field.'
                    },
                    { name: 'questionNumber', type: 'String', label: 'Badge', default: '1', supportsResource: true },
                    { name: 'messageToggleActive', type: 'String', label: 'Active Label', default: 'Active', supportsResource: true },
                    { name: 'messageToggleInactive', type: 'String', label: 'Inactive Label', default: 'Inactive', supportsResource: true },

                    { name: 'disabled', type: 'Boolean', label: 'Disabled', default: false, compact: true }
                ]
            },
            {
                key: 'value',
                label: 'Value',
                expanded: true,
                properties: [{ name: 'checked', type: 'Boolean', label: 'Checked', supportsResource: true }]
            }
        ]
    },
    coreFlowCheckboxButton: {
        sections: [
            {
                key: 'display',
                label: 'Display',
                expanded: true,
                properties: [
                    {
                        name: 'fieldLabel',
                        type: 'String',
                        label: 'Label',
                        supportsResource: true,
                        editorRequired: true,
                        description: 'Short label shown beside the checkbox on the flow screen.'
                    },
                    { name: 'questionNumber', type: 'String', label: 'Badge', default: '1', supportsResource: true },
                    {
                        name: 'description',
                        type: 'String',
                        label: 'Description',
                        supportsResource: true,
                        editorRequired: true,
                        description: 'Supporting text shown with the checkbox; users need this for context.'
                    }
                ]
            },
            {
                key: 'value',
                label: 'Value',
                expanded: true,
                properties: [{ name: 'checked', type: 'Boolean', label: 'Checked', supportsResource: true }]
            }
        ]
    },
    coreFlowRichText: {
        sections: [
            {
                key: 'display',
                label: 'Display',
                expanded: true,
                properties: [
                    {
                        name: 'label',
                        type: 'String',
                        label: 'Label',
                        supportsResource: true,
                        editorRequired: true,
                        description: 'Shown on the flow screen above the field.'
                    },
                    { name: 'questionNumber', type: 'String', label: 'Badge', default: '1', supportsResource: true },
                    { name: 'placeholder', type: 'String', label: 'Placeholder', supportsResource: true },

                    { name: 'required', type: 'Boolean', label: 'Required', default: false, compact: true }
                ]
            },
            {
                key: 'value',
                label: 'Value',
                expanded: true,
                properties: [{ name: 'value', type: 'String', label: 'Value', supportsResource: true }]
            },
            {
                key: 'constraints',
                label: 'Format & Constraints',
                expanded: false,
                properties: [
                    {
                        name: 'variant',
                        type: 'String',
                        label: 'Toolbar Position',
                        options: [
                            { label: 'Bottom toolbar', value: 'bottom-toolbar' },
                            { label: 'Top toolbar', value: 'top-toolbar' }
                        ],
                        default: 'bottom-toolbar'
                    },
                    { name: 'disabledCategories', type: 'String', label: 'Disabled Categories', default: 'FORMAT_TEXT', supportsResource: true }
                ]
            },
            {
                key: 'validation',
                label: 'Error Messages',
                expanded: false,
                properties: [{ name: 'messageWhenValueMissing', type: 'String', label: 'Required Error', supportsResource: true }]
            }
        ]
    },
    coreFlowSlider: {
        sections: [
            {
                key: 'display',
                label: 'Display',
                expanded: true,
                properties: [
                    {
                        name: 'label',
                        type: 'String',
                        label: 'Label',
                        supportsResource: true,
                        editorRequired: true,
                        description: 'Shown on the flow screen above the field.'
                    },
                    { name: 'questionNumber', type: 'String', label: 'Badge', default: '1', supportsResource: true },

                    { name: 'disabled', type: 'Boolean', label: 'Disabled', default: false, compact: true }
                ]
            },
            {
                key: 'value',
                label: 'Value',
                expanded: true,
                properties: [{ name: 'value', type: 'Integer', label: 'Value', supportsResource: true }]
            },
            {
                key: 'constraints',
                label: 'Format & Constraints',
                expanded: false,
                properties: [
                    { name: 'min', type: 'Integer', label: 'Min', default: 1, supportsResource: true },
                    { name: 'max', type: 'Integer', label: 'Max', default: 99, supportsResource: true },
                    { name: 'step', type: 'Integer', label: 'Step', default: 1, supportsResource: true }
                ]
            }
        ]
    },
    coreFlowCombobox: {
        sections: [
            {
                key: 'display',
                label: 'Display',
                expanded: true,
                properties: [
                    {
                        name: 'label',
                        type: 'String',
                        label: 'Label',
                        supportsResource: true,
                        editorRequired: true,
                        description: 'Shown on the flow screen above the field.'
                    },
                    { name: 'questionNumber', type: 'String', label: 'Badge', default: '1', supportsResource: true },
                    { name: 'placeholder', type: 'String', label: 'Placeholder', default: 'Select an option...', supportsResource: true },
                    { name: 'required', type: 'Boolean', label: 'Required', default: false, compact: true },

                    { name: 'disabled', type: 'Boolean', label: 'Disabled', default: false, compact: true },
                    { name: 'isMultiSelect', type: 'Boolean', label: 'Multi-Select', default: false, compact: true }
                ]
            },
            {
                key: 'value',
                label: 'Value',
                expanded: true,
                properties: [
                    {
                        name: 'value',
                        type: 'String',
                        label: 'Value',
                        supportsResource: true,
                        description:
                            'Bind a String collection variable. One entry when single-select; multiple when Multi-Select is enabled.'
                    }
                ]
            },
            {
                key: 'dataSource',
                label: 'Data Source',
                expanded: true,
                component: 'pflow_cpeDataSource',
                componentConfig: CPE_DATA_SOURCE_STANDARD
            },
            {
                key: 'validation',
                label: 'Error Messages',
                expanded: false,
                properties: [{ name: 'messageWhenValueMissing', type: 'String', label: 'Required Error', supportsResource: true }]
            }
        ]
    },
    coreFlowRadioGroup: {
        sections: [
            {
                key: 'display',
                label: 'Display',
                expanded: true,
                properties: [
                    {
                        name: 'label',
                        type: 'String',
                        label: 'Label',
                        supportsResource: true,
                        editorRequired: true,
                        description: 'Shown on the flow screen above the field.'
                    },
                    { name: 'questionNumber', type: 'String', label: 'Badge', default: '1', supportsResource: true },
                    {
                        name: 'type',
                        type: 'String',
                        label: 'Display Type',
                        options: [
                            { label: 'Radio', value: 'radio' },
                            { label: 'Button', value: 'button' }
                        ],
                        default: 'radio'
                    },
                    { name: 'required', type: 'Boolean', label: 'Required', default: false, compact: true },

                    { name: 'disabled', type: 'Boolean', label: 'Disabled', default: false, compact: true },
                    { name: 'isMultiSelect', type: 'Boolean', label: 'Multi-Select', default: false, compact: true }
                ]
            },
            {
                key: 'value',
                label: 'Value',
                expanded: true,
                properties: [
                    {
                        name: 'value',
                        type: 'String',
                        label: 'Value',
                        supportsResource: true,
                        description:
                            'Bind a String collection. One entry for single-select; multiple when Multi-Select is on.'
                    }
                ]
            },
            {
                key: 'dataSource',
                label: 'Data Source',
                expanded: true,
                component: 'pflow_cpeDataSource',
                componentConfig: CPE_DATA_SOURCE_STANDARD
            },
            {
                key: 'validation',
                label: 'Error Messages',
                expanded: false,
                properties: [{ name: 'messageWhenValueMissing', type: 'String', label: 'Required Error', supportsResource: true }]
            }
        ]
    },
    coreFlowQuickChoice: {
        sections: [
            {
                key: 'display',
                label: 'Display',
                expanded: true,
                properties: [
                    {
                        name: 'masterLabel',
                        type: 'String',
                        label: 'Label',
                        supportsResource: true,
                        editorRequired: true,
                        description: 'Shown on the flow screen above the Quick Choice control.'
                    },
                    { name: 'questionNumber', type: 'String', label: 'Badge', default: '1', supportsResource: true },
                    {
                        name: 'fieldLevelHelp',
                        type: 'String',
                        label: 'Help Text',
                        supportsResource: true,
                        description: 'Optional hint shown below the field on the flow screen.'
                    },
                    { name: 'style_width', type: 'Integer', label: 'Width (px)', default: 320, supportsResource: true },
                    { name: 'required', type: 'Boolean', label: 'Required', default: false, compact: true },

                    { name: 'disabled', type: 'Boolean', label: 'Disabled', default: false, compact: true },
                    { name: 'isMultiSelect', type: 'Boolean', label: 'Multi-Select', default: false, compact: true }
                ]
            },
            {
                key: 'value',
                label: 'Value',
                expanded: true,
                properties: [
                    {
                        name: 'value',
                        type: 'String',
                        label: 'Value',
                        supportsResource: true,
                        description: 'Bind a String collection for selected values (one or more).'
                    }
                ]
            },
            {
                key: 'dataSource',
                label: 'Data Source',
                expanded: true,
                component: 'pflow_cpeDataSource',
                componentConfig: CPE_DATA_SOURCE_QUICK_CHOICE
            },
            {
                key: 'validation',
                label: 'Error Messages',
                expanded: false,
                properties: [{ name: 'messageWhenValueMissing', type: 'String', label: 'Required Error', supportsResource: true }]
            }
        ]
    },
    coreFlowCheckboxGroup: {
        sections: [
            {
                key: 'display',
                label: 'Display',
                expanded: true,
                properties: [
                    {
                        name: 'label',
                        type: 'String',
                        label: 'Label',
                        supportsResource: true,
                        editorRequired: true,
                        description: 'Shown on the flow screen above the field.'
                    },
                    { name: 'questionNumber', type: 'String', label: 'Badge', default: '1', supportsResource: true },
                    { name: 'required', type: 'Boolean', label: 'Required', default: false, compact: true },

                    { name: 'disabled', type: 'Boolean', label: 'Disabled', default: false, compact: true },
                    {
                        name: 'isMultiSelect',
                        type: 'Boolean',
                        label: 'Multi-Select',
                        default: true,
                        compact: true,
                        description: 'When off, renders a single-select radio group.'
                    }
                ]
            },
            {
                key: 'value',
                label: 'Value',
                expanded: true,
                properties: [
                    {
                        name: 'value',
                        type: 'String',
                        label: 'Selected Values',
                        supportsResource: true,
                        description: 'Bind a String collection variable for the selected option values.'
                    }
                ]
            },
            {
                key: 'dataSource',
                label: 'Data Source',
                expanded: true,
                component: 'pflow_cpeDataSource',
                componentConfig: CPE_DATA_SOURCE_STANDARD
            },
            {
                key: 'validation',
                label: 'Error Messages',
                expanded: false,
                properties: [{ name: 'messageWhenValueMissing', type: 'String', label: 'Required Error', supportsResource: true }]
            }
        ]
    },
    coreFlowDualListbox: {
        sections: [
            {
                key: 'display',
                label: 'Display',
                expanded: true,
                properties: [
                    {
                        name: 'label',
                        type: 'String',
                        label: 'Label',
                        supportsResource: true,
                        editorRequired: true,
                        description: 'Shown on the flow screen above the field.'
                    },
                    { name: 'questionNumber', type: 'String', label: 'Badge', default: '1', supportsResource: true },
                    { name: 'sourceLabel', type: 'String', label: 'Available Panel Label', default: 'Available', supportsResource: true },
                    { name: 'selectedOptionsLabel', type: 'String', label: 'Selected Panel Label', default: 'Selected', supportsResource: true },
                    { name: 'required', type: 'Boolean', label: 'Required', default: false, compact: true },

                    { name: 'disabled', type: 'Boolean', label: 'Disabled', default: false, compact: true },
                    {
                        name: 'isMultiSelect',
                        type: 'Boolean',
                        label: 'Multi-Select',
                        default: true,
                        compact: true,
                        description: 'When off, only one value can be selected.'
                    }
                ]
            },
            {
                key: 'value',
                label: 'Value',
                expanded: true,
                properties: [
                    {
                        name: 'value',
                        type: 'String',
                        label: 'Selected Values',
                        supportsResource: true,
                        description: 'Bind a String collection variable for the selected option values.'
                    }
                ]
            },
            {
                key: 'dataSource',
                label: 'Data Source',
                expanded: true,
                component: 'pflow_cpeDataSource',
                componentConfig: CPE_DATA_SOURCE_STANDARD
            },
            {
                key: 'constraints',
                label: 'Selection Limits',
                expanded: false,
                properties: [
                    { name: 'min', type: 'Integer', label: 'Minimum selections', supportsResource: true },
                    { name: 'max', type: 'Integer', label: 'Maximum selections', supportsResource: true }
                ]
            },
            {
                key: 'validation',
                label: 'Error Messages',
                expanded: false,
                properties: [
                    { name: 'messageWhenValueMissing', type: 'String', label: 'Required Error', supportsResource: true },
                    { name: 'messageWhenRangeOverflow', type: 'String', label: 'Too Many Selections', supportsResource: true },
                    { name: 'messageWhenRangeUnderflow', type: 'String', label: 'Too Few Selections', supportsResource: true }
                ]
            }
        ]
    },
    coreFlowLookup: {
        sections: [
            {
                key: 'display',
                label: 'Display',
                expanded: true,
                properties: [
                    {
                        name: 'label',
                        type: 'String',
                        label: 'Label',
                        supportsResource: true,
                        editorRequired: true,
                        description: 'Shown on the flow screen above the field.'
                    },
                    { name: 'questionNumber', type: 'String', label: 'Badge', default: '+', supportsResource: true },
                    { name: 'placeholder', type: 'String', label: 'Placeholder', supportsResource: true },
                    { name: 'iconName', type: 'String', label: 'Icon', default: 'utility:new', supportsResource: true },
                    { name: 'required', type: 'Boolean', label: 'Required', default: false, compact: true },

                    { name: 'isMultiEntry', type: 'Boolean', label: 'Multi-Select', default: false, compact: true }
                ]
            },
            {
                key: 'value',
                label: 'Value',
                expanded: true,
                properties: [
                    { name: 'value', type: 'String', label: 'Selected Value', supportsResource: true },
                    { name: 'defaultValue', type: 'String', label: 'Default Value', supportsResource: true }
                ]
            },
            {
                key: 'dataSource',
                label: 'Data Source',
                expanded: true,
                component: 'pflow_cpeDataSource',
                componentConfig: CPE_DATA_SOURCE_LOOKUP
            },
            {
                key: 'advanced',
                label: 'Advanced',
                expanded: false,
                properties: [
                    { name: 'cascadeRole', type: 'String', label: 'Cascade Role', supportsResource: true },
                    { name: 'scrollAfterNItems', type: 'Integer', label: 'Scroll After N Items', supportsResource: true }
                ]
            },
            {
                key: 'validation',
                label: 'Error Messages',
                expanded: false,
                properties: [{ name: 'messageWhenValueMissing', type: 'String', label: 'Required Error', supportsResource: true }]
            }
        ]
    },
    coreFlowRecordPicker: {
        sections: [
            {
                key: 'display',
                label: 'Display',
                expanded: true,
                properties: [
                    {
                        name: 'label',
                        type: 'String',
                        label: 'Label',
                        supportsResource: true,
                        editorRequired: true,
                        description: 'Shown on the flow screen above the field.'
                    },
                    { name: 'questionNumber', type: 'String', label: 'Badge', default: '+', supportsResource: true },
                    { name: 'placeholder', type: 'String', label: 'Placeholder', supportsResource: true },

                    { name: 'required', type: 'Boolean', label: 'Required', default: false, compact: true },
                    { name: 'disabled', type: 'Boolean', label: 'Disabled', default: false, compact: true }
                ]
            },
            {
                key: 'value',
                label: 'Value',
                expanded: true,
                properties: [{ name: 'value', type: 'String', label: 'Selected Record Id', supportsResource: true }]
            },
            {
                key: 'dataSource',
                label: 'Data Source',
                expanded: true,
                properties: [
                    {
                        name: 'objectApiName',
                        type: 'String',
                        label: 'Object API Name',
                        editorRequired: true,
                        description: 'API name of the object to search (e.g. Account). Required for the picker to load.'
                    },
                    {
                        name: 'primaryField',
                        type: 'String',
                        label: 'Primary Display Field',
                        editorRequired: true,
                        description: 'Field API name shown as the main label in each search result.'
                    },
                    {
                        name: 'additionalDisplayField',
                        type: 'String',
                        label: 'Additional Display Field',
                        description: 'Optional second line of text in each result row.'
                    },
                    {
                        name: 'searchField',
                        type: 'String',
                        label: 'Search Field',
                        editorRequired: true,
                        description: 'Field API name the user query matches against (often the same as the primary display field).'
                    },
                    {
                        name: 'additionalSearchField',
                        type: 'String',
                        label: 'Additional Search Field',
                        description: 'Optional extra field included in search matching.'
                    },
                    {
                        name: 'filterJson',
                        type: 'String',
                        label: 'Filter (JSON)',
                        supportsResource: true,
                        description: 'Optional JSON filter object for lightning-record-picker.'
                    }
                ]
            },
            {
                key: 'validation',
                label: 'Error Messages',
                expanded: false,
                properties: [{ name: 'messageWhenValueMissing', type: 'String', label: 'Required Error', supportsResource: true }]
            }
        ]
    }
};

/**
 * Normalize Flow extensionName (e.g. c:coreFlowTextInput, ns__coreFlowTextInput) to a SCHEMAS key.
 * @param {unknown} raw
 * @returns {string}
 */
export function normalizeFlowExtensionToSchemaKey(raw) {
    if (raw == null || typeof raw !== 'string') {
        return '';
    }
    let s = raw.trim();
    if (!s) {
        return '';
    }
    if (s.includes(':')) {
        s = (s.split(':').pop() || '').trim();
    }
    const parts = s.split('__');
    if (parts.length > 1) {
        s = parts[parts.length - 1].trim();
    }
    if (s.includes('-')) {
        s = s.replace(/-([a-z])/gi, (_, c) => c.toUpperCase());
    }
    return s;
}

/** @param {unknown[]} [fields] @param {object[]} accumulator */
function collectNestedScreenFields(fields, accumulator) {
    if (!Array.isArray(fields)) {
        return;
    }
    for (let fi = 0; fi < fields.length; fi += 1) {
        const f = fields[fi];
        if (!f || typeof f !== 'object') {
            continue;
        }
        accumulator.push(f);
        if (Array.isArray(f.fields)) {
            collectNestedScreenFields(f.fields, accumulator);
        }
    }
}

/** @param {Record<string, unknown> & { screens?: unknown }} [builderContext] */
function listScreensFromBuilderContext(builderContext) {
    if (!builderContext || !builderContext.screens) {
        return [];
    }
    const { screens } = builderContext;
    if (Array.isArray(screens)) {
        return screens.filter((s) => s && typeof s === 'object');
    }
    if (typeof screens === 'object') {
        return Object.values(screens).filter((s) => s && typeof s === 'object');
    }
    return [];
}

/**
 * Resolve SCHEMAS key for the Flow screen field being edited.
 * Flow passes elementInfo.apiName as the field instance API name (not the LWC bundle name).
 * @param {Record<string, unknown> & { apiName?: string }} [elementInfo]
 * @param {Record<string, unknown> & { screens?: unknown }} [builderContext]
 * @returns {string}
 */
export function resolveSchemaKey(elementInfo, builderContext) {
    const pickKey = (candidate) => {
        const k = normalizeFlowExtensionToSchemaKey(candidate);
        return k && SCHEMAS[k] ? k : '';
    };

    if (elementInfo && typeof elementInfo === 'object') {
        const fromInfo =
            pickKey(elementInfo.componentName) ||
            pickKey(elementInfo.descriptor) ||
            pickKey(elementInfo.extensionName);
        if (fromInfo) {
            return fromInfo;
        }
    }

    const instanceName =
        elementInfo && typeof elementInfo === 'object' && elementInfo.apiName != null
            ? String(elementInfo.apiName)
            : '';
    if (!instanceName) {
        return '';
    }

    const direct = pickKey(instanceName);
    if (direct) {
        return direct;
    }

    const screensFromBc = listScreensFromBuilderContext(builderContext);
    for (let si = 0; si < screensFromBc.length; si += 1) {
        const screen = screensFromBc[si];
        const flat = [];
        collectNestedScreenFields(screen.fields || screen.screenFields, flat);
        for (let fi = 0; fi < flat.length; fi += 1) {
            const f = flat[fi];
            if (String(f.name) !== instanceName) {
                continue;
            }
            const ext = f.extensionName || f.extension || f.componentName;
            const key = pickKey(ext);
            if (key) {
                return key;
            }
        }
    }

    return '';
}

/**
 * @param {string} apiName Schema key from resolveSchemaKey (e.g. coreFlowTextInput)
 */
export function getSchemaForComponent(apiName) {
    if (!apiName || !SCHEMAS[apiName]) {
        return { sections: [] };
    }
    return SCHEMAS[apiName];
}

/**
 * Sections with at least one editable field OR an embedded CPE sub-component (e.g. data source editor).
 * @param {string} apiName
 */
export function getActiveSections(apiName) {
    const schema = getSchemaForComponent(apiName);
    return schema.sections.filter(
        (s) =>
            (Array.isArray(s.properties) && s.properties.length > 0) ||
            (typeof s.component === 'string' && s.component.length > 0)
    );
}

/**
 * Section keys that start expanded (for lightning-accordion initial open state only).
 * @param {string} apiName
 * @returns {string[]}
 */
export function getDefaultAccordionOpenKeys(apiName) {
    return getActiveSections(apiName).filter((s) => s.expanded).map((s) => s.key);
}
