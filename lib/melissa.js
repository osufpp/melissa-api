const _ = require('lodash');
const axios = require('axios');

function Melissa(options, logger) {
    options = options || { };
    this.name = 'melissa-api';
    this.licenseKey = options.licenseKey || '';
    this.userId = options.userId || '';
    this.logger = logger || null;
    this.loggerConfig = options.loggerConfig;
    this.logLevel = options.logLevel || 'verbose';
    this.timeout = options.timeout || (1000 * 60 * 3);
}

Melissa.prototype._buildApiUrl = function (service, endpoint) {
    if (endpoint.substring(0, 1) !== '/') {
        endpoint = `/${ endpoint }`;
    }
    let host;
    switch (service) {
        case 'expressentry':
            host = 'expressentry.melissadata.net';
            break;
        case 'iplocator':
            host = 'globalip.melissadata.net/v4'
    }
    return `https://${ host }/web${ endpoint }`;
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
    return this._request(options);
};

/**
 * HTTP request to Melissa API. Automatically adds ID (license key, token, or user ID).
 * @param {Object} config    axios library configuration
 * @returns {Promise}
 * @private
 */
Melissa.prototype._request = async function (config) {
    config = config || { };
    config.headers = { 'Content-Type': 'application/json' };
    config.params.id = config.token || this.licenseKey || this.userId || null;
    delete config.token;
    const instance = axios.create();
    const response = await instance(config);
    this._writeLog(config, response);
    if (!isResponseSuccessful(response.status)) {
        let err = new Error(`${ response.status } - ${ config.url } failed`);
        err.code = response.status;
        err.meta = response.data;
        throw err;
    }
    return response.data;
};

Melissa.prototype._writeLog = function (axiosConfig, response) {
    const logLevel = (isResponseSuccessful(response.status) ? this.logLevel : 'error');
    let logParts = [ `[${ this.name }]`, response.request.method ];
    logParts.push(response.request.path);
    logParts.push(this.loggerConfig.data ? JSON.stringify(axiosConfig.data) : null);
    logParts.push(`${ response.status } ${ response.statusText }`);
    logParts.push(this.loggerConfig.response ? JSON.stringify(response.data) : null);
    const log = _.compact(logParts).join(' ');
    this.logger[ logLevel ](log);
}

function isResponseSuccessful(statusCode) {
    return ((statusCode >= 200) && (statusCode < 300));
}

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

module.exports = Melissa;
