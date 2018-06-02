'use strict';

const _ = require('lodash');
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

    emitAndWait(event, ...args) {
        return _(this.listeners(event))
            .map((l) => Promise.method(l).apply(this, args.concat('async')))
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

        emitter.on(event, (...args) => {
            if (args.includes('async')) {
                return this.emitAndWait(event, ...args);
            } else {
                this.emit(event, ...args);
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
}
