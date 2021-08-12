import {expect} from "chai";
import convert from "../../../parametricUrl/converter";
import * as crs from "masterportalAPI/src/crs";

const namedProjections = [
    ["EPSG:31467", "+title=Bessel/Gauß-Krüger 3 +proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=3500000 +y_0=0 +ellps=bessel +datum=potsdam +units=m +no_defs"],
    ["EPSG:25832", "+title=ETRS89/UTM 32N +proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],
    ["EPSG:8395", "+title=ETRS89/Gauß-Krüger 3 +proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=3500000 +y_0=0 +ellps=GRS80 +datum=GRS80 +units=m +no_defs"],
    ["EPSG:4326", "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs"]
];

describe("src/utils/converter.js", () => {
    describe("convert", () => {
        it("convert String  to boolean", () => {
            expect(convert("false")).to.be.equals(false);
            expect(convert("FAlse")).to.be.equals(false);
            expect(convert("false   ")).to.be.equals(false);
            expect(convert("  false")).to.be.equals(false);
            expect(convert(false)).to.be.equals(false);

            expect(convert("true")).to.be.equals(true);
            expect(convert("True")).to.be.equals(true);
            expect(convert("true   ")).to.be.equals(true);
            expect(convert("  true")).to.be.equals(true);
            expect(convert("")).to.be.equals(true);
            expect(convert(true)).to.be.equals(true);

            expect(convert(null)).to.be.equals(false);
            expect(convert(undefined)).to.be.equals(false);
            expect(convert("nix")).to.be.equals("nix");
        });

    });
    it("convert 2 numbers as String or String[] to Array with numbers", () => {
        expect(convert("[]")).to.be.deep.equals([]);
        expect(convert("[553925,5931898]")).to.be.deep.equals([553925, 5931898]);
        expect(convert("553925,5931898")).to.be.deep.equals([553925, 5931898]);
        expect(convert(",5931898")).to.be.deep.equals(["", 5931898]);
        expect(convert(",")).to.be.deep.equals(["", ""]);
    });
    it("convert an EPSG code to a projection", () => {
        crs.registerProjections(namedProjections);

        expect(convert("EPSG:4326").name).to.be.equals("EPSG:4326");
        expect(convert("EPSG:25832").name).to.be.equals("EPSG:25832");
    });

});
