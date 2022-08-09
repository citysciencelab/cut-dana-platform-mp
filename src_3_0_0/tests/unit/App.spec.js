import Vuex from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import {shallowMount, createLocalVue} from "@vue/test-utils";
import AppComponent from "../../App.vue";
import mutations from "../../app-store/mutations";
import actions from "../../app-store/actions";


const localVue = createLocalVue();

localVue.use(Vuex);

describe("src_3_0_0/App.vue", () => {
    let store,
        wrapper;

    beforeEach(() => {
        actions.loadConfigJson = sinon.spy();
        actions.loadRestServicesJson = sinon.spy();
        actions.loadServicesJson = sinon.spy();
        mutations.setConfigJs = sinon.spy();

        store = new Vuex.Store({
            namespaced: true,
            mutations: mutations,
            actions: actions
        });
    });

    it("loads config on creating App", () => {
        wrapper = shallowMount(AppComponent, {store, localVue});

        expect(wrapper.find("#masterportal-container").exists()).to.be.true;
        expect(actions.loadConfigJson.calledOnce).to.be.true;
        expect(actions.loadRestServicesJson.calledOnce).to.be.true;
        expect(actions.loadServicesJson.calledOnce).to.be.true;
        expect(mutations.setConfigJs.calledOnce).to.be.true;
    });
});
