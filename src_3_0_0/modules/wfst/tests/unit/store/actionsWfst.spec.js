import axios from "axios";
import {expect} from "chai";
import sinon from "sinon";
import prepareFeaturePropertiesModule from "../../../js/prepareFeatureProperties";
import writeTransactionModule from "../../../js/writeTransaction";
import actionsWfst from "../../../store/actionsWfst";


describe("src_3_0_0/modules/wfst/store/actionsWfst.js", () => {
    let commit,
        map,
        dispatch,
        getters,
        rootGetters;

    before(() => {
        i18next.init({
            lng: "cimode",
            debug: false
        });
    });

    beforeEach(() => {
        commit = sinon.spy();
        dispatch = sinon.spy();
        map = {
            id: "ol",
            mode: "2D",
            getLayers: () => {
                return {
                    getArray: () => []
                };
            },
            removeLayer: sinon.stub()
        };
        mapCollection.clear();
        mapCollection.addMap(map, "2D");
    });
    afterEach(sinon.restore);

    describe("reset", () => {
        const featurePropertiesSymbol = Symbol("featureProperties");
        let setVisibleSpy;

        beforeEach(() => {
            getters = {
                currentLayerId: "",
                featureProperties: featurePropertiesSymbol
            };
            setVisibleSpy = sinon.spy();
            rootGetters = {
                "Maps/getLayerById": () => ({
                    setVisible: setVisibleSpy
                })
            };
        });

        it("should reset all values to its default state", () => {
            actionsWfst.reset({commit, dispatch, getters, rootGetters});

            expect(commit.calledTwice).to.be.true;
            expect(commit.firstCall.args.length).to.equal(2);
            expect(commit.firstCall.args[0]).to.equal("setFeatureProperties");
            expect(commit.firstCall.args[1]).to.equal(featurePropertiesSymbol);
            expect(commit.secondCall.args.length).to.equal(2);
            expect(commit.secondCall.args[0]).to.equal("setSelectedInteraction");
            expect(commit.secondCall.args[1]).to.equal(null);
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args.length).to.equal(1);
            expect(dispatch.firstCall.args[0]).to.equal("clearInteractions");
        });
        it("should reset all values to its default state and activate the current layer if it was previously unselected", () => {
            getters.featureProperties = [{symbol: featurePropertiesSymbol}];

            actionsWfst.reset({commit, dispatch, getters, rootGetters});

            expect(commit.calledTwice).to.be.true;
            expect(commit.firstCall.args.length).to.equal(2);
            expect(commit.firstCall.args[0]).to.equal("setFeatureProperties");
            expect(Array.isArray(commit.firstCall.args[1])).to.be.true;
            expect(commit.firstCall.args[1].length).to.equal(1);
            expect(commit.firstCall.args[1][0]).to.eql({symbol: featurePropertiesSymbol, value: null});
            expect(commit.secondCall.args.length).to.equal(2);
            expect(commit.secondCall.args[0]).to.equal("setSelectedInteraction");
            expect(commit.secondCall.args[1]).to.equal(null);
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args.length).to.equal(1);
            expect(dispatch.firstCall.args[0]).to.equal("clearInteractions");
        });
    });
    describe("sendTransaction", () => {
        const layer = {
                id: Symbol("layerId"),
                url: "some.good.url",
                isSecured: false
            },
            featureSymbol = Symbol("feature"),
            axiosResponse = {
                status: 200,
                statusText: "Ok"
            },
            writeTransactionSymbol = Symbol("writeTransaction");
        let axiosStub,
            consoleSpy,
            /* loaderHideSpy,
            loaderShowSpy, */
            refreshSpy;

        beforeEach(() => {
            getters = {
                currentLayerIndex: 0,
                layerInformation: [layer],
                selectedInteraction: "Point"
            };
            axiosStub = sinon.stub(axios, "post").returns(new Promise(resolve => resolve(axiosResponse)));
            consoleSpy = sinon.spy();
            sinon.stub(console, "error").callsFake(consoleSpy);
            sinon.stub(writeTransactionModule, "writeTransaction").callsFake(() => writeTransactionSymbol);
            refreshSpy = sinon.spy();
        });
        it("should send an axios request and show an alert with a success message for an insert transaction", () => {
            axiosResponse.data = "<?xml version='1.0' encoding='UTF-8'?>\n" +
                "<wfs:TransactionResponse xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd\" xmlns:wfs=\"http://www.opengis.net/wfs\" xmlns:ogc=\"http://www.opengis.net/ogc\" version=\"1.1.0\">\n" +
                "  <wfs:TransactionSummary>\n" +
                "    <wfs:totalInserted>1</wfs:totalInserted>\n" +
                "    <wfs:totalUpdated>0</wfs:totalUpdated>\n" +
                "    <wfs:totalDeleted>0</wfs:totalDeleted>\n" +
                "  </wfs:TransactionSummary>\n" +
                "  <wfs:InsertResults>\n" +
                "    <wfs:Feature>\n" +
                "      <ogc:FeatureId fid=\"wfst.59\"/>\n" +
                "    </wfs:Feature>\n" +
                "  </wfs:InsertResults>\n" +
                "</wfs:TransactionResponse>";

            actionsWfst.sendTransaction({dispatch, commit, getters, rootGetters}, featureSymbol)
                .then(() => {
                    expect(axiosStub.calledOnce).to.be.true;
                    expect(axiosStub.firstCall.args.length).to.equal(3);
                    expect(axiosStub.firstCall.args[0]).to.equal(layer.url);
                    expect(axiosStub.firstCall.args[1]).to.equal(writeTransactionSymbol);
                    expect(axiosStub.firstCall.args[2]).to.eql({
                        withCredentials: layer.isSecured,
                        headers: {"Content-Type": "text/xml"},
                        responseType: "text/xml"
                    });
                    expect(consoleSpy.notCalled).to.be.true;
                    /* expect(loaderShowSpy.calledOnce).to.be.true; TODO Stub only work with one method...
                    expect(loaderShowSpy.firstCall.args.length).to.equal(0);
                    expect(loaderHideSpy.calledOnce).to.be.true;
                    expect(loaderHideSpy.firstCall.args.length).to.equal(0); */
                    expect(refreshSpy.calledOnce).to.be.true;
                    expect(refreshSpy.firstCall.args.length).to.equal(0);
                    expect(dispatch.calledTwice).to.be.true;
                    expect(dispatch.firstCall.args.length).to.equal(1);
                    expect(dispatch.firstCall.args[0]).to.equal("reset");
                    expect(dispatch.secondCall.args.length).to.equal(3);
                    expect(dispatch.secondCall.args[0]).to.equal("Alerting/addSingleAlert");
                    expect(dispatch.secondCall.args[1]).to.eql({
                        category: "Info",
                        displayClass: "info",
                        content: "common:modules.wfst.transaction.success.insert",
                        mustBeConfirmed: false
                    });
                    expect(dispatch.secondCall.args[2]).to.eql({root: true});
                });
        });
        it("should send an axios request and show an alert with a success message for an update transaction", () => {
            getters.selectedInteraction = "update";
            axiosResponse.data = "<?xml version='1.0' encoding='UTF-8'?>\n" +
                "<wfs:TransactionResponse xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd\" xmlns:wfs=\"http://www.opengis.net/wfs\" xmlns:ogc=\"http://www.opengis.net/ogc\" version=\"1.1.0\">\n" +
                "  <wfs:TransactionSummary>\n" +
                "    <wfs:totalInserted>0</wfs:totalInserted>\n" +
                "    <wfs:totalUpdated>1</wfs:totalUpdated>\n" +
                "    <wfs:totalDeleted>0</wfs:totalDeleted>\n" +
                "  </wfs:TransactionSummary>\n" +
                "</wfs:TransactionResponse>";

            actionsWfst.sendTransaction({dispatch, commit, getters, rootGetters}, featureSymbol)
                .then(() => {
                    expect(axiosStub.calledOnce).to.be.true;
                    expect(axiosStub.firstCall.args.length).to.equal(3);
                    expect(axiosStub.firstCall.args[0]).to.equal(layer.url);
                    expect(axiosStub.firstCall.args[1]).to.equal(writeTransactionSymbol);
                    expect(axiosStub.firstCall.args[2]).to.eql({
                        withCredentials: layer.isSecured,
                        headers: {"Content-Type": "text/xml"},
                        responseType: "text/xml"
                    });
                    expect(consoleSpy.notCalled).to.be.true;
                    /* expect(loaderShowSpy.calledOnce).to.be.true; TODO Stub only work with one method...
                    expect(loaderShowSpy.firstCall.args.length).to.equal(0);
                    expect(loaderHideSpy.calledOnce).to.be.true;
                    expect(loaderHideSpy.firstCall.args.length).to.equal(0); */
                    expect(refreshSpy.calledOnce).to.be.true;
                    expect(refreshSpy.firstCall.args.length).to.equal(0);
                    expect(dispatch.calledTwice).to.be.true;
                    expect(dispatch.firstCall.args.length).to.equal(1);
                    expect(dispatch.firstCall.args[0]).to.equal("reset");
                    expect(dispatch.secondCall.args.length).to.equal(3);
                    expect(dispatch.secondCall.args[0]).to.equal("Alerting/addSingleAlert");
                    expect(dispatch.secondCall.args[1]).to.eql({
                        category: "Info",
                        displayClass: "info",
                        content: "common:modules.wfst.transaction.success.update",
                        mustBeConfirmed: false
                    });
                    expect(dispatch.secondCall.args[2]).to.eql({root: true});
                });
        });
        it("should send an axios request and show an alert with a success message for a delete transaction", () => {
            getters.selectedInteraction = "delete";
            axiosResponse.data = "<?xml version='1.0' encoding='UTF-8'?>\n" +
                "<wfs:TransactionResponse xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd\" xmlns:wfs=\"http://www.opengis.net/wfs\" xmlns:ogc=\"http://www.opengis.net/ogc\" version=\"1.1.0\">\n" +
                "  <wfs:TransactionSummary>\n" +
                "    <wfs:totalInserted>0</wfs:totalInserted>\n" +
                "    <wfs:totalUpdated>0</wfs:totalUpdated>\n" +
                "    <wfs:totalDeleted>1</wfs:totalDeleted>\n" +
                "  </wfs:TransactionSummary>\n" +
                "</wfs:TransactionResponse>";

            actionsWfst.sendTransaction({dispatch, commit, getters, rootGetters}, featureSymbol)
                .then(() => {
                    expect(axiosStub.calledOnce).to.be.true;
                    expect(axiosStub.firstCall.args.length).to.equal(3);
                    expect(axiosStub.firstCall.args[0]).to.equal(layer.url);
                    expect(axiosStub.firstCall.args[1]).to.equal(writeTransactionSymbol);
                    expect(axiosStub.firstCall.args[2]).to.eql({
                        withCredentials: layer.isSecured,
                        headers: {"Content-Type": "text/xml"},
                        responseType: "text/xml"
                    });
                    expect(consoleSpy.notCalled).to.be.true;
                    /* expect(loaderShowSpy.calledOnce).to.be.true; TODO Stub only work with one method...
                    expect(loaderShowSpy.firstCall.args.length).to.equal(0);
                    expect(loaderHideSpy.calledOnce).to.be.true;
                    expect(loaderHideSpy.firstCall.args.length).to.equal(0); */
                    expect(refreshSpy.calledOnce).to.be.true;
                    expect(refreshSpy.firstCall.args.length).to.equal(0);
                    expect(dispatch.calledTwice).to.be.true;
                    expect(dispatch.firstCall.args.length).to.equal(1);
                    expect(dispatch.firstCall.args[0]).to.equal("reset");
                    expect(dispatch.secondCall.args.length).to.equal(3);
                    expect(dispatch.secondCall.args[0]).to.equal("Alerting/addSingleAlert");
                    expect(dispatch.secondCall.args[1]).to.eql({
                        category: "Info",
                        displayClass: "info",
                        content: "common:modules.wfst.transaction.success.delete",
                        mustBeConfirmed: false
                    });
                    expect(dispatch.secondCall.args[2]).to.eql({root: true});
                });
        });
        it("should send an axios request and show an alert with a generic error message if no transactionsSummary is present in the XML response", () => {
            axiosResponse.data = "<?xml version='1.0' encoding='UTF-8'?>\n" +
                "<ows:ExceptionReport xmlns:ows=\"http://www.opengis.net/ows\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.opengis.net/ows http://schemas.opengis.net/ows/1.0.0/owsExceptionReport.xsd\" version=\"1.0.0\">\n" +
                "  <ows:Exception" +
                "    <ows:ExceptionText>Cannot perform insert operation: Error in XML document (line: 1, column: 234, character offset: 233): Feature type \"{wrong}wfst\" is unknown.</ows:ExceptionText>\n" +
                "  </ows:Exception>\n" +
                "</ows:ExceptionReport>";

            actionsWfst.sendTransaction({dispatch, commit, getters, rootGetters}, featureSymbol)
                .then(() => {
                    expect(axiosStub.calledOnce).to.be.true;
                    expect(axiosStub.firstCall.args.length).to.equal(3);
                    expect(axiosStub.firstCall.args[0]).to.equal(layer.url);
                    expect(axiosStub.firstCall.args[1]).to.equal(writeTransactionSymbol);
                    expect(axiosStub.firstCall.args[2]).to.eql({
                        withCredentials: layer.isSecured,
                        headers: {"Content-Type": "text/xml"},
                        responseType: "text/xml"
                    });
                    expect(consoleSpy.notCalled).to.be.true;
                    /* expect(loaderShowSpy.calledOnce).to.be.true; TODO Stub only work with one method...
                    expect(loaderShowSpy.firstCall.args.length).to.equal(0);
                    expect(loaderHideSpy.calledOnce).to.be.true;
                    expect(loaderHideSpy.firstCall.args.length).to.equal(0); */
                    expect(refreshSpy.calledOnce).to.be.true;
                    expect(refreshSpy.firstCall.args.length).to.equal(0);
                    expect(dispatch.calledTwice).to.be.true;
                    expect(dispatch.firstCall.args.length).to.equal(1);
                    expect(dispatch.firstCall.args[0]).to.equal("reset");
                    expect(dispatch.secondCall.args.length).to.equal(3);
                    expect(dispatch.secondCall.args[0]).to.equal("Alerting/addSingleAlert");
                    expect(dispatch.secondCall.args[1]).to.eql({
                        category: "Info",
                        displayClass: "info",
                        content: "common:modules.wfst.transaction.error.genericFailedTransaction",
                        mustBeConfirmed: false
                    });
                    expect(dispatch.secondCall.args[2]).to.eql({root: true});
                });
        });
        it("should send an axios request, show an alert with a generic error message if no transactionsSummary is present in the XML response and log an error if an exceptionText is present in the XML response", () => {
            axiosResponse.data = "<?xml version='1.0' encoding='UTF-8'?>\n" +
                "<ows:ExceptionReport xmlns:ows=\"http://www.opengis.net/ows\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.opengis.net/ows http://schemas.opengis.net/ows/1.0.0/owsExceptionReport.xsd\" version=\"1.0.0\">\n" +
                "  <ows:Exception>" +
                "    <ows:ExceptionText>Cannot perform insert operation: Error in XML document (line: 1, column: 234, character offset: 233): Feature type \"{wrong}wfst\" is unknown.</ows:ExceptionText>\n" +
                "  </ows:Exception>\n" +
                "</ows:ExceptionReport>";

            actionsWfst.sendTransaction({dispatch, commit, getters, rootGetters}, featureSymbol)
                .then(() => {
                    expect(axiosStub.calledOnce).to.be.true;
                    expect(axiosStub.firstCall.args.length).to.equal(3);
                    expect(axiosStub.firstCall.args[0]).to.equal(layer.url);
                    expect(axiosStub.firstCall.args[1]).to.equal(writeTransactionSymbol);
                    expect(axiosStub.firstCall.args[2]).to.eql({
                        withCredentials: layer.isSecured,
                        headers: {"Content-Type": "text/xml"},
                        responseType: "text/xml"
                    });
                    expect(consoleSpy.calledOnce).to.be.true;
                    expect(consoleSpy.firstCall.args.length).to.equal(2);
                    expect(consoleSpy.firstCall.args[0]).to.equal("WfsTransaction: An error occurred when sending the transaction to the service.");
                    expect(consoleSpy.firstCall.args[1]).to.equal("Cannot perform insert operation: Error in XML document (line: 1, column: 234, character offset: 233): Feature type \"{wrong}wfst\" is unknown.");
                    /* expect(loaderShowSpy.calledOnce).to.be.true; TODO Stub only work with one method...
                    expect(loaderShowSpy.firstCall.args.length).to.equal(0);
                    expect(loaderHideSpy.calledOnce).to.be.true;
                    expect(loaderHideSpy.firstCall.args.length).to.equal(0); */
                    expect(refreshSpy.calledOnce).to.be.true;
                    expect(refreshSpy.firstCall.args.length).to.equal(0);
                    expect(dispatch.calledTwice).to.be.true;
                    expect(dispatch.firstCall.args.length).to.equal(1);
                    expect(dispatch.firstCall.args[0]).to.equal("reset");
                    expect(dispatch.secondCall.args.length).to.equal(3);
                    expect(dispatch.secondCall.args[0]).to.equal("Alerting/addSingleAlert");
                    expect(dispatch.secondCall.args[1]).to.eql({
                        category: "Info",
                        displayClass: "info",
                        content: "common:modules.wfst.transaction.error.genericFailedTransaction",
                        mustBeConfirmed: false
                    });
                    expect(dispatch.secondCall.args[2]).to.eql({root: true});
                });
        });
        it("should send an axios request and show an alert with a specific error message parsed from the response if no transactionsSummary is present in the XML response and an exceptionCode is present in the response", () => {
            axiosResponse.data = "<?xml version='1.0' encoding='UTF-8'?>\n" +
                "<ows:ExceptionReport xmlns:ows=\"http://www.opengis.net/ows\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.opengis.net/ows http://schemas.opengis.net/ows/1.0.0/owsExceptionReport.xsd\" version=\"1.0.0\">\n" +
                "  <ows:Exception exceptionCode=\"InvalidParameterValue\">\n" +
                "  </ows:Exception>\n" +
                "</ows:ExceptionReport>";
            actionsWfst.sendTransaction({dispatch, commit, getters, rootGetters}, featureSymbol)
                .then(() => {
                    expect(axiosStub.calledOnce).to.be.true;
                    expect(axiosStub.firstCall.args.length).to.equal(3);
                    expect(axiosStub.firstCall.args[0]).to.equal(layer.url);
                    expect(axiosStub.firstCall.args[1]).to.equal(writeTransactionSymbol);
                    expect(axiosStub.firstCall.args[2]).to.eql({
                        withCredentials: layer.isSecured,
                        headers: {"Content-Type": "text/xml"},
                        responseType: "text/xml"
                    });
                    expect(consoleSpy.notCalled).to.be.true;
                    /* expect(loaderShowSpy.calledOnce).to.be.true; TODO Stub only work with one method...
                    expect(loaderShowSpy.firstCall.args.length).to.equal(0);
                    expect(loaderHideSpy.calledOnce).to.be.true;
                    expect(loaderHideSpy.firstCall.args.length).to.equal(0); */
                    expect(refreshSpy.calledOnce).to.be.true;
                    expect(refreshSpy.firstCall.args.length).to.equal(0);
                    expect(dispatch.calledTwice).to.be.true;
                    expect(dispatch.firstCall.args.length).to.equal(1);
                    expect(dispatch.firstCall.args[0]).to.equal("reset");
                    expect(dispatch.secondCall.args.length).to.equal(3);
                    expect(dispatch.secondCall.args[0]).to.equal("Alerting/addSingleAlert");
                    expect(dispatch.secondCall.args[1]).to.eql({
                        category: "Info",
                        displayClass: "info",
                        content: "common:modules.wfst.transaction.error.InvalidParameterValue",
                        mustBeConfirmed: false
                    });
                    expect(dispatch.secondCall.args[2]).to.eql({root: true});
                });
        });
    });
    describe("setFeatureProperty", () => {
        let featureProperty;

        beforeEach(() => {
            featureProperty = {
                type: "number",
                value: "3",
                key: "specialKey"
            };
        });

        it("should commit the property if the type is fitting to the value", () => {
            actionsWfst.setFeatureProperty({commit, dispatch}, featureProperty);

            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args.length).to.equal(2);
            expect(commit.firstCall.args[0]).to.equal("setFeatureProperty");
            expect(commit.firstCall.args[1]).to.eql({key: featureProperty.key, value: featureProperty.value});
            expect(dispatch.notCalled).to.be.true;
        });
        it("should dispatch an alert if the type is a number but the converted value is not", () => {
            featureProperty.value = "noNumber";

            actionsWfst.setFeatureProperty({commit, dispatch}, featureProperty);

            expect(commit.notCalled).to.be.true;
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args.length).to.equal(3);
            expect(dispatch.firstCall.args[0]).to.equal("Alerting/addSingleAlert");
            expect(dispatch.firstCall.args[1]).to.eql({
                category: "error",
                content: "modules.wfst.error.onlyNumbersAllowed",
                mustBeConfirmed: false
            });
            expect(dispatch.firstCall.args[2]).to.eql({root: true});
        });
    });
    describe("setFeatureProperties", () => {
        let prepareFeaturePropertiesSpy;

        beforeEach(() => {
            getters = {
                currentLayerIndex: 0,
                layerInformation: [{}]
            };
            prepareFeaturePropertiesSpy = sinon.spy();
            sinon.stub(prepareFeaturePropertiesModule, "prepareFeatureProperties").callsFake(prepareFeaturePropertiesSpy);
        });

        it("should commit featureProperties on basis of the layer if a layer is selected that has a featurePrefix configured and is selected in the layer tree", async () => {
            getters.layerInformation[0].featurePrefix = "pre";
            getters.layerInformation[0].visibility = true;

            await actionsWfst.setFeatureProperties({commit, getters});

            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args.length).to.equal(2);
            expect(commit.firstCall.args[0]).to.equal("setFeatureProperties");
            expect(prepareFeaturePropertiesSpy.calledOnce).to.be.true;
        });
        it("should commit an error message if no layer is currently selected", async () => {
            getters.currentLayerIndex = -1;

            await actionsWfst.setFeatureProperties({commit, getters});

            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args.length).to.equal(2);
            expect(commit.firstCall.args[0]).to.equal("setFeatureProperties");
            expect(commit.firstCall.args[1]).to.equal("modules.wfst.error.allLayersNotSelected");
            expect(prepareFeaturePropertiesSpy.notCalled).to.be.true;
        });
        it("should commit an error message if the currently selected layer has no featurePrefix configured", async () => {
            await actionsWfst.setFeatureProperties({commit, getters});

            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args.length).to.equal(2);
            expect(commit.firstCall.args[0]).to.equal("setFeatureProperties");
            expect(commit.firstCall.args[1]).to.equal("modules.wfst.error.layerNotConfiguredCorrectly");
            expect(prepareFeaturePropertiesSpy.notCalled).to.be.true;
        });
        it("should commit an error message if the currently selected layer is not selected in the layer tree", async () => {
            getters.layerInformation[0].featurePrefix = "pre";
            getters.layerInformation[0].isSelected = false;

            await actionsWfst.setFeatureProperties({commit, getters});

            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args.length).to.equal(2);
            expect(commit.firstCall.args[0]).to.equal("setFeatureProperties");
            expect(commit.firstCall.args[1]).to.equal("modules.wfst.error.layerNotSelected");
            expect(prepareFeaturePropertiesSpy.notCalled).to.be.true;
        });
    });
});
