// export declare function PlayerWidget(element: HTMLElement) : MixcloudPlayerWidgetApiRPC;


// @flow

// This file acts as a shim to communicate with the widgetApi at js/player-widget/components/WidgetApi/index.js

/*
This is a thin RPC layer providing a function:
var myWidget = window.Mixcloud.PlayerWidget(iframe);

after the myWidget.ready promise is resolved the API has been fetched from the widget
 and myWidget will be populated with methods and events.

When debugging this, it's useful to see the debug comments in this file and use the django template called debug_api.html

*/

import { isBrowser } from './consts';
import { Deferred } from './deferred';

type MessageData =
    | {
          type: 'getApi'
      }
    | {
          type: 'method',
          data: {
              methodId: number,
              methodName: string,
              args: Array<any>
          }
      };

type WindowOnReceiveMessageCallback = {
    window: WindowProxy,
    callback: Function
};

const ORIGIN = 'https://www.mixcloud.com';

// This is changed when using debug_api.html:
const DEBUG = isBrowser && (<any>window)['testingPlayerApi'];

export interface MixcloudPlayerExternalWidgetApiRPC {
    ready: Deferred<any>;
    events: any;
    apiBuilt: boolean;
    load?(id: string, autoplay: boolean): Promise<any>;
    play?(): void;
    pause?(): void;
    seek?(seconds: number): void;
    destroy(): void;
}

export class MixcloudPlayerWidgetApiRPC {
    otherWindow: WindowProxy;
    methodCounter = 0;
    methodResponses = {};
    eventHandlers = {};
    windowOnReceiveMessageCallbacks: WindowOnReceiveMessageCallback[] = [];

    external: MixcloudPlayerExternalWidgetApiRPC = {
        ready: new Deferred(),
        events: {},
        apiBuilt: false,
        destroy: () => this.destroy(),
    };

    constructor(iframe: HTMLIFrameElement) {
        this.otherWindow = iframe.contentWindow!;

        // Add this widget window to the listeners (see onReceiveMessage)
        this.windowOnReceiveMessageCallbacks.push({
            window: this.otherWindow,
            callback: this.receiveMessage
        });

        // If the iframe is ready we can fetch the API
        this.send({ type: 'getApi' });

        // Listen in a cross-platform way
        if (window.addEventListener) {
            window.addEventListener('message', this.onReceiveMessage, false);
        } else {
            // window.attachEvent('onmessage', this.onReceiveMessage);
        }
    }

    receiveMessage = (type: string, data: any) => {
        switch (type) {
            case 'ready':
                // if we're getting this event, the first attempt to get the api probably failed
                this.send({ type: 'getApi' });
                break;
            case 'api':
                this.buildApi(data);
                break;
            case 'event':
                (<any>this.eventHandlers)[data.eventName].apply(
                    this.external,
                    data.args
                );
                break;
            case 'methodResponse':
                if ((<any>this.methodResponses)[data.methodId]) {
                    // Resolve the deferred promise
                    (<any>this.methodResponses)[data.methodId].resolve(data.value);
                    delete (<any>this.methodResponses)[data.methodId];
                }
                break;
        }
    };

    // Create a "deferred" promise that we can externally resolve once the response comes back from the iframe
    deferredMethodResponse = (methodId: number, methodName: string, ...args: any[]) => {
        let resolver;
        const promise = new Promise(resolve => {
            resolver = resolve;
            this.send({
                type: 'method',
                data: {
                    methodId: this.methodCounter,
                    methodName,
                    args
                }
            });
        });

        // $FlowIgnore doesn't like attaching things to promises
        (<any>promise).resolve = resolver;

        return promise;
    };

    buildMethod = (methodName: string) => (...args: any[]) => {
        this.methodCounter++;
        const methodId = this.methodCounter;

        (<any>this.methodResponses)[this.methodCounter] = this.deferredMethodResponse(
            methodId,
            methodName,
            ...args
        );

        return (<any>this.methodResponses)[this.methodCounter];
    };

    buildApi = ({ methods, events }: { methods: string[], events: string[] }) => {
        // I had to add this check to make events work all the time
        if (!this.external.apiBuilt) {
            methods.forEach(methodName => {
                (<any>this.external)[methodName] = this.buildMethod(methodName);
            });

            events.forEach(eventName => {
                (<any>this.eventHandlers)[eventName] = Callbacks();
                this.external.events[eventName] = (<any>this.eventHandlers)[
                    eventName
                ].external;
            });

            this.external.apiBuilt = true;
            this.external.ready.resolve(this.external);
        }
    };

    onReceiveMessage = (event: MessageEvent) => {
        // DEBUG: Might need to remove this when using debug_api.html:
        if (
            !DEBUG &&
            ![ORIGIN, 'https://player-widget.mixcloud.com', window.location.origin].includes(event.origin)
        ) {
            console.error('Playerwidget received message from incorrect origin',
                { expected: ORIGIN, got: event.origin });

            return;
        }

        let data: any;

        try {
            // $FlowIgnore we catch the error
            data = JSON.parse(event.data);
        } catch (err) {
            console.error('Playerwidget received malformed JSON data', err);

            return;
        }

        if (data.mixcloud !== 'playerWidget') {
            console.error('Playerwidget received incorrect data');

            return;
        }

        // postMessage can be called from any window and there could be multiple
        // widgets on the page - this will call the callback for the appropriate
        // widget iframe
        this.windowOnReceiveMessageCallbacks.forEach(
            ({ callback, window: callbackWindow }) => {
                if (callbackWindow === event.source) {
                    callback(data.type, data.data);
                }
            }
        );
    };

    send = (data: MessageData) => {
        this.otherWindow.postMessage(
            JSON.stringify(data),
            '*'
            // DEBUG ? '*' : ORIGIN
            // DEBUG ? '*' : location.origin
        );
    };

    destroy() {
        // Listen in a cross-platform way
        if (window.removeEventListener) {
            window.removeEventListener('message', this.onReceiveMessage, false);
        } else {
            // window.detachEvent('onmessage', this.onReceiveMessage);
        }
    }
}

export const Callbacks = () => {
    let callbacks: Function[] = [];

    return {
        apply: (context: any, args: any[]) => {
            callbacks.forEach(callback => {
                callback.apply(context, args);
            });
        },
        external: {
            on: (callback: Function) => {
                callbacks.push(callback);
            },
            off: (callback: Function) => {
                callbacks = callbacks.filter(i => i !== callback);
            }
        }
    };
};

export const PlayerWidget = (iframe: HTMLIFrameElement) => {
    const api = new MixcloudPlayerWidgetApiRPC(iframe);

    // Only public methods
    return api.external;
};
