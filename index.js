'use strict';

const Promise = require('bluebird');
const EventEmitter = require('events').EventEmitter;

module.exports = class ExtraEmitter extends EventEmitter {
    /**
     * @static
     * @param {EventEmitter} from
     * @param {EventEmitter} to
     * @param {String|String[]} event or array of events to passthrough
     */
    static passthroughEvent(...args) {
        return mkPassthroughFn('emit')(...args);
    }

    /**
     * @static
     * @param {EventEmitter} from
     * @param {EventEmitter} to
     * @param {String|String[]} event or array of events to passthrough
     */
    static passthroughEventAsync(...args) {
        return mkPassthroughFn('emitAndWait')(...args);
    }

    /**
     * Emit event and wait for all async handler execution results
     * @param {String} event
     * @param {any} args
     * @returns {Promise}
     */
    emitAndWait(event, ...args) {
        const asyncHandlers = this.listeners(event)
            .map((listener) => Promise.method(listener).apply(this, markAsAsync(args)));

        return waitForResults(asyncHandlers);
    }

    /**
     * Subscribe on event(s) from given emitter and trigger the same event(s) from itself
     * @param {EventEmitter} emitter
     * @param {String|String[]} event or array of events to passthrough
     */
    passthroughEvent(emitter, event) {
        if (Array.isArray(event)) {
            event.forEach(this.passthroughEvent.bind(this, emitter));
            return;
        }

        emitter.on(event, (...args) => {
            if (args.includes('async')) {
                return this.emitAndWait(event, ...args);
            } else {
                this.emit(event, ...args);
            }
        });
    }
};

function markAsAsync(args) {
    return args.includes['async'] ? args : args.concat('async');
}

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
}
