define(function (require) {
    var Backbone = require("backbone"),
        Radio = require("backbone.radio"),
        Config = require("config"),
        ol = require("openlayers"),
        ThemeList = require("modules/tools/gfi/themes/list"),
        gfiParams = [],
        Gfi;

    Gfi = Backbone.Model.extend({
        defaults: {
            // detached | attached
            desktopViewType: "detached",
            // ist das Modal/Popover sichtbar
            isVisible: false,
            // mobile Ansicht true | false
            isMobile: Radio.request("Util", "isViewMobile"),
            // ol.Overlay für attached
            overlay: new ol.Overlay({element: undefined}),
            // desktop/attached/view.js | desktop/detached/view.js | mobile/view.js
            currentView: undefined,
            // Koordinate für das attached Popover und den Marker
            coordinate: undefined,
            // Verwaltet die Themes
            themeList: new ThemeList(),
            // Index für das aktuelle Theme
            themeIndex: 0,
            // Anzahl der Themes
            numberOfThemes: 0,
            active3d: false
        },
        initialize: function () {
            var channel = Radio.channel("GFI");

            channel.on({
                "setIsVisible": this.setIsVisible,
                "setGfiParams": this.setGfiParamsFromCustomModule
            }, this);

            channel.reply({
                "getIsVisible": this.getIsVisible,
                "getGFIForPrint": this.getGFIForPrint,
                "getCoordinate": this.getCoordinate,
                "getCurrentView": this.getCurrentView
            }, this);

            this.listenTo(this, {
                "change:isVisible": function (model, value) {
                    channel.trigger("isVisible", value);
                    if (value === false && this.getNumberOfThemes() > 0) {
                        this.getThemeList().setAllInVisible();
                    }
                },
                "change:isMobile": function () {
                    this.initView();
                    if (this.getIsVisible() === true) {
                        this.getCurrentView().render();
                        this.getThemeList().appendTheme(this.getThemeIndex());
                        this.getCurrentView().toggle();
                    }
                },
                "change:coordinate": function (model, value) {
                    this.setIsVisible(false);
                    this.getOverlay().setPosition(value);
                },
                "change:themeIndex": function (model, value) {
                    this.getThemeList().appendTheme(value);
                },
                "change:desktopViewType": function () {
                    Radio.trigger("Map", "addOverlay", this.getOverlay());
                }
            });

            this.listenTo(this.getThemeList(), {
                "isReady": function () {
                    if (this.getThemeList().length > 0) {
                        this.setNumberOfThemes(this.getThemeList().length);
                        this.getCurrentView().render();
                        this.getThemeList().appendTheme(0);
                        this.setIsVisible(true);
                    }
                    else {
                        this.setIsVisible(false);
                    }
                }
            });

            this.listenTo(Radio.channel("Util"), {
                "isViewMobileChanged": this.setIsMobile
            }, this);

            this.listenTo(Radio.channel("Tool"), {
                "activatedTool": this.checkTool
            });

            this.listenTo(Radio.channel("Map"), {
                "clickedWindowPosition": this.setGfiParams3d
            }, this);


            if (_.has(Config, "gfiWindow")) {
                this.setDesktopViewType(Config.gfiWindow);
            }

            if (!_.isUndefined(Radio.request("Parser", "getItemByAttributes", {isActive: true}))) {
                this.checkTool(Radio.request("Parser", "getItemByAttributes", {isActive: true}).id);
            }
            this.initView();
        },

        /**
         * Prüft ob GFI aktiviert ist und registriert entsprechend den Listener oder eben nicht
         * @param  {String} id - Tool Id
         */
        checkTool: function (id) {
            if (id === "gfi") {
                Radio.trigger("Map", "registerListener", "click", this.setGfiParams, this);
                this.active3d = true;
            }
            else {
                Radio.trigger("Map", "unregisterListener", "click", this.setGfiParams, this);
                this.active3d = false;
            }
        },

        /**
         * Löscht vorhandene View - falls vorhanden - und erstellt eine neue
         * mobile | detached | attached
         */
        initView: function () {
            var CurrentView;

            // Beim ersten Initialisieren ist CurrentView noch undefined
            if (_.isUndefined(this.getCurrentView()) === false) {
                this.getCurrentView().removeView();
            }

            if (this.getIsMobile()) {
                CurrentView = require("modules/tools/gfi/mobile/view");
            }
            else {
                if (this.getDesktopViewType() === "attached") {
                    CurrentView = require("modules/tools/gfi/desktop/attached/view");
                }
                else {
                    CurrentView = require("modules/tools/gfi/desktop/detached/view");
                }
            }
            this.setCurrentView(new CurrentView({model: this}));
        },

        setGfiParams3d: function(event) {
            if(this.active3d) {
                if (Radio.request("Map", "isMap3d")) {
                    // Abbruch, wenn auf SearchMarker x geklickt wird.
                    if (this.checkInsideSearchMarker(event.position.x, event.position.y) === true) {
                        return;
                    }


                    var features = Radio.request("Map", "getFeatures3dAtPosition", event.position);
                    for (var i = 0; i < features.length; i++) {
                        var object = features[i];
                        if(object) {
                            if (object instanceof Cesium.Cesium3DTileFeature) {
                                var properties = {};
                                var propertyNames = object.getPropertyNames();
                                var length = propertyNames.length;
                                for (var j = 0; j < length; ++j) {
                                    var propertyName = propertyNames[j];
                                    properties[propertyName] = object.getProperty(propertyName);
                                }
                                if(properties.attributes && properties.id){
                                    properties.attributes.gmlid = properties.id;
                                }
                                var modelattributes = {
                                    attributes: properties.attributes ? properties.attributes : properties,
                                    gfiAttributes: "showAll",
                                    typ: "Cesium3DTileFeature",
                                    name: "Buildings"
                                };
                                gfiParams.push(modelattributes);
                                break; // nur das erste 3D Objekt
                            } else if (object.primitive) {
                                var feature = object.primitive.olFeature;
                                var layer = object.primitive.olLayer;
                                if (feature && layer) {
                                    this.searchModelByFeature(feature, layer);
                                    break; // nur das erste 3D Objekt
                                }
                            }
                        }
                    }

                    if (gfiParams.length >= 1) {
                        if(event.pickedPosition && event.pickedPosition[2] >= event.coordinate[2]) {
                            this.setCoordinate(event.pickedPosition);
                        } else {
                            this.setCoordinate(event.coordinate);
                        }
                    } else { // wenn keine 3D Objekte gefunden wurden, check WMS Layer
                        this.setCoordinate(event.coordinate);
                        var visibleWMSLayerList = Radio.request("ModelList", "getModelsByAttributes", {isVisibleInMap: true, isOutOfRange: false, typ: "WMS"});
                        var visibleGroupLayerList = Radio.request("ModelList", "getModelsByAttributes", {isVisibleInMap: true, isOutOfRange: false, typ: "GROUP"});
                        var visibleLayerList = _.union(visibleWMSLayerList, visibleGroupLayerList);

                        var resolution = event.resolution;
                        var projection = Radio.request("MapView", "getProjection");
                        var coordinate = event.coordinate.slice(0,2);
                        // WMS | GROUP
                        _.each(visibleLayerList, function (model) {
                            if (model.getGfiAttributes() !== "ignore") {
                                if (model.getTyp() === "WMS") {
                                    model.attributes.gfiUrl = model.getGfiUrl(resolution, coordinate, projection);
                                    gfiParams.push(model.attributes);
                                }
                                else {
                                    model.get("gfiParams").forEach(function (params, index) {
                                        params.gfiUrl = model.getGfiUrl(index, resolution, coordinate, projection);
                                        gfiParams.push(model.getGfiParams()[index]);
                                    });
                                }
                            }
                        }, this);
                    }
                    this.setThemeIndex(0);
                    this.getThemeList().reset(gfiParams);
                    gfiParams = [];
                }
            }
        },

        /**
         *
         * @param {ol.MapBrowserPointerEvent} evt
         */
        setGfiParams: function (evt) {
            var visibleWMSLayerList = Radio.request("ModelList", "getModelsByAttributes", {isVisibleInMap: true, isOutOfRange: false, typ: "WMS"}),
                visibleGroupLayerList = Radio.request("ModelList", "getModelsByAttributes", {isVisibleInMap: true, isOutOfRange: false, typ: "GROUP"}),
                visibleLayerList = _.union(visibleWMSLayerList, visibleGroupLayerList),
                eventPixel = Radio.request("Map", "getEventPixel", evt.originalEvent),
                isFeatureAtPixel = Radio.request("Map", "hasFeatureAtPixel", eventPixel);

            this.setCoordinate(evt.coordinate);

            // Abbruch, wenn auf SearchMarker x geklickt wird.
            if (this.checkInsideSearchMarker (eventPixel[1], eventPixel[0]) === true) {
                return;
            }

            // Vector
            Radio.trigger("ClickCounter", "gfi");
            if (isFeatureAtPixel === true) {
                Radio.trigger("Map", "forEachFeatureAtPixel", eventPixel, this.searchModelByFeature);
            }
            var resolution = Radio.request("MapView", "getResolution").resolution,
                projection = Radio.request("MapView", "getProjection"),
                coordinate = evt.coordinate;
            // WMS | GROUP
            _.each(visibleLayerList, function (model) {
                if (model.getGfiAttributes() !== "ignore") {
                    if (model.getTyp() === "WMS") {
                        model.attributes.gfiUrl = model.getGfiUrl(resolution, coordinate, projection);
                        gfiParams.push(model.attributes);
                    }
                    else {
                        model.get("gfiParams").forEach(function (params, index) {
                            params.gfiUrl = model.getGfiUrl(index, resolution, coordinate, projection);
                            gfiParams.push(model.getGfiParams()[index]);
                        });
                    }
                }
            }, this);
            this.setThemeIndex(0);
            this.getThemeList().reset(gfiParams);
            gfiParams = [];
        },
        setGfiParamsFromCustomModule: function (params) {
            this.setCoordinate(params.coordinates);
            gfiParams = [{
                name: params.name,
                gfiAttributes: params.attributes,
                typ: params.typ,
                feature: params.feature,
                gfiTheme: params.gfiTheme
            }];
            this.getThemeList().reset(gfiParams);
            gfiParams = [];
        },
        /**
         *
         * @param  {ol.Feature} featureAtPixel
         * @param  {ol.layer.Vector} olLayer
         */
        searchModelByFeature: function (featureAtPixel, olLayer) {
            var model = Radio.request("ModelList", "getModelByAttributes", {id: olLayer.get("id")});

            if (_.isUndefined(model) === false) {
                var modelAttributes = _.pick(model.attributes, "name", "gfiAttributes", "typ", "gfiTheme", "routable");
                // Feature
                if (_.has(featureAtPixel.getProperties(), "features") === false) {
                    modelAttributes.feature = featureAtPixel;
                    gfiParams.push(modelAttributes);
                }
                // Cluster Feature
                else {
                    _.each(featureAtPixel.get("features"), function (feature) {
                        modelAttributes = _.pick(model.attributes, "name", "gfiAttributes", "typ", "gfiTheme", "routable");
                        modelAttributes.feature = feature;
                        gfiParams.push(modelAttributes);
                    });
                }
            }
        },

        // Setter
        setCoordinate: function (value, options) {
            this.set("coordinate", value, options);
        },

        setCurrentView: function (value) {
            this.set("currentView", value);
        },

        setDesktopViewType: function (value) {
            this.set("desktopViewType", value);
        },

        setIsMobile: function (value) {
            this.set("isMobile", value);
        },

        setIsVisible: function (value) {
            this.set("isVisible", value);
        },

        setNumberOfThemes: function (value) {
            this.set("numberOfThemes", value);
        },

        setOverlayElement: function (value) {
            this.getOverlay().setElement(value);
        },

        setThemeIndex: function (value) {
            this.set("themeIndex", value);
        },

        // Getter
        getCoordinate: function () {
            return this.get("coordinate");
        },

        getCurrentView: function () {
            return this.get("currentView");
        },

        getDesktopViewType: function () {
            return this.get("desktopViewType");
        },

        getIsMobile: function () {
            return this.get("isMobile");
        },

        getIsVisible: function () {
            return this.get("isVisible");
        },

        getNumberOfThemes: function () {
            return this.get("numberOfThemes");
        },

        getOverlay: function () {
            return this.get("overlay");
        },

        getOverlayElement: function () {
            return this.getOverlay().getElement();
        },

        getThemeIndex: function () {
            return this.get("themeIndex");
        },

        getThemeList: function () {
            return this.get("themeList");
        },

        /*
        * @description Liefert die GFI-Infos ans Print-Modul.
        */
        getGFIForPrint: function () {
            var theme = this.getThemeList().at(this.getThemeIndex());

            return [theme.getGfiContent()[0], theme.get("name"), this.getCoordinate()];
        },

        /**
        * Prüft, ob clickpunkt in RemoveIcon und liefert true/false zurück.
        */
        checkInsideSearchMarker: function (top, left) {
            var button = Radio.request("MapMarker", "getCloseButtonCorners"),
                bottomSM = button.bottom,
                leftSM = button.left,
                topSM = button.top,
                rightSM = button.right;

            if (top <= topSM && top >= bottomSM && left >= leftSM && left <= rightSM) {
                this.setIsVisible(false);
                return true;
            }
            else {
                return false;
            }
        }

    });

    return Gfi;
});
