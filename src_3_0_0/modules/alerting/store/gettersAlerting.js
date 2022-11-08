export default {
    /**
     * Getter for fetchBroadcastUrl.
     * @param {Object} state state
     * @returns {String} fetchBroadcastUrl
     */
    fetchBroadcastUrl: (state) => {
        return state.fetchBroadcastUrl;
    },
    /**
     * Getter for localStorageDisplayedAlertsKey.
     * @param {Object} state state
     * @returns {String} localStorageDisplayedAlertsKey
     */
    localStorageDisplayedAlertsKey: (state) => {
        return state.localStorageDisplayedAlertsKey;
    },
    /**
     * Getter for displayedAlerts.
     * @param {Object} state state
     * @returns {Object} displayedAlerts
     */
    displayedAlerts: (state) => {
        return state.displayedAlerts;
    },
    /**
     * Getter for showTheModal.
     * @param {Object} state state
     * @returns {Boolean} showTheModal
     */
    showTheModal: (state) => {
        return state.showTheModal;
    },
    /**
     * This returns the alerts queue array grouped by the alerts' category property.
     * @param {Object} state state
     * @returns {Object[]} sortedAlerts
     */
    sortedAlerts: (state) => {
        const
            resultByCategory = {},
            results = [];

        state.alerts.forEach(singleAlert => {
            if (resultByCategory[singleAlert.category] === undefined) {
                resultByCategory[singleAlert.category] = [];
            }
            resultByCategory[singleAlert.category].push({...singleAlert});
        });

        Object.keys(resultByCategory).forEach(key => {
            results.push({category: key, content: resultByCategory[key]});
        });

        return results;
    }
};
