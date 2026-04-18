# Reference demos

These LWCs are *not* part of the deployable toolkit package. They're kept
here as a copy-paste starting point for building your own CPE using the
widgets in `force-app/`.

**demoWidgetsDirect** — runtime Flow Screen component that renders a
summary of the values selected in its CPE.

**demoWidgetsDirectCpe** — the matching hand-rolled CPE. Composes:
- `c-pflow-molecule-custom-lookup` wired to `searchSObjectTypes` Apex (SObject picker)
- `c-pflow-molecule-field-picker` in single and multi modes
- `c-pflow-organism-where-builder`
- `c-pflow-molecule-order-limit`

## Deploy the demo

If you want to see the pattern end-to-end in Flow Builder:

```bash
sf project deploy start -d examples/lwc -o <org-alias>
```

Then drop **Demo | Widgets Direct** onto a Flow screen.
