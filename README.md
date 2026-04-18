# Professor Flow | CPE Toolkit

Reusable building blocks for Salesforce Flow **Custom Property Editors (CPEs)** — field pickers, a visual WHERE-clause builder, flow-resource picker, data-source selector, searchable lookup, validation mixin, and a shared field-metadata cache.

Drop these into your own CPE LWC and skip the boilerplate. **None of the pack's 9 widget components appear in the Flow screen palette** — they're all `isExposed=false`, used only from inside your CPE LWC.

> **Caveat:** the CPE LWC *you* write for *your* runtime component will appear in the palette. That's the Salesforce LWC spec — any LWC referenced by `configurationEditor` must have `<target>lightning__FlowScreen</target>` + `<isExposed>true</isExposed>`, which forces palette exposure. The accepted convention is to prefix its masterLabel with `_` (sorts to bottom) and add `(Builder Only)` to warn admins.

## What's included — 9 LWCs + 1 Apex controller

### Atom

- **`pflowAtomCheckbox`** — Flow CB_TRUE/CB_FALSE boolean toggle for CPE rows.

### Molecules

- **`pflowMoleculeFieldPicker`** — Single or multi-select SObject field picker. Toggle modes with `@api isMultiEntry`.
- **`pflowMoleculeOrderLimit`** — ORDER BY field + direction + LIMIT (clamped 0–2000).
- **`pflowMoleculeCustomLookup`** — Searchable lookup primitive with debounce + title-token highlighting.

### Organisms

- **`pflowOrganismWhereBuilder`** — Visual WHERE clause builder (operators filtered by field type, AND/OR).
- **`pflowOrganismDataSource`** — Six-mode data-source selector (Collections / Picklist / Visual / SOQL / SOSL).
- **`pflowOrganismResourcePicker`** — Flow variable / merge-field / literal picker (adapted from UnofficialSF `fsc_flowPicker3`).

### Utilities

- **`pflowUtilityValidationMixin`** — `FlowValidationMixin` — the Flow three-method validation contract (`validate` / `setCustomValidity` / `reportValidity`).
- **`pflowUtilityCpeHelpers`** — Pure helpers: field-metadata LRU cache, merge-field reference parsing, data-source mode resolution.

### Apex

- **`PFlowCpeChoiceEngineController`** + **`PFlowCpeChoiceEngineControllerTest`** — Unified `@AuraEnabled` API: object/field describe, SOQL/SOSL search, picklist values, record-type options, configuration validation. All dynamic SOQL enforces `AccessLevel.USER_MODE`. 37 tests, 81% coverage.

## Install

```bash
sf project deploy start -d force-app -o <org-alias>
```

(Unmanaged package URLs will be published after the first package build.)

## Quick start — build a CPE for your own Flow screen component

### 1. Your runtime LWC

`myRatingField.js-meta.xml`:

```xml
<targetConfig targets="lightning__FlowScreen" configurationEditor="c-my-rating-field-cpe">
  <property name="label"    type="String"  label="Screen Label" />
  <property name="maxStars" type="Integer" label="Max Stars" default="5" />
  <property name="required" type="Boolean" label="Required" />
</targetConfig>
```

### 2. Your CPE LWC (uses our widgets)

`myRatingFieldCpe.html`:

```html
<template>
  <c-pflow-molecule-field-picker
    label="Sort field"
    object-api-name={objectApiName}
    value={sortField}
    field-level-help="Field to sort the rating data by."
    onfieldchange={handleSortFieldChange}
  ></c-pflow-molecule-field-picker>

  <c-pflow-organism-where-builder
    object-api-name={objectApiName}
    value={whereClause}
    onwherechange={handleWhereChange}
  ></c-pflow-organism-where-builder>

  <c-pflow-molecule-order-limit
    object-api-name={objectApiName}
    order-by-field={orderField}
    order-by-direction={orderDirection}
    query-limit={queryLimit}
    onorderchange={handleOrderChange}
    onlimitchange={handleLimitChange}
  ></c-pflow-molecule-order-limit>
</template>
```

`myRatingFieldCpe.js`:

```js
import { api, LightningElement } from 'lwc';
const VALUE_CHANGED = 'configuration_editor_input_value_changed';
export default class MyRatingFieldCpe extends LightningElement {
  @api builderContext;
  @api inputVariables;
  _fire(name, value, type) {
    this.dispatchEvent(new CustomEvent(VALUE_CHANGED, {
      bubbles: true, composed: true,
      detail: { name, newValue: value ?? null, newValueDataType: type }
    }));
  }
  handleSortFieldChange(e) { this._fire('sortField', e.detail.fieldApiName, 'String'); }
  // ...
}
```

`myRatingFieldCpe.js-meta.xml`:

```xml
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
  <apiVersion>66.0</apiVersion>
  <isExposed>true</isExposed>
  <masterLabel>_ My Rating Field CPE (Builder Only)</masterLabel>
  <targets>
    <target>lightning__FlowScreen</target>
  </targets>
</LightningComponentBundle>
```

### 3. Extend the validation mixin in your runtime LWC

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

## Reference demo

A copy-paste starting point lives in [`examples/lwc/`](examples/) — a runtime component that renders a summary of its configured values, paired with a hand-rolled CPE that composes every widget. See [`examples/README.md`](examples/README.md) for details on deploying it separately.

## License

Apache-2.0. Portions adapted from [UnofficialSF FlowScreenComponentsBasePack](https://github.com/UnofficialSF/LightningFlowComponents) by Eric Smith — attribution preserved in individual file headers and in [NOTICE](NOTICE).
