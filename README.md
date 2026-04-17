# Professor Flow | CPE Toolkit

Reusable building blocks for Salesforce Flow **Custom Property Editors (CPEs)** — field pickers, a visual WHERE-clause builder, flow-resource picker, data-source selector, searchable lookup, validation mixin, and a pluggable schema-driven property-editor container.

Drop these into your own CPE LWC and skip the boilerplate.

## Installed as a single package

The toolkit ships as **one installable package**. Components depend on each other internally (pickers compose the lookup, the data source composes the WHERE builder, etc.), so there's no individual-component install. Install the pack once, use any combination of widgets.

## What's included (v1.0) — 10 LWCs + 1 Apex controller

### Atom

- **`pflowAtomCheckbox`** — Flow CB_TRUE/CB_FALSE boolean toggle for CPE rows.

### Molecules

- **`pflowMoleculeFieldPicker`** — Single or multi-select SObject field picker with type icons. Toggle modes with `@api isMultiEntry`.
- **`pflowMoleculeOrderLimit`** — ORDER BY field + direction + LIMIT (clamped 0–2000).
- **`pflowMoleculeCustomLookup`** — Searchable lookup primitive with debounce + title-token highlighting. Used internally by the pickers but exposed for custom UIs.

### Organisms

- **`pflowOrganismPropertyEditor`** — Pluggable schema-driven CPE container. Accepts `@api schema` from a wrapper CPE — no shared schemaData file.
- **`pflowOrganismWhereBuilder`** — Visual WHERE clause builder (operators filtered by field type, AND/OR).
- **`pflowOrganismDataSource`** — Six-mode data-source selector (Single/Dual String Collections, Picklist Field, Visual Text Box, SOQL Lookup, SOSL Search).
- **`pflowOrganismResourcePicker`** — Flow variable / merge-field / literal picker (adapted from UnofficialSF `fsc_flowPicker3`).

### Utilities

- **`pflowUtilityValidationMixin`** — `FlowValidationMixin` — the Flow three-method validation contract (`validate` / `setCustomValidity` / `reportValidity`).
- **`pflowUtilityCpeHelpers`** — Pure helpers: field-metadata LRU cache, merge-field reference parsing, data-source mode resolution.

### Apex

- **`PFlowCpeChoiceEngineController`** — Unified @AuraEnabled API: object/field describe, SOQL/SOSL search, picklist values, record-type options, configuration validation. All dynamic SOQL enforces `AccessLevel.USER_MODE`.

## Install

The unmanaged package URLs will be published after the first packaging run.

For now, clone and deploy:

```bash
sf project deploy start -d force-app -o <org-alias>
```

## Quick start — build a CPE for your own Flow screen component

The Property Editor is a **pluggable container**: each consuming LWC provides its own schema via a thin wrapper CPE.

### 1. Your runtime LWC

`myRatingField.js-meta.xml`:

```xml
<targetConfig targets="lightning__FlowScreen">
  <property name="label"    type="String"  label="Screen Label" />
  <property name="maxStars" type="Integer" label="Max Stars" default="5" />
  <property name="required" type="Boolean" label="Required" />
</targetConfig>
<configurationEditor>c-my-rating-field-cpe</configurationEditor>
```

### 2. Your wrapper CPE LWC (10 lines)

`myRatingFieldCpe.html`:

```html
<template>
  <c-pflow-organism-property-editor schema={schema}></c-pflow-organism-property-editor>
</template>
```

`myRatingFieldCpe.js`:

```js
import { LightningElement } from 'lwc';

export default class MyRatingFieldCpe extends LightningElement {
  schema = [
    {
      key: 'display',
      label: 'Display',
      expanded: true,
      properties: [
        { name: 'label',    type: 'String',  label: 'Screen Label' },
        { name: 'maxStars', type: 'Integer', label: 'Max Stars', default: 5 },
        { name: 'required', type: 'Boolean', label: 'Required' }
      ]
    }
  ];
}
```

`myRatingFieldCpe.js-meta.xml`:

```xml
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
  <apiVersion>66.0</apiVersion>
  <isExposed>true</isExposed>
  <targets>
    <target>lightning__FlowScreen</target>
  </targets>
</LightningComponentBundle>
```

### 3. Add our widgets inside your own CPE (if you skip the Property Editor)

```html
<c-pflow-molecule-field-picker
  label="Field to sort by"
  object-api-name={objectApiName}
  value={sortField}
  onfieldchange={handleSortFieldChange}
></c-pflow-molecule-field-picker>

<c-pflow-organism-where-builder
  object-api-name={objectApiName}
  value={whereClause}
  onwherechange={handleWhereChange}
></c-pflow-organism-where-builder>
```

### 4. Extend the validation mixin in your runtime LWC

```js
import { LightningElement, api } from 'lwc';
import { FlowValidationMixin } from 'c/pflowUtilityValidationMixin';

export default class MyRatingField extends FlowValidationMixin(LightningElement) {
  @api value;
  @api required;

  getInternalError() {
    return this.required && !this.value ? 'This field is required' : null;
  }
}
```

## Architecture

Atomic design following the meridian LWC standard: `{appPrefix}{AtomicLevel}{ComponentName}`. The toolkit has **0 Atoms, 3 Molecules, 4 Organisms, 2 Utilities, 1 Checkbox Atom** — deliberately shallow since CPEs are fundamentally form rows with a few complex composite widgets.

Internal composition:

```
pflowOrganismDataSource → pflowMoleculeCustomLookup + pflowMoleculeFieldPicker + pflowOrganismResourcePicker
pflowMoleculeFieldPicker → pflowMoleculeCustomLookup + pflowUtilityCpeHelpers
pflowOrganismResourcePicker → pflowUtilityCpeHelpers
pflowOrganismWhereBuilder → pflowMoleculeCustomLookup
All pickers share the field-metadata LRU cache via pflowUtilityCpeHelpers.
```

## Documentation

Full component reference and tutorial: [professorflow.com/components/pflow-cpe-toolkit](https://professorflow.com/components/pflow-cpe-toolkit)

## License

Apache-2.0. Portions adapted from [UnofficialSF FlowScreenComponentsBasePack](https://github.com/UnofficialSF/LightningFlowComponents) by Eric Smith — attribution preserved in individual file headers and in [NOTICE](NOTICE).
