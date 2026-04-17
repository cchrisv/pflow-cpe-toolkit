import { api, LightningElement } from 'lwc';

/**
 * Stress-test wrapper CPE. Passes a schema to
 * `c-pflow-organism-property-editor` that exercises every rendering
 * path in the Property Editor:
 *
 *   - String (plain)
 *   - String with `pattern` name → regex-preset combobox + sample tester
 *   - Integer
 *   - Boolean (non-compact toggle)
 *   - Boolean (compact — rendered in the toggle grid at section bottom)
 *   - Date
 *   - DateTime
 *   - Picklist (options array → combobox)
 *   - String with `supportsResource: true` → Resource Picker with merge-fields
 */
export default class DemoKitchenSinkCpe extends LightningElement {
    @api builderContext;
    @api inputVariables;
    @api automaticOutputVariables;
    @api elementInfo;
    @api genericTypeMappings;

    schema = [
        {
            key: 'basic',
            label: 'Basic Inputs',
            expanded: true,
            properties: [
                {
                    name: 'label',
                    type: 'String',
                    label: 'Label',
                    placeholder: 'e.g. Kitchen Sink',
                    editorRequired: true
                },
                {
                    name: 'textValue',
                    type: 'String',
                    label: 'Text Value',
                    description: 'A regular text input.'
                },
                {
                    name: 'pattern',
                    type: 'String',
                    label: 'Pattern',
                    description: 'Regex validation pattern — renders the preset combobox + sample tester.'
                }
            ]
        },
        {
            key: 'numbersAndDates',
            label: 'Numbers & Dates',
            expanded: true,
            properties: [
                {
                    name: 'count',
                    type: 'Integer',
                    label: 'Count',
                    default: 0,
                    description: 'Integer input (uses lightning-input type="number" step="1").'
                },
                {
                    name: 'goLive',
                    type: 'Date',
                    label: 'Go Live Date',
                    description: 'Date input.'
                },
                {
                    name: 'deadline',
                    type: 'DateTime',
                    label: 'Deadline',
                    description: 'Date-time input.'
                }
            ]
        },
        {
            key: 'booleansAndPicklist',
            label: 'Booleans & Picklist',
            expanded: false,
            properties: [
                {
                    name: 'priority',
                    type: 'String',
                    label: 'Priority',
                    description: 'Picklist rendered as a combobox (options[] array present).',
                    options: [
                        { label: 'Low', value: 'low' },
                        { label: 'Medium', value: 'med' },
                        { label: 'High', value: 'high' }
                    ]
                },
                {
                    name: 'active',
                    type: 'Boolean',
                    label: 'Active',
                    description: 'Full-width boolean toggle.'
                },
                {
                    name: 'showHeader',
                    type: 'Boolean',
                    label: 'Show Header',
                    compact: true,
                    description: 'Compact boolean — rendered in the toggle grid.'
                }
            ]
        },
        {
            key: 'resources',
            label: 'Flow Resources',
            expanded: false,
            properties: [
                {
                    name: 'defaultOwner',
                    type: 'String',
                    label: 'Default Owner',
                    supportsResource: true,
                    description: 'String with supportsResource:true → renders the Resource Picker with merge-fields.'
                }
            ]
        }
    ];
}
