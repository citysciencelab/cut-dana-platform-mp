import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import moment from "moment";
import NewsViewComponent from "../../../components/NewsView.vue";
import News from "../../../store/indexNewsView";
import {expect} from "chai";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("src_3_0_0/modules/newsView/components/NewsView.vue", () => {
    const mockConfigJson = {
        Portalconfig: {
            mainMenu: {
                sections: [
                    {
                        type: "news"
                    }
                ]
            }
        }
    };
    let store,
        wrapper,
        news;

    beforeEach(() => {
        mapCollection.clear();

        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        News
                    }
                }
            },
            state: {
                configJson: mockConfigJson
            }
        });
        news = [
            {
                category: "category 1",
                content: "content 1",
                displayFrom: "2022-02-18 13:00",
                displayUntil: "2022-02-25 18:00"
            },
            {
                category: "category 2",
                content: "content 2",
                displayFrom: "2020-02-18 13:00",
                displayUntil: "2020-02-25 18:00"
            },
            {
                category: "category 3",
                content: "content 3",
                displayFrom: "2021-02-18 13:00",
                displayUntil: "2021-02-25 18:00"
            }
        ];
        store.commit("Modules/News/setActive", true);
        store.commit("Modules/News/setNews", []);
    });

    afterEach(() => {
        sinon.restore();
    });

    // after(() => {
    //     NewsView.state = defaultState;
    // });

    it("renders the NewsView component", () => {
        wrapper = shallowMount(NewsViewComponent, {
            global: {
                plugins: [store]
            }});

        expect(wrapper.find("#news-view").exists()).to.be.true;
    });

    it("renders the NewsView component with news", () => {
        store.commit("Modules/News/setNews", news);
        wrapper = shallowMount(NewsViewComponent, {
            global: {
                plugins: [store]
            }});

        expect(wrapper.find("#news-view").exists()).to.be.true;
        expect(wrapper.find("#news-title").exists()).to.be.true;
        expect(wrapper.find("#news_date_0").exists()).to.be.true;
        expect(wrapper.find("#news_date_1").exists()).to.be.true;
        expect(wrapper.find("#news_date_2").exists()).to.be.true;
        expect(wrapper.find("#news_category_0").exists()).to.be.true;
        expect(wrapper.find("#news_category_1").exists()).to.be.true;
        expect(wrapper.find("#news_category_2").exists()).to.be.true;
        expect(wrapper.find("#news_content_0").exists()).to.be.true;
        expect(wrapper.find("#news_content_1").exists()).to.be.true;
        expect(wrapper.find("#news_content_2").exists()).to.be.true;
    });

    it("checks content of news and sorting by date", () => {
        const date_0 = moment(news[0].displayFrom).format("DD.MM.YYYY") + " - " + moment(news[0].displayUntil).format("DD.MM.YYYY"),
            date_1 = moment(news[1].displayFrom).format("DD.MM.YYYY") + " - " + moment(news[1].displayUntil).format("DD.MM.YYYY"),
            date_2 = moment(news[2].displayFrom).format("DD.MM.YYYY") + " - " + moment(news[2].displayUntil).format("DD.MM.YYYY");

        store.commit("Modules/News/setNews", news);
        wrapper = shallowMount(NewsViewComponent, {
            global: {
                plugins: [store]
            }});

        expect(wrapper.find("#news-view").exists()).to.be.true;
        expect(wrapper.find("#news-title").text()).to.be.equals("modules.tools.news.headline");
        expect(wrapper.find("#news_date_0").text()).to.be.equals(date_0);
        expect(wrapper.find("#news_date_1").text()).to.be.equals(date_2);
        expect(wrapper.find("#news_date_2").text()).to.be.equals(date_1);
        expect(wrapper.find("#news_category_0").text()).to.be.equals(news[0].category);
        expect(wrapper.find("#news_category_1").text()).to.be.equals(news[2].category);
        expect(wrapper.find("#news_category_2").text()).to.be.equals(news[1].category);
        expect(wrapper.find("#news_content_0").text()).to.be.equals(news[0].content);
        expect(wrapper.find("#news_content_1").text()).to.be.equals(news[2].content);
        expect(wrapper.find("#news_content_2").text()).to.be.equals(news[1].content);
    });

    it("checks html if no category available", () => {
        const aNews = {
            category: "",
            content: "content",
            displayFrom: "2021-02-18 13:00",
            displayUntil: "2021-02-25 18:00"
        };

        store.commit("Modules/News/setNews", [aNews]);
        wrapper = shallowMount(NewsViewComponent, {
            global: {
                plugins: [store]
            }});

        expect(wrapper.find("#news-view").exists()).to.be.true;
        expect(wrapper.find("#news_date_0").exists()).to.be.true;
        expect(wrapper.find("#news_category_0").exists()).to.be.false;
        expect(wrapper.find("#news_content_0").exists()).to.be.true;
    });

    it("test method getDate", () => {
        const date_0 = moment(news[0].displayFrom).format("DD.MM.YYYY") + " - " + moment(news[0].displayUntil).format("DD.MM.YYYY"),
            date_1 = moment(news[1].displayFrom).format("DD.MM.YYYY") + " - " + moment(news[1].displayUntil).format("DD.MM.YYYY"),
            date_2 = moment(news[2].displayFrom).format("DD.MM.YYYY") + " - " + moment(news[2].displayUntil).format("DD.MM.YYYY"),
            noDate = {
                category: "category",
                content: "content"
            };

        store.commit("Modules/News/setNews", news);

        wrapper = shallowMount(NewsViewComponent, {
            global: {
                plugins: [store]
            }});

        expect(wrapper.vm.getDate(news[0])).to.be.equals(date_0);
        expect(wrapper.vm.getDate(news[1])).to.be.equals(date_1);
        expect(wrapper.vm.getDate(news[2])).to.be.equals(date_2);
        expect(wrapper.vm.getDate(noDate)).to.be.equals("");
    });

    it("test method getDate if date one or two date attributes are missing ", () => {
        const noDate = {
                category: "category",
                content: "content"
            },
            onlyDisplayFrom = {
                category: "category",
                content: "content",
                displayFrom: "2021-02-18 13:00"
            },
            onlyDisplayUntil = {
                category: "category",
                content: "content",
                displayUntil: "2021-02-25 18:00"
            };

        store.commit("Modules/News/setNews", news);
        wrapper = shallowMount(NewsViewComponent, {
            global: {
                plugins: [store]
            }});

        expect(wrapper.vm.getDate(noDate)).to.be.equals("");
        expect(wrapper.vm.getDate(onlyDisplayFrom)).to.be.equals(moment(onlyDisplayFrom.displayFrom).format("DD.MM.YYYY"));
        expect(wrapper.vm.getDate(onlyDisplayUntil)).to.be.equals("");
    });

});
