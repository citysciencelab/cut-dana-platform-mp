import {expect} from "chai";
import getters from "../../../store/gettersFooter";
import stateFooter from "../../../store/stateFooter";

const {
    urls,
    showVersion,
    showFooter
} = getters;

describe("gettersFooter.vue", () => {
    describe("Footer getters", function () {
        it("returns the urls from state", function () {
            const state = {
                urls: [
                    {
                        "bezeichnung": "Example",
                        "url": "https://example.net",
                        "alias": "Example Alias",
                        "alias_mobil": "EA"
                    }
                ]
            };

            expect(urls(stateFooter)).to.be.an("array").that.is.empty;
            expect(urls(state)).to.be.an("array").to.equals(state.urls);
        });
        it("returns the showVersion from state", function () {
            const state = {
                showVersion: true
            };

            expect(showVersion(stateFooter)).to.be.false;
            expect(showVersion(state)).to.be.true;
        });
        it("returns the showFooter from state", function () {
            const state = {
                showFooter: true
            };

            expect(showFooter(stateFooter)).to.be.false;
            expect(showFooter(state)).to.be.true;
        });
    });
});
