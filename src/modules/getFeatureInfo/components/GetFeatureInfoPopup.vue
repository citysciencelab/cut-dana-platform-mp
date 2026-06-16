<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import GetFeatureInfoDetached from "./GetFeatureInfoDetached.vue";
import {mapAttributes} from "@masterportal/masterportalapi/src/lib/attributeMapper";
import omit from "../../../shared/js/utils/omit";
import IconButton from "../../../shared/modules/buttons/components/IconButton.vue";

/**
 * Get Feature Info Popup — free-floating popup displayed over the map.
 * Only rendered when `showInPopup` is true in the GFI config.
 * @module modules/getFeatureInfo/components/GetFeatureInfoPopup
 */
export default {
    name: "GetFeatureInfoPopup",
    components: {
        GetFeatureInfoDetached,
        IconButton
    },
    data () {
        return {
            pagerIndex: 0,
            updatedFeature: false,
            leftIcon: "bi-chevron-left",
            rightIcon: "bi-chevron-right",
            popupLeft: null,
            popupTop: null
        };
    },
    computed: {
        ...mapGetters(["ignoredKeys"]),
        ...mapGetters("Modules/GetFeatureInfo", [
            "showInPopup",
            "visible"
        ]),
        ...mapGetters("Modules/GetFeatureInfo", {
            gfiFeatures: "gfiFeaturesReverse"
        }),
        ...mapGetters("Maps", ["clickPixel"]),
        ...mapGetters("Maps", {
            mapMode: "mode"
        }),

        feature () {
            if (this.gfiFeatures !== null && Array.isArray(this.gfiFeatures) && this.gfiFeatures.length > 0) {
                return this.gfiFeatures[this.pagerIndex];
            }
            return null;
        },

        leftPager () {
            return this.gfiFeatures?.length > 1 && this.pagerIndex > 0;
        },

        rightPager () {
            return this.gfiFeatures?.length > 1 && this.pagerIndex < this.gfiFeatures.length - 1;
        },

        popupStyle () {
            if (!this.clickPixel) {
                return {};
            }
            if (this.popupLeft === null || this.popupTop === null) {
                return {
                    left: `${this.clickPixel[0] + 15}px`,
                    top: `${this.clickPixel[1] - 15}px`,
                    visibility: "hidden"
                };
            }
            return {
                left: `${this.popupLeft}px`,
                top: `${this.popupTop}px`
            };
        }
    },
    watch: {
        clickPixel: {
            handler () {
                this.popupLeft = null;
                this.popupTop = null;
                this.updatePosition();
            },
            deep: true
        },
        feature: {
            handler () {
                this.updatePosition();
            },
            deep: true
        },
        gfiFeatures: {
            handler (newFeatures) {
                if (newFeatures?.length > 0) {
                    this.pagerIndex = 0;
                    this.setUpdatedFeature(true);
                }
                else if (newFeatures === null) {
                    this.setUpdatedFeature(false);
                }
            },
            deep: true
        }
    },
    beforeUpdate () {
        if (this.feature) {
            this.createMappedProperties(this.feature);
        }
    },
    updated () {
        this.updatePosition();
    },
    methods: {
        ...mapMutations("Modules/GetFeatureInfo", [
            "setGfiFeatures"
        ]),
        ...mapActions("Modules/GetFeatureInfo", [
            "removeHighlightColor"
        ]),

        close () {
            this.pagerIndex = 0;
            this.popupLeft = null;
            this.popupTop = null;
            this.setGfiFeatures(null);
            if (this.mapMode === "3D") {
                this.removeHighlightColor();
            }
        },

        setUpdatedFeature (val = false) {
            this.updatedFeature = val;
        },

        updatePosition () {
            this.$nextTick(() => {
                if (this.$refs.popup && this.clickPixel) {
                    const popupRect = this.$refs.popup.getBoundingClientRect();
                    const offset = 15;
                    let left = this.clickPixel[0] + offset;
                    let top = this.clickPixel[1] - offset;

                    // Exceeds right edge
                    if (left + popupRect.width > window.innerWidth) {
                        left = this.clickPixel[0] - popupRect.width - offset;
                    }
                    // Exceeds left edge
                    if (left < 0) {
                        left = 0;
                    }

                    // Exceeds bottom edge
                    if (top + popupRect.height > window.innerHeight) {
                        top = window.innerHeight - popupRect.height - offset;
                    }
                    // Exceeds top edge
                    if (top < 0) {
                        top = 0;
                    }

                    if (this.popupLeft !== left || this.popupTop !== top) {
                        this.popupLeft = left;
                        this.popupTop = top;
                    }
                }
            });
        },

        increasePagerIndex () {
            if (this.pagerIndex < this.gfiFeatures.length - 1) {
                this.pagerIndex += 1;
            }
        },

        decreasePagerIndex () {
            if (this.pagerIndex > 0) {
                this.pagerIndex -= 1;
            }
        },

        createMappedProperties (feature) {
            if (Array.isArray(feature?.getFeatures())) {
                feature.getFeatures().forEach(singleFeature => {
                    this.createMappedProperties(singleFeature);
                });
            }
            else if (feature?.getProperties() && feature?.getProperties() !== null) {
                feature.getMappedProperties = () => this.prepareProperties(
                    feature.getProperties(),
                    feature.getAttributesToShow(),
                    this.ignoredKeys
                );
            }
        },

        prepareProperties (properties, mappingObject, ignoredKeys) {
            if (mappingObject === "showAll" && Array.isArray(ignoredKeys) || mappingObject === undefined) {
                return omit(properties, ignoredKeys, true);
            }
            return mapAttributes(properties, mappingObject);
        }
    }
};
</script>

<template>
    <div
        v-if="showInPopup && visible && feature !== null"
        ref="popup"
        class="gfi-popup"
        :style="popupStyle"
    >
        <div class="gfi-popup-close-row">
            <button
                class="gfi-popup-close-btn"
                :aria-label="$t('common:modules.getFeatureInfo.close')"
                @click="close"
            >
                <i class="bi bi-x-lg" />
            </button>
        </div>
        <GetFeatureInfoDetached
            :feature="feature"
            :is-updated="updatedFeature"
            @update-feature-done="setUpdatedFeature(true)"
            @close="close"
        >
            <template #pager-left>
                <div
                    class="gfi-pager"
                    :class="!leftPager ? 'gfi-pager-left-margin' : ''"
                >
                    <IconButton
                        v-if="leftPager"
                        :aria="$t('common:modules.getFeatureInfo.buttonBack')"
                        :class-array="['pager-left', 'pager', 'btn-primary']"
                        :icon="leftIcon"
                        role="button"
                        :interaction="decreasePagerIndex"
                    />
                </div>
            </template>
            <template #pager-right>
                <div
                    class="gfi-pager"
                    :class="!rightPager ? 'gfi-pager-right-margin' : ''"
                >
                    <IconButton
                        v-if="rightPager"
                        :aria="$t('common:modules.getFeatureInfo.buttonForward')"
                        :class-array="['pager-right', 'pager', 'btn-primary', 'd-flex', 'flex-row-reverse']"
                        :icon="rightIcon"
                        role="button"
                        :interaction="increasePagerIndex"
                    />
                </div>
            </template>
        </GetFeatureInfoDetached>
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";

.gfi-popup {
  position: absolute;
  z-index: 10;
  background-color: $white;
  border: 1px solid $light_grey;
  border-radius: 4px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  min-width: 280px;
  max-width: 420px;
  max-height: 60vh;
  overflow-y: auto;
  pointer-events: all;
  padding: 0.5rem 1rem 1rem;

  .gfi-popup-close-row {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 0.25rem;
  }

  .gfi-popup-close-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    color: $dark_blue;
    padding: 0.1rem 0.3rem;
    line-height: 1;

    &:hover {
      color: $accent_hover;
    }
  }

  .gfi-pager {
    background-color: transparent;
  }

  .gfi-pager-left-margin {
    margin-left: 2.5rem;
  }

  .gfi-pager-right-margin {
    margin-right: 2.5rem;
  }
}
</style>
