import {Stroke, Style} from "ol/style.js";
import stateRouting from "../../../../store/stateRouting";

/**
 * Creates Direction Route Style Function
 * @param {ol/Feature} feature for the current style
 * @returns {ol/Style} style function
 */
export default function createDirectionsRouteStyle (feature) {
    console.log(stateRouting);
    // check if correct?
    const styleSetting = stateRouting.directionsSettings.styleRoute? stateRouting.directionsSettings.styleRoute : stateRouting.Directions.settings.styleRoute,
        isHighlight = feature.get("isHighlight");

    if (isHighlight) {
        return new Style({
            stroke: new Stroke({
                color: [...styleSetting.partHighlightColor, 1.0],
                width: styleSetting.partHighlightWidth
            })
        });
    }

    return [
        new Style({
            stroke: new Stroke({
                color: [...styleSetting.highlightColor, 1.0],
                width: styleSetting.highlightWidth
            })
        }),
        new Style({
            stroke: new Stroke({
                color: [...styleSetting.fillColor, 1.0],
                width: styleSetting.width
            })
        })
    ];
}
