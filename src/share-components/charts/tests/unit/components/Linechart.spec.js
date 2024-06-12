import Vuex from "vuex";
import {shallowMount, createLocalVue} from "@vue/test-utils";
import {expect} from "chai";
import ChartJs from "chart.js/auto";
import sinon from "sinon";
import LinechartItem from "../../../components/LinechartItem.vue";

const localVue = createLocalVue();

localVue.use(Vuex);

describe("src/share-components/charts/components/LinechartItem.vue", () => {
    let wrapper, destroyChartSpy;

    beforeEach(() => {
        wrapper = shallowMount(LinechartItem, {
            propsData: {
                data: {
                    labels: [],
                    datasets: []
                },
                givenOptions: {}
            },
            localVue
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("mounted", () => {
        it("should create an instance of ChartJS when mounted", async () => {
            await wrapper.vm.$nextTick();
            expect(wrapper.vm.chart).to.be.an.instanceof(ChartJs);
        });
        it("should create a chart of type line when mounted", async () => {
            await wrapper.vm.$nextTick();
            expect(wrapper.vm.chart.config.type).to.equal("line");
        });
        it("should create a canvas element in its component", async () => {
            await wrapper.vm.$nextTick();
            expect(wrapper.find("canvas").exists()).to.be.true;
        });
    });
    describe.skip("resetChart", () => {
        it("should destroy the former chart and create a new one", async () => {
            // let destroyCalled = false;
            destroyChartSpy = sinon.spy(LinechartItem.methods, "destroyChart");
            await wrapper.vm.$nextTick();
            // Robin: das funktioniert nicht, da die destroy-Methode überschrieben wird und dann das chart nicht destroyed wird, so dass kein neues erzeugt werden kann
            // --> Error: Canvas is already in use. Chart with ID '1' must be destroyed before the canvas with ID '' can be reused.
            // Lösung: chart.destroy als sinon.spy --> geht nicht, da chartjs kein export default macht
            // Lösung: method added destroyChart, die chart.destroy  aufruft und darauf eine spy setzen vor Erzeugung des wrapper

            // wrapper.vm.chart.destroy = () => {
            //     destroyCalled = true;
            // };

            wrapper.vm.resetChart({});
            expect(destroyChartSpy.calledOnce).to.be.true;
        });
    });
    describe("getChartJsOptions", () => {
        it("should return an empty object in case everything is fishy", () => {
            expect(wrapper.vm.getChartJsOptions(undefined, undefined)).to.be.an("object").and.to.be.empty;
            expect(wrapper.vm.getChartJsOptions(null, null)).to.be.an("object").and.to.be.empty;
            expect(wrapper.vm.getChartJsOptions("string", "string")).to.be.an("object").and.to.be.empty;
            expect(wrapper.vm.getChartJsOptions(123, 123)).to.be.an("object").and.to.be.empty;
            expect(wrapper.vm.getChartJsOptions(true, true)).to.be.an("object").and.to.be.empty;
            expect(wrapper.vm.getChartJsOptions(false, false)).to.be.an("object").and.to.be.empty;
        });
        it("should return the first param in case the second param is not an object", () => {
            const obj = {test: true};

            expect(wrapper.vm.getChartJsOptions(obj, undefined)).to.deep.equal(obj);
            expect(wrapper.vm.getChartJsOptions(obj, null)).to.deep.equal(obj);
            expect(wrapper.vm.getChartJsOptions(obj, "string")).to.deep.equal(obj);
            expect(wrapper.vm.getChartJsOptions(obj, 123)).to.deep.equal(obj);
            expect(wrapper.vm.getChartJsOptions(obj, true)).to.deep.equal(obj);
            expect(wrapper.vm.getChartJsOptions(obj, false)).to.deep.equal(obj);
        });
        it("should return the second param in case the first param is not an object", () => {
            const obj = {test: true};

            expect(wrapper.vm.getChartJsOptions(undefined, obj)).to.deep.equal(obj);
            expect(wrapper.vm.getChartJsOptions(null, obj)).to.deep.equal(obj);
            expect(wrapper.vm.getChartJsOptions("string", obj)).to.deep.equal(obj);
            expect(wrapper.vm.getChartJsOptions(123, obj)).to.deep.equal(obj);
            expect(wrapper.vm.getChartJsOptions(true, obj)).to.deep.equal(obj);
            expect(wrapper.vm.getChartJsOptions(false, obj)).to.deep.equal(obj);
        });
        it("should deep assign the given params", () => {
            const objA = {
                    test: {
                        a: 1,
                        b: 2
                    }
                },
                objB = {
                    test: {
                        b: 3,
                        d: 4
                    },
                    e: 5
                },
                expected = {
                    test: {
                        a: 1,
                        b: 3,
                        d: 4
                    },
                    e: 5
                };

            expect(wrapper.vm.getChartJsOptions(objA, objB)).to.deep.equal(expected);
        });
    });
});
