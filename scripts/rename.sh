#!/usr/bin/env bash
# One-shot rename of coreFlow* → pflow_cpe* across all source files.
# Idempotent: re-running after a successful rename is a no-op.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LWC="$ROOT/force-app/main/default/lwc"
CLS="$ROOT/force-app/main/default/classes"

echo "→ Pass 1: in-file string replacements"

# LWC identifier pairs (camelCase): old → new
LWC_PAIRS=(
  "coreFlowPropertyEditor|pflow_cpePropertyEditor"
  "coreUtilityFlowValidation|pflow_cpeValidationMixin"
  "coreMoleculeQuestionField|pflow_cpeQuestionField"
  "coreFlowCpeFieldPicker|pflow_cpeFieldPicker"
  "coreFlowCpeMultiFieldPicker|pflow_cpeMultiFieldPicker"
  "coreFlowCpeWhereBuilder|pflow_cpeWhereBuilder"
  "coreFlowCpeOrderLimit|pflow_cpeOrderLimit"
  "coreFlowCpeDataSource|pflow_cpeDataSource"
  "coreFlowResourcePickerUtils|pflow_cpeResourcePickerUtils"
  "coreFlowResourcePicker|pflow_cpeResourcePicker"
  "coreOrganismCustomLookup|pflow_cpeCustomLookup"
  "coreFlowCpeCheckbox|pflow_cpeCheckbox"
  "coreFlowCpeFieldCache|pflow_cpeFieldCache"
  "coreFlowDataSourceUtils|pflow_cpeDataSourceUtils"
)

# Class name pairs (PascalCase): matches ES class definitions
CLASS_PAIRS=(
  "CoreFlowPropertyEditor|PflowCpePropertyEditor"
  "CoreUtilityFlowValidation|PflowCpeValidationMixin"
  "CoreMoleculeQuestionField|PflowCpeQuestionField"
  "CoreFlowCpeFieldPicker|PflowCpeFieldPicker"
  "CoreFlowCpeMultiFieldPicker|PflowCpeMultiFieldPicker"
  "CoreFlowCpeWhereBuilder|PflowCpeWhereBuilder"
  "CoreFlowCpeOrderLimit|PflowCpeOrderLimit"
  "CoreFlowCpeDataSource|PflowCpeDataSource"
  "CoreFlowResourcePickerUtils|PflowCpeResourcePickerUtils"
  "CoreFlowResourcePicker|PflowCpeResourcePicker"
  "CoreOrganismCustomLookup|PflowCpeCustomLookup"
  "CoreFlowCpeCheckbox|PflowCpeCheckbox"
  "CoreFlowCpeFieldCache|PflowCpeFieldCache"
  "CoreFlowDataSourceUtils|PflowCpeDataSourceUtils"
)

# HTML tag pairs (kebab-case): rendered custom-element names
HTML_PAIRS=(
  "c-core-flow-property-editor|c-pflow-cpe-property-editor"
  "c-core-utility-flow-validation|c-pflow-cpe-validation-mixin"
  "c-core-molecule-question-field|c-pflow-cpe-question-field"
  "c-core-flow-cpe-field-picker|c-pflow-cpe-field-picker"
  "c-core-flow-cpe-multi-field-picker|c-pflow-cpe-multi-field-picker"
  "c-core-flow-cpe-where-builder|c-pflow-cpe-where-builder"
  "c-core-flow-cpe-order-limit|c-pflow-cpe-order-limit"
  "c-core-flow-cpe-data-source|c-pflow-cpe-data-source"
  "c-core-flow-resource-picker-utils|c-pflow-cpe-resource-picker-utils"
  "c-core-flow-resource-picker|c-pflow-cpe-resource-picker"
  "c-core-organism-custom-lookup|c-pflow-cpe-custom-lookup"
  "c-core-flow-cpe-checkbox|c-pflow-cpe-checkbox"
  "c-core-flow-cpe-field-cache|c-pflow-cpe-field-cache"
  "c-core-flow-data-source-utils|c-pflow-cpe-data-source-utils"
)

# Apex class pairs
APEX_PAIRS=(
  "CoreFlowChoiceEngineControllerTest|PFlowCpeChoiceEngineControllerTest"
  "CoreFlowChoiceEngineController|PFlowCpeChoiceEngineController"
  "CoreFlowChoiceEngineLog|PFlowCpeChoiceEngineLog"
)

# Human-readable master-label replacements (meta.xml)
LABEL_PAIRS=(
  "Core Flow Property Editor|Professor Flow | CPE Property Editor"
  "Core Flow CPE Data Source|Professor Flow | CPE Data Source"
  "Core Flow Resource Picker|Professor Flow | CPE Resource Picker"
  "Core Flow CPE Checkbox|Professor Flow | CPE Checkbox"
  "Core Organism Custom Lookup|Professor Flow | CPE Custom Lookup"
)

# Find every source file and apply all replacements.
# Using sed -i'' for macOS/GNU compat; Git Bash on Windows honors empty-string backup.
FILES="$(find "$LWC" "$CLS" -type f \( -name '*.js' -o -name '*.html' -o -name '*.css' -o -name '*.xml' -o -name '*.cls' \))"

run_replace() {
  local pairs_var=$1
  local -n pairs=$pairs_var
  for pair in "${pairs[@]}"; do
    IFS='|' read -r OLD NEW <<< "$pair"
    # Escape forward slashes for sed — unlikely here, but safe
    for f in $FILES; do
      if grep -q "$OLD" "$f" 2>/dev/null; then
        # Use | as sed delimiter since replacements may contain / in paths
        sed -i "s|$OLD|$NEW|g" "$f"
      fi
    done
  done
}

run_replace LWC_PAIRS
echo "  · LWC camelCase identifiers replaced"
run_replace CLASS_PAIRS
echo "  · PascalCase class names replaced"
run_replace HTML_PAIRS
echo "  · HTML custom-element tags replaced"
run_replace APEX_PAIRS
echo "  · Apex class references replaced"
run_replace LABEL_PAIRS
echo "  · masterLabel descriptions branded"

echo "→ Pass 2: rename folders and basenames"

# Rename LWC folders + files inside each folder (basename matches folder)
for pair in "${LWC_PAIRS[@]}"; do
  IFS='|' read -r OLD NEW <<< "$pair"
  if [ -d "$LWC/$OLD" ] && [ ! -d "$LWC/$NEW" ]; then
    mv "$LWC/$OLD" "$LWC/$NEW"
    echo "  · $OLD → $NEW"
    # Rename inner files: OLD.html → NEW.html, etc.
    for f in "$LWC/$NEW"/${OLD}.*; do
      [ -e "$f" ] || continue
      ext="${f##*${OLD}.}"
      mv "$f" "$LWC/$NEW/${NEW}.${ext}"
    done
  fi
done

# Rename Apex files
for pair in "${APEX_PAIRS[@]}"; do
  IFS='|' read -r OLD NEW <<< "$pair"
  for ext in cls cls-meta.xml; do
    if [ -f "$CLS/$OLD.$ext" ] && [ ! -f "$CLS/$NEW.$ext" ]; then
      mv "$CLS/$OLD.$ext" "$CLS/$NEW.$ext"
      echo "  · $OLD.$ext → $NEW.$ext"
    fi
  done
done

echo "✓ rename complete"
