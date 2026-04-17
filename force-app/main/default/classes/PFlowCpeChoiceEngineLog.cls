/**
 * @description Logging bridge for Core Flow choice engine Apex. Uses System.debug so the package compiles
 * in orgs without Nebula Logger. When Nebula is installed, replace calls with Logger.setScenario / Logger.error / Logger.saveLog
 * per nebula-logger-standards.md (do not call saveLog from @AuraEnabled(cacheable=true) entry points).
 */
public inherited sharing class PFlowCpeChoiceEngineLog {
    /** @description Scenario name used in debug output. */
    private static final String SCENARIO = 'Core Flow Choice Engine';

    public static void setScenario() {
        System.debug(LoggingLevel.FINE, '[' + SCENARIO + ']');
    }

    public static void error(String context, Exception e) {
        String msg = context;
        if (e != null) {
            msg += ' | ' + e.getTypeName() + ': ' + e.getMessage();
        }
        System.debug(LoggingLevel.ERROR, '[' + SCENARIO + '] ' + msg);
    }

    /** @description No-op for System.debug bridge; Nebula would flush here for non-cacheable transactions. */
    public static void saveLog() {
    }
}
