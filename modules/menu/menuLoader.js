import LightMenu from "./desktop/listViewLight";
import Menu from "./desktop/listView";
import MobileMenu from "./mobile/listView";
import TableMenu from "./table/view";

const MenuLoader = Backbone.Model.extend(/** @lends MenuLoader.prototype */{
    defaults: {
        treeType: "light",
        currentMenu: ""
    },
    /**
     * @class MenuLoader
     * @extends Backbone.Model
     * @memberof Menu
     * @constructs
     * @description This Loader gives you ...
     */
    initialize: function () {
        this.treeType = Radio.request("Parser", "getTreeType");

        // im Table-Style soll das ui nicht verändert werden
        if (this.menuStyle === "DEFAULT") {
            Radio.on("Util", {
                "isViewMobileChanged": function () {
                    $("div.collapse.navbar-collapse ul.nav-menu").empty();
                    $("div.collapse.navbar-collapse .breadcrumb-mobile").empty();
                    this.loadMenu();
                }
            }, this);
        }

        this.listenTo(Radio.channel("i18next"), {
            "languageChanged": function () {
                this.switchCollectionLanguage(Radio.request("ModelList", "getCollection"));

                $("div.collapse.navbar-collapse ul.nav-menu").empty();
                $("div.collapse.navbar-collapse .breadcrumb-mobile").empty();
                this.loadMenu();
            }
        });

        this.switchCollectionLanguage(Radio.request("ModelList", "getCollection"));
        this.loadMenu();
    },

    /**
     * changes the values of all models in ModelList collection where a translate function is given
     * @pre the collection is somewhat
     * @post the collection is translated where translations where found
     * @param {Backbone.Collection} collection the collection (e.g. ModelList) to run through
     * @return {Void}  -
     */
    switchCollectionLanguage: function (collection) {
        if (!collection || typeof collection.each !== "function") {
            return;
        }

        collection.each(function (model) {
            if (model.has("i18nextTranslate") && typeof model.get("i18nextTranslate") === "function") {
                model.get("i18nextTranslate")(function (key, value) {
                    if (!model.has(key) || typeof value !== "String") {
                        return;
                    }
                    model.set(key, value);
                });
            }
        }, this);
    },

    /**
     * Prüft initial und nach jedem Resize, ob und welches Menü geladen werden muss und lädt bzw. entfernt Module.
     * @param  {Object} caller this MenuLoader
     * @return {Object}        this
     * @fires Map#RadioTriggerMapUpdateSize
     */
    loadMenu: function () {
        var isMobile = Radio.request("Util", "isViewMobile"),
            channel = Radio.channel("Menuloader");

        if (this.currentMenu) {
            this.currentMenu.stopListening();
        }
        if (!this.menuStyle) {
            this.menuStyle = Radio.request("Util", "getUiStyle");
        }

        if (this.menuStyle === "TABLE") {
            this.currentMenu = new TableMenu();
            channel.trigger("ready", this.currentMenu.id);
        }
        else if (this.menuStyle === "DEFAULT") {
            $("#map").css("height", "calc(100% - 50px)");
            $("#main-nav").show();

            if (isMobile) {
                this.currentMenu = new MobileMenu();
            }
            else if (this.treeType === "light") {
                this.currentMenu = new LightMenu();
            }
            else {
                this.currentMenu = new Menu();
            }
            // Nachdem die MapSize geändert wurde, muss die Map aktualisiert werden.
            channel.trigger("ready", this.currentMenu.id);
            Radio.trigger("Map", "updateSize");
        }
    }
});

export default MenuLoader;
