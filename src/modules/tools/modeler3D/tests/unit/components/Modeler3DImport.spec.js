import Vuex from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import {mount, config, createLocalVue} from "@vue/test-utils";
import Modeler3DImportComponent from "../../../components/Modeler3DImport.vue";
import Modeler3DModule from "../../../store/indexModeler3D";
import {JSDOM} from "jsdom";

const localVue = createLocalVue(),
    globalDocument = global.document,
    globalWindow = global.window,
    {window} = new JSDOM();

global.window = window;
global.FileReader = window.FileReader;
localVue.use(Vuex);

config.mocks.$t = key => key;

describe("src/modules/tools/modeler3D/components/Modeler3DImport.vue", () => {
    let store, wrapper, scene;
    const entities = {
            getById: sinon.stub().returns({position: {}}),
            add: sinon.stub()
        },
        defaultDataSource = {entities},
        dataSourceDisplay = {defaultDataSource},
        map3D = {
            id: "1",
            mode: "3D",
            getCesiumScene: () => {
                return scene;
            }
        };

    map3D.getDataSourceDisplay = sinon.stub().returns(dataSourceDisplay);

    beforeEach(() => {
        mapCollection.clear();
        mapCollection.addMap(map3D, "3D");
        store = new Vuex.Store({
            namespaces: true,
            modules: {
                Tools: {
                    namespaced: true,
                    modules: {
                        Modeler3D: Modeler3DModule
                    }
                }
            }
        });
        store.commit("Tools/Modeler3D/setActive", true);
        store.commit("Tools/Modeler3D/setIsLoading", false);
    });

    afterEach(() => {
        sinon.restore();
        if (wrapper) {
            wrapper.destroy();
        }
    });

    after(() => {
        global.document = globalDocument;
        global.window = globalWindow;
    });

    it("should find Tool component", () => {
        wrapper = mount(Modeler3DImportComponent, {store, localVue});
        const toolModeler3DImportWrapper = wrapper.findComponent({name: "BasicFileImport"});

        expect(toolModeler3DImportWrapper.exists()).to.be.true;
    });
    it("should handle files correctly", () => {
        wrapper = mount(Modeler3DImportComponent, {store, localVue});
        const fileDetails = {
                lastModified: 1686206596589,
                name: "House.gltf",
                size: 1801540,
                type: "",
                webkitRelativePath: ""
            },
            file = new File([fileDetails], fileDetails.name),
            readAsArrayBufferStub = sinon.stub(FileReader.prototype, "readAsArrayBuffer"),
            readAsTextStub = sinon.stub(FileReader.prototype, "readAsText");
            // addSingleAlertStub = sinon.stub(store, "dispatch");

        file.name = fileDetails.name;

        // Call the addFile function
        wrapper.vm.addFile([file]);
        // expect(addSingleAlertStub.calledOnceWith("Alerting/addSingleAlert")).to.be.true;
        // expect(addSingleAlertStub.args[0][1]).to.deep.equal({
        //     content: i18next.t("common:modules.tools.modeler3D.import.alertingMessages.missingFormat", {format: "xyz"})
        // });
        readAsArrayBufferStub.restore();
        readAsTextStub.restore();
    });
    it("handles OBJ file correctly", async () => {
        wrapper = mount(Modeler3DImportComponent, {store, localVue});
        const fileContent = "dummy obj file content",
            fileName = "example.obj",
            file = new File([fileContent], fileName),

            readAsTextStub = sinon.stub(FileReader.prototype, "readAsText");

        wrapper.vm.handleObjFile(file, fileName);

        expect(readAsTextStub.calledOnceWith(file)).to.be.true;

        readAsTextStub.restore();
    });
    it("should handle DAE file correctly", () => {
        wrapper = mount(Modeler3DImportComponent, {store, localVue});
        const fileContent = "dummy dae file content",
            fileName = "example.dae",
            file = new File([fileContent], fileName),
            blob = new Blob([fileContent], {type: "application/octet-stream"}),
            readAsDataURLStub = sinon.stub(FileReader.prototype, "readAsDataURL"),
            onloadHandler = sinon.stub(),
            readerInstance = {
                onload: onloadHandler
            };

        readAsDataURLStub.callsFake(function () {
            readerInstance.onload({target: {result: fileContent}});
        });

        wrapper.vm.handleDaeFile.call(readerInstance, file, fileName);

        expect(readAsDataURLStub.calledOnce).to.be.true;
        expect(readAsDataURLStub.getCall(0).args[0]).to.be.an.instanceOf(Blob);
        expect(readAsDataURLStub.getCall(0).args[0].size).to.equal(blob.size);
        expect(onloadHandler.calledOnce).to.be.true;

        readAsDataURLStub.restore();
    });
    it("displays the list of successfully imported models", async () => {
        wrapper = mount(Modeler3DImportComponent, {store, localVue});
        const importedModels = [
                {
                    id: "1",
                    name: "Model 1",
                    show: true
                },
                {
                    id: "2",
                    name: "Model 2",
                    show: true
                }
            ],
            importedModelList = wrapper.find("#successfully-imported-models");

        store.commit("Tools/Modeler3D/setImportedModels", importedModels);
        await wrapper.vm.$nextTick();

        expect(importedModelList.exists()).to.be.true;
    });
});
