import {createStore} from "vuex";
import {config, shallowMount, mount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";

import SearchBarComponent from "../../../components/SearchBar.vue";

config.global.mocks.$t = key => key;

describe("src_3_0_0/modules/searchBar/components/SearchBar.vue", () => {
    const searchInterfaceInstances = [
        {
            "searchInterfaceId": "gazetteer"
        }
    ];
    let searchResults,
        store,
        wrapper;


    beforeEach(() => {
        searchResults = [
            {
                "category": "Straße",
                "id": "BeidemNeuenKrahnStraße",
                "index": 0,
                "name": "Bei dem Neuen Krahn",
                "searchInterfaceId": "gazetteer",
                "displayedInfo": "",
                "icon": "bi-signpost",
                "imagePath": "",
                "toolTip": "",
                "events": {
                }

            },
            {
                "category": "Adresse",
                "id": "BeidemNeuenKrahn2Adresse",
                "index": 1,
                "name": "Bei dem Neuen Krahn 2",
                "searchInterfaceId": "gazetteer",
                "displayedInfo": "",
                "icon": "bi-signpost",
                "imagePath": "",
                "toolTip": "",
                "events": {
                }
            }
        ];

        store = createStore({
            namespaced: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        SearchBar: {
                            namespaced: true,
                            actions: {
                                instantiateSearchInterfaces: sinon.stub(),
                                overwriteDefaultValues: sinon.stub(),
                                search: sinon.stub(),
                                setMarker: sinon.stub(),
                                activateActions: sinon.stub()
                            },
                            getters: {
                                configPaths: () => [],
                                currentSide: () => "mainMenu",
                                minCharacters: () => 3,
                                placeholder: () => "ABC",
                                searchInput: () => "abc-straße",
                                searchInterfaceInstances: () => searchInterfaceInstances,
                                searchResults: () => searchResults,
                                searchResultsActive: () => false,
                                showAllResults: () => false,
                                suggestionListLength: () => 0,
                                type: () => "searchBar"
                            },
                            mutations: {
                                addSuggestionItem: sinon.stub(),
                                setSearchInput: sinon.stub(),
                                setShowAllResults: sinon.stub(),
                                setCurrentSide: sinon.stub(),
                                setSearchResultsActive: sinon.stub(),
                                setSearchSuggestions: sinon.stub()
                            }
                        }
                    }
                },
                Menu: {
                    namespaced: true,
                    getters: {
                        currentComponent: () => () => "root"
                    },
                    mutations: {
                        switchToRoot: sinon.spy()
                    }
                }
            },
            getters: {
                portalConfig: sinon.stub()
            },
            actions: {
                initializeModule: sinon.stub()
            }
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("render SearchBar", () => {
        it("should render the SearchBar with button and input and mounted values", async () => {
            wrapper = mount(SearchBarComponent, {
                global: {
                    plugins: [store]
                }
            });
            wrapper.vm.setCurrentSide("root");
            await wrapper.vm.$nextTick();
            expect(wrapper.find("#search-bar").exists()).to.be.true;
            expect(wrapper.find("#search-button").exists()).to.be.true;
            expect(wrapper.find("input").exists()).to.be.true;
            expect(wrapper.vm.currentSide).to.eql("mainMenu");
            expect(wrapper.vm.currentComponentSide).to.be.undefined;
        });
    });

    describe("click button", () => {
        it("should start search to abc-straße, if button is clicked", async () => {
            wrapper = shallowMount(SearchBarComponent, {
                global: {
                    plugins: [store]
                }
            });

            const startSearchSpy = sinon.spy(wrapper.vm, "startSearch");

            await wrapper.find("#search-button").trigger("click");

            expect(startSearchSpy.calledOnce).to.be.true;
        });
    });
    describe("test input element", () => {
        it("should start search to abc-straße, if button is clicked", async () => {
            wrapper = shallowMount(SearchBarComponent, {
                propsData: {
                    clickAction: sinon.spy
                },
                global: {
                    plugins: [store]
                }
            });

            const testInput = wrapper.find({ref: "searchInput"});

            expect(testInput.exists()).to.be.true;
        });
    });

    describe("searchResultsWithUniqueCategories", () => {
        it("should set the categories to unique categories", async () => {
            searchResults = [
                {
                    "category": "komootPhoton",
                    "id": "abc-straße 1",
                    "index": 1,
                    "name": "abc-straße 1",
                    "searchInterfaceId": "komootPhoton_0",
                    "displayedInfo": "",
                    "icon": "bi-signpost",
                    "imagePath": "",
                    "toolTip": "",
                    "events": {
                    }
                },
                {
                    "category": "komootPhoton",
                    "id": "abc-straße 1",
                    "index": 1,
                    "name": "abc-straße 1",
                    "searchInterfaceId": "komootPhoton_1",
                    "displayedInfo": "",
                    "icon": "bi-signpost",
                    "imagePath": "",
                    "toolTip": "",
                    "events": {
                    }
                }
            ];
            wrapper = await shallowMount(SearchBarComponent, {
                global: {
                    plugins: [store]
                }
            });
            expect(wrapper.vm.searchResultsWithUniqueCategories).to.deep.equal([
                {
                    "category": "komootPhoton_0",
                    "id": "abc-straße 1",
                    "index": 1,
                    "name": "abc-straße 1",
                    "searchInterfaceId": "komootPhoton_0",
                    "displayedInfo": "",
                    "icon": "bi-signpost",
                    "imagePath": "",
                    "toolTip": "",
                    "events": {
                    }
                },
                {
                    "category": "komootPhoton_1",
                    "id": "abc-straße 1",
                    "index": 1,
                    "name": "abc-straße 1",
                    "searchInterfaceId": "komootPhoton_1",
                    "displayedInfo": "",
                    "icon": "bi-signpost",
                    "imagePath": "",
                    "toolTip": "",
                    "events": {
                    }
                }
            ]);
        });
    });

    describe("searchActivated", () => {
        it("check if search should be activated", () => {
            wrapper = shallowMount(SearchBarComponent, {
                global: {
                    plugins: [store]
                }
            });

            const testResult = wrapper.vm.searchActivated;

            expect(testResult).to.be.true;
        });
    });

    describe("limitedSortedSearchResults", () => {
        it("tests the computed property SearchBarSuggestionList", async () => {
            wrapper = await shallowMount(SearchBarComponent, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.vm.limitedSortedSearchResults.results).to.deep.equal({
                categoryProvider: {
                    Straße: "gazetteer",
                    Adresse: "gazetteer"
                },
                availableCategories: ["Straße", "Adresse"],
                StraßeCount: 1,
                AdresseCount: 1,
                AdresseIcon: "bi-signpost",
                StraßeIcon: "bi-signpost"
            });
        });
    });

    describe("method checkCurrentComponent", () => {
        it("tests the method checkCurrentComponent with currentComponentSide root", async () => {

            wrapper = await shallowMount(SearchBarComponent, {
                global: {
                    plugins: [store]
                }
            });

            const startSearchSpy = sinon.spy(wrapper.vm, "startSearch");

            await wrapper.vm.checkCurrentComponent();

            expect(startSearchSpy.called).to.be.true;

        });
    });

    describe("zoomToAndMarkSearchResult", () => {
        it("zooms to and sets a marker at a given searchResult", () => {
            searchResults = [
                {
                    "category": "Adresse",
                    "id": "NeuenfelderStraße19",
                    "index": 1,
                    "name": "Neuenfelder Straße 19",
                    "searchInterfaceId": "gazetteer",
                    "displayedInfo": "",
                    "icon": "bi-signpost",
                    "imagePath": "",
                    "toolTip": "",
                    "events": {
                    }
                },
                {
                    "category": "Adresse",
                    "id": "NeuenfelderStraße19",
                    "index": 1,
                    "name": "Neuenfelder Straße 19",
                    "searchInterfaceId": "elasticSearch_1",
                    "displayedInfo": "",
                    "icon": "bi-signpost",
                    "imagePath": "",
                    "toolTip": "",
                    "events": {
                    }
                }
            ];
            wrapper = shallowMount(SearchBarComponent, {
                global: {
                    plugins: [store]
                }
            });

            const activateActionsSpy = sinon.spy(wrapper.vm, "activateActions");

            wrapper.vm.zoomToAndMarkSearchResult("Neuenfelder Straße 19");
            expect(activateActionsSpy.called).to.be.true;
        });
        it("does not zoom to a given searchResult if not elastic search", () => {
            searchResults = [
                {
                    "category": "Adresse",
                    "id": "NeuenfelderStraße19",
                    "index": 1,
                    "name": "Neuenfelder Straße 19",
                    "searchInterfaceId": "gazetteer",
                    "displayedInfo": "",
                    "icon": "bi-signpost",
                    "imagePath": "",
                    "toolTip": "",
                    "events": {
                    }
                },
                {
                    "category": "Adresse",
                    "id": "NeuenfelderStraße19",
                    "index": 1,
                    "name": "Neuenfelder Straße 19",
                    "searchInterfaceId": "gazetteer",
                    "displayedInfo": "",
                    "icon": "bi-signpost",
                    "imagePath": "",
                    "toolTip": "",
                    "events": {
                    }
                }
            ];

            wrapper = shallowMount(SearchBarComponent, {
                global: {
                    plugins: [store]
                }
            });

            const activateActionsSpy = sinon.spy(wrapper.vm, "activateActions");

            wrapper.vm.zoomToAndMarkSearchResult("Neuenfelder Straße 19");
            expect(activateActionsSpy.called).not.to.be.true;
        });
    });

});
