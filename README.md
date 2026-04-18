# Professor Flow | CPE Toolkit

Reusable building blocks for Salesforce Flow **Custom Property Editors (CPEs)** — field pickers, a visual WHERE-clause builder, flow-resource picker, data-source selector, searchable lookup, validation mixin, and a shared field-metadata cache.

Drop these into your own CPE LWC and skip the boilerplate. **None of the pack's 9 widget components appear in the Flow screen palette** — they're all `isExposed=false`, used only from inside your CPE LWC.

> **Caveat about your own CPE:** any CPE LWC *you* write and reference via `configurationEditor` must have `<target>lightning__FlowScreen</target>` + `<isExposed>true</isExposed>` per the Salesforce spec. That combination forces it into the Flow screen palette — unavoidable for LWC-based CPEs. Prefix its `masterLabel` with `_` so it sorts to the bottom, and append `(Builder Only)` to warn admins not to drop it directly.

---

## Install

```bash
sf project deploy start -d force-app -o <org-alias>
```

Apex: 37 tests pass, 81% class coverage. See [`examples/`](examples/) for a reference CPE you can deploy separately.

---

## Component reference

Every prop column uses the same convention:

- **Prop** — the `@api` name (camelCase in JS, kebab-case in HTML).
- **Type** — JS type. `getter/setter` means the prop has read-side coercion.
- **Default** — declared default (empty if required or `undefined`).
- **Notes** — behavior, coercion, interaction with other props.

---

### `pflowAtomCheckbox`

Atom. Boolean toggle using Flow's legacy `CB_TRUE`/`CB_FALSE` string wire format that CPEs expect when storing a boolean property. Renders a `lightning-input type="toggle"`.

**Props**

| Prop | Type | Default | Notes |
|---|---|---|---|
| `label` | string | — | Displayed next to the toggle. |
| `name` | string | — | Echoed back in `checkboxchanged.detail.id`. |
| `checked` | boolean \| string | — | Accepts `true`, `'true'`, or `'CB_TRUE'` as checked. Everything else is unchecked. |
| `fieldLevelHelp` | string | — | Renders the native ⓘ tooltip icon next to the label. |
| `disabled` | boolean | — | Disables the toggle. |

**Events**

| Event | `detail` shape | Fires when |
|---|---|---|
| `checkboxchanged` | `{ id, newValue: boolean, newValueDataType: 'Boolean', newStringValue: 'CB_TRUE' \| 'CB_FALSE' }` | User toggles. |

**Gotchas**

- Use this instead of a raw `lightning-input type="toggle"` inside a CPE. Flow Builder stores CPE booleans as the string `'CB_TRUE'` / `'CB_FALSE'`, not JS booleans. If you skip this component, you'll set the wrong wire type and values won't round-trip through `inputVariables`.

---

### `pflowMoleculeCustomLookup`

Molecule. Searchable combobox primitive with debounced search, token-highlighted results, keyboard nav, and multi-select pill mode. You feed it results via `setSearchResults()` from an `onsearch` handler.

**Props**

| Prop | Type | Default | Notes |
|---|---|---|---|
| `label` | string | `'Search'` | — |
| `placeholder` | string | `''` | — |
| `variant` | string | `'label-stacked'` | `'label-stacked'` shows an external label; `'label-hidden'` hides it (use when a parent component already renders the label, e.g. FieldPicker in multi mode). |
| `required` | boolean | `false` | — |
| `disabled` | boolean | `false` | — |
| `isMultiEntry` | boolean | `false` | When true, selections become pills. When false, single-select. |
| `minSearchTermLength` | number | `2` | Minimum characters before `search` fires. Set to `0` to fire on focus. |
| `scrollAfterNItems` | number \| null | `null` | If set, result list scrolls after this many items. |
| `messageWhenValueMissing` | string | `'A selection is required.'` | Shown when `required` is set and nothing selected. |
| `fieldLevelHelp` | string | — | ⓘ tooltip next to the external label (when `variant='label-stacked'`). |
| `errors` | `{ id, message }[]` | `[]` | External errors shown inline under the input. |
| `newRecordOptions` | `{ value, label, defaults? }[]` | `[]` | Adds "+ New Record" entries at the bottom of the dropdown. Fires `newrecord` on click. |
| `selection` | `Row \| Row[]` | — | Preselected row(s). See Row shape below. |

**`Row` shape passed to `setSearchResults()` / returned by `getSelection()`**

```ts
{
  id: string,        // value stored on selection
  title: string,     // primary text
  subtitle?: string, // secondary text under title
  icon?: string,     // SLDS utility or standard icon name
  sObjectType?: string  // optional type hint rendered as a badge
}
```

**Public methods (`@api`)**

- `setSearchResults(rows: Row[])` — call from your `onsearch` handler with Apex results.
- `setDefaultResults(rows: Row[])` — shown when dropdown opens without a search term.
- `getSelection(): Row | Row[]` — current selection (array in multi mode, single object otherwise).
- `selection = null` — assign to clear the selection.

**Events**

| Event | `detail` shape | Fires when |
|---|---|---|
| `search` | `{ rawSearchTerm: string }` | User types (after `minSearchTermLength` gate + debounce). |
| `selectionchange` | varies; call `getSelection()` for the current state | User picks or removes a row. |
| `newrecord` | `{ value }` | User clicks a `newRecordOptions` entry. |

**Gotchas**

- **You own the data.** This component never queries Apex directly. Wire `onsearch` to your server call and call `setSearchResults`.
- `minSearchTermLength: 0` is useful for "list everything" pickers, but be ready for a fire on mount — set `setDefaultResults()` first.
- When used inside FieldPicker multi mode, the parent renders the label; pass `variant="label-hidden"` to avoid double labels.

---

### `pflowMoleculeFieldPicker`

Molecule. SObject field picker in single or multi mode. Uses the shared field-metadata cache in `pflowUtilityCpeHelpers` so N pickers for the same object share one Apex describe call.

**Props**

| Prop | Type | Default | Notes |
|---|---|---|---|
| `label` | string | `''` | — |
| `required` | boolean | `false` | Forwarded to the underlying lookup. |
| `disabled` | boolean | `false` | — |
| `fieldLevelHelp` | string | — | ⓘ tooltip next to the label. |
| `placeholder` | string | `'Search fields...'` | — |
| `isMultiEntry` | boolean | `false` | When true, pills + CSV value. When false, single-select + event-delivered api name. |
| `fieldTypeFilter` | string | `''` | Comma-separated `Schema.DisplayType` names (e.g. `'PICKLIST,MULTIPICKLIST'`). Empty = all types. Whitespace tolerated. |
| `value` (getter/setter) | string | `''` | Single mode: field API name. Multi mode: comma-separated API names. |
| `objectApiName` (getter/setter) | string | `''` | When this changes, the cache is re-queried and downstream selections reset. |

**Events**

| Event | `detail` shape | Mode |
|---|---|---|
| `fieldchange` | `{ fieldApiName, fieldLabel, fieldType }` | single-select only |
| `change` | `{ value: string \| null }` (CSV of api names) | multi-select only |

**Gotchas**

- **Two different events for two modes.** Don't wire both — pick the one that matches `isMultiEntry`.
- `fieldTypeFilter` filters the dropdown but **does not validate** `value` — if the consumer injects a value whose field type doesn't match, the pill still renders (with a fallback icon).
- Changing `objectApiName` resets the internal cache for the old object (bounded LRU of 10 objects across all pickers; see `pflowUtilityCpeHelpers`).
- Single mode emits `fieldchange`, not `change`. Multi mode is the opposite. This asymmetry matches the original coreFlow contract.

---

### `pflowMoleculeOrderLimit`

Molecule. ORDER BY field + direction picker + optional LIMIT input. Uses `searchLookupDatasetFieldsForObject` under the hood for the ORDER field lookup.

**Props**

| Prop | Type | Default | Notes |
|---|---|---|---|
| `disabled` | boolean | `false` | Disables all three inputs. |
| `objectApiName` (getter/setter) | string | `''` | Required before the ORDER field picker can show results. |
| `orderByField` (getter/setter) | string | `''` | API name of the sort field. |
| `orderByDirection` (getter/setter) | string | `'DESC'` | Setter coerces anything that isn't exactly `'ASC'` to `'DESC'`. |
| `queryLimit` (getter/setter) | number \| string | `''` | Clamped 0–2000 on input change; stored as string internally. |

**Events**

| Event | `detail` shape | Fires when |
|---|---|---|
| `orderchange` | `{ orderByField: string \| null, orderByDirection: 'ASC' \| 'DESC' }` | User picks a field or changes direction. |
| `limitchange` | `{ queryLimit: number \| null }` | User changes the limit. |

**Gotchas**

- Empty limit input dispatches `{ queryLimit: null }`, not `0`. Distinguish intentionally-unlimited (`null`) from zero.
- Direction is always uppercase in events regardless of case-fold input.
- The ORDER field picker uses the dataset API (`searchLookupDatasetFieldsForObject`), which returns only fields safe to sort on (skips formulas / long text / etc.).

---

### `pflowOrganismWhereBuilder`

Organism. Visual WHERE clause builder — one row per condition, operators filtered by field type, AND/OR logic between rows. Emits a composable SOQL fragment.

**Props**

| Prop | Type | Default | Notes |
|---|---|---|---|
| `disabled` | boolean | `false` | — |
| `builderContext` | Flow builderContext | — | Required to resolve flow merge fields in condition values. |
| `automaticOutputVariables` | Flow auto outputs | — | Required for merge-field completion. |
| `maxWidth` | number | `280` | px width cap for inline pickers. |
| `objectApiName` (getter/setter) | string | `''` | Required. Changes reset conditions. |
| `value` (getter/setter) | string | `''` | SOQL WHERE fragment. Parsed on set, serialized on emit. Unparseable input is treated as raw mode. |

**Events**

| Event | `detail` shape | Fires when |
|---|---|---|
| `change` | `{ value: string \| null }` (SOQL WHERE fragment) | Row add/remove, operator change, AND/OR toggle, value edit. |

**Operator sets (filtered by field type)**

- Text-like (`STRING`, `TEXTAREA`, `URL`, `EMAIL`, `PHONE`, `ENCRYPTEDSTRING`): `=`, `!=`, `LIKE`, `NOT LIKE`, `IN`, `NOT IN`
- Numeric (`INTEGER`, `LONG`, `DOUBLE`, `CURRENCY`, `PERCENT`): `=`, `!=`, `<`, `>`, `<=`, `>=`
- Boolean: `=`, `!=`
- Date/DateTime/Time: `=`, `!=`, `<`, `>`, `<=`, `>=`
- Picklist: `=`, `!=`, `IN`, `NOT IN`
- Multi-picklist: `INCLUDES`, `EXCLUDES`
- Reference: `=`, `!=`, `IN`, `NOT IN`

**Gotchas**

- `IN` / `NOT IN` values should be comma-separated (e.g. `a, b, c`); the builder strips parens and single-quotes on parse, wraps them back on serialize.
- Mixed AND/OR in one clause falls through to raw-text mode (visual editor returns `null` from parse, user edits SOQL directly).
- `value` set with unparseable SOQL is preserved as-is and rendered in raw mode — no data loss.
- `LIKE` / `NOT LIKE` wrap input in `%...%` on serialize and strip it on parse; users type literal fragments.

---

### `pflowOrganismDataSource`

Organism. Six-mode data-source selector for choice components. Wraps FieldPicker + WhereBuilder + OrderLimit + ResourcePicker + CustomLookup for complete dataset configuration.

**Modes** (select via the Input Mode combobox):

| Mode | Intent | Inputs |
|---|---|---|
| **Single String Collection** | Manually enter one collection — label and value identical | Choice Values textarea |
| **Dual String Collections** | Zip labels + values by index | Choice Labels textarea, Choice Values textarea |
| **Picklist Field** | Derive choices from a picklist field's LDS wire | Object picker, Picklist field picker, optional record-type, dependent-picklist controls |
| **Visual Text Box** | Visual card/icon grid | Titles, descriptions, icons collections |
| **SOQL Lookup** | Query records at runtime | Object picker, Where builder, Order/Limit, display/value/subtitle field pickers |
| **SOSL Search** | Free-text SOSL search | Object picker, display/value/subtitle, SOSL snippet controls |

**Props**

| Prop | Type | Default | Notes |
|---|---|---|---|
| `builderContext` | Flow builderContext | — | Passed through to inner ResourcePicker. Required for merge-field resolution. |
| `automaticOutputVariables` | Flow auto outputs | — | Required for merge-field completion. |
| `inputValues` | `Record<string, unknown>` | `{}` | Map of all property values; keys match Flow CPE storage. |
| `inputVariables` | Flow inputVariables | — | Used to seed `inputValues` on first set. |
| `allowedInputModes` | `string[]` | all 6 modes | Filter to restrict UI to a subset (e.g. SOQL-only). |
| `showDisplayMode` | boolean | `false` | Show the Picklist / Radio / Visual mode selector. |
| `showVisualCardOptions` | boolean | `false` | Show card-specific options (column count, icon size). |
| `pickerMaxWidth` | number | `280` | px width cap for inline pickers. |

**Events**

| Event | `detail` shape | Fires when |
|---|---|---|
| `datasourcechange` | `{ propertyName: string, newValue: any, newValueDataType: string }` | Any internal field changes; dispatch one event per logical property. |

**Gotchas**

- **Stateful across modes.** Switching from SOQL to Picklist Field doesn't erase SOQL-specific values (whereClause, orderBy) — they're preserved in `inputValues`. Wire the consumer to clear on mode change if needed.
- `inputValues` is the source of truth, not individual props. The component reads the current mode from `inputValues.inputMode`.
- The embedded ResourcePicker requires `builderContext` with a populated `screens` array. On first render, `builderContext` may be a stub — the component polls (up to a handful of animation frames) until it's hydrated.

---

### `pflowOrganismResourcePicker`

Organism. Flow variable / merge-field / literal picker. Renders a combobox whose dropdown groups the user's Flow resources: variables, constants, global variables, automatic outputs, Action outputs, screen component outputs, record lookups, formulas, etc. **Adapted from UnofficialSF `fsc_flowPicker3`** — attribution in file header and `NOTICE`.

**Props**

| Prop | Type | Default | Notes |
|---|---|---|---|
| `name` | string | — | Echoed back in `valuechanged.detail.id`. |
| `label` | string | — | Displayed above the combobox. |
| `required` | boolean | `false` | — |
| `builderContextFilterType` | string | — | e.g. `'String'`, `'Boolean'`, `'SObject'`. Filters which flow resources appear by data type. |
| `builderContextFilterCollectionBoolean` | boolean | — | `true` = only collection resources; `false` = only non-collection; undefined = both. |
| `maxWidth` | number | — | px width cap on the dropdown. |
| `autocomplete` | string | `'off'` | Passed through to underlying input. |
| `fieldLevelHelp` | string | — | ⓘ tooltip next to the label. |
| `disabled` | boolean | — | — |
| `allowHardCodeReference` | boolean (getter/setter) | `false` | When true, allows manual `{!...}` input that isn't in the resource tree (e.g. Filter element outputs). Changes placeholder text. |
| `builderContext` | Flow builderContext | — | Required. Reference changes cascade to rebuild merge-field list. |
| `automaticOutputVariables` | Flow auto outputs | — | Required. |

**Events**

| Event | `detail` shape | Fires when |
|---|---|---|
| `valuechanged` | `{ id: string, newValue: any, newValueDataType: 'String' \| 'reference' }` | User selects a resource or types a literal. |

**Gotchas**

- **`{!...}` is "reference", anything else is "String".** The component emits `newValueDataType` accordingly; honor it when storing the property.
- The `builderContextFilterType` follows Flow's type vocabulary (`String`, `Number`, `Boolean`, `Date`, `DateTime`, `SObject`) — not JavaScript types.
- Resource tree is rebuilt whenever `builderContext` reference changes. If Flow Builder mutates it in place (same object, different internals), the component may not notice — this is a coreFlow-inherited behavior.
- `allowHardCodeReference: true` is required when the downstream source is a Filter / Transform element — those outputs aren't exposed via standard `automaticOutputVariables`.

---

### `pflowUtilityValidationMixin`

Utility (not a rendered component). Exports `FlowValidationMixin` — the Flow three-method validation contract. Extend this in runtime screen components (not CPEs) to block Next/Finish on invalid input.

**Usage**

```js
import { LightningElement, api } from 'lwc';
import { FlowValidationMixin } from 'c/pflowUtilityValidationMixin';

export default class MyField extends FlowValidationMixin(LightningElement) {
  @api value;
  @api required;

  /** Override. Return a non-empty error string when invalid, else null. */
  getInternalError() {
    return this.required && !this.value ? 'This field is required' : null;
  }

  handleChange(e) {
    this.value = e.detail.value;
    this.markInteracted();  // optional — suppresses errors until first interaction
  }
}
```

**Methods exposed on the subclass**

| Method | Signature | What it does |
|---|---|---|
| `validate()` | `() => { isValid: boolean, errorMessage: string \| null }` | Flow's standard validation contract. Flow calls this when user clicks Next/Finish. |
| `setCustomValidity(msg)` | `(msg: string) => void` | Flow's standard accessor to inject an external error. |
| `reportValidity()` | `() => void` | Flow's standard "show errors now" trigger. Usually called from `validate()`. |
| `getInternalError()` | `() => string \| null` | **You override this.** Return your error string (or null). |
| `markInteracted()` | `() => void` | Optional. Call after first user change to opt into deferred-error display. |

**Gotchas**

- `getInternalError` is what you override — not `validate`. `validate` calls through to `getInternalError` + external message.
- `markInteracted` is optional. Without it, errors show immediately on first render. With it, they're suppressed until the user touches the field.
- External errors (from `setCustomValidity`) take precedence over internal ones.

---

### `pflowUtilityCpeHelpers`

Utility module (no rendered output). Pure functions + one shared LRU cache. Import the named exports.

```js
import {
  // Field-metadata cache
  fetchFields, clearFieldCache, clearFieldCacheFor, getFieldCacheStats,
  iconForFieldType, formatFieldType, fieldsToOptions, filterFieldOptions,
  // Merge-field helpers (adapted from UnofficialSF fsc_flowComboboxUtils)
  flowComboboxDefaults, isReference, getDataType, formattedValue, removeFormatting,
  // Data-source mode constants + transforms
  INPUT_MODE_LABELS, DATA_SOURCE_MODES, DISPLAY_MODE_LABELS,
  normalizeInputMode,
  resolveFromSingleCollection, resolveFromDualCollections,
  doSort, addNoneOption,
  resolveFromPicklistFieldWire, getFieldPicklistFromByRecordType, filterDependentPicklistValues,
  buildVisualCardItems, allLabelsAndValuesFromOptions
} from 'c/pflowUtilityCpeHelpers';
```

| Export | Type | Purpose |
|---|---|---|
| `fetchFields(objectApiName)` | `Promise<Field[]>` | Hits `getObjectFields` Apex; de-dupes concurrent calls per object; caches result. |
| `clearFieldCache()` | `() => void` | Full cache wipe. Use on user switch / manual refresh. |
| `clearFieldCacheFor(objectApiName)` | `(string) => void` | Invalidate one object. |
| `getFieldCacheStats()` | `() => { size, inflight, lru }` | Diagnostic only. |
| `iconForFieldType(type)` | `(string) => string` | Maps `Schema.DisplayType` to SLDS utility icon (e.g. `STRING` → `utility:text`). |
| `formatFieldType(type)` | `(string) => string` | Human label (e.g. `MULTIPICKLIST` → `'Multi-Picklist'`). |
| `fieldsToOptions(fields)` | `(Field[]) => Row[]` | Apex field rows → CustomLookup row shape. |
| `filterFieldOptions(options, term)` | — | Case-insensitive substring filter on title / id / subtitle. |
| `flowComboboxDefaults` | frozen object | Shared constants used by ResourcePicker (data type names, resource types). |
| `isReference(v)` | `(string) => boolean` | True iff `v` is `{!...}`. |
| `formattedValue(v, dataType)` | — | Wraps bare string in `{!...}` when dataType is `'reference'`, otherwise returns as-is. |
| `removeFormatting(v)` | `(string) => string` | Strips `{!...}` wrapper. Idempotent. |
| `INPUT_MODE_LABELS` / `DATA_SOURCE_MODES` / `DISPLAY_MODE_LABELS` | frozen enums | Constants for DataSource mode switching. |
| `normalizeInputMode(label)` | `(string) => DATA_SOURCE_MODES key` | Maps user-facing label → normalized key. |
| `resolveFromSingleCollection` / `resolveFromDualCollections` | — | Build option rows from collection props. |
| `doSort(options, sort)` | — | Alphabetic sort (case-insensitive). Returns new array. |
| `addNoneOption(options, allow)` | — | Prepends `{ label: '--None--', value: 'None' }`. |
| `resolveFromPicklistFieldWire(fieldPicklistData, allowNone, sortList)` | — | Transforms an LDS wire payload into option rows. |
| `getFieldPicklistFromByRecordType(picklistFieldValues, apiName)` | — | Pulls one field's picklist payload out of `getPicklistValuesByRecordType`. |
| `filterDependentPicklistValues(values, controllingValue, controllerValues)` | — | Applies `validFor` bitmask filtering for dependent picklists. |
| `buildVisualCardItems(titles, descriptions, icons, includeIcons, staticResourceBaseUrl)` | — | Builds QuickChoice-style card items. |
| `allLabelsAndValuesFromOptions(options)` | `=> { allLabels, allValues }` | Split options into parallel label / value arrays. |

**Gotchas**

- `fetchFields` LRU is bounded at **10 objects**. If your CPE switches between more, older entries are evicted.
- The cache is **process-scoped** — it persists across components on the same page but not across tabs. Call `clearFieldCache()` on logout if you also clear auth.
- `filterDependentPicklistValues` does **not** understand Flow's picklist wire fully — it operates on the LDS `validFor` base64 bitmask directly. If Salesforce changes that format, this needs a fix.

---

## Apex reference — `PFlowCpeChoiceEngineController`

All SOQL uses `Database.queryWithBinds(..., AccessLevel.USER_MODE)` so FLS/CRUD is enforced. All dynamic fragments that can't be bind variables pass through `String.escapeSingleQuotes`.

| Method | Cacheable? | Returns | Purpose |
|---|---|---|---|
| `searchSObjectTypes(searchKey)` | ✅ | `List<ChoiceOption>` | All accessible + queryable SObjects; filtered by partial name match. Max 80 rows. |
| `searchPicklistFieldsForObject(objectApiName, searchKey)` | ✅ | `List<ChoiceOption>` | Picklist fields on an object. |
| `searchLookupDatasetFieldsForObject(objectApiName, searchKey)` | ✅ | `List<ChoiceOption>` | Sortable fields on an object (skips Address/Location/Base64). |
| `getRecordTypeOptions(objectApiName)` | ✅ | `List<ChoiceOption>` | Active record types for an object. |
| `getControllerFieldApiName(objectApiName, dependentFieldApiName)` | ✅ | `String` | Walks the dependency chain to find the controlling field. |
| `searchControllerPicklistValues(...)` | ✅ | `List<ChoiceOption>` | Controller values filtered by record type. |
| `getObjectFields(objectName)` | ✅ | `List<Field>` | All fields + metadata (name, label, type, relationshipName). Primary cached call used by field pickers. |
| `validateLookupConfigurationDetailed(...)` | ✅ | `LookupValidationResult` | Validates object + field + where + search-term combination. |
| `validateLookupConfiguration(SearchRequest)` | ✅ | `LookupValidationResult` | Same as above, takes a structured request. |
| `getRecords(GetRecordsRequest)` | ❌ | `List<ChoiceOption>` | SOQL select with configurable where. Max 50 rows. |
| `getLookupSearchResultsDetailed(...)` | ✅ | `List<ChoiceOption>` | SOQL search with LIKE on displayed field. |
| `getLookupSearchResults(SearchRequest)` | ✅ | `List<ChoiceOption>` | Same, takes structured request. |
| `getSoslSearchResults(SearchRequest)` | ✅ | `List<ChoiceOption>` | SOSL search across text fields. |
| `getFieldValue(GetFieldValueRequest)` | ✅ | `ChoiceOption` | Single record's field value by Id. |
| `getReference(field)` | ✅ | `String` | Relationship field reference (sObjectType of the referenceTo). |
| `getHelpText(field)` | ✅ | `String` | Inline-help text from field describe. |

**Request DTOs** — see `PFlowCpeChoiceEngineController.cls` for full shapes. Most commonly:

```apex
public class SearchRequest {
  public String sObjectName;
  public String displayedFieldName;   // primary column (e.g. 'Name')
  public String subtitleFieldName;    // optional secondary column
  public String valueFieldName;       // what to store (e.g. 'Id')
  public String otherFields;          // CSV of extra fields
  public String whereClause;          // SOQL WHERE fragment
  public String filteredFieldName;    // runtime filter column
  public String filterFieldValue;     // runtime filter value
  public String searchTerm;
  public String orderByField;
  public String orderByDirection;     // 'ASC' | 'DESC'
  public Integer queryLimit;
}
```

**Gotchas**

- `getRecords` is **not cacheable** (returns user-specific, time-sensitive data). Don't `@wire` it — call imperatively.
- `getSoslSearchResults` returns empty in test context unless you call `Test.setFixedSearchResults()` first.
- `searchSObjectTypes` filters on `isAccessible() && isQueryable()`. Entities with CRUD-denied types (e.g. `ContentFolder` for unentitled users) won't appear.
- `getLookupSearchResults*` caps results at 50 rows (configurable via `queryLimit` up to 2000). Consider pagination at the UI layer for large datasets.

---

## License

Apache-2.0. Portions adapted from [UnofficialSF FlowScreenComponentsBasePack](https://github.com/UnofficialSF/LightningFlowComponents) by Eric Smith — attribution preserved in individual file headers and in [NOTICE](NOTICE).
