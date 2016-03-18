define([
    "backbone",
    "backbone.radio",
    "modules/core/util",
    "config",
    "modules/treeMobile/dummyModel",
    "modules/treeMobile/folderModel",
    "modules/treeMobile/itemModel",
    "modules/treeMobile/layerModel"
], function () {

     var Backbone = require("backbone"),
         Util = require("modules/core/util"),
         Radio = require("backbone.radio"),
         Dummy = require("modules/treeMobile/dummyModel"),
         Folder = require("modules/treeMobile/folderModel"),
         Item = require("modules/treeMobile/itemModel"),
         Layer = require("modules/treeMobile/layerModel"),
         Config = require("config"),
         treeNodes = [],
         TreeCollection;

    TreeCollection = Backbone.Collection.extend({
        model: function (attrs, options) {
            if (attrs.type === "folder") {
                return new Folder(attrs, options);
            }
            else if (attrs.type === "layer") {
                return new Layer(attrs, options);
            }
            else if (attrs.type === "item") {
                return new Item(attrs, options);
            }
            else if (attrs.type === "dummy") {
                return new Dummy(attrs, options);
            }
        },
        // Pfad zur treeconfig
        url: "tree-config.json",

        initialize: function () {
             this.parseMainMenue();
             this.parseTools();

            switch (Config.tree.type){
                case "default": {
                    this.parseLayerList();
                    break;
                }
                case "light": {
                    this.parseLightTree();
                    break;
                }
                case "custom": {
                    this.addTreeMenu();
                    this.loadTreeConfig();
                    break;
                }
                case "dummy": {
                    for (var i = 0; i < 10; i++) {
                        this.add({type: "dummy"});
                    }
                    for (var i = 0; i < 10; i++) {
                        this.add({type: "dummy", parentId: "1"});
                    }
                }
            }
        },
        /**
        * Ließt aus der Config aus, welche Menüeinträge
        * angezeigt werden sollen und erzeugt daraus die
        * oberen statischen Menüelmente (alles außer den Baum)
        */
        parseMainMenue: function () {
            _.each(Config.menuItems, function (value, key) {
                if (key === "tree" || key === "tools") {
                    this.add({
                        type: "folder",
                        title: value.title,
                        glyphicon: value.glyphicon,
                        isRoot: true,
                        id: key
                    });
                }
                else {
                    this.add({
                        type: "item",
                        title: value.title,
                        glyphicon: value.glyphicon,
                        isRoot: true,
                        id: key
                    });
                }
            }, this);
        },

        /**
         * Erstellt die 1. Themenbaum-Ebene bei custom und default (Hintergrundkarten, Fachdaten und Auswahlt der Karten).
         */
        addTreeMenu: function () {
            var treeId = this.findWhere({isRoot: true, id: "tree"}).id;

            this.add({
                type: "folder",
                title: "Hintergrundkarten",
                glyphicon: "glyphicon-plus-sign",
                isRoot: false,
                id: "BaseLayer",
                parentId: treeId
            });
            this.add({
                type: "folder",
                title: "Fachdaten",
                glyphicon: "glyphicon-plus-sign",
                isRoot: false,
                id: "OverLayer",
                parentId: treeId
            });
            this.add({
                type: "folder",
                title: "Auswahl der Karten",
                glyphicon: "glyphicon-plus-sign",
                isRoot: false,
                id: "SelectedLayer",
                parentId: treeId,
                isLeafFolder: true
            });
        },

        parseTools: function () {
            var toolId = this.findWhere({isRoot: true, id: "tools"}).id;

            if (_.isUndefined(toolId) === false) {
                _.each(Config.tools, function (value) {
                    this.add({type: "item", title: value.title, glyphicon: value.glyphicon, parentId: toolId});
                }, this);
            }
        },
        /**
        * Ließt aus der Config die Layer aus und
        * erzeugt daraus einen Baum mit nur einer Ebene.
        * In dieser Ebene sind alle Layer
        */
        parseLightTree: function () {
            var treeId = this.findWhere({isRoot: true, id: "tree"}).id,
                layerList = Radio.request("LayerList", "getLayerList");

            _.each(layerList, function (element) {
                this.add({
                    type: "layer",
                    parentId: treeId,
                    layerId: element.get("id"),
                    title: element.get("name")
                });
            }, this);
        },
        /**
        * Lädt eine Treeconfig und erzeugt daraus einen Baum
        * die Treeconfig wird in parse() geparst
        */
        loadTreeConfig: function () {
            this.fetch({
                remove: false,
                async: false,
                beforeSend: Util.showLoader(),
                success: function () {
                    Util.hideLoader();
                }
            });
        },
        /**
         * parsed die gefetchte Treeconfig
         * @param  {Object} response - Die treeConfig JSON
         */
        parse: function (response) {

            // key = Hintergrundkarten || Fachdaten || Ordner
            // value = Array von Objekten (Layer || Ordner)
            _.each(response, function (value, key) {
                var parentId = "";

                if (key === "Hintergrundkarten") {
                    parentId = "BaseLayer";
                }
                else if (key === "Fachdaten") {
                    parentId = "OverLayer";
                }
                else {
                    parentId = value[0].id;
                }

                _.each(value, function (element) {
                    if (_.has(element, "Layer")) {
                        _.each(element.Layer, function (layer) {
                            treeNodes.push({
                                type: "layer",
                                parentId: parentId,
                                layerId: layer.id
                            });
                        });
                    }
                    if (_.has(element, "Ordner")) {
                        _.each(element.Ordner, function (folder) {
                            folder.id = _.uniqueId(folder.Titel);
                            treeNodes.push({
                                type: "folder",
                                parentId: parentId,
                                title: folder.Titel,
                                id: folder.id,
                                isLeafFolder: (!_.has(folder, "Ordner")) ? true : false
                            });
                            // rekursiver Aufruf
                            this.parse({"Ordner": [folder]});
                        }, this);
                    }
                }, this);
            }, this);

            return treeNodes;
        },
        /**
        * Holt sich die Liste detr Layer aus dem Layermodul
        * und erzeugt daraus einen Baum
        */
        parseLayerList: function () {},
        /**
        * Setzt bei Änderung der Ebene, alle Model
        * auf der neuen Ebene auf sichtbar
        * @param {int} parentId Die Id des Objektes dessen Kinder angezeigt werden sollen
        */
        setModelsVisible: function (parentId) {
            var children = this.where({parentId: parentId});

            _.each(children, function (model) {
                model.setIsVisible(true);
            });
        },
        /**
         * Setzt alle Model unsichtbar
         */
        setAllModelsInvisible: function () {
            this.forEach(function (model) {
                model.setIsVisible(false);
            });
        },
        /**
        * Setzt bei Änderung der Ebene, alle Model
        * auf der alten Ebene auf unsichtbar
        * darf erst aufgerufen werden, nachdem
        * die Animation der ebenänderung fertig ist
        * @param {int} parentId Die ID des Objektes dessen Kinder nicht mehr angezeigt werden sollen
        */
        setModelsInVisible: function (parentId) {}
    });

    return TreeCollection;
});
