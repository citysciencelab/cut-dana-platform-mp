import axios from "axios";
import {RoutingGeosearchResult} from "../classes/routing-geosearch-result";
import state from "../../store/stateRouting";
import store from "../../../../../app-store";

/**
 * Requests POIs from text from LocationFinder
 * @param {String} search text to search with
 * @returns {RoutingGeosearchResult[]} routingGeosearchResults
 */
async function fetchRoutingLocationFinderGeosearch (search) {
    const serviceUrl = store.getters.getRestServiceById(state.geosearch.serviceId).url,
        url = `${serviceUrl}/Lookup?limit=${state.geosearch.limit}&properties=text`,
        parameter = `&query=${encodeURIComponent(search)}`,
        response = await axios.get(url + parameter);

    if (response.status !== 200 && !response.data.success) {
        throw new Error({
            status: response.status,
            message: response.statusText
        });
    }

    return response.data.locs.map(d => {
        d.epsg = response.data.sref;
        return parseRoutingLocationFinderGeosearchResult(d);
    });
}

/**
 * Parses Response from LocationFinder to RoutingGeosearchResult
 * @param {Object} geosearchResult from LocationFinder
 * @param {Object} [geosearchResult.geometry] geosearchResult geometry
 * @param {[Number, Number]} [geosearchResult.geometry.coordinates] geosearchResult geometry coordinates
 * @param {Object} [geosearchResult.properties] geosearchResult properties
 * @param {String} [geosearchResult.properties.text] geosearchResult properties text
 * @returns {RoutingGeosearchResult} routingGeosearchResult
 */
function parseRoutingLocationFinderGeosearchResult (geosearchResult) {
    return new RoutingGeosearchResult(
        [Number(geosearchResult.cx), Number(geosearchResult.cy)],
        geosearchResult.name,
        geosearchResult.epsg.toString()
    );
}

export {fetchRoutingLocationFinderGeosearch};
