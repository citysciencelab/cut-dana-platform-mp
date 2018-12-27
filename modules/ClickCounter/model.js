/**
 * @namespace ClickCounter
 */
const ClickCounterModel = Backbone.Model.extend(
/** @lends ClickCounterModel.prototype */
    {
        /**
        * @class ClickCounterModel
        * @memberof ClickCounter
        * @extends Backbone.Model
        * @constructs
        * @param {String} countframeid [description]
        * @param {String} usedURL [description]
        * @param {String} desktopURL [description]
        * @param {String} mobileURL [description]
        */
        defaults: {
            countframeid: _.uniqueId("countframe"),
            usedURL: "", // beutzte iFrame-URL, kann desktop oder mobile sein
            desktopURL: "", // URL die verwendet wird, wenn nicht mobile
            mobileURL: "" // URL die verwendet wird, wenn mobile
        },
        /**
         * Initialize function for model
         * @param  {String} desktopURL [description]
         * @param  {String} mobileURL  [description]
         * @return {void}
         */
        initialize: function (desktopURL, mobileURL) {
            var isMobile = Radio.request("Util", "isViewMobile"),
                usedURL = isMobile === true ? mobileURL : desktopURL;

            this.set("desktopURL", desktopURL);

            this.set("mobileURL", mobileURL);

            this.set("usedURL", usedURL);

            this.listenTo(Radio.channel("Util"), {
                "isViewMobileChanged": this.updateURL
            });
            // Erzeuge iFrame
            $("<iframe style='display:none' src='" + this.get("usedURL") + "' id='" + this.get("countframeid") + "' width='0' height='0' frameborder='0'/>").appendTo("body");
        },
        updateURL: function (isMobile) {
            var usedURL;

            if (isMobile) {
                usedURL = this.get("mobileURL");
            }
            else {
                usedURL = this.get("desktopURL");
            }
            this.set("usedURL", usedURL);
        },
        refreshIframe: function () {
            var id = this.get("countframeid"),
                url = this.get("usedURL");

            $("#" + id).attr("src", url);
        }
    });

export default ClickCounterModel;
