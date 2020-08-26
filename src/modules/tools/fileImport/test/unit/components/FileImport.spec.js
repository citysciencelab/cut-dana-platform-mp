import Vuex from "vuex";
import {config, shallowMount, createLocalVue} from "@vue/test-utils";
import FileImportComponent from "../../../components/FileImport.vue";
import FileImport from "../../../store/indexFileImport";
import {expect} from "chai";

const localVue = createLocalVue();

localVue.use(Vuex);

config.mocks.$t = key => key;

describe("FileImport.vue", () => {
    const
        mockConfigJson = {
            Portalconfig: {
                menu: {
                    tools: {
                        children: {
                            fileImport:
                            {
                                "title": "translate#common:menu.tools.fileImport",
                                "glyphicon": "glyphicon-resize-full",
                                "renderToWindow": true
                            }
                        }
                    }
                }
            }
        };

    let store;

    beforeEach(() => {
        store = new Vuex.Store({
            namespaces: true,
            modules: {
                Tools: {
                    namespaced: true,
                    modules: {
                        FileImport
                    }
                }
            },
            state: {
                configJson: mockConfigJson
            }
        });
        store.dispatch("Tools/FileImport/setActive", true);
    });

    it("renders the fileImport", () => {
        const wrapper = shallowMount(FileImportComponent, {store, localVue});

        expect(wrapper.find("#kml-import").exists()).to.be.true;
    });

    it("do not render the fileImport tool if not active", () => {
        store.dispatch("Tools/FileImport/setActive", false);
        const wrapper = shallowMount(FileImportComponent, {store, localVue});

        expect(wrapper.find("#kml-import").exists()).to.be.false;
    });

    it("import method is initially set to \"auto\"", () => {
        const wrapper = shallowMount(FileImportComponent, {store, localVue});

        expect(wrapper.vm.selectedFiletype).to.equal("auto");
    });
});
