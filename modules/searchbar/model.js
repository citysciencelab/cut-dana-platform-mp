define([
    "backbone",
    "eventbus"
    ], function (Backbone, EventBus) {
    "use strict";
    var SearchbarModel = Backbone.Model.extend({
        defaults: {
            placeholder: "Suche",
            recommandedListLength: 5,
            quickHelp: false,
            searchString: "", // der aktuelle String in der Suchmaske
            hitList: [],
            isHitListReady: true
        },
        /**
        *
        */
        initialize: function () {
            EventBus.on("createRecommendedList", this.createRecommendedList, this);

            EventBus.on("searchbar:pushHits", this.pushHits, this);
        },

        /**
        * aus View gaufgerufen
        */
        setSearchString: function (value) {
            this.set("searchString", value);
            this.set("hitList", []);
            EventBus.trigger("searchbar:search", this.get("searchString"));
        },
        /**
         * Hilfsmethode um ein Attribut vom Typ Array zu setzen.
         * {String} attribute - Das Attribut das gesetzt werden soll
         * {whatever} value - Der Wert des Attributs
         */
        pushHits: function (attribute, value) {
            var tempArray = _.clone(this.get(attribute));

            tempArray.push(value);
            this.set(attribute, _.flatten(tempArray));
        },
        /**
        *
        */
        createRecommendedList: function () {
            var max = this.get("recommandedListLength");

            if (this.get("hitList").length > 0 && this.get("isHitListReady") === true) {
                this.set("isHitListReady", false);
                if (this.get("hitList").length > max) {
                    var hitList = this.get("hitList"),
                        foundTypes = [],
                        singleTypes = _.reject(hitList, function (hit) {
                            if (_.contains(foundTypes, hit.type) === true || foundTypes.length === max) {
                                return true;
                            }
                            else {
                                foundTypes.push(hit.type);
                            }
                        }),
                        usedNumbers = [],
                        randomNumber;

                    while (singleTypes.length < max) {
                        randomNumber = _.random(0, hitList.length - 1);
                        if (_.contains(usedNumbers, randomNumber) === false) {
                            singleTypes.push(hitList[randomNumber]);
                            usedNumbers.push(randomNumber);
                        }
                    }
                    this.set("recommendedList", singleTypes);
                }
                else {
                    this.set("recommendedList", this.get("hitList"));
                }
                this.set("isHitListReady", true);
            }
        }
    });

    return new SearchbarModel();
});
