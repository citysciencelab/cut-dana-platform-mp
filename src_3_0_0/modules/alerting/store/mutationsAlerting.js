import moment from "moment";
import {generateSimpleMutations} from "../../../shared/js/utils/generators";
import initialState from "./stateAlerting";

export default {
    ...generateSimpleMutations(initialState),
    /**
     * Set state config
     * @param {Object} state state
     * @param {Object} configs configs
     * @returns {void}
     */
    setConfigs (state, configs) {
        state.configJs = configs;
    },
    /**
     * Adds a single alert with a push.
     * @param {Object} state state
     * @param {Object} newAlert new alert
     * @returns {void}
     */
    addToAlerts (state, newAlert) {
        state.alerts.push(newAlert);
    },
    /**
     * Removes a single given alert from queue.
     * @param {Object} state state
     * @param {Object} alertToRemove alert object to remove
     * @returns {void}
     */
    removeFromAlerts (state, alertToRemove) {
        state.alerts = state.alerts.filter(singleAlert => singleAlert.hash !== alertToRemove.hash);
    },
    /**
     * Sets the showTheModal flag toggling the modal's visibility.
     * @param {Object} state state
     * @param {Boolean} showTheModal visibility flag
     * @returns {void}
     */
    setReadyToShow (state, showTheModal) {
        state.showTheModal = showTheModal;
    },
    /**
     * Sets a single alert's has-been-read status to true by actually removing its mustBeConfirmed flag.
     * @param {Object} state state
     * @param {Object} singleAlert alert object that has been read
     * @returns {void}
     */
    setAlertAsRead (state, singleAlert) {
        singleAlert.mustBeConfirmed = false;
    },
    /**
     * Adds a reference, that a single alert has been displayed. Do not confuse this with has been read.
     * @param {Object} state state
     * @param {Object} newAlert alert object that has been displayed
     * @returns {void}
     */
    addToDisplayedAlerts (state, newAlert) {
        state.displayedAlerts = {...state.displayedAlerts, [newAlert.hash]: moment().format()};
    },
    /**
     * Sets all displayed alert references.
     * @param {Object} state state
     * @param {Object} alerts object containing all displayed alert references
     * @returns {void}
     */
    setDisplayedAlerts (state, alerts) {
        state.displayedAlerts = alerts;
    }
};
