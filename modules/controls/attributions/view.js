define([
    "backbone",
    "text!modules/controls/attributions/templateShow.html",
    "text!modules/controls/attributions/templateHide.html",
    "modules/controls/attributions/model",
    "backbone.radio"
], function () {

    var Backbone = require("backbone"),
        TemplateShow = require("text!modules/controls/attributions/templateShow.html"),
        TemplateHide = require("text!modules/controls/attributions/templateHide.html"),
        Attributions = require("modules/controls/attributions/model"),
        Radio = require("backbone.radio"),
        AttributionsView;

    AttributionsView = Backbone.View.extend({
        model: new Attributions(),
        templateShow: _.template(TemplateShow),
        templateHide: _.template(TemplateHide),
        events: {
            "click .attributions-button": "toggleIsContentVisible"
        },
        initialize: function () {
            var channel = Radio.channel("AttributionsView"),
                isViewMobile = Radio.request("Util", "isViewMobile");

            this.listenTo(channel, {
                "renderAttributions": this.renderAttributions
            });

            this.listenTo(this.model, {
                "change:isContentVisible": this.renderAttributions,
                "change:modelList": this.renderAttributions,
                "change:isVisibleInMap": this.toggleIsVisibleInMap
            });

            this.listenTo(Radio.channel("Overviewmap"), {
                "show": this.ovmShow,
                "hide": this.ovmHide
            });

            this.listenTo(Radio.channel("Util"), {
                "isViewMobileChanged": this.isViewMobileChanged
            });


            this.render();

            if (isViewMobile === true) {
                this.model.setIsContentVisible(this.model.getIsInitOpenMobile());
            }
            else {
                this.model.setIsContentVisible(this.model.getIsInitOpenDesktop());
            }
        },

        render: function () {
            var attr = this.model.toJSON(),
            isOverviewMap = Radio.request("Parser", "getItemByAttributes", {id: "overviewmap"}) ? true : false,
            isViewMobile = Radio.request("Util", "isViewMobile");

            this.$el.html(this.templateShow(attr));
            if (this.model.getIsVisibleInMap() === true) {
                this.$el.show();
                this.$el.addClass("attributions-view","attributions-background-color");
            }
            else {
                this.$el.hide();
            }

            this.isViewMobile(isViewMobile, isOverviewMap);

            if (attr.modelList.length === 0) {
                $(".attributions-div").removeClass("attributions-div");
            }
        },

        renderAttributions: function () {
            var attr = this.model.toJSON();

            if (this.model.getIsContentVisible() === true) {
                this.$el.html(this.templateShow(attr));
                this.$el.addClass("attributions-background-color");
            }
            else {
                this.$el.html(this.templateHide(attr));
                this.$el.removeClass("attributions-background-color");
            }
            if (_.isEmpty(attr.modelList) === true) {
                $(".attributions-div").removeClass("attributions-div");
            }
            else {
                $(".attributions-div").addClass("attributions-div")
            }
        },

        toggleIsContentVisible: function () {
            this.model.toggleIsContentVisible();
        },

        toggleIsVisibleInMap: function () {
            this.$el.toggle();
        },

        /**
         * Wenn die Overviewmap offen ist wird die Position des buttons über hinzufügen/entfernen
         * von css angepasst.
         */
        ovmShow: function () {
            this.addWithOverviewmapClass();
            $(".attributions-view").removeClass("attributions-view-withOverviewmapHidden");
        },

        /**
         * Wenn die Overviewmap versteckt ist wird die Position des buttons über hinzufügen/entfernen
         * von css angepasst.
         */
        ovmHide: function () {
            $(".attributions-view").addClass("attributions-view-withOverviewmapHidden");
            this.removeWithOverviewmapClass();
        },

        addWithOverviewmapClass: function () {
            this.$el.addClass("attributions-view-withOverviewmap")
        },

        removeWithOverviewmapClass: function () {
            this.$el.removeClass("attributions-view-withOverviewmap")
        },

        isViewMobileChanged: function () {console.log(12);
            var isOverviewMap = Radio.request("Parser", "getItemByAttributes", {id: "overviewmap"}) ? true : false,
            isViewMobile = Radio.request("Util", "isViewMobile");

            this.isViewMobile(isViewMobile, isOverviewMap);
        },

        isViewMobile: function (isViewMobile, isOverviewMap) {//console.log(isOverviewMap);
            if (isOverviewMap === true && isViewMobile === false) {
                this.addWithOverviewmapClass();
            }
            else if (isOverviewMap === true && isViewMobile === true) {
                this.removeWithOverviewmapClass();
            }
        }

    });

    return AttributionsView;
});
