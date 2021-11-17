import {getValueFromObjectByPath} from "./getValueFromObjectByPath.js";
import moment from "moment";
import thousandsSeparator from "./thousandsSeparator";
/**
 * Maps the feature properties by the given object.
 * @param {Object} properties The feature properties.
 * @param {Object} mappingObject Object to me mapped.
 * @param {Boolean} [isNested=true] Flag if Object is nested, like "gfiAttributes".
 * @returns {Object} The mapped properties.
 */
function attributeMapper (properties, mappingObject, isNested = true) {
    let mappedProperties;

    if (!mappingObject) {
        return false;
    }
    if (!isNested) {
        if (typeof mappingObject === "string") {
            mappedProperties = prepareValue(properties, mappingObject);
        }
        else {
            mappedProperties = prepareValueFromObject(mappingObject.name, mappingObject, properties);
        }
    }
    else {
        mappedProperties = {};
        Object.keys(mappingObject).forEach(key => {
            let newKey = mappingObject[key],
                value = prepareValue(properties, key);

            if (typeof newKey === "object") {
                value = prepareValueFromObject(key, newKey, properties);
                newKey = newKey.name;
            }
            if (value && value !== "undefined") {
                mappedProperties[newKey] = value;
            }
        });
    }
    return mappedProperties;
}

/**
 * Returns the value of the given key. Also considers, that the key may be an object path.
 * @param {Object} properties properties.
 * @param {String} key Key to derive value from.
 * @returns {*} - Value from key.
 */
function prepareValue (properties, key) {
    const isPath = key.startsWith("@") && key.length > 1;
    let value = properties[Object.keys(properties).find(propertiesKey => propertiesKey.toLowerCase() === key.toLowerCase())];

    if (isPath) {
        value = getValueFromObjectByPath(properties, key);
    }
    return value;
}
/**
 * Derives the gfi value if the value is an object.
 * @param {*} key Key of Attribute.
 * @param {Object} mappingObj Value of attribute.
 * @param {Object} properties object.
 * @returns {*} - Prepared Value
 */
function prepareValueFromObject (key, mappingObj, properties) {
    const type = mappingObj?.type ? mappingObj.type : "string",
        condition = mappingObj?.condition ? mappingObj.condition : null;
    let preparedValue = prepareValue(properties, key),
        format = mappingObj?.format ? mappingObj.format : "DD.MM.YYYY HH:mm:ss",
        date;

    if (condition) {
        preparedValue = getValueFromCondition(key, condition, properties);
    }
    switch (type) {
        case "date": {
            date = moment(String(preparedValue));
            if (date.isValid()) {
                preparedValue = moment(String(preparedValue)).format(format);
            }
            break;
        }
        case "number": {
            preparedValue = thousandsSeparator(preparedValue);
            break;
        }
        case "linechart": {
            preparedValue = Object.assign({
                name: key,
                staObject: preparedValue
            }, mappingObj);
            break;
        }
        case "boolean": {
            format = format === "DD.MM.YYYY HH:mm:ss" ? {true: true, false: false} : format;
            preparedValue = getBooleanValue(preparedValue, format);
            break;
        }
        // default equals to mappingObj.type === "string"
        default: {
            preparedValue = String(preparedValue);
        }
    }
    if (preparedValue && mappingObj.suffix && preparedValue !== "undefined") {
        preparedValue = appendSuffix(preparedValue, mappingObj.suffix);
    }
    if (preparedValue && mappingObj.prefix && preparedValue !== "undefined") {
        preparedValue = prependPrefix(preparedValue, mappingObj.prefix);
    }
    return preparedValue;
}

/**
 * Parsing the boolean value
 * @param {String} value default value
 * @param {String|Object} format the format of boolean value
* @returns {String} - original value or parsed value
 */
function getBooleanValue (value, format) {
    let parsedValue = String(value);

    if (Object.prototype.hasOwnProperty.call(format, value)) {
        // translation
        if (String(format[value]).includes("common:")) {
            parsedValue = i18next.t(format[value]);
        }
        // normal mapping
        else {
            parsedValue = format[value];
        }
    }
    return parsedValue;
}

/**
 * Derives the value from the given condition.
 * @param {String} key Key.
 * @param {String} condition Condition to filter.
 * @param {Object} properties Properties.
 * @returns {*} - Value that matches the given condition.
 */
function getValueFromCondition (key, condition, properties) {
    let valueFromCondition,
        match;

    if (condition === "contains") {
        match = Object.keys(properties).filter(key2 => {
            return key2.includes(key);
        })[0];
        valueFromCondition = properties[match];
    }
    else if (condition === "startsWith") {
        match = Object.keys(properties).filter(key2 => {
            return key2.startsWith(key);
        })[0];
        valueFromCondition = properties[match];
    }
    else if (condition === "endsWith") {
        match = Object.keys(properties).filter(key2 => {
            return key2.endsWith(key);
        })[0];
        valueFromCondition = properties[match];
    }
    else {
        valueFromCondition = properties[key];
    }

    return valueFromCondition;

}

/**
 * Appends a suffix if available.
 * @param {*} value Value to append suffix.
 * @param {String} suffix Suffix
 * @returns {String} - Value with suffix.
 */
function appendSuffix (value, suffix) {
    let valueWithSuffix = value;

    if (suffix) {
        valueWithSuffix = String(valueWithSuffix) + " " + suffix;
    }
    return valueWithSuffix;
}

/**
 * Prepend a prefix if available.
 * @param {*} value Value to prepend prefix.
 * @param {String} prefix Prefix
 * @returns {String} - Value with prefix.
 */
function prependPrefix (value, prefix) {
    let valueWithPrefix = value;

    if (prefix) {
        valueWithPrefix = prefix + String(valueWithPrefix);
    }
    return valueWithPrefix;
}

export default attributeMapper;
