import sinon from "sinon";
import {expect} from "chai";
import actionsIsochrones from "../../../../store/isochrones/actionsIsochrones";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import VectorSource from "ol/source/Vector";
import Draw from "ol/interaction/Draw";
import {RoutingWaypoint} from "../../../../utils/classes/routing-waypoint";
import {RoutingGeosearchResult} from "../../../../utils/classes/routing-geosearch-result";
import {RoutingIsochrones} from "../../../../utils/classes/routing-isochrones";
import {RoutingIsochronesArea} from "../../../../utils/classes/routing-isochrones-area";
import mapCollection from "../../../../../../../core/dataStorage/mapCollection";

describe("src/modules/tools/routing/store/isochrones/actionsIsochrones.js", () => {
    let state, commitSpy, commit, dispatchSpy, dispatch, dispatchMocks, getters, rootState, waypoint, isochronesAreaSource, isochronesResult;

    beforeEach(() => {
        isochronesAreaSource = new VectorSource();

        waypoint = new RoutingWaypoint({index: 0, source: isochronesAreaSource});
        waypoint.setCoordinates([8, 51]);
        waypoint.setIndexDirectionsLineString(0);

        commitSpy = sinon.spy();
        commit = (...args) => {
            commitSpy(...args);
            return undefined;
        };
        dispatchSpy = sinon.spy();

        isochronesResult = new RoutingIsochrones([8, 51, 9, 52]);
        isochronesResult.addArea(new RoutingIsochronesArea(
            [[8.1, 51.1], [8.2, 51.2], [8.3, 51.3], [8.1, 51.1]],
            0,
            1800,
            1800,
            900,
            "CAR",
            "TIME",
            [],
            30
        ));
        isochronesResult.addArea(new RoutingIsochronesArea(
            [[9.1, 52.1], [9.2, 52.2], [9.3, 52.3], [9.1, 52.1]],
            0,
            900,
            1800,
            900,
            "CAR",
            "TIME",
            [],
            15
        ));
        dispatchMocks = {
            fetchIsochrones: isochronesResult
        };
        dispatch = (...args) => {
            dispatchSpy(...args);
            if (args[0] === "Tools/Routing/transformCoordinatesLocalToWgs84Projection") {
                return args[1];
            }
            else if (args[0] === "Tools/Routing/fetchTextByCoordinates") {
                return new RoutingGeosearchResult(args[1].coordinates[0], args[1].coordinates[1], "test");
            }
            return dispatchMocks[args[0]];
        };
        getters = {
            selectedAvoidSpeedProfileOptions: []
        };

        rootState = {
            Map: {
                mapId: "ol",
                mapMode: "2D"
            }
        };

        mapCollection.clear();
        mapCollection.addMap({
            id: "ol",
            mode: "2D",
            getView: () => ({
                fit: () => sinon.spy()
            }),
            addLayer: sinon.spy(),
            removeLayer: sinon.spy(),
            addInteraction: sinon.spy(),
            removeInteraction: sinon.spy()
        }, "ol", "2D");

        state = {
            settings: {},
            waypoint: waypoint,
            isochronesAreaSource: isochronesAreaSource,
            isochronesPointDrawInteraction: new Draw({
                source: "",
                type: "Point",
                geometryFunction: undefined
            })
        };
    });

    afterEach(sinon.restore);

    it("should findIsochrones", async () => {
        await actionsIsochrones.findIsochrones({state, getters, commit, dispatch, rootState});

        expect(commitSpy.args).to.deep.equal([
            ["setIsLoadingIsochrones", true],
            ["setRoutingIsochrones", isochronesResult],
            ["setIsLoadingIsochrones", false]
        ]);

        expect(dispatchSpy.args).to.deep.equal([
            ["Tools/Routing/transformCoordinatesLocalToWgs84Projection", [8, 51], {root: true}],
            ["resetIsochronesResult"],
            ["fetchIsochrones", {wgs84Coords: [8, 51], transformCoordinates: true}]
        ]);
    });

    it("should resetIsochronesResult", async () => {
        await actionsIsochrones.resetIsochronesResult({state, getters, commit, dispatch, rootState});

        expect(commitSpy.args).to.deep.equal([
            ["setRoutingIsochrones", null]
        ]);

        expect(dispatchSpy.args).to.deep.equal([]);
    });

    it("should initIsochrones without mapListenerAdded", async () => {
        state.mapListenerAdded = false;
        await actionsIsochrones.initIsochrones({state, getters, commit, dispatch, rootState});

        expect(commitSpy.args).to.deep.equal([
            ["setMapListenerAdded", true]
        ]);

        expect(dispatchSpy.args).to.deep.equal([
            ["createIsochronePointModifyInteractionListener"],
            ["createIsochronesPointDrawInteraction"]
        ]);
    });

    it("should initIsochrones with mapListenerAdded", async () => {
        state.mapListenerAdded = true;
        await actionsIsochrones.initIsochrones({state, getters, commit, dispatch, rootState});

        expect(commitSpy.args).to.deep.equal([]);

        expect(dispatchSpy.args).to.deep.equal([
            ["createIsochronesPointDrawInteraction"]
        ]);
    });

    it("should closeIsochrones", async () => {
        await actionsIsochrones.closeIsochrones({state, getters, commit, dispatch, rootState});

        expect(commitSpy.args).to.deep.equal([]);

        expect(dispatchSpy.args).to.deep.equal([
            ["removeIsochronesPointDrawInteraction"]
        ]);
    });

    it("should onIsochronesPointDrawEnd", async () => {
        const featurePoint = new Feature({
            geometry: new Point([10, 10])
        });

        state.isochronesPointSource = {
            removeFeature: sinon.spy()
        };

        await actionsIsochrones.onIsochronesPointDrawEnd({state, getters, commit, dispatch, rootState}, {
            feature: featurePoint
        });

        expect(commitSpy.args).to.deep.equal([]);

        expect(dispatchSpy.args).to.deep.equal([
            ["Tools/Routing/transformCoordinatesLocalToWgs84Projection", [10, 10], {root: true}],
            ["Tools/Routing/fetchTextByCoordinates", {coordinates: [10, 10]}, {root: true}]
        ]);

        expect(waypoint.getDisplayName()).equal("test");
        expect(waypoint.getCoordinates()).to.deep.equal([10, 10]);
    });

    it("should createIsochronesPointDrawInteraction", async () => {
        await actionsIsochrones.createIsochronesPointDrawInteraction({state, getters, commit, dispatch, rootState});

        expect(commitSpy.args).to.deep.equal([]);

        expect(dispatchSpy.args).to.deep.equal([
            ["removeIsochronesPointDrawInteraction"]
        ]);
    });
});