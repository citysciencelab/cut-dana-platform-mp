import {createLayer} from "./layerFactory";
import layerCollection from "./layerCollection";
import store from "../../../app-store";

/**
 * Starts the creation of the layer in the layer factory
 * and register watcher.
 * @param {Object[]} visibleLayerConfigs The layer configurations.
 * @returns {void}
 */
export default function initializeLayers (visibleLayerConfigs) {
    processLayerConfig(visibleLayerConfigs, store.getters["Maps/mode"]);

    watchMapMode();
    watchLayerConfig();
}

/**
 * Watches the mode in Maps.
 * Starts processing of visible 3d layer configs.
 * @returns {void}
 */
function watchMapMode () {
    store.watch((state, getters) => getters["Maps/mode"], mapMode => {
        if (mapMode === "3D") {
            processLayerConfig(store.getters.visibleLayerConfigs, mapMode);
        }
    });
}

/**
 * Watch the layers in layerConfig.
 * Starts processing of all layer configs.
 * @returns {void}
 */
function watchLayerConfig () {
    store.watch((state, getters) => getters.allLayerConfigs, layerConfig => {
        processLayerConfig(layerConfig, store.getters["Maps/mode"]);
    });
}

/**
 * Processes the layerConfig.
 * All existing layers will be updated.
 * Of the non-existing layers, only the visible ones are created and pushed into the LayerCollection.
 * @param {Object[]} layerConfig The layer configurations.
 * @param {String} mapMode The current map mode.
 * @returns {void}
 */
export function processLayerConfig (layerConfig, mapMode) {
    layerConfig.forEach(layerConf => {
        let layer = layerCollection.getLayerById(layerConf.id);

        if (layer !== undefined) {
            updateLayerAttributes(layer, layerConf);
        }
        else if (layerConf.visibility === true) {
            layer = createLayer(layerConf, mapMode);
            processLayer(layer, mapMode);
        }
    });
}

/**
 * Update the layer attributes of the already extistering layer.
 * @param {Layer} layer Layer of the layer collection.
 * @param {Object} layerConf The layer config.
 * @returns {void}
 */
export function updateLayerAttributes (layer, layerConf) {
    layer.updateLayerValues(layerConf);
    Object.assign(layer.attributes, layerConf);
}

/**
 * Processes the layer.
 * Layer is added to collection and map and layerConfig is updated.
 * @param {Layer} layer The layer configuration.
 * @returns {void}
 */
function processLayer (layer) {
    if (layer) {
        updateLayerConfig(layer);
        layerCollection.addLayer(layer);
    }
}

/**
 * Update the layer config in app-store.
 * @param {Layer} layer Layer of the layer collection.
 * @returns {void}
 */
function updateLayerConfig (layer) {
    store.commit("replaceByIdInLayerConfig", {
        layerConfigs: [{
            id: layer.get("id"),
            layer: layer.attributes
        }],
        trigger: false
    });
}
