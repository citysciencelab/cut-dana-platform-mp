<script>
import Feature from "ol/Feature.js";
import StylePolygon from "@masterportal/masterportalapi/src/vectorStyle/styles/polygon/stylePolygon";
import {createNominalCircleSegments} from "@masterportal/masterportalapi/src/vectorStyle/styles/point/stylePointNominal";
import {createSVGStyle} from "@masterportal/masterportalapi/src/vectorStyle/styles/point/stylePointIcon";
import {mapActions, mapGetters, mapMutations} from "vuex";
import getters from "../store/gettersLegend";
import mutations from "../store/mutationsLegend";
import actions from "../store/actionsLegend";
import LegendSingleLayer from "./LegendSingleLayer.vue";
import {convertColor} from "../../../utils/convertColor";
import {getComponent} from "../../../utils/getComponent";
import BasicDragHandle from "../../../share-components/BasicDragHandle.vue";

export default {
    name: "LegendWindow",
    components: {
        LegendSingleLayer,
        BasicDragHandle
    },
    computed: {
        ...mapGetters("Legend", Object.keys(getters)),
        ...mapGetters(["mobile", "uiStyle"])
    },
    watch: {
        /**
         * Closes the mobile menu and create the legend.
         * @param {Boolean} showLegend Should be show the legend.
         * @returns {void}
         */
        showLegend (showLegend) {
            if (showLegend) {
                document.getElementsByClassName("navbar-collapse")[0].classList.remove("show");
                this.createLegend();
                // focus to first element
                this.$nextTick(() => {
                    if (this.$refs["close-icon"]) {
                        this.$refs["close-icon"].focus();
                    }
                });
            }
        },
        layerCounterIdForLayerInfo (layerCounterIdForLayerInfo) {
            if (layerCounterIdForLayerInfo) {
                this.createLegendForLayerInfo(this.layerIdForLayerInfo);
            }
        },
        legendOnChanged (legend) {
            if (legend) {
                this.createLegend();
                if (this.layerIdForLayerInfo) {
                    this.createLegendForLayerInfo(this.layerIdForLayerInfo);
                }
            }
        }
    },
    created () {
        this.listenToLayerVisibilityChanged();
        this.listenToUpdatedSelectedLayerList();
        this.listenToLayerLegendUpdate();
    },
    mounted () {
        this.getLegendConfig();
    },
    methods: {
        ...mapActions("Legend", Object.keys(actions)),
        ...mapMutations("Legend", Object.keys(mutations)),

        /**
         * Creates the legend.
         * @returns {void}
         */
        createLegend () {
            const visibleLayers = this.getVisibleLayers();

            visibleLayers.forEach(layer => this.toggleLayerInLegend(layer));
        },

        /**
         * Creates the legend for the layer info.
         * @param {String} layerIdForLayerInfo Id of layer to create the layer info legend.
         * @returns {void}
         */
        createLegendForLayerInfo (layerIdForLayerInfo) {
            const layerForLayerInfo = Radio.request("ModelList", "getModelByAttributes", {type: "layer", id: layerIdForLayerInfo});
            let legendObj = null,
                isValidLegend = null,
                legend = null;

            if (layerForLayerInfo) {
                if (layerForLayerInfo.get("typ") === "GROUP") {
                    legend = this.prepareLegendForGroupLayer(layerForLayerInfo.get("layerSource"));
                }
                else {
                    legend = this.prepareLegend(layerForLayerInfo.get("legend"));
                }

                legendObj = {
                    id: layerForLayerInfo.get("id"),
                    name: layerForLayerInfo.get("name"),
                    legend,
                    position: layerForLayerInfo.get("selectionIDX")
                };

                isValidLegend = this.isValidLegendObj(legendObj);
                if (isValidLegend) {
                    this.setLegendForLayerInfo(legendObj);
                }
            }
        },

        /**
         * Listens to changed layer visibility
         * @returns {void}
         */
        listenToLayerVisibilityChanged () {
            Backbone.Events.listenTo(Radio.channel("Layer"), {
                "layerVisibleChanged": (id, isVisibleInMap, layer) => {
                    this.toggleLayerInLegend(layer);
                }
            });
        },

        /**
         * Listens to updated selectedLayerList
         * @returns {void}
         */
        listenToUpdatedSelectedLayerList () {
            Backbone.Events.listenTo(Radio.channel("ModelList"), {
                "updatedSelectedLayerList": (layers) => {
                    layers.forEach(layer => this.toggleLayerInLegend(layer));
                }
            });
        },

        /**
         * Listens to changed layer legend
         * @returns {void}
         */
        listenToLayerLegendUpdate () {
            Backbone.Events.listenTo(Radio.channel("LegendComponent"), {
                "updateLegend": () => {
                    this.createLegend();
                }
            });
        },
        /**
         * Closes the legend.
         * @param {Event} event - the DOM event
         * @returns {void}
         */
        closeLegend (event) {
            if (event.type === "click" || event.which === 32 || event.which === 13) {
                const model = getComponent(this.id);

                this.setShowLegend(!this.showLegend);

                if (model) {
                    model.set("isActive", false);
                }
            }
        },

        /**
         * Retrieves the visible Layers from the ModelList
         * @returns {Object[]} - all Layer that are visible
         */
        getVisibleLayers () {
            return Radio.request("ModelList", "getModelsByAttributes", {type: "layer", isVisibleInMap: true});
        },

        /**
         * Generates or removed the layers legend object.
         * @param {Object} layer layer.
         * @returns {void}
         */
        toggleLayerInLegend (layer) {
            const isVisibleInMap = layer.get("isVisibleInMap"),
                layerId = layer.get("id"),
                layerName = layer.get("name"),
                layerLegend = layer.get("legend"),
                layerSelectionIDX = layer.get("selectionIDX"),
                layerTyp = layer.get("typ");

            if (isVisibleInMap) {
                if (layerTyp === "GROUP") {
                    this.generateLegendForGroupLayer(layer);
                }
                else {
                    this.generateLegend(layerId, layerName, layerLegend, layerSelectionIDX);
                }
            }
            else {
                this.removeLegend(layerId);
            }
        },

        /**
         * Prepares the legend with the given legendInfos
         * @param {ol/Layer/Group} groupLayer grouplayer.
         * @returns {Object[]} - the prepared legend.
         */
        generateLegendForGroupLayer (groupLayer) {
            const id = groupLayer.get("id"),
                legendObj = {
                    id: id,
                    name: groupLayer.get("name"),
                    legend: this.prepareLegendForGroupLayer(groupLayer.get("layerSource")),
                    position: groupLayer.get("selectionIDX")
                },
                isValidLegend = this.isValidLegendObj(legendObj),
                isNotYetInLegend = isValidLegend && this.isLayerNotYetInLegend(id),
                isLegendChanged = isValidLegend && !isNotYetInLegend && this.isLegendChanged(id, legendObj);

            if (isNotYetInLegend) {
                this.addLegend(legendObj);
            }
            else if (isLegendChanged) {
                this.removeLegend(id);
                this.addLegend(legendObj);
            }
            this.sortLegend();
        },

        /**
         * Prepares the legend array for a grouplayer by iterating over its layers and generating the legend of each child.
         * @param {ol/Layer/Source} layerSource Layer sources of group layer.
         * @returns {Object[]} - merged Legends.
         */
        prepareLegendForGroupLayer (layerSource) {
            let legends = [];

            layerSource.forEach(layer => {
                legends.push(this.prepareLegend(layer.get("legend")));
            });
            // legends = legends.flat(); does not work in unittest and older browser versions
            legends = [].concat(...legends);
            return legends;
        },

        /**
         * Generates the legend object and adds it to the legend array in the store.
         * @param {String} id Id of layer.
         * @param {String} name Name of layer.
         * @param {Object[]} legend Legend of layer.
         * @param {Number} selectionIDX SelectionIDX of layer.
         * @returns {void}
         */
        generateLegend (id, name, legend, selectionIDX) {
            const legendObj = {
                    id: id,
                    name: name,
                    legend: this.prepareLegend(legend),
                    position: selectionIDX
                },
                isValidLegend = this.isValidLegendObj(legendObj),
                isNotYetInLegend = isValidLegend && this.isLayerNotYetInLegend(id),
                isLegendChanged = isValidLegend && !isNotYetInLegend && this.isLegendChanged(id, legendObj);

            if (isNotYetInLegend) {
                this.addLegend(legendObj);
            }
            else if (isLegendChanged) {
                this.removeLegend(id);
                this.addLegend(legendObj);
            }
            this.sortLegend();
        },

        /**
         * Prepares the legend with the given legendInfos
         * @param {*[]} legendInfos legend Infos of layer
         * @returns {Object[]} - the prepared legend.
         */
        prepareLegend (legendInfos) {
            let preparedLegend = [];

            if (Array.isArray(legendInfos) && legendInfos.every(value => typeof value === "string") && legendInfos.length > 0) {
                preparedLegend = legendInfos;
            }
            else if (Array.isArray(legendInfos)) {
                legendInfos.forEach(legendInfo => {
                    const geometryType = legendInfo.geometryType,
                        name = legendInfo.label,
                        style = legendInfo.styleObject;
                    let legendObj = {
                        name
                    };

                    if (geometryType) {
                        if (geometryType === "Point") {
                            legendObj = this.prepareLegendForPoint(legendObj, style);
                        }
                        else if (geometryType === "LineString") {
                            legendObj = this.prepareLegendForLineString(legendObj, style);
                        }
                        else if (geometryType === "Polygon") {
                            legendObj = this.prepareLegendForPolygon(legendObj, style);
                        }
                        else if (geometryType === "Cesium") {
                            legendObj.name = this.prepareNameForCesium(style);
                            legendObj = this.prepareLegendForCesium(legendObj, style);
                        }
                    }
                    /** Style WMS */
                    else if (legendInfo?.name && legendInfo?.graphic) {
                        legendObj = legendInfo;
                    }
                    if (Array.isArray(legendObj)) {
                        legendObj.forEach(obj => {
                            preparedLegend.push(obj);
                        });
                    }
                    else {
                        preparedLegend.push(legendObj);
                    }
                });

            }
            return preparedLegend;
        },

        /**
         * Prepares the legend for point style.
         * @param {Object} legendObj The legend object.
         * @param {Object} style The styleObject.
         * @returns {Object} - prepared legendObj.
         */
        prepareLegendForPoint (legendObj, style) {
            const imgPath = style.imagePath,
                type = style.type ? style.type.toLowerCase() : style.attributes.type.toLowerCase(),
                imageName = style.imageName;
            let newLegendObj = legendObj;

            if (type === "icon") {
                newLegendObj.graphic = imgPath + imageName;
            }
            else if (type === "circle") {
                newLegendObj.graphic = this.drawCircleStyle(style);
            }
            else if (type === "interval") {
                newLegendObj.graphic = this.drawIntervalStyle(style);
            }
            else if (type === "nominal") {
                newLegendObj = this.drawNominalStyle(style);
            }
            return newLegendObj;
        },

        /**
         * Creates interval scaled advanced style for pointFeatures
         * @param {Object} style The styleObject.
         * @return {ol.Style} style
         */
        drawIntervalStyle (style) {
            const scalingShape = style.scalingShape,
                scalingAttribute = style.scalingAttribute;
            let intervalStyle = [];

            if (scalingShape === "CIRCLE_BAR") {
                intervalStyle = this.drawIntervalCircleBars(scalingAttribute, style);
            }

            return intervalStyle;
        },

        /**
         * Creates nominal scaled advanced style for pointFeatures
         * @param {Object} styleObject The styleObject.
         * @return {ol.Style} style
         */
        drawNominalStyle (styleObject) {
            const scalingShape = styleObject.attributes.scalingShape.toLowerCase();
            let nominalStyle = [];

            if (scalingShape === "circlesegments") {
                nominalStyle = this.drawNominalCircleSegments(styleObject);
            }

            return nominalStyle;
        },
        /**
         * Creats an SVG for nominal circle segment style.
         * @param {ol.style} styleObject The styleObject.
         * @returns {Array} - style as Array of objects.
         */
        drawNominalCircleSegments: function (styleObject) {
            const scalingAttribute = styleObject.attributes.scalingAttribute,
                scalingValues = styleObject.attributes.scalingValues,
                nominalCircleSegments = [];

            Object.keys(scalingValues).forEach(key => {
                const olFeature = new Feature(),
                    imageScale = styleObject.attributes.imageScale;
                let svg,
                    svgSize,
                    image,
                    imageSize,
                    imageSizeWithScale,
                    svgPath;

                olFeature.set(scalingAttribute, key);

                if (Array.isArray(styleObject.style)) {
                    svgPath = createNominalCircleSegments(olFeature, styleObject.attributes);
                    svg = createSVGStyle(svgPath, 5).getImage().getSrc();
                    svgSize = styleObject.style[0].getImage().getSize();
                    image = styleObject.style[1].getImage().getSrc();
                    imageSize = [Math.round(svgSize[0] * 1.04), Math.round(svgSize[1] * 1.04)];
                    imageSizeWithScale = [imageSize[0] * imageScale, imageSize[1] * imageScale];

                    nominalCircleSegments.push({
                        name: key,
                        graphic: [svg, image],
                        iconSize: imageSizeWithScale,
                        iconSizeDifferenz: Math.abs((imageSize[0] * imageScale - svgSize[0]) / 2)
                    });
                }
                else {
                    nominalCircleSegments.push({
                        name: key,
                        graphic: styleObject.style.getImage().getSrc()
                    });
                }
            });

            return nominalCircleSegments;
        },

        /**
         * Creats an SVG for interval circle bar style.
         * @param {String} scalingAttribute attribute that contains the values of a feature
         * @param {ol.style} style style
         * @returns {String} - style as svg
         */
        drawIntervalCircleBars: function (scalingAttribute, style) {
            const olFeature = new Feature(),
                circleBarScalingFactor = style.circleBarScalingFactor,
                barHeight = String(20 / circleBarScalingFactor),
                clonedStyle = style.clone(),
                intervalCircleBar = clonedStyle.getStyle().getImage().getSrc();

            olFeature.set(scalingAttribute, barHeight);
            clonedStyle.setFeature(olFeature);
            clonedStyle.setIsClustered(false);

            return intervalCircleBar;
        },

        /**
         * Creates an SVG for a circle style.
         * @param   {vectorStyle} style feature styles
         * @returns {string} svg
         */
        drawCircleStyle: function (style) {
            const circleStrokeColor = style.circleStrokeColor ? convertColor(style.circleStrokeColor, "rgbString") : "black",
                circleStrokeOpacity = style.circleStrokeColor[3] || 0,
                circleStrokeWidth = style.circleStrokeWidth,
                circleFillColor = style.circleFillColor ? convertColor(style.circleFillColor, "rgbString") : "black",
                circleFillOpacity = style.circleFillColor[3] || 0,
                circleRadius = style.circleRadius,
                widthAndHeight = (circleRadius + 1.5) * 2;
            let svg = "data:image/svg+xml;charset=utf-8,";

            svg += "<svg height='" + widthAndHeight + "' width='" + widthAndHeight + "' version='1.1' xmlns='http://www.w3.org/2000/svg'>";
            svg += "<circle cx='" + widthAndHeight / 2 + "' cy='" + widthAndHeight / 2 + "' r='" + circleRadius + "' stroke='";
            svg += circleStrokeColor;
            svg += "' stroke-opacity='";
            svg += circleStrokeOpacity;
            svg += "' stroke-width='";
            svg += circleStrokeWidth;
            svg += "' fill='";
            svg += circleFillColor;
            svg += "' fill-opacity='";
            svg += circleFillOpacity;
            svg += "'/>";
            svg += "</svg>";

            return svg;
        },

        /**
         * Prepares the legend for linestring style.
         * @param {Object} legendObj The legend object.
         * @param {Object} style The styleObject.
         * @returns {Object} - prepared legendObj.
         */
        prepareLegendForLineString (legendObj, style) {
            const strokeColor = style.lineStrokeColor ? convertColor(style.lineStrokeColor, "rgbString") : "black",
                strokeWidth = style.lineStrokeWidth,
                strokeOpacity = style.lineStrokeColor[3] || 0,
                strokeDash = style.lineStrokeDash ? style.lineStrokeDash.join(" ") : undefined;
            let svg = "data:image/svg+xml;charset=utf-8,";

            svg += "<svg height='35' width='35' version='1.1' xmlns='http://www.w3.org/2000/svg'>";
            svg += "<path d='M 05 30 L 30 05' stroke='";
            svg += strokeColor;
            svg += "' stroke-opacity='";
            svg += strokeOpacity;
            svg += "' stroke-width='";
            svg += strokeWidth;
            if (strokeDash) {
                svg += "' stroke-dasharray='";
                svg += strokeDash;
            }
            svg += "' fill='none'/>";
            svg += "</svg>";

            legendObj.graphic = svg;
            return legendObj;
        },

        /**
         * Prepares the legend for polygon style.
         * @param {Object} legendObj The legend object.
         * @param {Object} style The styleObject.
         * @returns {Object} - prepare legendObj
         */
        prepareLegendForPolygon (legendObj, style) {
            const fillColor = style.polygonFillColor ? convertColor(style.polygonFillColor, "rgbString") : "black",
                strokeColor = style.polygonStrokeColor ? convertColor(style.polygonStrokeColor, "rgbString") : "black",
                strokeWidth = style.polygonStrokeWidth,
                fillOpacity = style.polygonFillColor?.[3] || 0,
                fillHatch = style.polygonFillHatch,
                strokeOpacity = style.polygonStrokeColor[3] || 0,
                strokeCap = style.polygonStrokeCap || "round",
                strokeDash = style.polygonStrokeDash?.toString() || "";

            if (fillHatch) {
                legendObj.graphic = StylePolygon.prototype.getPolygonFillHatchLegendDataUrl(style);
            }
            else {
                let svg = "data:image/svg+xml;charset=utf-8,";

                svg += "<svg height='35' width='35' version='1.1' xmlns='http://www.w3.org/2000/svg'>";
                svg += "<polygon points='5,5 30,5 30,30 5,30' style='fill:";
                svg += fillColor;
                svg += ";fill-opacity:";
                svg += fillOpacity;
                svg += ";stroke:";
                svg += strokeColor;
                svg += ";stroke-opacity:";
                svg += strokeOpacity;
                svg += ";stroke-width:";
                svg += strokeWidth;
                svg += ";stroke-linecap:";
                svg += strokeCap;
                svg += ";stroke-dasharray:";
                svg += strokeDash;
                svg += ";'/>";
                svg += "</svg>";

                legendObj.graphic = svg;
            }

            return legendObj;
        },

        /**
         * Prepares the legend for cesium style.
         * @param {Object} legendObj The legend object.
         * @param {Object} style The styleObject.
         * @returns {Object} - prepare legendObj
         */
        prepareLegendForCesium (legendObj, style) {
            const color = style.style ? style.style.color : "black";
            let svg = "data:image/svg+xml;charset=utf-8,";

            svg += "<svg height='35' width='35' version='1.1' xmlns='http://www.w3.org/2000/svg'>";
            svg += "<polygon points='5,5 30,5 30,30 5,30' style='fill:";
            svg += color;
            svg += ";fill-opacity:";
            svg += 1;
            svg += ";stroke:";
            svg += color;
            svg += ";stroke-opacity:";
            svg += 1;
            svg += ";stroke-width:";
            svg += 1;
            svg += ";'/>";
            svg += "</svg>";

            legendObj.graphic = svg;
            return legendObj;
        },

        /**
         * Creates the Name for Cesium
         * @param {Object} style Style.
         * @returns {String} - prepared name
        */
        prepareNameForCesium: function (style) {
            const conditions = style.conditions;
            let name = "";

            if (conditions) {
                Object.keys(conditions).forEach(attribute => {
                    const value = style.conditions[attribute];

                    name += value;
                });
            }

            return name;
        },

        /**
        * Checks if given layerid is not yet in the legend.
        * @param {String} layerId Id of layer.
        * @returns {Boolean} - Flag if layer is not yet in the legend
        */
        isLayerNotYetInLegend (layerId) {
            return this.legends.filter((legendObj) => {
                return legendObj.id === layerId;
            }).length === 0;
        },

        /**
         * Checks if the legend object of the layer has changed
         * @param {String} layerId Id of layer
         * @param {Object} legendObj The legend object to be checked.
         * @returns {Boolean} - Flag if the legendObject has changed
         */
        isLegendChanged (layerId, legendObj) {
            let isLegendChanged = false;
            const layerLegend = this.legends.filter((legend) => {
                return legend.id === layerId;
            })[0];

            if (encodeURIComponent(JSON.stringify(layerLegend)) !== encodeURIComponent(JSON.stringify(legendObj))) {
                isLegendChanged = true;
            }

            return isLegendChanged;
        },

        /**
         * Checks if the given legend object is valid.
         * @param {Object} legendObj The legend object to be checked.
         * @returns {Boolean} - Flag if legendObject is valid.
         */
        isValidLegendObj (legendObj) {
            const legend = legendObj.legend,
                position = legendObj.position;
            let isValid = true;

            if (position < 0) {
                isValid = false;
            }
            if (typeof legend === "boolean" || !legend) {
                isValid = false;
            }
            if (Array.isArray(legend) && legend.length === 0) {
                isValid = false;
            }
            return isValid;
        },

        /**
         * Generates an id using the layername and replacing all non alphanumerics with an underscore.
         * @param {String} layerName The name of the layer.
         * @returns {String} - An id consisting of the alphanumeric layername.
         */
        generateId (layerName) {
            return layerName ? "legend_" + layerName.replace(/[\W_]+/g, "_") : undefined;
        },

        /**
         * Toggles the layer legends.
         * @param {Event} evt Click event.
         * @returns {void}
         */
        toggleCollapseAll (evt) {
            if (evt.type === "click" || evt.which === 32 || evt.which === 13) {

                const element = evt.currentTarget,
                    iconElement = element.querySelector("i"),
                    hasArrowUp = iconElement.className.includes("bi-arrow-up");

                if (hasArrowUp) {
                    this.collapseAllLegends();
                    iconElement.classList.remove("bi-arrow-up");
                    iconElement.classList.add("bi-arrow-down");
                }
                else {
                    this.expandAllLegends();
                    iconElement.classList.remove("bi-arrow-down");
                    iconElement.classList.add("bi-arrow-up");
                }
            }
        },

        /**
         * Collapses all layer legends
         * @returns {void}
         */
        collapseAllLegends () {
            this.legends.forEach(legendObj => {
                const id = this.generateId(legendObj.name),
                    layerLegendElement = document.getElementById(id),
                    layerTitleElement = layerLegendElement.parentElement.firstChild;

                layerTitleElement.classList.add("collapsed");
                layerLegendElement.classList.remove("show");
            });
        },

        /**
         * Expands all layer legends
         * @returns {void}
         */
        expandAllLegends () {
            this.legends.forEach(legendObj => {
                const id = this.generateId(legendObj.name),
                    layerLegendElement = document.getElementById(id),
                    layerTitleElement = layerLegendElement.parentElement.firstChild;

                layerTitleElement.classList.remove("collapsed");
                layerLegendElement.classList.add("show");
                layerLegendElement.removeAttribute("style");
            });
        }
    }
};
</script>

<template>
    <div
        id="legend"
        :class="mobile ? 'legend-mobile' : 'legend'"
    >
        <div
            v-if="showLegend"
            :class="mobile ? 'legend-window-mobile' : (uiStyle === 'TABLE' ? 'legend-window-table': 'legend-window')"
        >
            <BasicDragHandle
                target-sel="#legend"
                :margin-bottom="100"
            >
                <div
                    :class="uiStyle === 'TABLE' ? 'legend-title-table': 'legend-title'"
                    class="row py-3 d-flex align-items-center"
                >
                    <span class="bootstrap-icon d-md-none d-lg-inline-block col-2">
                        <i :class="icon" />
                    </span>
                    <h2 class="title col-5 px-0 pt-1 pb-0">
                        {{ $t(name) }}
                    </h2>
                    <div class="col-5 d-flex justify-content-end">
                        <span
                            v-if="showCollapseAllButton"
                            ref="collapse-all-icon"
                            class="bootstrap-icon toggle-collapse-all legend"
                            :title="$t('common:modules.legend.toggleCollapseAll')"
                            role="button"
                            tabindex="0"
                            @click="toggleCollapseAll($event)"
                            @keydown="toggleCollapseAll($event)"
                        >
                            <i class="bi-arrow-up" />
                        </span>
                        <span
                            ref="close-icon"
                            class="bootstrap-icon close-legend"
                            role="button"
                            tabindex="0"
                            @click="closeLegend($event)"
                            @keydown="closeLegend($event)"
                        >
                            <i class="bi-x-lg" />
                        </span>
                    </div>
                </div>
            </BasicDragHandle>
            <div class="legend-content">
                <div
                    v-for="legendObj in legends"
                    :key="legendObj.name"
                    class="layer card"
                >
                    <div
                        class="layer-title card-header"
                        data-bs-toggle="collapse"
                        :data-bs-target="'#' + generateId(legendObj.name)"
                    >
                        <span>{{ legendObj.name }}</span>
                    </div>
                    <LegendSingleLayer
                        :id="generateId(legendObj.name)"
                        :legend-obj="legendObj"
                        :render-to-id="''"
                    />
                </div>
            </div>
        </div>
        <LegendSingleLayer
            :legend-obj="layerInfoLegend"
            :render-to-id="'layerinfo-legend'"
        />
    </div>
</template>

<style lang="scss" scoped>
    @import "~/css/mixins.scss";
    @import "~variables";

    #legend.legend-mobile {
        width: 100%;
    }
    #legend {
        position: absolute;
        right: 1px;
        .legend-window {
            position: absolute;
            min-width:200px;
            max-width:600px;
            right: 45px;
            top: 10px;
            margin: 10px 10px 30px 10px;
            background-color: $white;
            z-index: 9999;
        }
        .legend-window-mobile {
            position: absolute;
            width: calc(100% - 20px);
            top: 10px;
            left: 10px;
            background-color: $white;
            z-index: 1;
        }
        .legend-title {
            padding: 10px;
            border-bottom: 2px solid #e7e7e7;
            cursor: move;
            .title{
                @include tool-headings-h2();
                display: inline-block;
                margin: 0;
            }
            .close-legend {
                padding: 5px;
                cursor: pointer;
                &:focus {
                    @include primary_action_focus;
                }
                &:hover {
                    @include primary_action_hover;
                }
            }
            .toggle-collapse-all {
                padding: 5px;
                cursor: pointer;
                &:focus {
                    @include primary_action_focus;
                }
                &:hover {
                    @include primary_action_hover;
                }
            }
        }
        .legend-content {
            margin-top: 2px;
            max-height: 70vh;
            overflow: auto;
            .layer-title {
                padding: 5px;
                font-weight: bold;
                background-color: $light_grey;
                span {
                    vertical-align: -webkit-baseline-middle;
                }
            }
            .layer {
                border: unset;
                margin: 2px;
                padding: 5px;
            }
        }
    }

    .legend-window-table {
        position: absolute;
        right: 0;
        border-radius: 12px;
        background-color: $dark_grey;
        width: 300px;
        margin: 10px 10px 30px 10px;
        z-index: 9999;
        .legend-title-table {
            font-size: $font_size_big;
            color: $white;
            padding: 10px;
            cursor: move;
            .close-legend {
                cursor: pointer;
                &:focus {
                    @include primary_action_focus;
                }
                &:hover {
                    @include primary_action_hover;
                }
            }
            .toggle-collapse-all {
                cursor: pointer;
                &:focus {
                    @include primary_action_focus;
                }
                &:hover {
                    @include primary_action_hover;
                }
            }
        }
        .legend-content {
            border-bottom-left-radius: 12px;
            border-bottom-right-radius: 12px;
            background-color: $light_grey;
            .card {
                background-color: $light_grey;
            }
            .layer-title {
                border-radius: 12px;
                padding: 5px;
                color: $black;
                font-weight: bold;
                background-color: $light_grey;
                span {
                    vertical-align: -webkit-baseline-middle;
                }
            }
            .layer {
                border: unset;
                margin: 2px;
                padding: 5px;
            }
        }
    }

</style>
