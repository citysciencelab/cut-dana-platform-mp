import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import PortalFooterComponent from "../../../components/PortalFooter.vue";
import {expect} from "chai";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("src_3_0_0/modules/portalFooter/components/PortalFooter.vue", () => {
    const urls = [{
        bezeichnung: "abc",
        url: "https://abc.de",
        alias: "Alphabet",
        alias_mobile: "ABC"
    }];
    let deviceMode,
        store;

    beforeEach(() => {
        deviceMode = "Desktop";

        store = createStore({
            namespaces: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        PortalFooter: {
                            namespaced: true,
                            getters: {
                                scaleLine: () => true,
                                seperator: () => true,
                                urls: () => urls
                            }
                        }
                    }
                }
            },
            getters: {
                deviceMode: () => deviceMode
            }
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    it("renders the footer", () => {
        const wrapper = shallowMount(PortalFooterComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find("#module-portal-footer").exists()).to.be.true;
    });

    it("renders the urls in footer", () => {
        const wrapper = shallowMount(PortalFooterComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find("a").exists()).to.be.true;
        expect(wrapper.find("a").text()).to.equals("Alphabet");
        expect(wrapper.find("a").attributes().href).to.equals("https://abc.de");
    });

    it("renders the mobile urls in footer", () => {
        deviceMode = "Mobile";

        const wrapper = shallowMount(PortalFooterComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find("a").exists()).to.be.true;
        expect(wrapper.find("a").text()).to.equals("ABC");
        expect(wrapper.find("a").attributes().href).to.equals("https://abc.de");
    });

    it("renders scaleLine exist", () => {
        const wrapper = shallowMount(PortalFooterComponent, {
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find("scale-line-stub").exists()).to.be.true;
    });
});
