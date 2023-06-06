import Cluster from "ol/source/Cluster";
import layerCollection from "../../../core/layers/js/layerCollection";
/**
 * Contains actions that communicate with other components after an interaction, such as onClick or onHover, with a search result.
 */

export default {
    /**
     * Activate the layer of the search result in topic tree.
     * @returns {void}
     */
    activateLayerInTopicTree: () => {
        // Do someThing

        /* used in:
            elasticSearch
            topicTree
        */
    },

    /**
     * Adds the layer from the search result to topic tree.
     * @returns {void}
     */
    addLayerToTopicTree: () => {
        // Do someThing

        /* used in:
            elasticSearch
        */
    },

    /**
     * Highlight feature of the search result.
     * @param {Object} param.dispatch the dispatch
     * @param {Object} payload The payload.
     * @param {String} payload.featureId id of the feature
     * @param {String} payload.layerId id of the layer
     * @returns {void}
     */
    highligtFeature: ({dispatch}, {featureId, layerId}) => {
        const layer = layerCollection.getLayerById(layerId);
        let layerSource = null,
            feature = null;

        if (!layer) {
            // load layer? activateLayerInTopicTree?
        }
        if (layer) {
            layerSource = layer.getLayerSource() instanceof Cluster ? layer.getLayerSource().getSource() : layer.getLayerSource();
            feature = layerSource.getFeatures().filter(feat => feat.ol_uid === featureId);
            dispatch("MapMarker/placingPolygonMarker", feature, {root: true});
        }

        /* used in:
            specialWFS
        */
    },

    /**
     * Opens the get feature info of the search result.
     * @returns {void}
     */
    openGetFeatureInfo: () => {
        // Do someThing

        /* used in:
            visibleVector
        */
    },

    /**
     * Opens the topic tree and scroll to layer of the search result.
     * @returns {void}
     */
    openTopicTree: () => {
        // Do someThing

        /* used in:
            elasticSearch
            topicTree
        */
    },

    /**
     * Sets the marker to the feature of the search result.
     * @returns {void}
     */
    setMarker: () => {
        // Do someThing

        /* used in:
            bkg
            gazetter
            komootPhoton
            locationFinder
            osmNominatim
            specialWFS
            visibleVector
        */
    },

    /**
     * Zoom to the feature of the search result.
     * @returns {void}
     */
    zoomToFeature: () => {
        // Do someThing

        /* used in:
            bkg
            gazetter
            komootPhoton
            locationFinder
            osmNominatim
            specialWFS
            visibleVector
        */
    }
};
