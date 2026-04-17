"""Strip PFlowCpeChoiceEngineLog references from the controller.

Transforms the three-line log pattern into simple try/catch with AuraHandledException.
Idempotent: running after a prior strip is a no-op.
"""
import re
import sys
from pathlib import Path


def strip(src: str) -> str:
    # 1. Remove LOG_SCENARIO_NAME constant + its JSDoc block.
    src = re.sub(
        r"    /\*\* @description Used by PFlowCpeChoiceEngineLog.*?\*/\n"
        r"    public static final String LOG_SCENARIO_NAME = '[^']*';\n\n",
        "",
        src,
        flags=re.DOTALL,
    )

    # 2. Remove every `PFlowCpeChoiceEngineLog.setScenario();` line (plus its leading indent + trailing newline).
    src = re.sub(r"[ \t]*PFlowCpeChoiceEngineLog\.setScenario\(\);\n", "", src)

    # 3. Collapse the standard catch-return-finally-saveLog pattern into a single AuraHandledException throw.
    #    The final `return empty;` is replaced by `throw new AuraHandledException(...)` and the finally block is removed.
    standard_pattern = re.compile(
        r"\} catch \(Exception e\) \{\n"
        r"[ \t]*PFlowCpeChoiceEngineLog\.error\('([^']+)', e\);\n"
        r"[ \t]*return [^\n]+;\n"
        r"[ \t]*\} finally \{\n"
        r"[ \t]*PFlowCpeChoiceEngineLog\.saveLog\(\);\n"
        r"([ \t]*)\}",
        re.MULTILINE,
    )

    def _std_replace(m: re.Match) -> str:
        method = m.group(1)
        closing_indent = m.group(2)
        # Indent `throw` one level inside the catch block.
        body_indent = closing_indent + "    "
        return (
            f"}} catch (Exception e) {{\n"
            f"{body_indent}throw new AuraHandledException('{method} failed: ' + e.getMessage());\n"
            f"{closing_indent}}}"
        )

    src = standard_pattern.sub(_std_replace, src)

    # 4. Validation methods: collapse catch-LookupValidationResult-return-finally into a single throw.
    validation_pattern = re.compile(
        r"\} catch \(Exception e\) \{\n"
        r"[ \t]*PFlowCpeChoiceEngineLog\.error\('([^']+)', e\);\n"
        r"[ \t]*LookupValidationResult r = new LookupValidationResult\(\);\n"
        r"[ \t]*r\.isConfigurationValid = false;\n"
        r"[ \t]*r\.configurationMessage = 'Validation failed: ' \+ e\.getMessage\(\);\n"
        r"[ \t]*return r;\n"
        r"[ \t]*\} finally \{\n"
        r"[ \t]*PFlowCpeChoiceEngineLog\.saveLog\(\);\n"
        r"([ \t]*)\}",
        re.MULTILINE,
    )

    def _val_replace(m: re.Match) -> str:
        method = m.group(1)
        closing_indent = m.group(2)
        body_indent = closing_indent + "    "
        return (
            f"}} catch (Exception e) {{\n"
            f"{body_indent}throw new AuraHandledException('{method} failed: ' + e.getMessage());\n"
            f"{closing_indent}}}"
        )

    src = validation_pattern.sub(_val_replace, src)

    # 5. Internal Core method pattern: simple error + return stays, just drop the log call.
    #    Pattern:  PFlowCpeChoiceEngineLog.error('xxx', e);\n (indent)res.configurationMessage = ...
    #    Strategy: Drop the LOG.error line; keep the existing res.configurationMessage return logic intact.
    src = re.sub(
        r"[ \t]*PFlowCpeChoiceEngineLog\.error\('[^']+', e\);\n",
        "",
        src,
    )

    return src


def main() -> None:
    path = Path(sys.argv[1])
    original = path.read_text(encoding="utf-8")
    stripped = strip(original)
    path.write_text(stripped, encoding="utf-8")
    # Sanity check
    if "PFlowCpeChoiceEngineLog" in stripped:
        remaining = [
            line for line in stripped.splitlines() if "PFlowCpeChoiceEngineLog" in line
        ]
        print(f"WARN — {len(remaining)} log references still present:")
        for line in remaining[:5]:
            print(f"  {line!r}")
        sys.exit(1)
    print("OK — all PFlowCpeChoiceEngineLog references removed")


if __name__ == "__main__":
    main()
