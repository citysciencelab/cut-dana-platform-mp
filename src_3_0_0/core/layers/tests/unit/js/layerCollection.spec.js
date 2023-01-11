import {expect} from "chai";
import Map from "ol/Map";

import layerCollection from "../../../js/layerCollection";

describe("src_3_0_0/core/js/layers/layerCollection.js", () => {
    let layer1,
        layer2,
        layer3,
        map;

    before(() => {
        mapCollection.clear();
        map = new Map();
        mapCollection.addMap(map, "2D");

        layer1 = {
            attributes: {
                id: "firstLayer"
            },
            getLayer: () => {
                return {"attributes": layer1.attributes};
            }
        };
        layer2 = {
            attributes: {
                id: "secondLayer"
            },
            getLayer: () => {
                return {"attributes": layer2.attributes};
            }
        };
        layer3 = {
            attributes: {
                id: "thirdLayer"
            },
            getLayer: () => {
                return {"attributes": layer3.attributes};
            }
        };
    });

    beforeEach(() => {
        layerCollection.clear();
    });

    after(() => {
        layerCollection.clear();
    });

    describe("addLayer and getLayers", () => {
        it("adds one layer to collection", () => {
            layerCollection.addLayer(layer1);

            expect(layerCollection.getLayers().length).to.equals(1);
            expect(layerCollection.getLayers()).to.deep.include(layer1);
        });

        it("adds two layer to collection", () => {
            layerCollection.addLayer(layer1);
            layerCollection.addLayer(layer2);

            expect(layerCollection.getLayers().length).to.equals(2);
            expect(layerCollection.getLayers()).to.have.deep.members([layer1, layer2]);
        });
    });

    describe("addLayer and getLayerById", () => {
        it("adds three layer to collection and get the layers by id", () => {
            layerCollection.addLayer(layer1);
            layerCollection.addLayer(layer2);
            layerCollection.addLayer(layer3);

            expect(layerCollection.getLayers().length).to.equals(3);
            expect(layerCollection.getLayerById("thirdLayer")).to.equals(layer3);
            expect(layerCollection.getLayerById("secondLayer")).to.equals(layer2);
            expect(layerCollection.getLayerById("firstLayer")).to.equals(layer1);
        });
    });

    describe("get olLayers", () => {
        it("adds three layer to collection and get the layers", () => {
            layerCollection.addLayer(layer1);
            layerCollection.addLayer(layer2);
            layerCollection.addLayer(layer3);

            expect(layerCollection.getOlLayers().length).to.equals(3);
            expect(layerCollection.getOlLayers()).to.deep.equal([{"attributes": layer1.attributes}, {"attributes": layer2.attributes}, {"attributes": layer3.attributes}]);
        });
    });
});
