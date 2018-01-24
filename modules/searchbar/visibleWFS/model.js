define(function (require) {
    var Radio = require("backbone.radio"),
        VisibleWFSModel;

    VisibleWFSModel = Backbone.Model.extend({
        /**
        *
        */
        defaults: {
            inUse: false,
            minChars: 3
        },
        /**
         * @description Initialisierung der visibleWFS Suche
         * @param {Object} config - Das Konfigurationsobjekt der Suche in sichtbaren WFS.
         * @param {integer} [config.minChars=3] - Mindestanzahl an Characters, bevor eine Suche initiiert wird.
         */
        initialize: function (config) {
            if (config.minChars) {
                this.set("minChars", config.minChars);
            }
            this.listenTo(Radio.channel("Searchbar"), {
                "search": this.prepSearch
            });
        },
        /**
        *
        */
        prepSearch: function (searchString) {
            if (this.get("inUse") === false && searchString.length >= this.get("minChars")) {
                this.set("inUse", true);
                var searchStringRegExp = new RegExp(searchString.replace(/ /g, ""), "i"), // Erst join dann als regulärer Ausdruck
                    wfsModels = Radio.request("ModelList", "getModelsByAttributes", {isVisibleInMap: true, typ: "WFS"}),
                    elasticModels = Radio.request("ModelList", "getModelsByAttributes", {isVisibleInMap: true, typ: "Elastic"}),
                    filteredModels = _.filter(_.union(wfsModels, elasticModels), function (model) {
                        return model.has("searchField") === true && model.get("searchField") != "";
                    }),
                    features = this.getFeaturesForSearch(filteredModels);

                this.searchInFeatures(searchStringRegExp, features);
                Radio.trigger("Searchbar", "createRecommendedList");
                this.set("inUse", false);
            }
        },
        /**
        *
        */
        searchInFeatures: function (searchStringRegExp, features) {
            _.each(features, function (feature) {
                var featureName = feature.name.replace(/ /g, "");

                // Prüft ob der Suchstring ein Teilstring vom Feature ist
                if (featureName.search(searchStringRegExp) !== -1) {
                    Radio.trigger("Searchbar", "pushHits", "hitList", feature);
                }
            }, this);
        },

        /**
         * gets an array of feature objects for the search
         * @param  {Backbone.Models[]} models
         * @return {object[]} featureArray
         */
        getFeaturesForSearch: function (models) {
            var featureArray = [];

            _.each(models, function (model) {
                var features = model.get("layer").getSource().getFeatures();

                _.each(features, function (feature) {
                    if (_.isArray(model.get("searchField"))) {
                        _.each(model.get("searchField"), function (field) {
                            featureArray.push(this.getFeatureObject(field, feature, model));
                        }, this)
                    }
                    else {
                        featureArray.push(this.getFeatureObject(model.get("searchField"), feature, model));
                    }
                }, this);
            }, this);

            return featureArray;
        },

        /**
         * gets a new feature object
         * @param  {string} searchField
         * @param  {ol.Feature} feature
         * @param  {Backbone.Model} model
         * @return {object}
         */
        getFeatureObject: function (searchField, feature, model) {
            return {
                name: feature.get(searchField),
                type: model.get("name"),
                coordinate: this.getCentroidPoint(feature.getGeometry()),
                imageSrc: this.getImageSource(feature, model),
                id: _.uniqueId(model.get("name")),
                additionalInfo: this.getAdditionalInfo(model, feature)
            }
        },

        /**
         * gets centroid point for a openlayers geometry
         * @param  {ol.geom.Geometry} geometry
         * @return {ol.Coordinate}
         */
        getCentroidPoint: function (geometry) {
            if (geometry.getType() === "MultiPolygon") {
                return _.flatten(geometry.getInteriorPoints().getCoordinates());
            }
            else {
                return geometry.getCoordinates();
            }
        },

        /**
         * returns an image source of a feature style
         * @param  {ol.Feature} feature
         * @param  {Backbone.Model} model
         * @return {string}
         */
        getImageSource: function (feature, model) {
            var layerStyle = model.get("layer").getStyle(feature),
                layerTyp = model.getTyp();

            // layerStyle returns style
            if (typeof layerStyle === "object") {
                return layerStyle[0].getImage().getSrc();
            }
            // layerStyle returns stylefunction
            else {
                var style = layerStyle(feature);

                return (layerTyp === "WFS") ? style.getImage().getSrc() : "";
            }
        },

        getAdditionalInfo: function (model, feature) {
            var additionalInfo = undefined;

            if (!_.isUndefined(model.get("additionalInfoField"))) {
                additionalInfo = feature.getProperties()[model.get("additionalInfoField")];
            }

            return additionalInfo
        }
    });

    return VisibleWFSModel;
});
