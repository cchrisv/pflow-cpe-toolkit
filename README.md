# Professor Flow | CPE Toolkit

Reusable building blocks for Salesforce Flow **Custom Property Editors (CPEs)** — field pickers, a visual WHERE-clause builder, flow-resource picker, data-source selector, searchable lookup, validation mixin, and a shared field-metadata cache.

Drop these into your own CPE LWC and skip the boilerplate. **Zero of the pack's 9 widget components appear in the Flow screen palette** — they're all internal-use LWCs (`isExposed=false`) consumed by your hand-written CPE.

> **Unavoidable caveat:** the CPE LWC *you* write for *your* runtime component will appear in the Flow screen palette. That's the Salesforce LWC spec — any LWC referenced by `configurationEditor` must have `<target>lightning__FlowScreen</target>` + `<isExposed>true</isExposed>`, and that combination puts it in the palette. The accepted industry convention is to prefix the masterLabel with `_` (sorts to bottom) and add `(Builder Only)` to warn admins not to drop it directly.

## What's included (v1.0) — 9 pack LWCs + 1 Apex controller + 1 reference demo

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

### Reference demo (optional — not part of the core pack)

- **`demoWidgetsDirect`** + **`_ demoWidgetsDirectCpe`** — a runtime component that renders a summary of its configured values, paired with a hand-rolled CPE that composes every widget. Use as a copy-paste starting point for your own CPE LWC.

## Install

Clone and deploy:

```bash
sf project deploy start -d force-app -o <org-alias>
```

(Unmanaged package URLs will be published after the first package build.)

## Architecture

The toolkit ships **pure reusable widgets**. Every pack LWC has `isExposed=false` so none of them clutter the Flow screen palette. You write your own CPE LWC (one per runtime component) and drop our widgets into its template.

**Why no shared PropertyEditor?** A shared schema-driven CPE either requires a merge-conflict-magnet `schemaData.js` file (coreFlow's original pattern) or forces each consumer to ship a wrapper CPE that appears in the palette. Neither scales. Hand-rolled CPEs give you full control over layout, validation, and conditional visibility with minimal boilerplate when the widgets handle the hard parts.

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
  <targets>
    <target>lightning__FlowScreen</target>
  </targets>
</LightningComponentBundle>
```

Your CPE will appear in the palette (one per runtime component) — that's unavoidable for LWC CPEs per the Salesforce spec. Prefix its master label with `_` to sort it to the bottom and add `(Builder Only)` to warn users.

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

## Working demo

The repo includes a reference implementation in `force-app/main/default/lwc/demoWidgetsDirect*` — a runtime component that renders a summary of its configured values (SObject, sort field, additional fields, WHERE clause, order + limit) paired with a hand-rolled CPE that exercises every widget in the toolkit:

- `c-pflow-molecule-custom-lookup` wired to `searchSObjectTypes` (SObject picker)
- `c-pflow-molecule-field-picker` in single and multi modes
- `c-pflow-organism-where-builder`
- `c-pflow-molecule-order-limit`

Deploy the pack + demo, drop **Demo | Widgets Direct** onto a Flow screen, and the full pattern renders end-to-end. The wrapper CPE is underscore-prefixed (`_ Demo | Widgets Direct CPE`) so it sorts to the bottom of the palette out of the way of the runtime component.

## License

Apache-2.0. Portions adapted from [UnofficialSF FlowScreenComponentsBasePack](https://github.com/UnofficialSF/LightningFlowComponents) by Eric Smith — attribution preserved in individual file headers and in [NOTICE](NOTICE).
