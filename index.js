'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const EventEmitter = require('events').EventEmitter;

module.exports = class AsyncEmitter extends EventEmitter {
    static passthroughEvent(...args) {
        return mkPassthroughFn('emit')(...args);
    }

    static passthroughEventAsync(...args) {
        return mkPassthroughFn('emitAndWait')(...args);
    }

    emitAndWait(event, ...args) {
        return _(this.listeners(event))
            .map((l) => Promise.method(l).apply(this, args))
            .thru(waitForResults)
            .value();
    }

    /**
     * Emit event emitted by emitter
     * @param {EventEmitter} emitter
     * @param {String|String[]} event or array of events to passthrough
     */
    passthroughEvent(emitter, event) {
        if (_.isArray(event)) {
            event.forEach(this.passthroughEvent.bind(this, emitter));
            return;
        }

        emitter.on(event, (data, opts) => {
            if (opts && opts.shouldWait) {
                return this.emitAndWait(event, data);
            } else {
                this.emit(event, data);
            }
        });
    }
};

function waitForResults(promises) {
    return Promise.all(promises.map((p) => p.reflect()))
        .then((res) => {
            const firstRejection = res.find((v) => v.isRejected());
            return firstRejection ? Promise.reject(firstRejection.reason()) : res.map((r) => r.value());
        });
}

function mkPassthroughFn(methodName) {
    const passEvents = (from, to, event) => {
        if (typeof event === 'string') {
            from.on(event, (...args) => to[methodName](event, ...args));
            return;
        }
        event.forEach((event) => passEvents(from, to, event));
    };

    return passEvents;
};