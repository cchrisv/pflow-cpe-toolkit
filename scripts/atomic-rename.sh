#!/usr/bin/env bash
# Atomic-design rename: pflow_cpe* → pflowAtom/Molecule/Organism/Utility*.
# Idempotent.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LWC="$ROOT/force-app/main/default/lwc"
CLS="$ROOT/force-app/main/default/classes"

echo "→ Pass 1: in-file string replacements"

# Folder / import / camelCase identifiers
LWC_PAIRS=(
  "pflow_cpePropertyEditor|pflowOrganismPropertyEditor"
  "pflow_cpeDataSource|pflowOrganismDataSource"
  "pflow_cpeResourcePicker|pflowOrganismResourcePicker"
  "pflow_cpeWhereBuilder|pflowOrganismWhereBuilder"
  "pflow_cpeFieldPicker|pflowMoleculeFieldPicker"
  "pflow_cpeOrderLimit|pflowMoleculeOrderLimit"
  "pflow_cpeCustomLookup|pflowMoleculeCustomLookup"
  "pflow_cpeCheckbox|pflowAtomCheckbox"
  "pflow_cpeValidationMixin|pflowUtilityValidationMixin"
  "pflow_cpeHelpers|pflowUtilityCpeHelpers"
)

# PascalCase class names (ES `class X` declarations)
CLASS_PAIRS=(
  "PflowCpePropertyEditor|PflowOrganismPropertyEditor"
  "PflowCpeDataSource|PflowOrganismDataSource"
  "PflowCpeResourcePicker|PflowOrganismResourcePicker"
  "PflowCpeWhereBuilder|PflowOrganismWhereBuilder"
  "PflowCpeFieldPicker|PflowMoleculeFieldPicker"
  "PflowCpeOrderLimit|PflowMoleculeOrderLimit"
  "PflowCpeCustomLookup|PflowMoleculeCustomLookup"
  "PflowCpeCheckbox|PflowAtomCheckbox"
)

# HTML kebab-case tags
HTML_PAIRS=(
  "c-pflow-cpe-property-editor|c-pflow-organism-property-editor"
  "c-pflow-cpe-data-source|c-pflow-organism-data-source"
  "c-pflow-cpe-resource-picker|c-pflow-organism-resource-picker"
  "c-pflow-cpe-where-builder|c-pflow-organism-where-builder"
  "c-pflow-cpe-field-picker|c-pflow-molecule-field-picker"
  "c-pflow-cpe-order-limit|c-pflow-molecule-order-limit"
  "c-pflow-cpe-custom-lookup|c-pflow-molecule-custom-lookup"
  "c-pflow-cpe-checkbox|c-pflow-atom-checkbox"
)

FILES="$(find "$LWC" -type f \( -name '*.js' -o -name '*.html' -o -name '*.css' -o -name '*.xml' \))"

run_replace() {
  local pairs_var=$1
  local -n pairs=$pairs_var
  for pair in "${pairs[@]}"; do
    IFS='|' read -r OLD NEW <<< "$pair"
    for f in $FILES; do
      if grep -q "$OLD" "$f" 2>/dev/null; then
        sed -i "s|$OLD|$NEW|g" "$f"
      fi
    done
  done
}

run_replace LWC_PAIRS
echo "  · camelCase folder / import identifiers replaced"
run_replace CLASS_PAIRS
echo "  · PascalCase class names replaced"
run_replace HTML_PAIRS
echo "  · HTML custom-element tags replaced"

echo "→ Pass 2: rename folders and inner file basenames"
cd "$LWC"
for pair in "${LWC_PAIRS[@]}"; do
  IFS='|' read -r OLD NEW <<< "$pair"
  if [ -d "$OLD" ] && [ ! -d "$NEW" ]; then
    mv "$OLD" "$NEW"
    for f in "$NEW"/${OLD}.*; do
      [ -e "$f" ] || continue
      ext="${f##*/$OLD.}"
      mv "$f" "$NEW/${NEW}.${ext}"
    done
    # Rename Jest test basenames too (in __tests__ subfolder)
    if [ -d "$NEW/__tests__" ]; then
      for f in "$NEW/__tests__/${OLD}.test.js"; do
        [ -e "$f" ] || continue
        mv "$f" "$NEW/__tests__/${NEW}.test.js"
      done
    fi
    echo "  · $OLD → $NEW"
  fi
done

echo "✓ atomic-design rename complete"
