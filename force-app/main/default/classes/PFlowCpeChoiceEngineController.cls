/**
 * @description Unified Apex for core Flow choice components: metadata pickers (CPE), SOQL/SOSL datasets,
 * validation, and resource-picker describe. Adapted from coreFlow CoreFlowChoiceEngineController.
 */
@SuppressWarnings('PMD.CognitiveComplexity, PMD.CyclomaticComplexity, PMD.ExcessiveParameterList, PMD.ApexCRUDViolation')
public with sharing class PFlowCpeChoiceEngineController {
    /** @description Used by PFlowCpeChoiceEngineLog / future Nebula scenario name alignment. */
    public static final String LOG_SCENARIO_NAME = 'Core Flow Choice Engine';

    private static final Integer MAX_ROWS = 50;
    private static final Integer MAX_LOOKUP_ROWS = 80;
    private static final Integer MAX_PICKLIST_FIELD_LOOKUP_ROWS = 2000;

    private static final Set<Schema.DisplayType> LOOKUP_CPE_FIELD_SKIP_TYPES = new Set<Schema.DisplayType>{
        Schema.DisplayType.BASE64,
        Schema.DisplayType.ADDRESS,
        Schema.DisplayType.LOCATION
    };

    /** @description Shared row for pickers, lookup search, and SOQL/SOSL results (LWC normalizes to label/value). */
    public class ChoiceOption implements Comparable {
        @AuraEnabled
        public String value;
        @AuraEnabled
        public String label;
        @AuraEnabled
        public String subtitle;
        @AuraEnabled
        public String icon;
        @AuraEnabled
        public String sObjectType;

        public ChoiceOption() {
        }

        @SuppressWarnings('PMD.ExcessiveParameterList')
        public ChoiceOption(String value, String label, String subtitle, String icon, String sObjectType) {
            this.value = value;
            this.label = label;
            this.subtitle = subtitle;
            this.icon = icon;
            this.sObjectType = sObjectType;
        }

        public Integer compareTo(Object other) {
            ChoiceOption o = (ChoiceOption) other;
            String a = this.label == null ? '' : this.label;
            String b = o.label == null ? '' : o.label;
            return a.compareTo(b);
        }
    }

    /** @description Parameters for {@link #getRecords(GetRecordsRequest)}. */
    public class GetRecordsRequest {
        @AuraEnabled
        public String sObjectName;
        @AuraEnabled
        public String valueFieldName;
        @AuraEnabled
        public String otherFields;
        @AuraEnabled
        public String displayedFieldName;
        @AuraEnabled
        public String whereClause;
        @AuraEnabled
        public String filteredFieldName;
        @AuraEnabled
        public String filterFieldValue;
    }

    /** @description Parameters for search methods. */
    public class SearchRequest {
        @AuraEnabled
        public String sObjectName;
        @AuraEnabled
        public String displayedFieldName;
        @AuraEnabled
        public String subtitleFieldName;
        @AuraEnabled
        public String valueFieldName;
        @AuraEnabled
        public String otherFields;
        @AuraEnabled
        public String whereClause;
        @AuraEnabled
        public String filteredFieldName;
        @AuraEnabled
        public String filterFieldValue;
        @AuraEnabled
        public String searchTerm;
        @AuraEnabled
        public String orderByField;
        @AuraEnabled
        public String orderByDirection;
        @AuraEnabled
        public Integer queryLimit;
    }

    /** @description Parameters for {@link #getFieldValue(GetFieldValueRequest)}. */
    public class GetFieldValueRequest {
        @AuraEnabled
        public String obj;
        @AuraEnabled
        public String objId;
        @AuraEnabled
        public String label;
    }

    private class WhereClauseResult {
        public List<String> whereParts;
        public Map<String, Object> binds;
    }

    /** @description Result of configuration validation. */
    public class LookupValidationResult {
        @AuraEnabled
        public Boolean isConfigurationValid;
        @AuraEnabled
        public String configurationMessage;
        @AuraEnabled
        public Boolean hasMatchingRows;
        @AuraEnabled
        public String dataAvailabilityMessage;
        @AuraEnabled
        public Boolean displayFieldSupportsSearch;
        @AuraEnabled
        public String searchSupportMessage;
    }

    /** @description Serializable field row for LWC resource picker. */
    public class Field {
        @AuraEnabled
        public String name;
        @AuraEnabled
        public String label;
        @AuraEnabled
        public String type;
        @AuraEnabled
        public String parentObjectName;
        @AuraEnabled
        public String relationshipName;

        public Field(String n, String l, String t) {
            name = n;
            label = l;
            type = t;
        }
    }

    // --- Design-time: object / field pickers ---

    @AuraEnabled(cacheable=true)
    public static List<ChoiceOption> searchSObjectTypes(String searchKey) {
        PFlowCpeChoiceEngineLog.setScenario();
        try {
            return searchSObjectTypesCore(searchKey);
        } catch (Exception e) {
            PFlowCpeChoiceEngineLog.error('searchSObjectTypes', e);
            return new List<ChoiceOption>();
        } finally {
            PFlowCpeChoiceEngineLog.saveLog();
        }
    }

    private static List<ChoiceOption> searchSObjectTypesCore(String searchKey) {
        List<ChoiceOption> rows = new List<ChoiceOption>();
        String k = searchKey == null ? '' : searchKey.trim().toLowerCase();
        for (Schema.SObjectType sot : Schema.getGlobalDescribe().values()) {
            Schema.DescribeSObjectResult d = sot.getDescribe();
            if (!d.isAccessible() || !d.isQueryable()) {
                continue;
            }
            String api = d.getName();
            String lab = d.getLabel() == null ? api : d.getLabel();
            if (k.length() > 0) {
                if (!api.toLowerCase().contains(k) && !lab.toLowerCase().contains(k)) {
                    continue;
                }
            }
            rows.add(new ChoiceOption(api, lab, api, 'utility:sobject', api));
        }
        rows.sort();
        return capChoiceList(rows, MAX_LOOKUP_ROWS);
    }

    @AuraEnabled(cacheable=true)
    public static List<ChoiceOption> searchPicklistFieldsForObject(String objectApiName, String searchKey) {
        PFlowCpeChoiceEngineLog.setScenario();
        try {
            return searchPicklistFieldsForObjectCore(objectApiName, searchKey);
        } catch (Exception e) {
            PFlowCpeChoiceEngineLog.error('searchPicklistFieldsForObject', e);
            return new List<ChoiceOption>();
        } finally {
            PFlowCpeChoiceEngineLog.saveLog();
        }
    }

    private static List<ChoiceOption> searchPicklistFieldsForObjectCore(String objectApiName, String searchKey) {
        List<ChoiceOption> out = new List<ChoiceOption>();
        if (String.isBlank(objectApiName)) {
            return out;
        }
        String k = searchKey == null ? '' : searchKey.trim().toLowerCase();
        Schema.SObjectType sot = resolveSObjectType(objectApiName);
        if (sot == null) {
            return out;
        }
        String canonicalObject = sot.getDescribe().getName();
        for (Schema.SObjectField token : sot.getDescribe().fields.getMap().values()) {
            Schema.DescribeFieldResult fr = token.getDescribe();
            Schema.DisplayType dt = fr.getType();
            if (dt != Schema.DisplayType.PICKLIST && dt != Schema.DisplayType.MULTIPICKLIST) {
                continue;
            }
            String name = fr.getName();
            String lab = fr.getLabel();
            if (k.length() > 0 && !name.toLowerCase().contains(k) && (lab == null || !lab.toLowerCase().contains(k))) {
                continue;
            }
            String subt =
                name + ' — ' + String.valueOf(dt) + (fr.isAccessible() ? '' : ' (FLS may restrict runtime read)');
            out.add(new ChoiceOption(name, lab, subt, 'utility:picklist', canonicalObject));
        }
        out.sort();
        return capChoiceList(out, MAX_PICKLIST_FIELD_LOOKUP_ROWS);
    }

    @AuraEnabled(cacheable=true)
    public static List<ChoiceOption> searchLookupDatasetFieldsForObject(String objectApiName, String searchKey) {
        PFlowCpeChoiceEngineLog.setScenario();
        try {
            return searchLookupDatasetFieldsForObjectCore(objectApiName, searchKey);
        } catch (Exception e) {
            PFlowCpeChoiceEngineLog.error('searchLookupDatasetFieldsForObject', e);
            return new List<ChoiceOption>();
        } finally {
            PFlowCpeChoiceEngineLog.saveLog();
        }
    }

    private static List<ChoiceOption> searchLookupDatasetFieldsForObjectCore(String objectApiName, String searchKey) {
        List<ChoiceOption> out = new List<ChoiceOption>();
        if (String.isBlank(objectApiName)) {
            return out;
        }
        String k = searchKey == null ? '' : searchKey.trim().toLowerCase();
        Schema.SObjectType sot = resolveSObjectType(objectApiName);
        if (sot == null) {
            return out;
        }
        String canonicalObject = sot.getDescribe().getName();
        for (Schema.SObjectField token : sot.getDescribe().fields.getMap().values()) {
            Schema.DescribeFieldResult fr = token.getDescribe();
            if (!fr.isAccessible() || LOOKUP_CPE_FIELD_SKIP_TYPES.contains(fr.getType())) {
                continue;
            }
            String name = fr.getName();
            String lab = fr.getLabel();
            if (k.length() > 0 && !name.toLowerCase().contains(k) && (lab == null || !lab.toLowerCase().contains(k))) {
                continue;
            }
            String fieldType = String.valueOf(fr.getType());
            out.add(new ChoiceOption(name, lab, name + ' — ' + fieldType, iconForFieldType(fieldType), canonicalObject));
        }
        out.sort();
        return capChoiceList(out, MAX_PICKLIST_FIELD_LOOKUP_ROWS);
    }

    @AuraEnabled(cacheable=true)
    public static List<ChoiceOption> getRecordTypeOptions(String objectApiName) {
        PFlowCpeChoiceEngineLog.setScenario();
        try {
            return getRecordTypeOptionsCore(objectApiName);
        } catch (Exception e) {
            PFlowCpeChoiceEngineLog.error('getRecordTypeOptions', e);
            return new List<ChoiceOption>();
        } finally {
            PFlowCpeChoiceEngineLog.saveLog();
        }
    }

    private static List<ChoiceOption> getRecordTypeOptionsCore(String objectApiName) {
        List<ChoiceOption> out = new List<ChoiceOption>();
        if (String.isBlank(objectApiName)) {
            return out;
        }
        Schema.SObjectType sot = resolveSObjectType(objectApiName);
        if (sot == null) {
            return out;
        }
        String canonical = sot.getDescribe().getName();
        for (Schema.RecordTypeInfo rti : sot.getDescribe().getRecordTypeInfos()) {
            if (!rti.isAvailable()) {
                continue;
            }
            String nm = rti.getName();
            out.add(
                new ChoiceOption(
                    rti.getRecordTypeId(),
                    rti.isMaster() ? (nm + ' (master)') : nm,
                    rti.getDeveloperName(),
                    'utility:record',
                    canonical
                )
            );
        }
        out.sort();
        return out;
    }

    @AuraEnabled(cacheable=true)
    public static String getControllerFieldApiName(String objectApiName, String dependentFieldApiName) {
        PFlowCpeChoiceEngineLog.setScenario();
        try {
            return getControllerFieldApiNameCore(objectApiName, dependentFieldApiName);
        } catch (Exception e) {
            PFlowCpeChoiceEngineLog.error('getControllerFieldApiName', e);
            return '';
        } finally {
            PFlowCpeChoiceEngineLog.saveLog();
        }
    }

    private static String getControllerFieldApiNameCore(String objectApiName, String dependentFieldApiName) {
        if (String.isBlank(objectApiName) || String.isBlank(dependentFieldApiName)) {
            return '';
        }
        Schema.SObjectType t = resolveSObjectType(objectApiName);
        if (t == null) {
            return '';
        }
        Map<String, Schema.SObjectField> fm = t.getDescribe().fields.getMap();
        Schema.SObjectField dep = findFieldIgnoreCase(fm, dependentFieldApiName);
        if (dep == null) {
            return '';
        }
        Schema.SObjectField ctrlField = dep.getDescribe().getController();
        if (ctrlField == null) {
            return '';
        }
        return ctrlField.getDescribe().getName();
    }

    @AuraEnabled(cacheable=true)
    public static List<ChoiceOption> searchControllerPicklistValues(
        String objectApiName,
        String dependentFieldApiName,
        String searchKey
    ) {
        PFlowCpeChoiceEngineLog.setScenario();
        try {
            String ctrl = getControllerFieldApiNameCore(objectApiName, dependentFieldApiName);
            if (String.isBlank(ctrl)) {
                return new List<ChoiceOption>();
            }
            return searchPicklistValuesForFieldCore(objectApiName, ctrl, searchKey);
        } catch (Exception e) {
            PFlowCpeChoiceEngineLog.error('searchControllerPicklistValues', e);
            return new List<ChoiceOption>();
        } finally {
            PFlowCpeChoiceEngineLog.saveLog();
        }
    }

    @TestVisible
    private static List<ChoiceOption> searchPicklistValuesForFieldForTest(
        String objectApiName,
        String fieldApiName,
        String searchKey
    ) {
        return searchPicklistValuesForFieldCore(objectApiName, fieldApiName, searchKey);
    }

    private static List<ChoiceOption> searchPicklistValuesForFieldCore(String objectApiName, String fieldApiName, String searchKey) {
        List<ChoiceOption> out = new List<ChoiceOption>();
        if (String.isBlank(objectApiName) || String.isBlank(fieldApiName)) {
            return out;
        }
        String k = searchKey == null ? '' : searchKey.trim().toLowerCase();
        Schema.SObjectType t = resolveSObjectType(objectApiName);
        if (t == null) {
            return out;
        }
        Map<String, Schema.SObjectField> fm = t.getDescribe().fields.getMap();
        Schema.SObjectField fldTok = findFieldIgnoreCase(fm, fieldApiName);
        if (fldTok == null) {
            return out;
        }
        Schema.DescribeFieldResult fr = fldTok.getDescribe();
        Schema.DisplayType dt = fr.getType();
        if (dt != Schema.DisplayType.PICKLIST && dt != Schema.DisplayType.MULTIPICKLIST) {
            return out;
        }
        for (Schema.PicklistEntry pe : fr.getPicklistValues()) {
            if (!pe.isActive()) {
                continue;
            }
            String val = pe.getValue();
            String lab = pe.getLabel();
            if (k.length() > 0 && !val.toLowerCase().contains(k) && (lab == null || !lab.toLowerCase().contains(k))) {
                continue;
            }
            out.add(new ChoiceOption(val, lab, val, 'utility:picklist', ''));
        }
        out.sort();
        return capChoiceList(out, MAX_LOOKUP_ROWS);
    }

    @AuraEnabled(cacheable=true)
    public static List<Field> getObjectFields(String objectName) {
        PFlowCpeChoiceEngineLog.setScenario();
        try {
            return getObjectFieldsCore(objectName);
        } catch (Exception e) {
            PFlowCpeChoiceEngineLog.error('getObjectFields', e);
            return new List<Field>();
        } finally {
            PFlowCpeChoiceEngineLog.saveLog();
        }
    }

    private static List<Field> getObjectFieldsCore(String objectName) {
        List<Field> fields = new List<Field>();
        if (String.isBlank(objectName)) {
            return fields;
        }
        Type t;
        try {
            t = Type.forName('Schema', objectName);
        } catch (Exception e) {
            return fields;
        }
        if (t == null) {
            return fields;
        }
        SObject proto;
        try {
            proto = (SObject) t.newInstance();
        } catch (Exception e) {
            return fields;
        }
        Map<String, Schema.SObjectField> tokenMap = proto.getSObjectType().getDescribe().fields.getMap();
        for (String fn : tokenMap.keySet()) {
            Schema.DescribeFieldResult fr = tokenMap.get(fn).getDescribe();
            if (!fr.isAccessible()) {
                continue;
            }
            Field f = new Field(fr.getName(), fr.getLabel(), fr.getType().name());
            if (fr.getReferenceTo() != null && fr.getReferenceTo().size() == 1) {
                f.parentObjectName = fr.getReferenceTo()[0].getDescribe().getName();
                f.relationshipName = fr.getRelationshipName();
            }
            fields.add(f);
        }
        return fields;
    }

    // --- Runtime: SOQL ---

    @SuppressWarnings('PMD.ExcessiveParameterList')
    @AuraEnabled
    public static LookupValidationResult validateLookupConfigurationDetailed(
        String sObjectName,
        String displayedFieldName,
        String subtitleFieldName,
        String valueFieldName,
        String otherFields,
        String whereClause,
        String filteredFieldName,
        String filterFieldValue
    ) {
        PFlowCpeChoiceEngineLog.setScenario();
        try {
            SearchRequest req = new SearchRequest();
            req.sObjectName = sObjectName;
            req.displayedFieldName = displayedFieldName;
            req.subtitleFieldName = subtitleFieldName;
            req.valueFieldName = valueFieldName;
            req.otherFields = otherFields;
            req.whereClause = whereClause;
            req.filteredFieldName = filteredFieldName;
            req.filterFieldValue = filterFieldValue;
            req.searchTerm = null;
            return validateLookupConfigurationCore(req);
        } catch (Exception e) {
            PFlowCpeChoiceEngineLog.error('validateLookupConfigurationDetailed', e);
            LookupValidationResult r = new LookupValidationResult();
            r.isConfigurationValid = false;
            r.configurationMessage = 'Validation failed: ' + e.getMessage();
            return r;
        } finally {
            PFlowCpeChoiceEngineLog.saveLog();
        }
    }

    @AuraEnabled
    public static LookupValidationResult validateLookupConfiguration(SearchRequest request) {
        PFlowCpeChoiceEngineLog.setScenario();
        try {
            return validateLookupConfigurationCore(request);
        } catch (Exception e) {
            PFlowCpeChoiceEngineLog.error('validateLookupConfiguration', e);
            LookupValidationResult r = new LookupValidationResult();
            r.isConfigurationValid = false;
            r.configurationMessage = 'Validation failed: ' + e.getMessage();
            return r;
        } finally {
            PFlowCpeChoiceEngineLog.saveLog();
        }
    }

    private static LookupValidationResult validateLookupConfigurationCore(SearchRequest request) {
        LookupValidationResult res = new LookupValidationResult();
        res.isConfigurationValid = false;
        res.hasMatchingRows = false;
        res.displayFieldSupportsSearch = true;
        res.searchSupportMessage = null;
        res.dataAvailabilityMessage = null;
        res.configurationMessage = null;

        if (request == null) {
            res.configurationMessage = 'Validation request was empty.';
            return res;
        }
        if (String.isBlank(request.sObjectName)) {
            res.configurationMessage = 'Object API name is required.';
            return res;
        }
        Schema.DescribeSObjectResult d = describeObject(request.sObjectName);
        if (d == null) {
            res.configurationMessage = 'Object is not available or you do not have access.';
            return res;
        }
        String fromName = d.getName();
        Map<String, Schema.SObjectField> fmap = d.fields.getMap();

        if (String.isBlank(request.displayedFieldName) || String.isBlank(request.valueFieldName)) {
            res.configurationMessage = 'Display field and value field are required.';
            return res;
        }
        if (!fieldReadable(fmap, request.displayedFieldName)) {
            res.configurationMessage = 'Display field is not available or not readable: ' + request.displayedFieldName;
            return res;
        }
        if (!fieldReadable(fmap, request.valueFieldName)) {
            res.configurationMessage = 'Value field is not available or not readable: ' + request.valueFieldName;
            return res;
        }
        if (!String.isBlank(request.subtitleFieldName) && !fieldReadable(fmap, request.subtitleFieldName)) {
            res.configurationMessage = 'Subtitle field is not available or not readable: ' + request.subtitleFieldName;
            return res;
        }
        if (!String.isBlank(request.filteredFieldName) && !fieldReadable(fmap, request.filteredFieldName)) {
            res.configurationMessage = 'Filter field is not available or not readable: ' + request.filteredFieldName;
            return res;
        }

        if (!String.isBlank(request.otherFields)) {
            List<String> bad = collectUnreadableTokens(request.otherFields, fmap);
            if (!bad.isEmpty()) {
                res.configurationMessage = 'Additional fields are not readable: ' + String.join(bad, ', ');
                return res;
            }
        }

        Schema.DescribeFieldResult dispFr = fmap.get(request.displayedFieldName.toLowerCase()).getDescribe();
        res.displayFieldSupportsSearch = displayFieldSupportsLike(dispFr);
        if (!res.displayFieldSupportsSearch) {
            res.searchSupportMessage =
                'Typed search uses LIKE on the display field; prefer a text-like field (Name, text, picklist, etc.) so search works reliably.';
        }

        WhereClauseResult wc = buildWhereClauseAndBinds(
            fmap,
            request.displayedFieldName,
            request.filteredFieldName,
            request.filterFieldValue,
            null,
            request.whereClause
        );
        List<String> whereParts = wc.whereParts;
        Map<String, Object> binds = new Map<String, Object>(wc.binds);
        String whereStr = whereParts.isEmpty() ? 'Id != null' : String.join(whereParts, ' AND ');
        String countSoql = 'SELECT count() FROM ' + fromName + ' WHERE ' + whereStr;

        try {
            Integer cnt = Database.countQueryWithBinds(countSoql, binds, AccessLevel.USER_MODE);
            res.hasMatchingRows = cnt != null && cnt > 0;
            if (!res.hasMatchingRows) {
                res.dataAvailabilityMessage =
                    'No rows match this object and filters for the running user. The lookup will be empty until data or filters change.';
            }
        } catch (Exception e) {
            PFlowCpeChoiceEngineLog.error('validateLookupConfigurationCore count', e);
            res.configurationMessage = 'Query cannot run: ' + e.getMessage();
            return res;
        }

        res.isConfigurationValid = true;
        return res;
    }

    private static List<String> collectUnreadableTokens(String otherFields, Map<String, Schema.SObjectField> fmap) {
        List<String> bad = new List<String>();
        for (String p : otherFields.split(',')) {
            String tok = p == null ? '' : p.trim();
            if (String.isBlank(tok)) {
                continue;
            }
            if (!fieldReadable(fmap, tok)) {
                bad.add(tok);
            }
        }
        return bad;
    }

    private static Boolean displayFieldSupportsLike(Schema.DescribeFieldResult fr) {
        if (fr == null) {
            return false;
        }
        Schema.DisplayType t = fr.getType();
        return t == Schema.DisplayType.STRING ||
            t == Schema.DisplayType.TEXTAREA ||
            t == Schema.DisplayType.PICKLIST ||
            t == Schema.DisplayType.MULTIPICKLIST ||
            t == Schema.DisplayType.PHONE ||
            t == Schema.DisplayType.URL ||
            t == Schema.DisplayType.EMAIL ||
            t == Schema.DisplayType.ID;
    }

    @AuraEnabled
    public static List<ChoiceOption> getRecords(GetRecordsRequest request) {
        PFlowCpeChoiceEngineLog.setScenario();
        try {
            return getRecordsCore(request);
        } catch (Exception e) {
            PFlowCpeChoiceEngineLog.error('getRecords', e);
            return new List<ChoiceOption>();
        } finally {
            PFlowCpeChoiceEngineLog.saveLog();
        }
    }

    private static List<ChoiceOption> getRecordsCore(GetRecordsRequest request) {
        List<ChoiceOption> out = new List<ChoiceOption>();
        if (request == null) {
            return out;
        }
        List<SObject> rows = queryRecordsSoql(
            request.sObjectName,
            request.valueFieldName,
            request.otherFields,
            request.displayedFieldName,
            null,
            request.whereClause,
            request.filteredFieldName,
            request.filterFieldValue,
            null,
            null,
            null,
            null
        );
        Schema.DescribeSObjectResult d = describeObject(request.sObjectName);
        String icon = d == null ? null : iconForObject(d);
        String st = d == null ? null : d.getName();
        for (SObject row : rows) {
            Object disp = row.get(request.displayedFieldName);
            Object val = row.get(request.valueFieldName);
            out.add(
                new ChoiceOption(
                    val == null ? '' : String.valueOf(val),
                    disp == null ? '' : String.valueOf(disp),
                    null,
                    icon,
                    st
                )
            );
        }
        return out;
    }

    @SuppressWarnings('PMD.ExcessiveParameterList')
    @AuraEnabled(cacheable=true)
    public static List<ChoiceOption> getLookupSearchResultsDetailed(
        String sObjectName,
        String displayedFieldName,
        String subtitleFieldName,
        String valueFieldName,
        String otherFields,
        String whereClause,
        String filteredFieldName,
        String filterFieldValue,
        String searchTerm,
        String orderByField,
        String orderByDirection,
        Integer queryLimit
    ) {
        PFlowCpeChoiceEngineLog.setScenario();
        try {
            SearchRequest req = new SearchRequest();
            req.sObjectName = sObjectName;
            req.displayedFieldName = displayedFieldName;
            req.subtitleFieldName = subtitleFieldName;
            req.valueFieldName = valueFieldName;
            req.otherFields = otherFields;
            req.whereClause = whereClause;
            req.filteredFieldName = filteredFieldName;
            req.filterFieldValue = filterFieldValue;
            req.searchTerm = searchTerm;
            req.orderByField = orderByField;
            req.orderByDirection = orderByDirection;
            req.queryLimit = queryLimit;
            return getLookupSearchResultsCore(req);
        } catch (Exception e) {
            PFlowCpeChoiceEngineLog.error('getLookupSearchResultsDetailed', e);
            return new List<ChoiceOption>();
        } finally {
            PFlowCpeChoiceEngineLog.saveLog();
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<ChoiceOption> getLookupSearchResults(SearchRequest request) {
        PFlowCpeChoiceEngineLog.setScenario();
        try {
            return getLookupSearchResultsCore(request);
        } catch (Exception e) {
            PFlowCpeChoiceEngineLog.error('getLookupSearchResults', e);
            return new List<ChoiceOption>();
        } finally {
            PFlowCpeChoiceEngineLog.saveLog();
        }
    }

    private static List<ChoiceOption> getLookupSearchResultsCore(SearchRequest request) {
        List<ChoiceOption> results = new List<ChoiceOption>();
        if (request == null) {
            return results;
        }
        Schema.DescribeSObjectResult d = describeObject(request.sObjectName);
        if (d == null) {
            return results;
        }
        List<SObject> rows = queryRecordsSoql(
            request.sObjectName,
            request.valueFieldName,
            request.otherFields,
            request.displayedFieldName,
            request.subtitleFieldName,
            request.whereClause,
            request.filteredFieldName,
            request.filterFieldValue,
            request.searchTerm,
            request.orderByField,
            request.orderByDirection,
            request.queryLimit
        );
        String icon = iconForObject(d);
        for (SObject row : rows) {
            results.add(rowToLookupChoice(row, request, d.getName(), icon));
        }
        return results;
    }

    @AuraEnabled(cacheable=true)
    public static List<ChoiceOption> getSoslSearchResults(SearchRequest request) {
        PFlowCpeChoiceEngineLog.setScenario();
        try {
            return getSoslSearchResultsCore(request);
        } catch (Exception e) {
            PFlowCpeChoiceEngineLog.error('getSoslSearchResults', e);
            return new List<ChoiceOption>();
        } finally {
            PFlowCpeChoiceEngineLog.saveLog();
        }
    }

    private static List<ChoiceOption> getSoslSearchResultsCore(SearchRequest request) {
        List<ChoiceOption> results = new List<ChoiceOption>();
        if (request == null) {
            return results;
        }
        String term = request.searchTerm == null ? '' : request.searchTerm.trim();
        if (term.length() < 2) {
            return results;
        }
        Schema.DescribeSObjectResult d = describeObject(request.sObjectName);
        if (d == null) {
            return results;
        }
        Map<String, Schema.SObjectField> fmap = d.fields.getMap();
        if (String.isBlank(request.displayedFieldName) || String.isBlank(request.valueFieldName)) {
            return results;
        }
        if (!fieldReadable(fmap, request.valueFieldName) || !fieldReadable(fmap, request.displayedFieldName)) {
            return results;
        }
        if (!String.isBlank(request.subtitleFieldName) && !fieldReadable(fmap, request.subtitleFieldName)) {
            return results;
        }

        Set<String> selectFields = buildSelectFieldSet(
            request.displayedFieldName,
            request.valueFieldName,
            request.subtitleFieldName,
            request.otherFields,
            fmap
        );
        List<String> whereParts = new List<String>();
        if (!String.isBlank(request.filteredFieldName) && fieldReadable(fmap, request.filteredFieldName)) {
            String fv = request.filterFieldValue == null ? '' : String.valueOf(request.filterFieldValue);
            whereParts.add(request.filteredFieldName + ' = \'' + String.escapeSingleQuotes(fv) + '\'');
        }
        if (!String.isBlank(request.whereClause)) {
            whereParts.add('(' + request.whereClause + ')');
        }
        String whereStr = whereParts.isEmpty() ? '' : ' WHERE ' + String.join(whereParts, ' AND ');
        String fromName = d.getName();
        String fieldCsv = joinFields(selectFields);
        String findExpr = buildSoslFindExpression(term);
        String sosl = 'FIND ' + findExpr + ' IN ALL FIELDS RETURNING ' + fromName + '(' + fieldCsv + whereStr + ' LIMIT ' + MAX_ROWS + ')';

        List<List<SObject>> raw;
        try {
            raw = Search.query(sosl);
        } catch (Exception e) {
            PFlowCpeChoiceEngineLog.error('SOSL failed: ' + sosl, e);
            return results;
        }
        if (raw == null || raw.isEmpty()) {
            return results;
        }
        String icon = iconForObject(d);
        for (SObject row : raw[0]) {
            results.add(rowToLookupChoice(row, request, d.getName(), icon));
        }
        return results;
    }

    private static String buildSoslFindExpression(String term) {
        String cleaned = term.replace('{', ' ').replace('}', ' ').replace('\\', ' ').trim();
        if (String.isBlank(cleaned)) {
            cleaned = term;
        }
        String esc = String.escapeSingleQuotes(cleaned);
        return '\'*' + esc + '*\'';
    }

    @AuraEnabled
    public static ChoiceOption getFieldValue(GetFieldValueRequest request) {
        PFlowCpeChoiceEngineLog.setScenario();
        try {
            return getFieldValueCore(request);
        } catch (Exception e) {
            PFlowCpeChoiceEngineLog.error('getFieldValue', e);
            return null;
        } finally {
            PFlowCpeChoiceEngineLog.saveLog();
        }
    }

    private static ChoiceOption getFieldValueCore(GetFieldValueRequest request) {
        if (request == null || String.isBlank(request.obj) || String.isBlank(request.objId) || String.isBlank(request.label)) {
            return null;
        }
        Schema.DescribeSObjectResult d = describeObject(request.obj);
        if (d == null || !d.fields.getMap().containsKey(request.label.toLowerCase())) {
            return null;
        }
        String vf = 'Id';
        Set<String> fields = new Set<String>{ vf, request.label };
        String soql = 'SELECT ' + joinFields(fields) + ' FROM ' + request.obj + ' WHERE Id = :objId LIMIT 1';
        List<SObject> rows = Database.queryWithBinds(soql, new Map<String, Object>{ 'objId' => request.objId }, AccessLevel.USER_MODE);
        if (rows.isEmpty()) {
            return null;
        }
        SObject row = rows[0];
        Object disp = row.get(request.label);
        Object val = row.get(vf);
        return new ChoiceOption(
            val == null ? '' : String.valueOf(val),
            disp == null ? '' : String.valueOf(disp),
            null,
            iconForObject(d),
            d.getName()
        );
    }

    @AuraEnabled
    public static String getReference(String field) {
        PFlowCpeChoiceEngineLog.setScenario();
        try {
            return getReferenceCore(field);
        } catch (Exception e) {
            PFlowCpeChoiceEngineLog.error('getReference', e);
            return null;
        } finally {
            PFlowCpeChoiceEngineLog.saveLog();
        }
    }

    private static String getReferenceCore(String field) {
        if (String.isBlank(field)) {
            return null;
        }
        List<String> parts = field.split('\\.');
        if (parts.size() < 2) {
            return null;
        }
        String objName = parts[0];
        Schema.SObjectField f = resolveFieldToken(field);
        if (f == null) {
            return null;
        }
        Schema.DescribeFieldResult fr = f.getDescribe();
        if (fr.getType() == Schema.DisplayType.REFERENCE && fr.getReferenceTo() != null && !fr.getReferenceTo().isEmpty()) {
            return fr.getReferenceTo()[0].getDescribe().getName();
        }
        return objName;
    }

    @AuraEnabled
    public static String getHelpText(String field) {
        PFlowCpeChoiceEngineLog.setScenario();
        try {
            Schema.SObjectField f = resolveFieldToken(field);
            return f == null ? null : f.getDescribe().getInlineHelpText();
        } catch (Exception e) {
            PFlowCpeChoiceEngineLog.error('getHelpText', e);
            return null;
        } finally {
            PFlowCpeChoiceEngineLog.saveLog();
        }
    }

    // --- Private helpers ---

    private static ChoiceOption rowToLookupChoice(SObject row, SearchRequest request, String sObjectTypeName, String icon) {
        Object valObj = row.get(request.valueFieldName);
        String rid = valObj == null ? null : String.valueOf(valObj);
        Object tObj = row.get(request.displayedFieldName);
        String title = tObj == null ? '' : String.valueOf(tObj);
        String subt = null;
        if (!String.isBlank(request.subtitleFieldName)) {
            Object sObj = row.get(request.subtitleFieldName);
            subt = sObj == null ? null : String.valueOf(sObj);
        }
        return new ChoiceOption(rid, title, subt, icon, sObjectTypeName);
    }

    private static Schema.SObjectField findFieldIgnoreCase(Map<String, Schema.SObjectField> fm, String apiName) {
        Schema.SObjectField dep = fm.get(apiName.toLowerCase());
        if (dep != null) {
            return dep;
        }
        for (Schema.SObjectField fld : fm.values()) {
            if (fld.getDescribe().getName().equalsIgnoreCase(apiName)) {
                return fld;
            }
        }
        return null;
    }

    private static List<ChoiceOption> capChoiceList(List<ChoiceOption> rows, Integer maxN) {
        if (rows.size() <= maxN) {
            return rows;
        }
        List<ChoiceOption> limited = new List<ChoiceOption>();
        for (Integer i = 0; i < maxN; i++) {
            limited.add(rows[i]);
        }
        return limited;
    }

    private static Schema.SObjectType resolveSObjectType(String objectApiName) {
        if (String.isBlank(objectApiName)) {
            return null;
        }
        String o = objectApiName.trim();
        Map<String, Schema.SObjectType> gd = Schema.getGlobalDescribe();
        Schema.SObjectType t = gd.get(o);
        if (t != null) {
            return t;
        }
        for (String k : gd.keySet()) {
            if (k != null && k.equalsIgnoreCase(o)) {
                return gd.get(k);
            }
        }
        return null;
    }

    private static Schema.SObjectField resolveFieldToken(String field) {
        if (String.isBlank(field)) {
            return null;
        }
        List<String> parts = field.split('\\.');
        if (parts.size() < 2) {
            return null;
        }
        String objName = parts[0];
        String fieldName = parts[1];
        Schema.SObjectType t = Schema.getGlobalDescribe().get(objName);
        if (t == null) {
            return null;
        }
        return t.getDescribe().fields.getMap().get(fieldName.toLowerCase());
    }

    private static Schema.DescribeSObjectResult describeObject(String apiName) {
        if (String.isBlank(apiName)) {
            return null;
        }
        String o = apiName.trim();
        Map<String, Schema.SObjectType> gd = Schema.getGlobalDescribe();
        Schema.SObjectType t = gd.get(o);
        if (t == null) {
            for (String k : gd.keySet()) {
                if (k != null && k.equalsIgnoreCase(o)) {
                    t = gd.get(k);
                    break;
                }
            }
        }
        if (t == null) {
            return null;
        }
        Schema.DescribeSObjectResult d = t.getDescribe();
        if (!d.isAccessible()) {
            return null;
        }
        return d;
    }

    private static List<SObject> queryRecordsSoql(
        String sObjectName,
        String valueFieldName,
        String otherFields,
        String displayedFieldName,
        String subtitleFieldName,
        String whereClause,
        String filteredFieldName,
        String filterFieldValue,
        String searchTerm,
        String orderByField,
        String orderByDirection,
        Integer queryLimit
    ) {
        List<SObject> empty = new List<SObject>();
        Schema.DescribeSObjectResult d = describeObject(sObjectName);
        if (d == null) {
            return empty;
        }
        Map<String, Schema.SObjectField> fmap = d.fields.getMap();
        if (String.isBlank(displayedFieldName) || String.isBlank(valueFieldName)) {
            return empty;
        }
        if (!fieldReadable(fmap, valueFieldName) || !fieldReadable(fmap, displayedFieldName)) {
            return empty;
        }
        if (!String.isBlank(subtitleFieldName) && !fieldReadable(fmap, subtitleFieldName)) {
            return empty;
        }

        Set<String> selectFields = buildSelectFieldSet(displayedFieldName, valueFieldName, subtitleFieldName, otherFields, fmap);
        WhereClauseResult wc = buildWhereClauseAndBinds(fmap, displayedFieldName, filteredFieldName, filterFieldValue, searchTerm, whereClause);
        List<String> whereParts = wc.whereParts;
        Map<String, Object> binds = wc.binds;

        String whereStr = whereParts.isEmpty() ? 'Id != null' : String.join(whereParts, ' AND ');
        String orderByClause;
        if (String.isNotBlank(orderByField) && fieldReadable(fmap, orderByField)) {
            String dir = (String.isNotBlank(orderByDirection) && orderByDirection.equalsIgnoreCase('ASC')) ? 'ASC' : 'DESC';
            orderByClause = orderByField + ' ' + dir + ' NULLS LAST';
        } else if (String.isBlank(searchTerm) && fieldReadable(fmap, 'LastModifiedDate')) {
            orderByClause = 'LastModifiedDate DESC NULLS LAST';
        } else {
            String orderField = fieldReadable(fmap, displayedFieldName) ? displayedFieldName : 'Id';
            orderByClause = orderField + ' NULLS LAST';
        }
        String limitStr = '';
        if (queryLimit != null && queryLimit > 0) {
            Integer capped = Math.min(queryLimit, 2000);
            limitStr = ' LIMIT ' + capped;
        }
        String fromName = d.getName();
        String soql =
            'SELECT ' +
            joinFields(selectFields) +
            ' FROM ' +
            fromName +
            ' WHERE ' +
            whereStr +
            ' ORDER BY ' +
            orderByClause +
            limitStr;

        return Database.queryWithBinds(soql, binds, AccessLevel.USER_MODE);
    }

    private static Set<String> buildSelectFieldSet(
        String displayedFieldName,
        String valueFieldName,
        String subtitleFieldName,
        String otherFields,
        Map<String, Schema.SObjectField> fmap
    ) {
        Set<String> selectFields = new Set<String>{ valueFieldName, displayedFieldName };
        if (!String.isBlank(subtitleFieldName)) {
            selectFields.add(subtitleFieldName);
        }
        if (!String.isBlank(otherFields)) {
            for (String p : otherFields.split(',')) {
                String tok = p == null ? '' : p.trim();
                if (!String.isBlank(tok) && fieldReadable(fmap, tok)) {
                    selectFields.add(tok);
                }
            }
        }
        return selectFields;
    }

    private static WhereClauseResult buildWhereClauseAndBinds(
        Map<String, Schema.SObjectField> fmap,
        String displayedFieldName,
        String filteredFieldName,
        String filterFieldValue,
        String searchTerm,
        String whereClause
    ) {
        WhereClauseResult out = new WhereClauseResult();
        out.whereParts = new List<String>();
        out.binds = new Map<String, Object>();
        if (!String.isBlank(filteredFieldName) && fieldReadable(fmap, filteredFieldName)) {
            out.whereParts.add(filteredFieldName + ' = :filterFieldValue');
            out.binds.put('filterFieldValue', filterFieldValue);
        }
        appendSearchPredicate(out.whereParts, out.binds, fmap, displayedFieldName, searchTerm);
        if (!String.isBlank(whereClause)) {
            out.whereParts.add('(' + whereClause + ')');
        }
        return out;
    }

    private static void appendSearchPredicate(
        List<String> whereParts,
        Map<String, Object> binds,
        Map<String, Schema.SObjectField> fmap,
        String displayedFieldName,
        String searchTerm
    ) {
        if (String.isBlank(searchTerm) || !fieldReadable(fmap, displayedFieldName)) {
            return;
        }
        String st = searchTerm.trim();
        if (String.isBlank(st) || st.length() < 2) {
            return;
        }
        whereParts.add(displayedFieldName + ' LIKE :searchBind');
        binds.put('searchBind', '%' + st + '%');
    }

    private static Boolean fieldReadable(Map<String, Schema.SObjectField> fmap, String api) {
        Schema.SObjectField f = fmap.get(api.toLowerCase());
        return f != null && f.getDescribe().isAccessible();
    }

    private static String joinFields(Set<String> fields) {
        List<String> ordered = new List<String>(fields);
        ordered.sort();
        return String.join(ordered, ', ');
    }

    private static final Map<String, String> FIELD_TYPE_ICON_MAP = new Map<String, String>{
        'STRING' => 'utility:text',
        'TEXTAREA' => 'utility:textarea',
        'INTEGER' => 'utility:number_input',
        'LONG' => 'utility:number_input',
        'DOUBLE' => 'utility:number_input',
        'CURRENCY' => 'utility:currency',
        'PERCENT' => 'utility:percent',
        'BOOLEAN' => 'utility:check',
        'DATE' => 'utility:date_input',
        'DATETIME' => 'utility:date_time',
        'TIME' => 'utility:clock',
        'PICKLIST' => 'utility:picklist_type',
        'COMBOBOX' => 'utility:picklist_type',
        'MULTIPICKLIST' => 'utility:multi_select_picklist',
        'REFERENCE' => 'utility:record_lookup',
        'EMAIL' => 'utility:email',
        'PHONE' => 'utility:phone_portrait',
        'URL' => 'utility:link',
        'ID' => 'utility:key',
        'ADDRESS' => 'utility:location',
        'LOCATION' => 'utility:location',
        'ENCRYPTEDSTRING' => 'utility:lock',
        'BASE64' => 'utility:image',
        'ANYTYPE' => 'utility:text',
        'COMPLEXVALUE' => 'utility:recipe',
        'DATACATEGORYGROUPREFERENCE' => 'utility:recipe',
        'SOBJECT' => 'utility:sobject'
    };

    private static String iconForFieldType(String fieldType) {
        if (fieldType == null) return 'utility:text';
        String icon = FIELD_TYPE_ICON_MAP.get(fieldType.toUpperCase());
        return icon != null ? icon : 'utility:text';
    }

    private static String iconForObject(Schema.DescribeSObjectResult d) {
        String name = d.getName();
        if (name.endsWithIgnoreCase('__c')) {
            return 'custom:' + name.toLowerCase();
        }
        return 'standard:' + name.toLowerCase();
    }
}
