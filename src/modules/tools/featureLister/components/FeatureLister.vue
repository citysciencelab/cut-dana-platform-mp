<script>
import {mapGetters, mapActions, mapMutations} from "vuex";
import getters from "../store/gettersFeatureLister";
import actions from "../store/actionsFeatureLister";
import mutations from "../store/mutationsFeatureLister";
import ToolTemplate from "../../ToolTemplate.vue";
import getComponent from "../../../../utils/getComponent";
import VectorLayer from "ol/layer/Vector.js";
import {isPhoneNumber, getPhoneNumberAsWebLink} from "../../../../utils/isPhoneNumber.js";
import beautifyKey from "../../../../utils/beautifyKey";
import {isWebLink} from "../../../../utils/urlHelper";
import {isEmailAddress} from "../../../../utils/isEmailAddress";
import toBold from "../../../../utils/toBold";

export default {
    name: "FeatureLister",
    components: {
        ToolTemplate
    },
    data: function () {
        return {
            defaultTabClass: "feature-lister-navtabs-li text-center",
            activeTabClass: "feature-lister-navtabs-li text-center active",
            disabledTabClass: "feature-lister-navtabs-li text-center disabled"
        };
    },
    computed: {
        ...mapGetters("Tools/FeatureLister", Object.keys(getters)),
        ...mapGetters("Map", [
            "visibleLayerList"
        ]),
        visibleVectorLayers: function () {
            const vectorLayers = [];

            this.visibleLayerList.forEach(layer => {
                if (layer instanceof VectorLayer && layer.get("typ") === "WFS") {
                    const layerSource = layer.getSource();

                    vectorLayers.push(
                        {
                            name: layer.get("name"),
                            id: layer.get("id"),
                            features: layerSource.getFeatures(),
                            geometryType: layerSource.getFeatures()[0] ? layerSource.getFeatures()[0].getGeometry().getType() : null
                        }
                    );
                }
            });
            return vectorLayers;
        },
        themeTabClasses: function () {
            return this.layerListView ? this.activeTabClass : this.defaultTabClass;
        },
        listTabClasses: function () {
            if (this.featureListView) {
                this.sortItems();
                return this.activeTabClass;
            }
            if (this.featureDetailView) {
                return this.defaultTabClass;
            }
            return this.disabledTabClass;
        },
        detailsTabClasses: function () {
            if (this.featureDetailView) {
                return this.activeTabClass;
            }
            if (this.selectedFeature) {
                return this.defaultTabClass;
            }
            return this.disabledTabClass;
        }
    },
    created () {
        this.$on("close", this.close);
    },
    methods: {
        ...mapActions("Tools/FeatureLister", Object.keys(actions)),
        ...mapMutations("Tools/FeatureLister", Object.keys(mutations)),
        beautifyKey,
        isWebLink,
        isPhoneNumber,
        getPhoneNumberAsWebLink,
        isEmailAddress,
        toBold,
        removeVerticalBar (value) {
            return value.replaceAll("|", "<br>");
        },
        /**
         * Closes this tool window by setting active to false
         * @returns {void}
         */
        close () {
            this.setActive(false);
            const model = getComponent(this.$store.state.Tools.FeatureLister.id);

            if (model) {
                model.set("isActive", false);
            }
            this.$store.dispatch("Map/removeHighlightFeature", "decrease", {root: true});
            this.resetToThemeChooser();
        },
        /**
         * Sorts the table items accoring to the clicked table header.
         * @returns {void}
         */
        async sortItems () {
            const tableHeaders = await document.getElementsByClassName("feature-lister-list-table-th");

            try {
                tableHeaders.forEach(th_elem => {
                    let asc = true;
                    const index = Array.from(th_elem.parentNode.children).indexOf(th_elem);

                    th_elem.addEventListener("click", () => {
                        const arr = [...th_elem.closest("table").querySelectorAll("tbody tr")].slice(1);

                        arr.sort((a, b) => {
                            let a_val = "",
                                b_val = "";

                            if (a.children[index] !== undefined && b.children[index] !== undefined) {
                                a_val = a.children[index].innerText;
                                b_val = b.children[index].innerText;
                            }
                            return asc ? a_val.localeCompare(b_val) : b_val.localeCompare(a_val);
                        });
                        arr.forEach(elem => {
                            th_elem.closest("table").querySelector("tbody").appendChild(elem);
                        });
                        asc = !asc;
                    });
                });
            }
            catch (error) {
                console.error(error);
            }
        }
    }
};
</script>

<template lang="html">
    <ToolTemplate
        :id="id"
        :title="$t(name)"
        :icon="glyphicon"
        :active="active"
        :render-to-window="renderToWindow"
        :resizable-window="resizableWindow"
        :deactivate-gfi="deactivateGFI"
    >
        <template #toolBody>
            <div
                v-if="active"
                id="tool-feature-lister"
            >
                <ul class="nav nav-tabs feature-lister-navtabs">
                    <li
                        id="tool-feature-lister-themeChooser"
                        :class="themeTabClasses"
                        role="presentation"
                    >
                        <a
                            href="#"
                            @click.prevent="switchToThemes()"
                        >{{ $t("modules.tools.featureLister.chooseTheme") }}</a>
                    </li>
                    <li
                        id="tool-feature-lister-list"
                        :class="listTabClasses"
                        role="presentation"
                    >
                        <a
                            href="#"
                            @click.prevent="switchToList(layer)"
                        >{{ $t("modules.tools.featureLister.list") }}</a>
                    </li>
                    <li
                        id="tool-feature-lister-details"
                        :class="detailsTabClasses"
                        role="presentation"
                    >
                        <a
                            href="#"
                            @click.prevent="switchToDetails()"
                        >{{ $t("modules.tools.featureLister.details") }}</a>
                    </li>
                </ul>
                <div
                    v-if="layerListView"
                    id="feature-lister-themes"
                    class="feature-lister-themes panel panel-default"
                >
                    <div
                        id="feature-lister-themes-header"
                        class="panel-heading"
                    >
                        {{ $t("modules.tools.featureLister.visibleVectorLayers") }}
                    </div>
                    <ul
                        v-for="layer in visibleVectorLayers"
                        id="feature-lister-themes-ul"
                        :key="'tool-feature-lister-' + layer.id"
                        class="nav nav-pills nav-stacked"
                    >
                        <li
                            :id="'feature-lister-layer-' + layer.id"
                            class="feature-lister-themes-li"
                            role="presentation"
                        >
                            <a
                                href="#"
                                @click.prevent="switchToList(layer)"
                            >{{ layer.name }}</a>
                        </li>
                    </ul>
                </div>
                <template v-if="featureListView">
                    <div
                        id="feature-lister-list-header"
                        class="panel-heading"
                    >
                        <span>{{ layer.name }}</span>
                    </div>
                    <div
                        id="feature-lister-list"
                        class="panel panel-default feature-lister-list"
                    >
                        <div
                            class="table-responsive  feature-lister-list-table-container"
                        >
                            <table
                                id="feature-lister-list-table"
                                class="table table-striped table-hover table-condensed table-bordered"
                            >
                                <tbody>
                                    <tr class="feature-lister-list-table-tr">
                                        <th
                                            v-for="(header, index) in headers"
                                            :key="'tool-feature-lister-' + index"
                                            class="feature-lister-list-table-th"
                                        >
                                            <span class="glyphicon glyphicon-sort-by-alphabet" />
                                            {{ header.value }}
                                        </th>
                                    </tr>
                                    <tr
                                        v-for="(feature, index) in featureProperties"
                                        :id="'tool-feature-lister-feature-' + index"
                                        :key="'tool-feature-lister-' + index"
                                        class="feature-lister-list-table-tr"
                                        @click="clickOnFeature(index)"
                                        @mouseover="hoverOverFeature(index)"
                                        @focus="hoverOverFeature(index)"
                                    >
                                        <template v-if="index < shownFeatures">
                                            <td
                                                v-for="(property, i) in feature"
                                                :key="'tool-feature-lister-' + i"
                                                class="feature-lister-list-table-td"
                                            >
                                                {{ property }}
                                            </td>
                                        </template>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div
                            class="panel-footer feature-lister-list-footer"
                        >
                            <button
                                type="button"
                                class="btn btn-default navbar-btn feature-lister-list-button"
                                aria-label="Left Align"
                                :disabled="featureCount <= maxFeatures || shownFeatures === featureCount"
                                @click="showMore()"
                            >
                                <span
                                    class="glyphicon glyphicon-import"
                                    aria-hidden="true"
                                /> {{ $t("modules.tools.featureLister.more") }}
                            </button>
                            <p
                                class="navbar-text feature-lister-list-message"
                            >
                                {{ $t("modules.tools.featureLister.key", {shownFeatures, featureCount}) }}
                            </p>
                        </div>
                    </div>
                </template>
                <template v-if="featureDetailView">
                    <div
                        id="feature-lister-details-header"
                        class="panel-heading"
                    >
                        <span> {{ $t("modules.tools.featureLister.detailsOfSelected") }} </span>
                    </div>
                    <div
                        id="feature-lister-details"
                        class="panel panel-default feature-lister-details"
                    >
                        <ul
                            v-for="(feature, key) in featureDetails"
                            :key="'tool-feature-lister-' + key"
                            class="list-group feature-lister-details-ul"
                        >
                            <li class="list-group-item feature-lister-details-li">
                                <strong>
                                    {{ beautifyKey(feature[0]) }}
                                </strong>
                            </li>
                            <li class="list-group-item feature-lister-details-li">
                                <p v-if="isWebLink(feature[1])">
                                    <a
                                        :href="feature[1]"
                                        target="_blank"
                                    >{{ feature[1] }}</a>
                                </p>
                                <p v-else-if="isPhoneNumber(feature[1])">
                                    <a :href="getPhoneNumberAsWebLink(feature[1])">{{ feature[1] }}</a>
                                </p>
                                <p v-else-if="isEmailAddress(feature[1])">
                                    <a :href="`mailto:${feature[1]}`">{{ feature[1] }}</a>
                                </p>
                                <p
                                    v-else-if="typeof feature[1] === 'string' && feature[1].includes(';')"
                                >
                                    <span v-html="toBold(feature[1], key)" />
                                </p>
                                <p
                                    v-else-if="typeof feature[1] === 'string' && feature[1].includes('|')"
                                >
                                    <span v-html="removeVerticalBar(feature[1])" />
                                </p>
                                <p
                                    v-else-if="typeof feature[1] === 'string' && feature[1].includes('<br>')"
                                >
                                    <span v-html="feature[1]" />
                                </p>
                                <p v-else>
                                    {{ feature[1] }}
                                </p>
                            </li>
                        </ul>
                    </div>
                </template>
            </div>
        </template>
    </ToolTemplate>
</template>


<style lang="scss" scoped>
    @import "~/css/mixins.scss";
    $color_1: gray;
    $color_2: black;

/***** Desktop *****/
/***** Mobil *****/
#featureLister {
    width: 426px;
}
.feature-lister-list-table-th {
    cursor: pointer;
    >span {
        float: left;
        width: 15px;
        color: $color_1;
    }
    >.feature-lister-list-table-th-sorted {
        color: $color_2;
    }
}
.feature-lister-list-table-container {
    border-left: 1px solid #ddd !important;
    border-right: 1px solid #ddd !important;
}
#feature-lister-list-table {
    overflow: auto;
}
.feature-lister-list-button {
    position: relative;
    right: 0px;
}
.feature-lister-list-message {
    float: left;
    text-align: center;
    align-items: center;
}
.feature-lister-details-li {
    cursor: text;
    a:link {
        color: royalblue;
        text-decoration: underline;
    }
    a:visited {
        color: royalblue;
        text-decoration: underline;
    }
    a:hover {
        color: blue;
        text-decoration: underline;
    }
    a:active {
        color: blue;
        text-decoration: underline;
    }
    p {
        color: $color_2;
    }
}
.feature-lister-details-ul {
    max-height: 400px;
    overflow: auto;
    cursor: auto;
}
.feature-lister-list-table-td {
    height: 15px;
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.feature-lister-list-table-tr {
    cursor: pointer;
}
.feature-lister-details {
    display: block;
    margin-bottom: 0px;
    max-height: 100%;
    overflow: auto;
}
.feature-lister-list {
    margin-bottom: 0px;
    display: contents;
    overflow: auto;
}
.feature-lister-themes {
    width: 100%;
}
.panel-heading {
    background: #f5f5f5;
    color: #333333;
    cursor: default;
    border-left: 1px solid #ddd;
    border-right: 1px solid #ddd;
}
</style>