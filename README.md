# Professor Flow | CPE Toolkit

Reusable building blocks for Salesforce Flow **Custom Property Editors (CPEs)** — field pickers, a visual WHERE-clause builder, flow-resource picker, data-source selector, validation mixin, and a unified schema-driven property-editor container.

Drop these components into your own CPE LWC and skip the boilerplate.

## What's included (v1.0)

**Core infrastructure**
- `pflow_cpePropertyEditor` — schema-driven CPE container (exposed to `lightning__FlowScreen`)
- `pflow_cpeValidationMixin` — Flow three-method validation contract (`validate` / `setCustomValidity` / `reportValidity`)
- `pflow_cpeQuestionField` — standard field-row layout (badge / label / help / error / slot)

**Pickers & widgets**
- `pflow_cpeFieldPicker` — single SObject field picker with type icons
- `pflow_cpeMultiFieldPicker` — multi-select field picker with pills
- `pflow_cpeWhereBuilder` — visual WHERE clause builder (operators filtered by field type, AND/OR)
- `pflow_cpeOrderLimit` — ORDER BY + LIMIT configuration
- `pflow_cpeDataSource` — six-mode data source selector (Picklist / SOQL / SOSL / Collections / Visual)
- `pflow_cpeResourcePicker` — Flow variable / merge-field / literal picker
- `pflow_cpeCustomLookup` — debounced searchable lookup primitive
- `pflow_cpeCheckbox` — boolean toggle with Flow CB_TRUE/CB_FALSE wire format

**Utilities**
- `pflow_cpeFieldCache` — LRU field metadata cache shared across pickers
- `pflow_cpeResourcePickerUtils` — merge-field parsing helpers
- `pflow_cpeDataSourceUtils` — data-source mode transforms

**Apex**
- `PFlowCpeChoiceEngineController` — unified server API for object/field pickers, SOQL/SOSL search, dataset validation
- `PFlowCpeChoiceEngineLog` — logging wrapper (Nebula Logger compatible)

## Install

TODO — production and sandbox unmanaged-package URLs will be added after first package build.

For now, clone and deploy:

```
sf project deploy start -d force-app -o <org-alias>
```

## Quick start

Wire the property editor into your CPE LWC's `*.js-meta.xml`:

```xml
<targetConfig targets="lightning__FlowScreen">
  <property name="myField" label="My Field" type="String" />
</targetConfig>
<configurationEditor>c-pflow-cpe-property-editor</configurationEditor>
```

Extend the validation mixin in your runtime screen LWC:

```js
import { LightningElement } from 'lwc';
import { FlowValidationMixin } from 'c/pflow_cpeValidationMixin';

export default class MyField extends FlowValidationMixin(LightningElement) {
  @api myValue;
  getInternalError() {
    return this.myValue ? null : 'Required';
  }
}
```

## Documentation

Full component reference and tutorial: [professorflow.com/components/pflow-cpe-toolkit](https://professorflow.com/components/pflow-cpe-toolkit)

## License

Apache-2.0. Portions adapted from [UnofficialSF FlowScreenComponentsBasePack](https://github.com/UnofficialSF/LightningFlowComponents) by Eric Smith — attribution preserved in individual file headers.
