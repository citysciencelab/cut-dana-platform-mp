const webdriver = require("selenium-webdriver"),
    {isMaster} = require("../../../../../../test/end2end/settings"),
    {initDriver} = require("../../../../../../test/end2end/library/driver"),
    {logTestingCloudUrlToTest} = require("../../../../../../test/end2end/library/utils"),
    {expect} = require("chai"),
    {By, until} = webdriver,
    {getScale} = require("../../../../../../test/end2end/library/scripts");


/**
 * Tests regarding scale switcher tool.
 * @param {e2eTestParams} params The parameter set.
 * @returns {void}
 */
async function ScaleSwitcherTests ({builder, url, resolution, capability}) {
    const testIsApplicable = isMaster(url);

    if (testIsApplicable) {
        describe("ScaleSwitcher", function () {
            let driver;

            before(async function () {
                if (capability) {

                    capability.name = this.currentTest.fullTitle();
                    capability["sauce:options"].name = this.currentTest.fullTitle();
                    builder.withCapabilities(capability);
                }
                driver = await initDriver(builder, url, resolution);
            });

            after(async function () {
                if (capability) {
                    driver.session_.then(function (sessionData) {
                        logTestingCloudUrlToTest(sessionData.id_);
                    });
                }
                await driver.quit();
            });

            afterEach(async function () {
                if (this.currentTest._currentRetry === this.currentTest._retries - 1) {
                    console.warn("      FAILED! Retrying test \"" + this.currentTest.title + "\"  after reloading url");
                    await driver.quit();
                    driver = await initDriver(builder, url, resolution);
                    await (await driver.findElement(By.xpath("//ul[@id='tools']//.."))).click();
                    await (await driver.findElement(By.css("#tools .glyphicon-resize-small"))).click();
                }
            });

            it("Open the tool scaleSwitcher and check if all elements are visible", async function () {
                if ((await driver.findElements(By.id("scale-switcher"))).length === 0) {
                    await (await driver.findElement(By.xpath("//ul[@id='tools']//.."))).click();
                    await (await driver.findElement(By.css("#tools .glyphicon-resize-small"))).click();
                }

                await driver.wait(until.elementIsVisible(await driver.findElement(By.id("scale-switcher"))));

                const header = await driver.findElement(By.css("div.win-heading div.heading-element p.title"), 5000),
                    label = await driver.findElement(By.css("div#scale-switcher label"), 5000),
                    select = await driver.findElement(By.id("scale-switcher-select"), 5000),
                    selectValue = await select.getAttribute("value"),
                    selectContent = await driver.findElement(By.css(`#scale-switcher-select option[value="${selectValue}"]`), 5000);

                expect(await header.getText()).to.equals("Maßstab umschalten");
                expect(await label.getText()).to.equals("Maßstab");
                expect(selectValue).to.equals("60000");
                expect(await selectContent.getText()).to.equals("1 : 60000");
            });

            it("Switch scale to 1 : 10000 and check if the scale of the map has switched as well", async function () {
                const select = await driver.findElement(By.id("scale-switcher-select"), 5000),
                    targetScale = 10000;

                await select.click();
                await (await driver.findElement(By.css(`#scale-switcher-select option[value="${targetScale}"]`))).click();

                expect(await select.getAttribute("value")).to.equals(String(targetScale));
                expect(await driver.executeScript(getScale)).to.equals(targetScale);
            });

            it("Switch scale to 1 : 250000 and check if the scale of the map has switched as well", async function () {
                const select = await driver.findElement(By.id("scale-switcher-select"), 5000),
                    targetScale = 250000;

                await select.click();
                await (await driver.findElement(By.css(`#scale-switcher-select option[value="${targetScale}"]`))).click();

                expect(await select.getAttribute("value")).to.equals(String(targetScale));
                expect(await driver.executeScript(getScale)).to.equals(targetScale);
            });
        });
    }
}

module.exports = ScaleSwitcherTests;
