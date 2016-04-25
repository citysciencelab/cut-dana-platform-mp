define([
    "backbone",
    "eventbus"
], function (Backbone, EventBus) {
    "use strict";
    var Seite4Model = Backbone.Model.extend({
        defaults: {
            params: {},
            brwList: [],
            aktBRW: "",
            normBRW: "",
            nutzung: "",
            produkt: "",
            jahr: "",
            page: "",
            wpsWorkbenchnameBRW: "BRWUmrechnungHH",
            wpsWorkbenchnameIDAUmrechnung: "IDABerechnungHH"
        },
        initialize: function () {
            this.listenTo(this, "change:brwList", this.checkResponseReceived);

            EventBus.on("wps:response", this.handleBRWResponse, this), // Result von wpsWorkbenchnameBRW
            EventBus.on("wps:response", this.handleIDAResponse, this); // Result von wpsWorkbenchnameIDAUmrechnung
        },
        checkResponseReceived: function () {
            var brwList = this.get("brwList"),
                rr = _.pluck(brwList, "responseReceived"),
                every = _.every(rr, function (r) {
                    if (r === true) {
                        return true;
                    }
                });

            if (every === true) {
                this.requestIDA();
            }
        },
        /*
        * Ergänze alle Objekte um id
        */
        addId: function (obj) {
            _.each(obj, function (o) {
                var uniqueID = _.uniqueId("ida_");

                o = _.extend(o, {id: uniqueID});
                o = _.extend(o, {responseReceived: false});
                o = _.extend(o, {umgerechneterbrw: ""});
            });
            return obj;
        },
        /*
        * wird von View bei init gerufen
        */
        startCalculation: function () {
            var brwList = this.addId(this.get("brwList")),
                params = this.get("params"),
                STRL = _.has(params, "STRL") === true ? params.STRL : "",
                BAUW = _.has(params, "BAUW") === true ? params.BAUW : "",
                ZWGFZ = _.has(params, "WGFZ") === true ? parseFloat(params.WGFZ.replace(/,/, ".").trim()) : "",
                ZFLAE = _.has(params, "FLAE") === true ? parseFloat(params.FLAE.replace(/,/, ".").trim()) : "";

            this.set("brwList", brwList);
            _.each(brwList, function (brw) {
                switch (brw.art) {
                    case "Akt.BRW": {
                        this.requestBRW(brw, STRL, BAUW, ZWGFZ, ZFLAE);
                        break;
                    }
                    case "Norm.BRW": {
                        this.requestBRW(brw, "F", "eh", 1, 1000); // immer Frontlage, Einfamilienhaus, 1.0 und 1000m²
                        break;
                    }
                }
            }, this);
        },
        /*
        * stellt Requests zur Abfrage der einzelnen BRW zusammen
        */
        requestBRW: function (brw, STRL, BAUW, ZWGFZ, ZFLAE, id) {
            var stichtag = brw.stichtag.split("."),
                dataInputs = "<wps:DataInputs>",
                znuta = brw.ergnuta && brw.ergnuta !== "" ? brw.ergnuta : brw.nuta;

            dataInputs = this.concatStrings (dataInputs, this.returnBRWInputSnippet("ExtID", brw.id, "string")); // Externer Identifikator des WPS-Prozesses, wird mit ausgegeben.
            dataInputs = this.concatStrings (dataInputs, this.returnBRWInputSnippet("BRW", brw.brw, "float"));
            dataInputs = this.concatStrings (dataInputs, this.returnBRWInputSnippet("STAG", stichtag[2] + "-" + stichtag[1] + "-" + stichtag[0], "string"));
            dataInputs = this.concatStrings (dataInputs, this.returnBRWInputSnippet("ENTW", brw.entw, "string"));
            dataInputs = this.concatStrings (dataInputs, this.returnBRWInputSnippet("BEIT", brw.beit, "string"));
            dataInputs = this.concatStrings (dataInputs, this.returnBRWInputSnippet("NUTA", brw.nuta, "string"));
            dataInputs = this.concatStrings (dataInputs, this.returnBRWInputSnippet("ERGNUTA", brw.ergnuta, "string"));
            dataInputs = this.concatStrings (dataInputs, this.returnBRWInputSnippet("BAUW", brw.bauw, "string"));
            if (brw.wgfz !== "") {
                dataInputs = this.concatStrings (dataInputs, this.returnBRWInputSnippet("WGFZ", brw.wgfz, "float"));
            }
            if (brw.flae !== "") {
                dataInputs = this.concatStrings (dataInputs, this.returnBRWInputSnippet("FLAE", brw.flae, "float"));
            }
            dataInputs = this.concatStrings (dataInputs, this.returnBRWInputSnippet("ZENTW", brw.entw, "string"));
            dataInputs = this.concatStrings (dataInputs, this.returnBRWInputSnippet("ZBEIT", brw.beit, "string"));
            dataInputs = this.concatStrings (dataInputs, this.returnBRWInputSnippet("ZNUTA", znuta, "string"));
            dataInputs = this.concatStrings (dataInputs, this.returnBRWInputSnippet("ZBAUW", BAUW, "string"));
            if (ZWGFZ !== "") {
                dataInputs = this.concatStrings (dataInputs, this.returnBRWInputSnippet("ZWGFZ", ZWGFZ, "float"));
            }
            if (ZFLAE !== "") {
                dataInputs = this.concatStrings (dataInputs, this.returnBRWInputSnippet("ZFLAE", ZFLAE, "float"));
            }
            dataInputs = this.concatStrings (dataInputs, this.returnBRWInputSnippet("ZStrLage", STRL, "string"));
            if (brw.nWohnW !== "") {
                dataInputs = this.concatStrings (dataInputs, this.returnBRWInputSnippet("NWohnW", brw.nWohnW, "float"));
            }
            if (brw.nBueroW !== "") {
                dataInputs = this.concatStrings (dataInputs, this.returnBRWInputSnippet("NBueroW", brw.nBueroW, "float"));
            }
            if (brw.nLadenW !== "") {
                dataInputs = this.concatStrings (dataInputs, this.returnBRWInputSnippet("NLadenW", brw.nLadenW, "float"));
            }
            if (brw.egnutzung !== "") {
                dataInputs = this.concatStrings (dataInputs, this.returnBRWInputSnippet("EGNutzung", brw.egnutzung, "string"));
            }
            if (brw.eggfzAnt !== "") {
                dataInputs = this.concatStrings (dataInputs, this.returnBRWInputSnippet("EGGFZAnt", brw.eggfzAnt, "float"));
            }
            if (brw.egw !== "") {
                dataInputs = this.concatStrings (dataInputs, this.returnBRWInputSnippet("EGW", brw.egw, "float"));
            }
            if (brw.ignutzung !== "") {
                dataInputs = this.concatStrings (dataInputs, this.returnBRWInputSnippet("IGNutzung", brw.ignutzung, "string"));
            }
            if (brw.iggfzAnt !== "") {
                dataInputs = this.concatStrings (dataInputs, this.returnBRWInputSnippet("IGGFZAnt", brw.iggfzAnt, "float"));
            }
            if (brw.igw !== "") {
                dataInputs = this.concatStrings (dataInputs, this.returnBRWInputSnippet("IGW", brw.igw, "float"));
            }
            if (brw.zgnutzung !== "") {
                dataInputs = this.concatStrings (dataInputs, this.returnBRWInputSnippet("ZGNutzung", brw.zgnutzung, "string"));
            }
            if (brw.zggfzAnt !== "") {
                dataInputs = this.concatStrings (dataInputs, this.returnBRWInputSnippet("ZGGFZAnt", brw.zggfzAnt, "float"));
            }
            if (brw.zgw !== "") {
                dataInputs = this.concatStrings (dataInputs, this.returnBRWInputSnippet("ZGW", brw.zgw, "float"));
            }
            if (brw.ognutzung !== "") {
                dataInputs = this.concatStrings (dataInputs, this.returnBRWInputSnippet("OGNutzung", brw.ognutzung, "string"));
            }
            if (brw.oggfzAnt !== "") {
                dataInputs = this.concatStrings (dataInputs, this.returnBRWInputSnippet("OGGFZAnt", brw.oggfzAnt, "float"));
            }
            if (brw.ogw !== "") {
                dataInputs = this.concatStrings (dataInputs, this.returnBRWInputSnippet("OGW", brw.ogw, "float"));
            }
            dataInputs += "</wps:DataInputs>";
            EventBus.trigger("wps:request", {
                workbenchname: this.get("wpsWorkbenchnameBRW"),
                dataInputs: dataInputs
            });
        },
        /*
        * empfängt Teile der umgerechneten BRW (sowohl AktBRW als auch NormBRW)
        */
        handleBRWResponse: function (obj) {
            if (obj.request.workbenchname === this.get("wpsWorkbenchnameBRW")) {
                var brwList = this.get("brwList"),
                    aktbrwList = _.filter(brwList, {art: "Akt.BRW"}),
                    normBRWParams = _.values(_.filter(brwList, {art: "Norm.BRW"}))[0],
                    ergebnis = $(obj.data).find("wps\\:Ergebnis,Ergebnis"),
                    umgerechneterbrw = $(ergebnis).find("wps\\:brw,brw")[0].textContent,
                    error = $(ergebnis).find("wps\\:ErrorOccured,ErrorOccured")[0].textContent,
                    fehlertext = $(ergebnis).find("wps\\:Fehlermeldung,Fehlermeldung")[0].textContent,
                    parameter = $(obj.data).find("wps\\:parameter,parameter"),
                    id = $(parameter).attr("ExtID");

                if (error === "No") {
                    var brw = _.find(brwList, function (brw) {
                        return brw.id === id;
                    });
                    if (brw) {
                        brw.umgerechneterbrw = umgerechneterbrw;
                        brw.responseReceived = true;
                        this.unset("brwList", {silent: true});
                        this.set("brwList", brwList);
                    }
                }
            }
        },
        /*
        * stellt Request zur Abfrage von IDA-Werten zusammen
        */
        requestIDA: function () {
            var params = this.get("params"),
                dataInputs = "<wps:DataInputs>",
                BRWJSON = JSON.stringify(this.get("brwList"));

            this.set("BRWJSON", BRWJSON);
            dataInputs = this.concatStrings (dataInputs, this.returnIDAInputSnippet("nutzung", "string"));
            dataInputs = this.concatStrings (dataInputs, this.returnIDAInputSnippet("produkt", "string"));
            dataInputs += "<wps:Input>";
            dataInputs += "<ows:Identifier>DATU</ows:Identifier>";
            dataInputs += "<wps:Data>";
            dataInputs += "<wps:LiteralData dataType='string'>" + this.get("jahr") + "-07-01</wps:LiteralData>"; // immer 1. Juli des gewählten Jahres
            dataInputs += "</wps:Data>";
            dataInputs += "</wps:Input>";
            dataInputs = this.concatStrings (dataInputs, this.returnIDAInputSnippet("StadtteilName", "string"));
            dataInputs = this.concatStrings (dataInputs, this.returnIDAInputSnippet("WGFZ", "float"));
            dataInputs = this.concatStrings (dataInputs, this.returnIDAInputSnippet("FLAE", "float"));
            dataInputs = this.concatStrings (dataInputs, this.returnIDAInputSnippet("BAUW", "string"));
            dataInputs = this.concatStrings (dataInputs, this.returnIDAInputSnippet("STRL", "string"));
            dataInputs = this.concatStrings (dataInputs, this.returnIDAInputSnippet("GESL", "string"));
            dataInputs = this.concatStrings (dataInputs, this.returnIDAInputSnippet("BAUJ", "integer"));
            dataInputs = this.concatStrings (dataInputs, this.returnIDAInputSnippet("MODG", "integer"));
            dataInputs = this.concatStrings (dataInputs, this.returnIDAInputSnippet("WOFL", "float"));
            dataInputs = this.concatStrings (dataInputs, this.returnIDAInputSnippet("ZAWO", "integer"));
            dataInputs = this.concatStrings (dataInputs, this.returnIDAInputSnippet("GARI", "integer"));
            dataInputs = this.concatStrings (dataInputs, this.returnIDAInputSnippet("GARA", "integer"));
            dataInputs = this.concatStrings (dataInputs, this.returnIDAInputSnippet("STEA", "integer"));
            dataInputs = this.concatStrings (dataInputs, this.returnIDAInputSnippet("EGFL", "float"));
            dataInputs = this.concatStrings (dataInputs, this.returnIDAInputSnippet("OGFL", "float"));
            dataInputs = this.concatStrings (dataInputs, this.returnIDAInputSnippet("WONKM", "float"));
            dataInputs = this.concatStrings (dataInputs, this.returnIDAInputSnippet("SONKM", "float"));
            dataInputs = this.concatStrings (dataInputs, this.returnIDAInputSnippet("RLZ", "integer"));
            dataInputs = this.concatStrings (dataInputs, this.returnIDAInputSnippet("JEZ", "integer"));
            dataInputs = this.concatStrings (dataInputs, this.returnIDAInputSnippet("ENER", "float"));
            dataInputs = this.concatStrings (dataInputs, this.returnIDAInputSnippet("KELL", "boolean"));
            dataInputs = this.concatStrings (dataInputs, this.returnIDAInputSnippet("LIFT", "boolean"));
            dataInputs = this.concatStrings (dataInputs, this.returnIDAInputSnippet("STST", "integer"));
            dataInputs = this.concatStrings (dataInputs, this.returnIDAInputSnippet("FKWERT", "float"));
            dataInputs = this.concatStrings (dataInputs, this.returnIDAInputSnippet("SACH", "float"));
            dataInputs = this.concatStrings (dataInputs, this.returnIDAInputSnippet("BRWJSON", "string"));
            dataInputs += "</wps:DataInputs>";
            EventBus.trigger("wps:request", {
                workbenchname: this.get("wpsWorkbenchnameIDAUmrechnung"),
                dataInputs: dataInputs
            });
        },
        returnBRWInputSnippet: function (name, value, typ) {
            return "<wps:Input><ows:Identifier>" + name + "</ows:Identifier><wps:Data><wps:LiteralData dataType='" + typ + "'>" + value + "</wps:LiteralData></wps:Data></wps:Input>";
        },
        returnIDAInputSnippet: function (name, typ) {
            var params = this.get("params"),
                par = this.get(name);

            if (_.has(params, name) === true) {
                return "<wps:Input><ows:Identifier>" + name.toUpperCase() + "</ows:Identifier><wps:Data><wps:LiteralData dataType='" + typ + "'>" + _.values(_.pick(params, name))[0] + "</wps:LiteralData></wps:Data></wps:Input>";
            }
            else if (par) {
                return "<wps:Input><ows:Identifier>" + name.toUpperCase() + "</ows:Identifier><wps:Data><wps:LiteralData dataType='" + typ + "'>" + par + "</wps:LiteralData></wps:Data></wps:Input>";
            }
            else {
                return null;
            }
        },
        concatStrings: function (string, newString) {
            if (newString) {
                return string + newString;
            }
            else {
                return string;
            }
        },
        /*
        * Übergibt das Ergebnis an die View
        */
        handleIDAResponse: function (obj) {
            if (obj.request.workbenchname === this.get("wpsWorkbenchnameIDAUmrechnung")) {
                var result = $(obj.data).find("wps\\:ergebnis,ergebnis")[0].textContent,
                    error = $(obj.data).find("wps\\:error,error")[0].textContent,
                    params = $(obj.data).find("wps\\:eingabeparameter,eingabeparameter")[0],
                    html = "";

                this.set("result", result);
                this.set("error", error.replace(/\n/g, "<br>"));
                if (params.hasAttribute("NUTZUNG")) {
                    html += "</br>NUTZUNG " + params.getAttribute("NUTZUNG");
                }
                if (params.hasAttribute("PRODUKT")) {
                    html += "</br>PRODUKT " + params.getAttribute("PRODUKT");
                }
                if (params.hasAttribute("DATU")) {
                    html += "</br>DATU " + params.getAttribute("DATU");
                }
                if (params.hasAttribute("STADTTEILNAME")) {
                    html += "</br>STADTTEILNAME " + params.getAttribute("STADTTEILNAME");
                }
                if (params.hasAttribute("NORMBRW")) {
                    html += "</br>NORMBRW " + params.getAttribute("NORMBRW");
                }
                if (params.hasAttribute("AKTBRW")) {
                    html += "</br>AKTBRW " + params.getAttribute("AKTBRW");
                }
                if (params.hasAttribute("WGFZ")) {
                    html += "</br>WGFZ " + params.getAttribute("WGFZ");
                }
                if (params.hasAttribute("FLAE")) {
                    html += "</br>FLAE " + params.getAttribute("FLAE");
                }
                if (params.hasAttribute("BAUW")) {
                    html += "</br>BAUW " + params.getAttribute("BAUW");
                }
                if (params.hasAttribute("STRL")) {
                    html += "</br>STRL " + params.getAttribute("STRL");
                }
                if (params.hasAttribute("GESL")) {
                    html += "</br>GESL " + params.getAttribute("GESL");
                }
                if (params.hasAttribute("BAUJ")) {
                    html += "</br>BAUJ " + params.getAttribute("BAUJ");
                }
                if (params.hasAttribute("MODG")) {
                    html += "</br>MODG " + params.getAttribute("MODG");
                }
                if (params.hasAttribute("WOFL")) {
                    html += "</br>WOFL " + params.getAttribute("WOFL");
                }
                if (params.hasAttribute("ZAWO")) {
                    html += "</br>ZAWO " + params.getAttribute("ZAWO");
                }
                if (params.hasAttribute("GARI")) {
                    html += "</br>GARI " + params.getAttribute("GARI");
                }
                if (params.hasAttribute("GARA")) {
                    html += "</br>GARA " + params.getAttribute("GARA");
                }
                if (params.hasAttribute("STEA")) {
                    html += "</br>STEA " + params.getAttribute("STEA");
                }
                if (params.hasAttribute("EGFL")) {
                    html += "</br>EGFL " + params.getAttribute("EGFL");
                }
                if (params.hasAttribute("OGFL")) {
                    html += "</br>OGFL " + params.getAttribute("OGFL");
                }
                if (params.hasAttribute("WONKM")) {
                    html += "</br>WONKM " + params.getAttribute("WONKM");
                }
                if (params.hasAttribute("SONKM")) {
                    html += "</br>SONKM " + params.getAttribute("SONKM");
                }
                if (params.hasAttribute("RLZ")) {
                    html += "</br>RLZ " + params.getAttribute("RLZ");
                }
                if (params.hasAttribute("JEZ")) {
                    html += "</br>JEZ " + params.getAttribute("JEZ");
                }
                if (params.hasAttribute("STST")) {
                    html += "</br>STST " + params.getAttribute("STST");
                }
                if (params.hasAttribute("FKWERT")) {
                    html += "</br>FKWERT " + params.getAttribute("FKWERT");
                }
                if (params.hasAttribute("SACH")) {
                    html += "</br>SACH " + params.getAttribute("SACH");
                }
                if (params.hasAttribute("ENER")) {
                    html += "</br>ENER " + params.getAttribute("ENER");
                }
                if (params.hasAttribute("KELL")) {
                    html += "</br>KELL " + params.getAttribute("KELL");
                }
                if (params.hasAttribute("LIFT")) {
                    html += "</br>LIFT " + params.getAttribute("LIFT");
                }
                if (params.hasAttribute("EBK")) {
                    html += "</br>EBK " + params.getAttribute("EBK");
                }
                this.set("parameter", html);
            }
        }
    });

    return new Seite4Model();
});
