import ClickCounterModel from "./model";

const ClickCounterView = Backbone.View.extend(
    /** @lends ClickCounterView.prototype */
    {
        /**
        * @class ClickCounterView
        * @memberof ClickCounter
        * @extends Backbone.View
        * @constructs
        * @param {String} desktopURL [description]
        * @param {String} mobileURL [description]
        */
        /**
         * Initialize function for view
         * @param  {String} desktopURL [description]
         * @param  {String} mobileURL  [description]
         * @return {void}
         */
        initialize2: function (desktopURL, mobileURL) {
            var channel = Radio.channel("ClickCounter");

            this.model = new ClickCounterModel(desktopURL, mobileURL);

            channel.on({
                "toolChanged": this.registerClick,
                "calcRoute": this.registerClick,
                "zoomChanged": this.registerClick,
                "layerVisibleChanged": this.registerClick,
                "gfi": this.registerClick
            }, this);

            // fired beim Öffnen der Seite
            this.registerClick();
        },
        registerLayerEvent: function (layertree) {
            // fired beim LayerChange, Info-Button, Einstellungen auf dem Layertree
            if (layertree.length > 0) {
                layertree.click(function () {
                    this.registerClick();
                }.bind(this));
            }
        },
        registerClick: function () {
            this.model.refreshIframe();
        }
    });

export default ClickCounterView;
