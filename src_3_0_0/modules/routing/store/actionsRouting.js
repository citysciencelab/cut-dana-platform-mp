import {
    fetchRoutingNominatimGeosearch,
    fetchRoutingNominatimGeosearchReverse
} from "../js/geosearch/routing-nominatim-geosearch";
import crs from "@masterportal/masterportalapi/src/crs";
import {fetchRoutingBkgGeosearch, fetchRoutingBkgGeosearchReverse} from "../js/geosearch/routing-bkg-geosearch";
import * as constantsRouting from "./constantsRouting";

/**
 * @const {String} configPath an array of possible config locations. First one found will be used
 */

export default {
    /**
     * Called when the routing tool is created.
     * @param {Object} context actions context object.
     * @returns {void}
     */
    async initRouting ({dispatch}) {
        await dispatch("checkNonOptionalConfigFields");
    },

    /**
     * Resets all directions and sets the first waypoint.
     * @param {Object} context the vuex context
     * @param {Object} context.dispatch the dispatch
     * @param {Object} payload the vuex context
     * @param {String} payload.displayName name to show at start routing input field
     * @param {Array} payload.coordinates coordinates of the routing start waypoint
     * @returns {void}
     */
    setFirstWayPoint ({dispatch}, {displayName, coordinates}) {
        dispatch("Directions/reset");
        dispatch("Directions/addWaypoint", {index: 0, displayName, coordinates, fromExtern: true});
    },

    /**
     * Checks all non optional config fileds in the config.json.
     * @param {Object} context actions context object.
     * @returns {void}
     */
    checkNonOptionalConfigFields ({state}) {
        const checkPaths = constantsRouting.nonOptionalConfigFields.map(field => field.split(".")),
            missing = checkPaths.filter(path => {
                const val = path.reduce((partObj, partPath) => {
                    return partObj?.[partPath];
                }, state);

                return val === undefined || val === null;
            });

        if (missing.length > 0) {
            throw new Error("Routing tool is not configured correctly. The following required fields are missing: " + missing.map(m => m.join(".")).join(", "));
        }
    },
    /**
     * Async fetch Coordinates by text.
     * @param {Object} context actions context object.
     * @param {String} search searching text.
     * @returns {RoutingGeosearchResult[]} Returns parsed Array of RoutingGeosearchResults.
     */
    async fetchCoordinatesByText ({state, dispatch}, {search}) {
        let geosearchResults = [];

        if (search.length < state.geosearch.minChars) {
            return geosearchResults;
        }
        if (search.length > 0) {
            try {
                // Possible to change Geosearch by changing function depending on config
                if (state.geosearch.type === "NOMINATIM") {
                    geosearchResults = await fetchRoutingNominatimGeosearch(search);
                }
                else if (state.geosearch.type === "BKG") {
                    geosearchResults = await fetchRoutingBkgGeosearch(search);
                }
                else {
                    throw new Error("Geosearch is not configured correctly.");
                }

                // Transform WGS84 Coordinates to Local Projection
                geosearchResults.forEach(async geosearchResult => {
                    const coordinatesLocal = await dispatch(
                        "Modules/Routing/transformCoordinatesWgs84ToLocalProjection",
                        [geosearchResult.getLng(), geosearchResult.getLat()],
                        {root: true}
                    );

                    geosearchResult.setCoordinates(coordinatesLocal);
                });
            }
            catch (err) {
                dispatch("Alerting/addSingleAlert", {
                    category: "error",
                    title: i18next.t("common:modules.alerting.categories.error"),
                    content: i18next.t("common:modules.routing.errors.fetchingCoordinates")
                }, {root: true});
            }
        }
        return geosearchResults;
    },

    /**
     * Async fetch Text by Coordinates.
     * @param {Object} context actions context object.
     * @param {Array<{Number, Number}>} coordinates LonLat Coordinates.
     * @returns {RoutingGeosearchResult} Returns parsed Array of RoutingGeosearchResults.
     */
    async fetchTextByCoordinates ({state, dispatch}, {coordinates}) {
        let geosearchResult = null;

        try {
            // Possible to change Geosearch by changing function depending on config
            if (state.geosearch.type === "NOMINATIM") {
                geosearchResult = await fetchRoutingNominatimGeosearchReverse(
                    coordinates
                );
            }
            else if (state.geosearch.type === "BKG") {
                geosearchResult = await fetchRoutingBkgGeosearchReverse(coordinates);
            }
            else {
                throw new Error("Geosearch is not configured correctly.");
            }

            // Transform WGS84 Coordinates to Local Projection
            const coordinatesLocal = await dispatch(
                "Modules/Routing/transformCoordinatesWgs84ToLocalProjection",
                [geosearchResult.getLng(), geosearchResult.getLat()],
                {root: true}
            );

            geosearchResult.setCoordinates(coordinatesLocal);
        }
        catch (err) {
            // fail silently, comment needed for linter
        }
        return geosearchResult;
    },

    /**
     * Transforms the given coordinates from the local projection to the wgs84 projections
     * @param {Object} context actions context object.
     * @param {Array<{Number, Number}>} coordinates to project
     * @returns {Array<{Number, Number}>} projected wgs84 coordinates
     */
    transformCoordinatesLocalToWgs84Projection ({rootState}, coordinates) {
        return crs.transform(
            crs.getMapProjection(mapCollection.getMap(rootState.Maps.mode)),
            "EPSG:4326",
            coordinates
        );
    },
    /**
     * Transforms the given coordinates from the wgs84 projection to the local projections
     * @param {Object} context actions context object.
     * @param {Array<{Number, Number}>} coordinates to project
     * @returns {Array<{Number, Number}>} projected local coordinates
     */
    transformCoordinatesWgs84ToLocalProjection ({rootState}, coordinates) {
        return crs.transform(
            "EPSG:4326",
            crs.getMapProjection(mapCollection.getMap(rootState.Maps.mode)),
            coordinates
        );
    }
};
