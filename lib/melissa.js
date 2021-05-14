const axios = require('axios').default;

function Melissa(options) {
    options = options || {};
    this.name = 'melissa';
    this.licenseKey = options.licenseKey || '';
    this.userId = options.userId || '';
}

Melissa.prototype._buildApiUrl = function (service, endpoint) {
    if (endpoint.substring(0, 1) !== '/') {
        endpoint = '/' + endpoint;
    }
    let host;
    switch (service) {
        case 'expressentry':
            host = 'expressentry.melissadata.net';
            break;
        case 'iplocator':
            host = 'globalip.melissadata.net/v4'
    }
    return 'https://' + host + '/web' + endpoint;
};

/**
 * Makes a GET request to the Melissa API.
 * @param {String} service     web service
 * @param {String} endpoint    API endpoint
 * @param {Object} [params]    URL parameters [optional]
 * @param {String} [token]     Melissa authentication token [optional]
 * @returns {Promise}
 * @private
 */
Melissa.prototype._get = async function (service, endpoint, params, token) {
    const options = {
        method: 'get',
        url: this._buildApiUrl(service, endpoint),
        params: params || {},
        token: token
    };
    return this._http(options);
};

/**
 * HTTP request to Melissa API. Automatically adds ID (license key, token, or user ID).
 * @param {Object} config    axios library configuration
 * @returns {Promise}
 * @private
 */
Melissa.prototype._http = async function (config) {
    config = config || {};
    config.headers = { 'Content-Type': 'application/json' };
    config.params.id = config.token || this.licenseKey || this.userId || null;
    delete config.token;
    const response = await axios(config);
    if (!isResponseSuccessful(response.status)) {
        let err = new Error(`${ response.status } - ${ config.url } failed`);
        err.code = response.status;
        err.meta = response.data;
        throw err;
    }
    return response.data;
};

/**
 * Purpose: This service is able to validate IPv4 addresses and give you geographic information for it.
 *          This geographical data can place an IP address within a city and postal code. It can also tell you the connection type and speed.
 * @param {String} ipAddress                  The IP address to be verified.
 * @param {String} [transmissionReference]    Serves as a unique identifier for this set of records. This allows you to match a response to a request. [optional]
 * @returns {Promise}
 */
Melissa.prototype.ipLocation = async function (ipAddress, transmissionReference) {
    let qs = { ip: ipAddress };
    if (transmissionReference) {
        qs.t = transmissionReference;
    }
    const endpoint = '/iplocation/doiplocation';
    return this._get('iplocator', endpoint, qs);
};

const isResponseSuccessful = function (statusCode) {
    return ((statusCode >= 200) && (statusCode < 300));
};

module.exports = Melissa;
