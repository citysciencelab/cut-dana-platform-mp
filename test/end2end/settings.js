const webdriver = require("selenium-webdriver"),
    capabilities = {
        firefox: {"browserName": "firefox", acceptSslCerts: true, acceptInsecureCerts: true},
        chrome: {"browserName": "chrome", version: "79", acceptSslCerts: true, acceptInsecureCerts: true},
        ie: webdriver.Capabilities.ie()
    },
    /** TODO
     * when changing the following values, also change the functions beneath; the values there should eventually
     * be replaced with references to these arrays, but during test writing, cases are oftentimes commented out,
     * effectively changing indices lots of time; do this when all e2e tests have been written
     */
    resolutions = [
        "1024x768"
        // "600x800"
    ],
    configs = new Map([
        ["CT", "/test/end2end/resources/configs/custom"], // CT = Custom Tree (like portal/masterTree)
        ["DT", "/test/end2end/resources/configs/default"], // DT = Default Tree (like portal/master)
        ["LT", "/test/end2end/resources/configs/basic"] // LT = Light Tree (like portal/basic)
    ]),
    modes = [
        "2D",
        // "3D",
        // "OB"
    ];

/**
 * Returns true for all resolutions marked mobile.
 * @param {String} resolution as WIDTHxHEIGHT
 * @returns {boolean} whether resolution is supposed to model mobile view
 */
function isMobile (resolution) {
    return resolution === "600x800";
}

/**
 * Returns true for 2D mode.
 * @param {String} mode to check
 * @returns {boolean} whether mode is 2D
 */
function is2D (mode) {
    return mode === "2D";
}

/**
 * Returns true for 3D mode.
 * @param {String} mode to check
 * @returns {boolean} whether mode is 3D
 */
function is3D (mode) {
    return mode === "3D";
}

/**
 * Returns true for OB mode.
 * @param {String} mode to check
 * @returns {boolean} whether mode is OB
 */
function isOB (mode) {
    return mode === "OB";
}

/**
 * Returns true for url indicating basic (LT) configuration.
 * @param {String} url url in use
 * @returns {boolean} whether configuration is basic
 */
function isBasic (url) {
    return url.includes(configs.get("LT"));
}

/**
 * Returns true for url indicating default (DT) configuration.
 * @param {String} url url in use
 * @returns {boolean} whether configuration is default
 */
function isDefault (url) {
    return url.includes(configs.get("DT"));
}

/**
 * Returns true for url indicating custom (CT) configuration.
 * @param {String} url url in use
 * @returns {boolean} whether configuration is custom
 */
function isCustom (url) {
    return url.includes(configs.get("CT"));
}

/**
 * Produces browserstack configurations.
 * @param {String} browserstackuser username
 * @param {String} browserstackkey key
 * @returns {Array} array of bs configuration objects
 */
function getBsCapabilities (browserstackuser, browserstackkey) {
    const base = {
        "seleniumVersion": "4.0.0-alpha.5",
        "project": "MasterPortal",
        "browserstack.local": true,
        "browserstack.user": browserstackuser,
        "browserstack.key": browserstackkey,
        // resolution of device, not resolution of browser window
        "resolution": "1024x768"
    };

    return [
        {
            ...base,
            "browserName": "Chrome",
            "browser_version": "74.0",
            "os": "Windows",
            "os_version": "10"
        }/*
        {
            ...base,
            "browserName": "Safari",
            "browser_version": "12.0",
            "os": "OS X",
            "os_version": "Mojave"
        }*/
    ];
}

module.exports = {
    capabilities,
    resolutions,
    configs,
    modes,
    is2D,
    is3D,
    isOB,
    isMobile,
    isBasic,
    isDefault,
    isCustom,
    getBsCapabilities
};
