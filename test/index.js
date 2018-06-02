'use strict';

const Promise = require('bluebird');
const ExtraEmitter = require('../index');

describe('async-emitter', () => {
    const sandbox = sinon.sandbox.create();
    let emitter;

    beforeEach(() => {
        emitter = new ExtraEmitter();
    });

    afterEach(() => sandbox.restore());

    it('should wait until all promises from handler will be resolved', () => {
        const insideHandler1 = sinon.spy();
        const insideHandler2 = sinon.spy();
        const afterWait = sinon.spy();

        emitter.on('event', () => Promise.delay(1).then(insideHandler1));
        emitter.on('event', () => Promise.delay(2).then(insideHandler2));

        return emitter.emitAndWait('event')
            .then(afterWait)
            .then(() => assert.callOrder(insideHandler1, insideHandler2, afterWait));
    });

    it('should wait for all promises if some of them was rejected', () => {
        const rejectSyncHandler = sandbox.stub().throws(new Error('some-error'));
        const rejectHandler = sandbox.stub().rejects(new Error('other-error'));
        const resolveHandler = sandbox.stub().resolves();

        emitter.on('event', () => rejectSyncHandler());
        emitter.on('event', () => rejectHandler());
        emitter.on('event', () => Promise.delay(10).then(resolveHandler));

        return emitter.emitAndWait('event')
            .catch(() => assert.callOrder(rejectSyncHandler, rejectHandler, resolveHandler));
    });

    it('should return result of resolved promises', () => {
        emitter.on('event', () => ({some: 'value'}));

        return emitter.emitAndWait('event').then((res) => assert.deepEqual(res, [{some: 'value'}]));
    });

    it('should pass the arguments except first to the listener', () => {
        const listener = sinon.spy();

        emitter.on('event', listener);

        return emitter.emitAndWait('event', 'arg1', 'arg2')
            .then(() => {
                assert.calledOnce(listener);
                assert.calledWith(listener, 'arg1', 'arg2');
            });
    });

    describe('passthroughEvent', () => {
        it('should passthrough event synchronously', () => {
            const from = new ExtraEmitter();
            const to = new ExtraEmitter();
            const spy = sinon.spy();

            ExtraEmitter.passthroughEvent(from, to, 'some-event');

            to.on('some-event', spy);
            from.emit('some-event', 'val1', 'val2');

            assert.calledWith(spy, 'val1', 'val2');
        });

        it('should passthrough all passed events', () => {
            const from = new ExtraEmitter();
            const to = new ExtraEmitter();
            const someSpy = sinon.spy().named('someSpy');
            const otherSpy = sinon.spy().named('otherSpy');

            ExtraEmitter.passthroughEvent(from, to, ['some-event', 'other-event']);
            to.on('some-event', someSpy);
            to.on('other-event', otherSpy);

            from.emit('some-event', 'v1', 'v2');
            from.emit('other-event', 'd1', 'd2');

            assert.calledWith(someSpy, 'v1', 'v2');
            assert.calledWith(otherSpy, 'd1', 'd2');
        });
    });

    describe('passthroughEventAsync', () => {
        it('should passthrough event', () => {
            const from = new ExtraEmitter();
            const to = new ExtraEmitter();
            const spy = sinon.spy();

            ExtraEmitter.passthroughEventAsync(from, to, 'some-event');

            to.on('some-event', spy);
            from.emit('some-event', 'val1', 'val2');

            assert.calledOnce(spy);
            assert.calledWith(spy, 'val1', 'val2');
        });

        it('should passthrough all passed events', () => {
            const from = new ExtraEmitter();
            const to = new ExtraEmitter();
            const someSpy = sinon.spy().named('someSpy');
            const otherSpy = sinon.spy().named('otherSpy');

            ExtraEmitter.passthroughEventAsync(from, to, ['some-event', 'other-event']);

            to.on('some-event', someSpy);
            to.on('other-event', otherSpy);

            from.emit('some-event', 'v1', 'v2');
            from.emit('other-event', 'd1', 'd2');

            assert.calledWith(someSpy, 'v1', 'v2');
            assert.calledWith(otherSpy, 'd1', 'd2');
        });

        it('should wait until the promise from `to` handler is resolved', () => {
            const from = new ExtraEmitter();
            const to = new ExtraEmitter();
            const afterWait = sinon.spy().named('afterWait');
            const insideHandler = sinon.spy().named('insideHandler');

            ExtraEmitter.passthroughEventAsync(from, to, 'some-event');

            to.on('some-event', () => Promise.delay(1).then(insideHandler));

            return from.emitAndWait('some-event')
                .then(afterWait)
                .then(() => assert.callOrder(insideHandler, afterWait));
        });
    });

    describe('passthroughEvent', () => {
        let runner,
            child;

        beforeEach(function() {
            runner = new ExtraEmitter();
            child = new ExtraEmitter();
        });

        it('should emit event emitted by child', () => {
            let onSomeEvent = sinon.spy();
            runner.on('some-event', onSomeEvent);
            runner.passthroughEvent(child, 'some-event');

            child.emit('some-event', 'some-data');

            assert.calledWith(onSomeEvent, 'some-data');
        });

        it('should emit all events emitted by child', () => {
            let onSomeEvent = sinon.spy(),
                onOtherEvent = sinon.spy();

            runner.on('some-event', onSomeEvent);
            runner.on('other-event', onOtherEvent);
            runner.passthroughEvent(child, ['some-event', 'other-event']);

            child.emit('some-event', 'some-data');
            child.emit('other-event', 'other-data');

            assert.calledWith(onSomeEvent, 'some-data');
            assert.calledWith(onOtherEvent, 'other-data');
        });

        it('should not break promise chain on event emitted by emitAndWait', () => {
            runner.passthroughEvent(child, 'some-event');
            runner.on('some-event', function() {
                return 'some-data';
            });

            return child.emitAndWait('some-event')
                .then((data) => {
                    assert.equal(data, 'some-data');
                });
        });
    });
});
