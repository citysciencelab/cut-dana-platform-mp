define([
    "backbone",
    "backbone.radio",
    "modules/core/modellist/list"
], function () {

    var Backbone = require("backbone"),
        Radio = require("backbone.radio"),
        ModelList = require("modules/core/modellist/list"),
        Parser;

    Parser = Backbone.Model.extend({
        defaults: {
            // "light-models"
            itemList: [],
            // Themenconfig.Fachdaten
            overlayer: [],
            // Themenconfig.Hintergrundkarten
            baselayer: [],
            // Portalconfig
            portalConfig: {},
            // Baumtyp
            treeType: ""
        },

        initialize: function () {
            var channel = Radio.channel("Parser");

            channel.reply({
                "getItemByAttributes": this.getItemByAttributes,
                "getItemsByAttributes": this.getItemsByAttributes
            }, this);

            this.parseMenu(this.get("portalConfig").menu, "root");
            this.parseControls(this.get("portalConfig").controls);

            if (this.getTreeType() === "light") {
                this.parseTree(this.getOverlayer(), "Themen", 0);
                this.parseTree(this.getBaselayer(), "Themen", 0);
            }
            else if (this.getTreeType() === "custom") {
                this.addTreeMenuItems();
                this.parseTree(this.getBaselayer(), "Baselayer", 0);
                this.parseTree(this.getOverlayer(), "Overlayer", 0);
            }
            else {
                this.addTreeMenuItems();
                this.parseTree(Radio.request("RawLayerList", "getLayerAttributesList"));
            }
            this.createModelList();
        },

        /**
         * Parsed die Menüeinträge (alles außer dem Inhalt des Baumes)
         */
        parseMenu: function (items, parentId) {

            _.each(items, function (value, key) {
                if (_.has(value, "children") || key === "tree") {
                    this.addItem({
                        type: "folder",
                        parentId: parentId,
                        glyphicon: value.glyphicon,
                        name: value.name,
                        id: value.name
                    });
                    this.parseMenu(value.children, value.name);
                }
                else {
                    this.addItem(_.extend({type: "tool", parentId: parentId, id: key}, value));
                }
            }, this);
        },

        /**
         * [parseControls description]
         * @param  {[type]} items [description]
         * @return {[type]}       [description]
         */
        parseControls: function (items) {
            _.each(items, function (value, key) {
                this.addItem({
                    type: "control",
                    id: key,
                    attr: value
                });
            }, this);
        },

        /**
         * Fügt dem Attribut "itemList" ein Item(layer, folder, ...) hinzu
         * @param {Object} obj - Item
         */
        addItem: function (obj) {
            if (!_.isUndefined(obj.visibility)) {
                obj.isSelected = obj.visibility;
                obj.isVisibleInMap = obj.visibility;
                delete obj.visibility;
            }
            this.getItemList().push(obj);
        },

        /**
         *  Ermöglicht ein Array von Objekten, die alle attr gemeinsam haben zu erzeugen
         */
        addItems: function (objs, attr) {
            _.each(objs, function (obj) {
                this.addItem(_.extend(obj, attr));
            }, this);
        },

        /**
         * Getter für das Attribut "itemList"
         * @return {Array}
         */
        getItemList: function () {
            return this.get("itemList");
        },

        /**
         * Getter für Attribut "baselayer"
         * @return {Object}
         */
        getBaselayer: function () {
            return this.get("baselayer");
        },
        /**
         * setter für Attribut "baselayer"
         * @return {Object}
         */
        setBaselayer: function (value) {
            return this.set("baselayer", value);
        },

         /**
          * Getter für Attribut "overlayer"
          * @return {Object}
          */
        getOverlayer: function () {
            return this.get("overlayer");
        },
         /**
          * Setter für Attribut "overlayer"
          * @return {Object}
          */
        setOverlayer: function (value) {
            return this.set("overlayer", value);
        },

        /**
          * Getter für Attribut "treeType"
          * @return {String}
          */
        getTreeType: function () {
             return this.get("treeType");
        },
        /**
          * Getter für Attribut "treeType"
          * @return {String}
          */
        setTreeType: function (value) {
             return this.set("treeType", value);
        },

        /**
         * [getItemByAttributes description]
         * @param  {[type]} value [description]
         * @return {[type]}       [description]
         */
        getItemByAttributes: function (value) {
            return _.findWhere(this.getItemList(), value);
        },

        /**
         * [getItemsByAttributes description]
         * @param  {[type]} value [description]
         * @return {[type]}       [description]
         */
        getItemsByAttributes: function (value) {
            return _.where(this.getItemList(), value);
        },

        /**
         * [createModelList description]
         * @return {[type]} [description]
         */
        createModelList: function () {
            new ModelList(_.filter(this.getItemList(), function (model) {
                return model.parentId === "root" ||
                    model.parentId === "Werkzeuge" ||
                    model.parentId === "Themen";
            }));
        },

        addTreeMenuItems: function () {
            this.addItem({
                type: "folder",
                name: "Hintergrundkarten",
                glyphicon: "glyphicon-plus-sign",
                id: "Baselayer",
                parentId: "Themen",
                isInThemen: true,
                isExpanded: false,
                level: 0
            });
            this.addItem({
                type: "folder",
                name: "Fachdaten",
                glyphicon: "glyphicon-plus-sign",
                id: "Overlayer",
                parentId: "Themen",
                isInThemen: true,
                isExpanded: true,
                level: 0
            });
            this.addItem({
                type: "folder",
                name: "Auswahl der Themen",
                glyphicon: "glyphicon-plus-sign",
                id: "SelectedLayer",
                parentId: "Themen",
                isLeafFolder: true,
                isInThemen: true,
                isExpanded: false,
                level: 0
            });
        },

        /**
         * Gruppiert Objekte aus der layerlist, die mit den Ids in der übergebenen Liste übereinstimmen
         * @param  {Object[]} layerlist - Objekte aus der services.json
         * @param  {string[]} ids - Array von Ids deren Objekte gruppiert werden
         * @return {Object[]} layerlist - Objekte aus der services.json
         */
        mergeObjectsByIds: function (ids, layerlist) {
            var objectsByIds,
                newObject;

                // Objekte die gruppiert werden
                objectsByIds = _.filter(layerlist, function (object) {
                    return _.contains(ids, object.id);
                });
                // Das erste Objekt wird kopiert
                newObject = _.clone(objectsByIds[0]);
                // Das Attribut layers wird gruppiert und am kopierten Objekt gesetzt
                newObject.layers = _.pluck(objectsByIds, "layers").toString();
                // Das Attribut maxScale wird gruppiert
                // Am kopierten Objekt wird der höchste Wert gesetzt
                newObject.maxScale = _.max(_.pluck(objectsByIds, "maxScale"), function (scale) {
                    return parseInt(scale, 10);
                });
                // Das Attribut minScale wird gruppiert
                // Am kopierten Objekt wird der niedrigste Wert gesetzt
                newObject.minScale = _.min(_.pluck(objectsByIds, "minScale"), function (scale) {
                    return parseInt(scale, 10);
                });

            return newObject;
        },

        /**
         * Generiert eine Uniq-Id mit Prefix
         * Zuvor werden alle Leerzeichen aus dem Prefix entfernt
         * @param  {String} value - Prefix für Uniq-Id
         * @return {String} value - Uniq-Id
         */
        createUniqId: function (value) {
            value = value.replace(/[^a-zA-Z0-9]/g, "");

            return _.uniqueId(value);
        }
    });

    return Parser;
});
