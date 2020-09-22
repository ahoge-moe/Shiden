/**
 * @module messageHandler
 * This module handles incoming messages from the broker
 */

module.exports = messageHandler = {
  /**
   * Checks if message has all required keys
   * @param {{Object}} message
   * @param {{Array<string>}} requiredKeys
   * @param {{boolean}}
   */
  messageHasRequiredKeys: (message, requiredKeys) => {
    return requiredKeys.every(key => typeof message[key] !== 'undefined');
  },

  /**
   * Checks if message has a valid schema.
   * Currently this only works for one level deep keys.
   * @param {{Object}} message
   * @param {{Object}} schema
   * @return {{boolean}}
   */
  messageHasValidSchema: (message, schema) => {
    const messageKeys = Object.keys(message);
    return messageKeys.every(key => {
      if (schema[key] === 'Array') return Array.isArray(message[key]);
      if (schema[key] === 'Object') return typeof message[key] === 'object' && !!message[key];
      return schema[key] === typeof message[key];
    });
  },
};
