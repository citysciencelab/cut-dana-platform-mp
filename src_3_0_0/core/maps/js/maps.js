import api from "@masterportal/masterportalapi/src/maps/api";
import {rawLayerList} from "@masterportal/masterportalapi/src";
import load3DScript from "@masterportal/masterportalapi/src/lib/load3DScript";

import {setResolutions, setValues} from "./setValuesToMapView";
import store from "../../../app-store";
import mapMarker from "./mapMarker";

/**
 * Create the map in different modes and update the map attributes.
 * @param {Object} mapViewSettings The map view settings.
 * @param {Object} configJs The config.js.
 * @returns {void}
 */
function initializeMaps (mapViewSettings, configJs) {
    create2DMap(mapViewSettings, configJs);
    store.dispatch("Maps/setMapAttributes");
    watchPortalConfig();
    load3DMap(configJs);
    mapMarker.initializeMapMarkers(configJs);
}

/**
 * Create the 2D map with mapview.
 * @param {Object} mapViewSettings The mapViewSettings of config.json file.
 * @param {Object} configJs The config.js.
 * @returns {void}
 */
function create2DMap (mapViewSettings, configJs) {
    const map2d = api.map.createMap({
        ...configJs,
        ...mapViewSettings,
        layerConf: rawLayerList.getLayerList()
    }, "2D", {});

    mapCollection.addMap(map2d, "2D");
}

/**
 * Watches the mapViewSettings
 * Sets the changed attributes.
 * @returns {void}
 */
function watchPortalConfig () {
    store.watch((state, getters) => getters.mapViewSettings, mapViewSettings => {
        const view = mapCollection.getMapView("2D"),
            resolutions = mapViewSettings?.options?.map(entry => entry.resolution);

        setResolutions(view, resolutions);
        setValues(view, mapViewSettings);
    });
}

/**
 * Loads Cesium and the start creating the 3D map.
 * @param {Object} configJs The config.js.
 * @returns {void}
 */
function load3DMap (configJs) {
    load3DScript.load3DScript(store.getters.cesiumLibrary, () => {
        create3DMap(configJs);
        store.dispatch("Maps/registerCesiumListener");

        if (configJs.startingMap3D) {
            store.dispatch("Maps/activateMap3d", "3D");
        }
    });
}

/**
 * Create the 3D map.
 * @param {Object} configJs The settings of config.json file.
 * @returns {void}
 */
function create3DMap (configJs) {
    const map3d = api.map.createMap({
        cesiumParameter: configJs?.cesiumParameter,
        map2D: mapCollection.getMap("2D"),
        shadowTime: function () {
            return this.time || Cesium.JulianDate.fromDate(new Date());
        }
    }, "3D");

    /**
     * Note: if the bugfix was released in an olcs version these two lines should be removed again
     * @see {@link https://github.com/openlayers/ol-cesium/pull/1109}
     */
    map3d.setEnabled(true);
    map3d.setEnabled(configJs.startingMap3D);

    mapCollection.addMap(map3d, "3D");
}

module.exports = {
    create3DMap,
    initializeMaps,
    load3DMap
};
