import Cluster from "ol/source/Cluster.js";
import {expect} from "chai";
import sinon from "sinon";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import Layer2dVectorOaf from "../../layer2dVectorOaf";

describe("src_3_0_0/core/layers/layer2dVectorOaf.js", () => {
    let attributes,
        warn;

    before(() => {
        warn = sinon.spy();
        sinon.stub(console, "warn").callsFake(warn);

        mapCollection.clear();
        const map = {
            id: "ol",
            mode: "2D",
            getView: () => {
                return {
                    getProjection: () => {
                        return {
                            getCode: () => "EPSG:25832"
                        };
                    }
                };
            }
        };

        mapCollection.addMap(map, "2D");
    });

    beforeEach(() => {
        attributes = {
            id: "id",
            name: "oafTestLayer",
            typ: "OAF"
        };
    });


    after(() => {
        sinon.restore();
    });

    describe("createLayer", () => {
        it("new Layer2dVectorWfs should create an layer with no warning", () => {
            const oafLayer = new Layer2dVectorOaf({});

            expect(oafLayer).not.to.be.undefined;
            expect(warn.notCalled).to.be.true;
        });

        it("createLayer shall create an ol.VectorLayer with source and style and OAF-format", function () {
            const oafLayer = new Layer2dVectorOaf(attributes),
                layer = oafLayer.getLayer();

            expect(layer).to.be.an.instanceof(VectorLayer);
            expect(layer.getSource()).to.be.an.instanceof(VectorSource);
            expect(typeof layer.getStyleFunction()).to.be.equals("function");
            expect(layer.get("id")).to.be.equals(attributes.id);
            expect(layer.get("name")).to.be.equals(attributes.name);
            expect(layer.get("gfiTheme")).to.be.equals(attributes.gfiTheme);
        });

        it("createLayer shall create an ol.VectorLayer with cluster-source", function () {
            attributes.clusterDistance = 60;
            const oafLayer = new Layer2dVectorOaf(attributes),
                layer = oafLayer.getLayer();

            expect(layer).to.be.an.instanceof(VectorLayer);
            expect(layer.getSource()).to.be.an.instanceof(Cluster);
            expect(layer.getSource().getDistance()).to.be.equals(attributes.clusterDistance);
            expect(typeof layer.getStyleFunction()).to.be.equals("function");
        });
    });

    describe("getRawLayerAttributes", () => {
        let localAttributes;

        beforeEach(() => {
            localAttributes = {
                bbox: [1, 2, 3, 4],
                bboxCrs: "EPSG:25832",
                clusterDistance: 10,
                collection: "collection",
                crs: "EPSG:25832",
                datetime: "time",
                id: "1234",
                limit: 10,
                offset: 10,
                params: "params",
                url: "exmpale.url"
            };
        });

        it("should return the raw layer attributes", () => {
            const oafLayer = new Layer2dVectorOaf(localAttributes);

            expect(oafLayer.getRawLayerAttributes(localAttributes)).to.deep.equals({
                bbox: [1, 2, 3, 4],
                bboxCrs: "EPSG:25832",
                clusterDistance: 10,
                collection: "collection",
                crs: "EPSG:25832",
                datetime: "time",
                id: "1234",
                limit: 10,
                offset: 10,
                params: "params",
                url: "exmpale.url"
            });
        });
    });

    describe("getOptions", () => {
        let options;

        beforeEach(() => {
            options = [
                "clusterGeometryFunction",
                "featuresFilter",
                "loadingParams",
                "loadingStrategy",
                "onLoadingError"
            ];
        });

        it("should return the options that includes the correct keys", () => {
            const oafLayer = new Layer2dVectorOaf(attributes);

            expect(Object.keys(oafLayer.getOptions(attributes))).to.deep.equals(options);
        });
    });
});
