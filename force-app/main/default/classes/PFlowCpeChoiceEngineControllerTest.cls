/**
 * @description Tests for PFlowCpeChoiceEngineController (adapted from coreFlow test coverage).
 */
@IsTest
private class PFlowCpeChoiceEngineControllerTest {
    @IsTest
    static void testValidateLookupConfiguration_leadObject() {
        if (!Schema.getGlobalDescribe().containsKey('Lead')) {
            return;
        }
        PFlowCpeChoiceEngineController.SearchRequest req = new PFlowCpeChoiceEngineController.SearchRequest();
        req.sObjectName = 'Lead';
        req.displayedFieldName = 'LastName';
        req.valueFieldName = 'Id';
        PFlowCpeChoiceEngineController.LookupValidationResult r = PFlowCpeChoiceEngineController.validateLookupConfiguration(req);
        String cfgMsg = r.configurationMessage == null ? '' : r.configurationMessage;
        Assert.areEqual(true, r.isConfigurationValid, cfgMsg);
        Assert.areEqual(true, r.displayFieldSupportsSearch);
    }

    @IsTest
    static void testValidateLookupConfiguration_invalidObject() {
        PFlowCpeChoiceEngineController.SearchRequest req = new PFlowCpeChoiceEngineController.SearchRequest();
        req.sObjectName = 'ZZZNomatchObject999__c';
        req.displayedFieldName = 'Name';
        req.valueFieldName = 'Id';
        PFlowCpeChoiceEngineController.LookupValidationResult r = PFlowCpeChoiceEngineController.validateLookupConfiguration(req);
        Assert.areEqual(false, r.isConfigurationValid);
    }

    @IsTest
    static void testValidateLookupConfiguration_badDisplayField() {
        PFlowCpeChoiceEngineController.SearchRequest req = new PFlowCpeChoiceEngineController.SearchRequest();
        req.sObjectName = 'Account';
        req.displayedFieldName = 'NotARealField9999';
        req.valueFieldName = 'Id';
        PFlowCpeChoiceEngineController.LookupValidationResult r = PFlowCpeChoiceEngineController.validateLookupConfiguration(req);
        Assert.areEqual(false, r.isConfigurationValid);
    }

    @IsTest
    static void testValidateLookupConfiguration_accountWithImpossibleWhere() {
        PFlowCpeChoiceEngineController.SearchRequest req = new PFlowCpeChoiceEngineController.SearchRequest();
        req.sObjectName = 'Account';
        req.displayedFieldName = 'Name';
        req.valueFieldName = 'Id';
        req.whereClause = 'Name = \'__nomatch_coreflow_test__\'';
        PFlowCpeChoiceEngineController.LookupValidationResult r = PFlowCpeChoiceEngineController.validateLookupConfiguration(req);
        Assert.areEqual(true, r.isConfigurationValid);
        Assert.areEqual(false, r.hasMatchingRows);
    }

    @IsTest
    static void testGetLookupSearchResults_emptyWhenInvalidObject() {
        PFlowCpeChoiceEngineController.SearchRequest req = new PFlowCpeChoiceEngineController.SearchRequest();
        req.sObjectName = 'BadObjectZZZ__c';
        req.displayedFieldName = 'Name';
        req.valueFieldName = 'Id';
        List<PFlowCpeChoiceEngineController.ChoiceOption> rows = PFlowCpeChoiceEngineController.getLookupSearchResults(req);
        Assert.areEqual(0, rows.size());
    }

    @IsTest
    static void testGetLookupSearchResults_withSearchTerm() {
        Account a = new Account(Name = 'PflowCpeLkupSrch 991');
        insert a;
        PFlowCpeChoiceEngineController.SearchRequest req = new PFlowCpeChoiceEngineController.SearchRequest();
        req.sObjectName = 'Account';
        req.displayedFieldName = 'Name';
        req.valueFieldName = 'Id';
        req.subtitleFieldName = 'Industry';
        req.otherFields = 'Phone';
        req.searchTerm = 'PflowCpe';
        List<PFlowCpeChoiceEngineController.ChoiceOption> rows = PFlowCpeChoiceEngineController.getLookupSearchResults(req);
        Assert.isTrue(!rows.isEmpty());
    }

    @IsTest
    static void testGetLookupSearchResultsDetailed_accountSearch() {
        Account a = new Account(Name = 'PflowCpeDetailSrch 992');
        insert a;
        List<PFlowCpeChoiceEngineController.ChoiceOption> rows = PFlowCpeChoiceEngineController.getLookupSearchResultsDetailed(
            'Account',
            'Name',
            null,
            'Id',
            null,
            null,
            null,
            null,
            'PflowCpeDetailSrch',
            null,
            null,
            null
        );
        Assert.isTrue(!rows.isEmpty());
    }

    @IsTest
    static void testGetRecords_accounts() {
        Account a = new Account(Name = 'PflowCpeRec 992');
        insert a;
        PFlowCpeChoiceEngineController.GetRecordsRequest gr = new PFlowCpeChoiceEngineController.GetRecordsRequest();
        gr.sObjectName = 'Account';
        gr.displayedFieldName = 'Name';
        gr.valueFieldName = 'Id';
        List<PFlowCpeChoiceEngineController.ChoiceOption> rs = PFlowCpeChoiceEngineController.getRecords(gr);
        Assert.isTrue(!rs.isEmpty());
    }

    @IsTest
    static void testGetFieldValue_accountName() {
        Account a = new Account(Name = 'PflowCpeFV 993');
        insert a;
        PFlowCpeChoiceEngineController.GetFieldValueRequest fv = new PFlowCpeChoiceEngineController.GetFieldValueRequest();
        fv.obj = 'Account';
        fv.objId = a.Id;
        fv.label = 'Name';
        PFlowCpeChoiceEngineController.ChoiceOption one = PFlowCpeChoiceEngineController.getFieldValue(fv);
        Assert.areNotEqual(null, one);
        Assert.areEqual(a.Id, one.value);
    }

    @IsTest
    static void testGetFieldValue_invalidParams() {
        PFlowCpeChoiceEngineController.GetFieldValueRequest fv = new PFlowCpeChoiceEngineController.GetFieldValueRequest();
        fv.obj = 'Account';
        fv.objId = null;
        fv.label = 'Name';
        PFlowCpeChoiceEngineController.ChoiceOption one = PFlowCpeChoiceEngineController.getFieldValue(fv);
        Assert.areEqual(null, one);
    }

    @IsTest
    static void testGetReferenceAndHelpText() {
        PFlowCpeChoiceEngineController.getReference('Contact.AccountId');
        PFlowCpeChoiceEngineController.getHelpText('Account.Name');
        PFlowCpeChoiceEngineController.getReference('NotDotted');
        PFlowCpeChoiceEngineController.getReference('');
    }

    @IsTest
    static void testValidateLookup_badAdditionalField() {
        PFlowCpeChoiceEngineController.SearchRequest req = new PFlowCpeChoiceEngineController.SearchRequest();
        req.sObjectName = 'Account';
        req.displayedFieldName = 'Name';
        req.valueFieldName = 'Id';
        req.otherFields = 'NotARealField9999';
        PFlowCpeChoiceEngineController.LookupValidationResult r = PFlowCpeChoiceEngineController.validateLookupConfiguration(req);
        Assert.areEqual(false, r.isConfigurationValid);
    }

    @IsTest
    static void testValidateLookup_nullRequest() {
        PFlowCpeChoiceEngineController.LookupValidationResult r = PFlowCpeChoiceEngineController.validateLookupConfiguration(null);
        Assert.areEqual(false, r.isConfigurationValid);
    }

    @IsTest
    static void testValidateLookupConfigurationDetailed_lead() {
        if (!Schema.getGlobalDescribe().containsKey('Lead')) {
            return;
        }
        PFlowCpeChoiceEngineController.LookupValidationResult r = PFlowCpeChoiceEngineController.validateLookupConfigurationDetailed(
            'Lead',
            'LastName',
            null,
            'Id',
            null,
            null,
            null,
            null
        );
        String m = r.configurationMessage == null ? '' : r.configurationMessage;
        Assert.areEqual(true, r.isConfigurationValid, m);
    }

    @IsTest
    static void testGetLookupSearchResults_nullRequest() {
        List<PFlowCpeChoiceEngineController.ChoiceOption> rows = PFlowCpeChoiceEngineController.getLookupSearchResults(null);
        Assert.areEqual(0, rows.size());
    }

    @IsTest
    static void testGetRecords_nullRequest() {
        List<PFlowCpeChoiceEngineController.ChoiceOption> rs = PFlowCpeChoiceEngineController.getRecords(null);
        Assert.areEqual(0, rs.size());
    }

    @IsTest
    static void testGetSoslSearchResults_account() {
        Account a = new Account(Name = 'PflowCpeSoslUnique 884422');
        insert a;
        PFlowCpeChoiceEngineController.SearchRequest req = new PFlowCpeChoiceEngineController.SearchRequest();
        req.sObjectName = 'Account';
        req.displayedFieldName = 'Name';
        req.valueFieldName = 'Id';
        req.searchTerm = '884422';
        List<PFlowCpeChoiceEngineController.ChoiceOption> rows = PFlowCpeChoiceEngineController.getSoslSearchResults(req);
        Assert.isTrue(!rows.isEmpty(), 'SOSL should find inserted Account by name token');
    }

    @IsTest
    static void testGetSoslSearchResults_shortTermReturnsEmpty() {
        PFlowCpeChoiceEngineController.SearchRequest req = new PFlowCpeChoiceEngineController.SearchRequest();
        req.sObjectName = 'Account';
        req.displayedFieldName = 'Name';
        req.valueFieldName = 'Id';
        req.searchTerm = 'x';
        List<PFlowCpeChoiceEngineController.ChoiceOption> rows = PFlowCpeChoiceEngineController.getSoslSearchResults(req);
        Assert.areEqual(0, rows.size());
    }

    // --- Field selector tests ---

    @IsTest
    static void testGetObjectFieldsReturnsAccountFields() {
        Test.startTest();
        List<PFlowCpeChoiceEngineController.Field> fields = PFlowCpeChoiceEngineController.getObjectFields('Account');
        Test.stopTest();

        Boolean accountOk =
            Schema.getGlobalDescribe().containsKey('Account') &&
            Schema.getGlobalDescribe().get('Account').getDescribe().isAccessible();
        Assert.isTrue(accountOk, 'Account should be accessible in describe for this org');

        if (fields.isEmpty()) {
            return;
        }
        Boolean hasName = false;
        for (PFlowCpeChoiceEngineController.Field f : fields) {
            if (f.name == 'Name') {
                hasName = true;
                break;
            }
        }
        Assert.isTrue(hasName, 'Account.Name should be present when any Account fields are readable');
    }

    @IsTest
    static void testGetObjectFieldsBlankNameReturnsEmpty() {
        Assert.areEqual(0, PFlowCpeChoiceEngineController.getObjectFields(null).size());
        Assert.areEqual(0, PFlowCpeChoiceEngineController.getObjectFields('').size());
        Assert.areEqual(0, PFlowCpeChoiceEngineController.getObjectFields('   ').size());
    }

    @IsTest
    static void testGetObjectFieldsInvalidTypeReturnsEmpty() {
        Assert.areEqual(0, PFlowCpeChoiceEngineController.getObjectFields('NotARealObjectZZZ999').size());
    }

    @IsTest
    static void testSearchSObjectTypesReturnsAccount() {
        List<PFlowCpeChoiceEngineController.ChoiceOption> rows = PFlowCpeChoiceEngineController.searchSObjectTypes('accoun');
        Assert.isTrue(!rows.isEmpty());
        Boolean found = false;
        for (PFlowCpeChoiceEngineController.ChoiceOption r : rows) {
            if (r.value == 'Account') {
                found = true;
                break;
            }
        }
        Assert.isTrue(found);
    }

    @IsTest
    static void testSearchPicklistFieldsForAccountReturnsRowsWhenVisible() {
        List<PFlowCpeChoiceEngineController.ChoiceOption> rows = PFlowCpeChoiceEngineController.searchPicklistFieldsForObject('Account', '');
        if (rows.isEmpty()) {
            return;
        }
        Boolean anyPicklist = false;
        for (PFlowCpeChoiceEngineController.ChoiceOption r : rows) {
            if (r.subtitle != null && r.subtitle.contains('PICKLIST')) {
                anyPicklist = true;
                break;
            }
        }
        Assert.isTrue(anyPicklist);
    }

    @IsTest
    static void testGetControllerFieldApiNameNameFieldReturnsBlank() {
        Assert.areEqual('', PFlowCpeChoiceEngineController.getControllerFieldApiName('Account', 'Name'));
    }

    @IsTest
    static void testSearchPicklistValuesForAccountIndustry() {
        List<PFlowCpeChoiceEngineController.ChoiceOption> vals = PFlowCpeChoiceEngineController.searchControllerPicklistValues(
            'Account',
            'Industry',
            ''
        );
        Assert.areEqual(0, vals.size());
    }

    @IsTest
    static void testSearchSObjectTypesBlankReturnsRows() {
        List<PFlowCpeChoiceEngineController.ChoiceOption> rows = PFlowCpeChoiceEngineController.searchSObjectTypes('');
        Assert.isTrue(!rows.isEmpty());
    }

    @IsTest
    static void testSearchPicklistFieldsBlankObjectReturnsEmpty() {
        Assert.areEqual(0, PFlowCpeChoiceEngineController.searchPicklistFieldsForObject('', 'x').size());
        Assert.areEqual(0, PFlowCpeChoiceEngineController.searchPicklistFieldsForObject(null, 'x').size());
    }

    @IsTest
    static void testGetControllerFieldBlankArgs() {
        Assert.areEqual('', PFlowCpeChoiceEngineController.getControllerFieldApiName('', 'Name'));
        Assert.areEqual('', PFlowCpeChoiceEngineController.getControllerFieldApiName('Account', ''));
    }

    @IsTest
    static void testSearchPicklistValuesForFieldIndustryWhenReadable() {
        Schema.DescribeFieldResult ind = Account.Industry.getDescribe();
        if (!ind.isAccessible()) {
            return;
        }
        List<PFlowCpeChoiceEngineController.ChoiceOption> vals = PFlowCpeChoiceEngineController.searchPicklistValuesForFieldForTest(
            'Account',
            'Industry',
            ''
        );
        Assert.isTrue(!vals.isEmpty());
    }

    @IsTest
    static void testSearchPicklistValuesForNonPicklistFieldReturnsEmpty() {
        Assert.areEqual(
            0,
            PFlowCpeChoiceEngineController.searchPicklistValuesForFieldForTest('Account', 'Name', '').size()
        );
    }

    @IsTest
    static void testSearchPicklistFieldsBogusObjectReturnsEmpty() {
        Assert.areEqual(0, PFlowCpeChoiceEngineController.searchPicklistFieldsForObject('NotAnObjectZZZ__c', '').size());
    }

    @IsTest
    static void testSearchControllerPicklistBogusObjectReturnsEmpty() {
        Assert.areEqual(
            0,
            PFlowCpeChoiceEngineController.searchControllerPicklistValues('NotAnObjectZZZ__c', 'Field__c', '').size()
        );
    }

    @IsTest
    static void testSearchPicklistValuesBogusObjectReturnsEmpty() {
        Assert.areEqual(
            0,
            PFlowCpeChoiceEngineController.searchPicklistValuesForFieldForTest('NotAnObjectZZZ__c', 'Industry', '').size()
        );
    }

    @IsTest
    static void testSearchPicklistValuesWithSearchKeyFilter() {
        if (!Account.Industry.getDescribe().isAccessible()) {
            return;
        }
        List<PFlowCpeChoiceEngineController.ChoiceOption> vals = PFlowCpeChoiceEngineController.searchPicklistValuesForFieldForTest(
            'Account',
            'Industry',
            'zzzznomatch999'
        );
        Assert.areEqual(0, vals.size());
    }

    @IsTest
    static void testSearchSObjectTypesNoMatchReturnsEmpty() {
        List<PFlowCpeChoiceEngineController.ChoiceOption> rows = PFlowCpeChoiceEngineController.searchSObjectTypes('zzzzzznomatchobject99999');
        Assert.areEqual(0, rows.size());
    }

    @IsTest
    static void testGetRecordTypeOptionsLead() {
        if (!Schema.getGlobalDescribe().containsKey('Lead')) {
            return;
        }
        List<PFlowCpeChoiceEngineController.ChoiceOption> rts = PFlowCpeChoiceEngineController.getRecordTypeOptions('Lead');
        Assert.isTrue(!rts.isEmpty());
    }

    @IsTest
    static void testSearchLookupDatasetFieldsForLead() {
        if (!Schema.getGlobalDescribe().containsKey('Lead')) {
            return;
        }
        List<PFlowCpeChoiceEngineController.ChoiceOption> rows = PFlowCpeChoiceEngineController.searchLookupDatasetFieldsForObject('Lead', '');
        Assert.isTrue(!rows.isEmpty());
        Boolean sawName = false;
        for (PFlowCpeChoiceEngineController.ChoiceOption r : rows) {
            if (r != null && r.value == 'Name') {
                sawName = true;
                break;
            }
        }
        Assert.isTrue(sawName);
    }
}
