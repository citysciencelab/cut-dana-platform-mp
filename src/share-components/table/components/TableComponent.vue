<script>
import {mapGetters} from "vuex";
import localeCompare from "../../../utils/localeCompare";
export default {
    name: "TableComponent",
    props: {
        data: {
            type: Object,
            required: true
        },
        sortable: {
            type: Boolean,
            required: false,
            default: false
        },
        showHeader: {
            type: Boolean,
            required: false,
            default: true
        },
        selectMode: {
            type: [String, Boolean],
            required: false,
            default: false
        }
    },
    emits: ["columnSelected", "rowSelected"],
    data () {
        return {
            selectedColumn: "",
            selectedRow: "",
            currentSorting: {},
            sortedRows: []
        };
    },
    computed: {
        ...mapGetters("Language", ["currentLocale"])
    },
    watch: {
        data: {
            handler (newValue) {
                this.sortedRows = newValue.items;
            },
            immediate: true
        }
    },
    mounted () {
        if (this.selectMode === "column" && Array.isArray(this.data?.headers)) {
            this.selectColumn(this.data.headers[1], 1);
        }
        else if (this.selectMode === "row" && Array.isArray(this.data?.items)) {
            this.selectRow(this.data.items[0]);
        }
    },
    methods: {
        /**
         * Handles the select on a td element.
         * @param {String} columnName The column name of the selected td.
         * @param {Number} columnIdx The index of the column.
         * @param {*[]} row The row as an array.
         * @returns {void}
         */
        handleTDSelect (columnName, columnIdx, row) {
            if (this.selectMode === "column") {
                this.selectColumn(columnName, columnIdx);
            }
            else if (this.selectMode === "row") {
                this.selectRow(row);
            }
        },
        /**
         * Selects the row.
         * @emits rowSelected The row stringified.
         * @param {*[]} row The row as array.
         * @returns {void}
         */
        selectRow (row) {
            if (this.selectMode !== "row") {
                return;
            }
            const stringifiedRow = this.getStringifiedRow(row);

            this.selectedRow = stringifiedRow;
            this.$emit("rowSelected", stringifiedRow);
        },
        /**
         * Selects the column.
         * @emits columnSelected The selected column name.
         * @param {String} columnName The column name.
         * @param {Number} idx The index of the column.
         * @returns {void}
         */
        selectColumn (columnName, idx) {
            if (this.selectMode !== "column" || !columnName || idx === 0) {
                return;
            }
            this.selectedColumn = columnName;
            this.$emit("columnSelected", this.selectedColumn);
        },
        /**
         * Gets a specific icon class to the passed order.
         * @param {String} column - The column in which the table is sorted.
         * @returns {String} The icon css class for the given order.
         */
        getIconClassByOrder (column) {
            if (this.currentSorting?.columnName !== column) {
                return "bi-arrow-down-up origin-order";
            }
            if (this.currentSorting.order === "asc") {
                return "bi-arrow-up";
            }
            if (this.currentSorting.order === "desc") {
                return "bi-arrow-down";
            }
            return "bi-arrow-down-up origin-order";
        },
        /**
         * Gets the next sort order.
         * @param {String} order - The order in which the table is sorted.
         * @returns {String} The sort order. Can be origin, desc, asc.
         */
        getSortOrder (order) {
            if (order === "origin") {
                return "desc";
            }
            if (order === "desc") {
                return "asc";
            }
            return "origin";
        },
        /**
         * Gets the rows sorted by column and order.
         * @param {Object[]} rows The rows to sort.
         * @param {String} columnToSort The column name which is sorted.
         * @param {String} order The order to sort by. Can be origin, desc, asc.
         * @returns {Object[]} the sorted rows.
         */
        getSortedRows (rows, columnToSort, order) {
            if (order === "origin") {
                return this.data.items;
            }
            const columnIdx = this.data.headers.findIndex(header => header === columnToSort),
                sorted = [...rows].sort((a, b) => {
                    if (typeof a[columnIdx] === "undefined") {
                        return -1;
                    }
                    if (typeof b[columnIdx] === "undefined") {
                        return 1;
                    }
                    if (typeof a[columnIdx] === "string" && typeof b[columnIdx] === "string") {
                        return localeCompare(a[columnIdx], b[columnIdx], this.currentLocale, {ignorePunctuation: true});
                    }
                    return a[columnIdx] - b[columnIdx];
                });

            return order === "asc" ? sorted : sorted.reverse();
        },
        /**
         * Gets the row stringified.
         * @param {*[]} row The row.
         * @returns {String} the stringified row.
         */
        getStringifiedRow (row) {
            return row.join("");
        },
        /**
         * Sets the order and sorts the table by the given column.
         * Sorting by a new column resets the order of the old column.
         * @param {String} columnName - The column to sort by.
         * @returns {void}
         */
        runSorting (columnName) {
            const oldColumn = this.currentSorting;

            if (!oldColumn?.columnName || oldColumn.columnName !== columnName) {
                this.currentSorting = {
                    columnName,
                    order: "origin"
                };
            }
            this.currentSorting.order = this.getSortOrder(this.currentSorting.order);
            this.sortedRows = this.getSortedRows(this.sortedRows, columnName, this.currentSorting.order);
        }
    }
};
</script>

<template>
    <table>
        <thead v-if="showHeader">
            <th
                v-for="(column, idx) in data.headers"
                :key="idx"
                :class="[selectMode === 'column' && idx > 0 ? 'selectable' : '', selectedColumn === column ? 'selected' : '']"
                @click="selectColumn(column, idx)"
            >
                <span>{{ column }}</span>
                <span
                    v-if="sortable"
                    class="bootstrap-icon selectable"
                    role="button"
                    tabindex="0"
                    :class="getIconClassByOrder(column)"
                    @click.stop="runSorting(column)"
                    @keypress.stop="runSorting(column)"
                />
            </th>
        </thead>
        <tbody>
            <tr
                v-for="(row, idx) in sortedRows"
                :key="idx"
                :class="[selectMode === 'row' ? 'selectable' : '', selectedRow === getStringifiedRow(row) ? 'selected' : '']"
            >
                <td
                    v-for="(entry, columnIdx) in row"
                    :key="columnIdx"
                    :class="[selectMode === 'column' && columnIdx > 0 ? 'selectable' : '', selectedColumn === data.headers[columnIdx] ? 'selected' : '']"
                    @click="handleTDSelect(data.headers[columnIdx], columnIdx, row)"
                    @keypress.enter="handleTDSelect(data.headers[columnIdx], columnIdx, row)"
                >
                    {{ entry }}
                </td>
            </tr>
        </tbody>
    </table>
</template>


<style scoped>
thead, tbody, tfoot, tr, td, th {
    border-width: 1px;
}
td, th {
    padding: .25rem;
}
.selectable {
    cursor: pointer
}
.selected {
    background-color: lightskyblue;
}
</style>
