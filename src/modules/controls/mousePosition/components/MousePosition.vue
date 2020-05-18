
<script>
import {mapGetters} from "vuex";
import ControlIcon from "../../ControlIcon.vue";

/**
 * While MousePosition is a control (that is, 1. historically, 2. in the sense of ol.controls, 3. regarding configJSON),
 * it is placed differently and has a diverging look to it. While placed in the controls/ folder, it's actually
 * used within the Footer to avoid footer and control from ever overlapping, no matter how high the footer may grow.
 */
export default {
    name: "MousePosition",
    components: {
        ControlIcon
    },
    data () {
        return {
            open: true
        };
    },
    computed: {
        ...mapGetters("Map", ["prettyMouseCoord"])
    },
    methods: {
        toggleOpen () {
            this.open = !this.open;
        }
    }
};
</script>

<template>
    <div
        :class="['mouse-position', open ? 'open' : 'closed']"
    >
        <span
            :class="['mouse-position-span', open ? 'open' : 'closed']"
        >
            {{ prettyMouseCoord || `common:modules.controls.mousePosition.hint` }}
        </span>
        <ControlIcon
            :icon-name="`chevron-${open ? 'left' : 'right'}`"
            :title="`common:modules.controls.mousePosition.${open ? 'hide' : 'show'}MousePosition`"
            :active="true"
            :on-click="toggleOpen"
            inline
        />
    </div>
</template>

<style lang="less" scoped>
    @import "../../../../variables.less";

    .mouse-position {
        display: flex;
        flex-direction: row;

        background-color: @primary;
        color: @primary_contrast;
        font-size: @font_size_small;
        line-height: @icon_length_small;
        min-height: @icon_length_small;

        transition: 1s ease-out;
        /* hack to prevent text from jumping during animation */
        transform: translateZ(0);

        &.closed {
            /* using translateX to prevent multiline flicker on width transformation */
            transform: translateX(calc(-100% + @icon_length_small));
        }

        .mouse-position-span {
            padding: 0 8px;
            border-right: 1px solid @primary_contrast;
        }
    }
</style>