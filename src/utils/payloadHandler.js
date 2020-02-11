/**
 * @module payloadHandler
 * This module handles incoming payloads by providing some functions for it
 */

module.exports = payloadHandler = {
  /**
   * Checks if payload has all required keys
   * @param {{Object}} payload
   * @param {{Array}} requiredKeys
   * @param {{boolean}}
   */
  payloadHasAllRequiredKeys: (payload, requiredKeys) => {
    return requiredKeys.every(key => typeof payload[key] !== 'undefined');
  },

  /**
   * Checks if payload has a valid schema.
   * Currently this only works for one level deep keys.
   * @param {{Object}} payload
   * @param {{Object}} schema
   * @return {{boolean}}
   */
  payloadHasValidSchema: (payload, schema) => {
    const payloadKeys = Object.keys(payload);
    return payloadKeys.every(key => {
      if (schema[key] === 'array') return Array.isArray(payload[key]);
      if (schema[key] === 'object') return typeof payload[key] === 'object' && !!payload[key];
      return schema[key] === typeof payload[key];
    });
  },
};
