import {easeOut} from "ol/easing";
import {generateSimpleMutations} from "../../../shared/js/utils/generators";
import stateMaps from "./stateMaps";

const mutations = {
    ...generateSimpleMutations(stateMaps),

    /**
     * Set both center and zoom in one go, and immediately move the map.
     * @param {MapState} state
     * @param {{ center: number[], zoom: number }} payload
     */
    setView (state, {center, zoom}) {
        state.center = center;
        state.zoom = zoom;

        const mapView = mapCollection.getMapView("2D");

        mapView.setCenter(center);
        mapView.setZoom(zoom);
    },

    /**
     * Smoothly animate to a new center / zoom.
     * Use this during "play" to avoid jump cuts.
     */
    animateView (state, {
        center,
        zoom,
        panDuration = 650,
        zoomDuration = 450,
        skipIfTinyMove = true
    }) {
        const view = mapCollection.getMapView("2D");

        if (!view) {
            return;
        }

        view.cancelAnimations?.();

        if (skipIfTinyMove) {
            const curCenter = view.getCenter() || [0, 0];
            const curZoom = view.getZoom() ?? state.zoom ?? 0;
            const dx = (center?.[0] ?? curCenter[0]) - curCenter[0];
            const dy = (center?.[1] ?? curCenter[1]) - curCenter[1];
            const dist = Math.hypot(dx, dy);
            const zoomDiff = Math.abs((typeof zoom === "number" ? zoom : curZoom) - curZoom);

            if (dist < 1 && zoomDiff < 0.1) {
                return;
            }
        }

        if (center) {
            state.center = center;
        }

        if (typeof zoom === "number") {
            state.zoom = zoom;
        }

        if (center) {
            view.animate({center, duration: panDuration, easing: easeOut});
        }

        if (typeof zoom === "number") {
            view.animate({zoom, duration: zoomDuration, easing: easeOut});
        }
    },

    /**
     * Adds the given feature to highlightedFeatures.
     * @param {Object} state the state.
     * @param {module:ol/Feature} feature - The given feature.
     * @returns {void}
     */
    addHighlightedFeature (state, feature) {
        state.highlightedFeatures.push(feature);
    },

    /**
     * Adds the given style to highlightedFeatureStyles.
     * @param {Object} state the state.
     * @param {Object} style - The given style.
     * @returns {void}
     */
    addHighlightedFeatureStyle (state, style) {
        state.highlightedFeatureStyles.push(style);
    }
};

export default mutations;
