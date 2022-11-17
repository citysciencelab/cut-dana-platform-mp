import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";

import layerFactory from "../../../../../core/layers/js/layerFactory";
import LayerComponent from "../../../components/LayerComponent.vue";

config.global.mocks.$t = key => key;

describe("src_3_0_0/modules/layerTree/components/Layer.vue", () => {
    let store,
        wrapper,
        layer,
        propsData,
        mapMode,
        replaceByIdInLayerConfigSpy,
        layer3D;

    beforeEach(() => {
        mapMode = "2D";
        layer = {
            id: "1",
            name: "layer",
            typ: "WMS",
            visibility: false
        };
        layer3D = {
            id: "3",
            name: "layer3D",
            typ: "Terrain3D",
            visibility: false
        };
        propsData = {
            layerConf: layer
        };
        replaceByIdInLayerConfigSpy = sinon.spy();
        sinon.stub(layerFactory, "getLayerTypes3d").returns(["TERRAIN3D"]);
        store = createStore({
            namespaces: true,
            modules: {
                Maps: {
                    namespaced: true,
                    getters: {
                        mode: () => mapMode
                    }
                },
                Modules: {
                    namespaced: true,
                    modules: {
                        namespaced: true,
                        LayerComponent
                    }
                }
            },
            mutations: {
                replaceByIdInLayerConfig: replaceByIdInLayerConfigSpy
            }
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    it("renders the layer given as property to the component", () => {
        wrapper = shallowMount(LayerComponent, {
            global: {
                plugins: [store]
            },
            propsData
        });

        expect(wrapper.find("#layertree-layer-" + propsData.layerConf.id).exists()).to.be.true;
    });

    it("renders layer with visibility false and checkbox", () => {
        wrapper = shallowMount(LayerComponent, {
            global: {
                plugins: [store]
            },
            propsData
        });

        expect(wrapper.find("#layertree-layer-" + propsData.layerConf.id).exists()).to.be.true;
        expect(wrapper.findAll("input").length).to.be.equals(1);
        expect(wrapper.find("input").attributes("type")).to.be.equals("checkbox");
        expect(wrapper.find("h5").text()).to.equal(propsData.layerConf.name);
        expect(wrapper.find("label").attributes("class")).not.to.include("bold");
    });

    it("renders layer with visibility true and checkbox, name is bold", () => {
        propsData.layerConf.visibility = true;

        wrapper = shallowMount(LayerComponent, {
            global: {
                plugins: [store]
            },
            propsData
        });

        expect(wrapper.find("#layertree-layer-" + propsData.layerConf.id).exists()).to.be.true;
        expect(wrapper.findAll("input").length).to.be.equals(1);
        expect(wrapper.find("input").attributes("type")).to.be.equals("checkbox");
        expect(wrapper.find("h5").text()).to.equal(propsData.layerConf.name);
        expect(wrapper.find("label").attributes("class")).to.include("bold");
    });

    it("method showInLayerTree - do not show layer with showInLayerTree = false", () => {
        propsData.layerConf.visibility = true;
        propsData.layerConf.showInLayerTree = false;

        wrapper = shallowMount(LayerComponent, {store, propsData: propsData, localVue});
        wrapper.vm.showInLayerTree();

        expect(wrapper.find("#layertree-layer-" + propsData.layerConf.id).exists()).to.be.false;
    });
    it("method showInLayerTree - show layer with showInLayerTree = true", () => {
        propsData.layerConf.showInLayerTree = false;

        wrapper = shallowMount(LayerComponent, {store, propsData: propsData, localVue});
        wrapper.vm.showInLayerTree();

        expect(wrapper.find("#layertree-layer-" + propsData.layerConf.id).exists()).to.be.false;
    });
    it("method showInLayerTree - show 3D-Layer", () => {
        mapMode = "3D";
        propsData.layerConf = layer3D;

        wrapper = shallowMount(LayerComponent, {store, propsData: propsData, localVue});
        wrapper.vm.showInLayerTree();

        expect(wrapper.find("#layertree-layer-" + propsData.layerConf.id).exists()).to.be.true;
    });

    it("click on checkbox of layer with visibility false", async () => {
        const spyArg = {
            layerConfigs: [{
                id: layer.id,
                layer: {
                    id: layer.id,
                    visibility: true
                }
            }]
        };
        let checkbox = null;

        wrapper = shallowMount(LayerComponent, {
            global: {
                plugins: [store]
            },
            propsData
        });

        expect(wrapper.find("#layertree-layer-" + propsData.layerConf.id).exists()).to.be.true;
        expect(wrapper.findAll("input").length).to.be.equals(1);

        checkbox = wrapper.find("input");
        checkbox.trigger("click");
        await wrapper.vm.$nextTick();

        expect(replaceByIdInLayerConfigSpy.calledOnce).to.be.true;
        expect(replaceByIdInLayerConfigSpy.firstCall.args[1]).to.be.deep.equals(spyArg);
    });

    it("click on checkbox of layer with visibility true", async () => {
        const spyArg = {
            layerConfigs: [{
                id: layer.id,
                layer: {
                    id: layer.id,
                    visibility: false
                }
            }]
        };
        let checkbox = null;

        propsData.layerConf.visibility = true;
        wrapper = shallowMount(LayerComponent, {
            global: {
                plugins: [store]
            },
            propsData
        });

        expect(wrapper.find("#layertree-layer-" + propsData.layerConf.id).exists()).to.be.true;
        expect(wrapper.findAll("input").length).to.be.equals(1);

        checkbox = wrapper.find("input");
        checkbox.trigger("click");
        await wrapper.vm.$nextTick();

        expect(replaceByIdInLayerConfigSpy.calledOnce).to.be.true;
        expect(replaceByIdInLayerConfigSpy.firstCall.args[1]).to.be.deep.equals(spyArg);
    });


});
