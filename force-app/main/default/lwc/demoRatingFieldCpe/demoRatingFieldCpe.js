import { api, LightningElement } from 'lwc';

/**
 * Demo wrapper CPE for `demoRatingField`.
 *
 * Delegates the entire configuration UI to `c-pflow-organism-property-editor`
 * by passing an @api schema describing the properties to edit. This is the
 * canonical "bring your own schema" pattern for the CPE Toolkit — new CPEs
 * only need to ship a schema object, not custom HTML/JS for each property row.
 */
export default class DemoRatingFieldCpe extends LightningElement {
    /** Flow Builder passes these through; the property editor consumes them directly. */
    @api builderContext;
    @api inputVariables;
    @api automaticOutputVariables;
    @api elementInfo;
    @api genericTypeMappings;

    schema = [
        {
            key: 'display',
            label: 'Display',
            expanded: true,
            properties: [
                {
                    name: 'label',
                    type: 'String',
                    label: 'Screen Label',
                    placeholder: 'e.g. How would you rate this?',
                    editorRequired: true
                },
                {
                    name: 'maxStars',
                    type: 'Integer',
                    label: 'Max Stars',
                    default: 5,
                    description: 'Number of stars shown (e.g. 5 for a 1–5 scale).'
                }
            ]
        },
        {
            key: 'validation',
            label: 'Validation',
            expanded: false,
            properties: [
                {
                    name: 'required',
                    type: 'Boolean',
                    label: 'Required',
                    description: 'If on, the user must click a star before moving to the next screen.'
                }
            ]
        }
    ];
}
