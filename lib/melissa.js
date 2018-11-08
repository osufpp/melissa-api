'use strict';

var request = require('request-promise');

function Melissa(options) {
    options = options || {};
    this.name = 'melissa';
    this.licenseKey = options.licenseKey || '';
    this.userId = options.userId || '';
    this.debug = options.debug || false;
}

Melissa.prototype._buildApiUrl = function (service, endpoint) {
    if (endpoint.substring(0, 1) !== '/') {
        endpoint = '/' + endpoint;
    }
    var host;
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
 * Makes a DELETE request to the Melissa API.
 * @param {String} service     web service
 * @param {String} endpoint    API endpoint
 * @param {Object} [qs]        querystring [optional]
 * @param {String} [token]     Melissa authentication token [optional]
 * @returns {Promise}
 * @private
 */
Melissa.prototype._delete = function (service, endpoint, qs, token) {
    var options = {
        method: 'DELETE',
        url: this._buildApiUrl(endpoint),
        qs: qs || {},
        accessToken: token
    };
    return this._http(options);
};

/**
 * Makes a GET request to the Melissa API.
 * @param {String} service     web service
 * @param {String} endpoint    API endpoint
 * @param {Object} [qs]        querystring [optional]
 * @param {String} [token]     Melissa authentication token [optional]
 * @returns {Promise}
 * @private
 */
Melissa.prototype._get = function (service, endpoint, qs, token) {
    var options = {
        method: 'GET',
        url: this._buildApiUrl(service, endpoint),
        qs: qs || {},
        token: token
    };
    return this._http(options);
};

/**
 * HTTP request to Melissa API. Automatically adds ID (license key, token, or user ID).
 * @param {Object} options    request library options
 * @returns {Promise}
 * @private
 */
Melissa.prototype._http = function (options) {
    options = options || {};
    options.json = true;
    options.resolveWithFullResponse = true;
    var id = (!!options.token ? options.token : (!!this.licenseKey ? this.licenseKey : (!!this.userId ? this.userId : null)));
    if (!!id) {
        delete options.token;
    }
    options.qs.id = id;
    require('request').debug = this.debug;
    return request(options)
        .then(function (response) {
            if (!isResponseSuccessful(response)) {
                var err = new Error(fmt('%s - %s failed', response.statusCode, options.url));
                err.code = response.statusCode;
                err.meta = response.body;
                return Promise.reject(err);
            }
            return response.body;
        })
};

/**
 * Purpose: This service is able to validate IPv4 addresses and give you geographic information for it.
 *          This geographical data can place an IP address within a city and postal code. It can also tell you the connection type and speed.
 * @param {String} ipAddress                  The IP address to be verified.
 * @param {String} [transmissionReference]    Serves as a unique identifier for this set of records. This allows you to match a response to a request. [optional]
 * @returns {Promise}
 */
Melissa.prototype.ipLocation = function (ipAddress, transmissionReference) {
    var qs = {
        ip: ipAddress
    };
    if (!!transmissionReference) {
        qs.t = transmissionReference;
    }
    var endpoint = '/iplocation/doiplocation';
    return this._get('iplocator', endpoint, qs);
};

var isResponseSuccessful = function (response) {
    return ((response.statusCode >= 200) && (response.statusCode < 300));
};

/**
 * Makes a POST request to the Melissa API.
 * @param {String} service     web service
 * @param {String} endpoint    API endpoint
 * @param {Object} [qs]        querystring [optional]
 * @param {Object} [body]      body [optional]
 * @param {String} [token]     Melissa authentication token [optional]
 * @returns {Promise}
 * @private
 */
Melissa.prototype._post = function (service, endpoint, qs, body, token) {
    var options = {
        method: 'POST',
        url: this._buildApiUrl(endpoint),
        qs: qs || {},
        body: body,
        token: token
    };
    return this._http(options);
};

/**
 * Makes a PUT request to the Melissa API.
 * @param {String} service     web service
 * @param {String} endpoint    API endpoint
 * @param {Object} [qs]        querystring [optional]
 * @param {Object} [body]      body [optional]
 * @param {String} [token]     Melissa authentication token [optional]
 * @returns {Promise}
 * @private
 */
Melissa.prototype._put = function (service, endpoint, qs, body, token) {
    var options = {
        method: 'PUT',
        url: this._buildApiUrl(endpoint),
        qs: qs || {},
        body: body,
        accessToken: token
    };
    return this._http(options);
};

module.exports = Melissa;
