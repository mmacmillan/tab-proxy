/*
TabProxy.js
-----------
    The TabProxy intends to allow methods to be "bridged" across tabs, allowing them to synchronize when they are invoked, sharing the arguments each time.  A 
    bridged method that is invoked in any tab fill fire in all the other tabs with the same arguments.  localStorage is used as the bridge, so if the browser
    doesn't support it, currently they are out of luck.

    Mike MacMillan
    mikejmacmillan@gmail.com
*/
;!function(undefined) {
    var _methods = {},
        _bridge = { queue: {} };

    //** polyfill/override the Storage object here if you feel up to it; currently unsupported
    if(!window.localStorage) return;

    function loadBridge(src) {
        //** load the bridge from localStorage, ensuring its exists if not there
        var b = JSON.parse(src||localStorage.getItem(_pxy.storageKey));
        b && (_bridge = b) || localStorage.setItem(_pxy.storageKey, JSON.stringify((_bridge = { queue: {} })));

        //** provide the implementation for the bridge object
        _bridge.invoke = function(key, args, save) { 
            !_bridge.queue[key] && (_bridge.queue[key] = []);

            //** queue the method by key, along with its args
            _bridge.queue[key].push({
                source: window._ProxyId,
                args: args
            });

            if(save) {
                //** this will invoke the localStorage 'storage' event listeners
                localStorage.setItem(_pxy.storageKey, JSON.stringify(_bridge));

                //** reset the queue with the assumption that things are handled; i dont like that this requires a double event, but meh for now
                _bridge.queue = {};
                setTimeout(function() { localStorage.setItem(_pxy.storageKey, JSON.stringify(_bridge)); }, 0);
            }
        }

        _bridge.handleEvent = function(e) {
            //** make sure this is a bridge event
            if(e && e.key !== _pxy.storageKey) return;

            //** sync the bridge with localStorage
            loadBridge(e.newValue);

            //** for each method in the queue, fire its handler
            for(var s in _bridge.queue) {
                var q = _bridge.queue[s];
                q && q.forEach(function(evt) {
                    if(evt.source == window._ProxyId) return; //** dont handle your own events...

                    //** get the fn handler by key invoking it with the proxied args if found
                    var handler = _methods[s];
                    handler && handler.fn && handler.fn.apply(handler.ctx, evt.args);
                });
            }
        }
    }

    //** dereference a dot notation key, returning the parent and fn objects
    function getObject(key, ctx) {
        var parts = key.split('.');
        var c = ctx||window, p = null, fn = null;

        for(var i=0;i<parts.length;i++)
            (p = c) && (c = c[parts[i]]);

        //** make sure we have a fn...
        if(!((fn = c) instanceof Function)) return;
        return  {
            parent: p, 
            fn: fn,
            ctx: ctx||window,
            name: parts[parts.length-1]
        }
    }

    var _pxy = {
        storageKey: 'tabproxy-bridge',

        register: function(win) {
            if(win._ProxyId) return; //** assuming its been registered...
            win._ProxyId = (new Date*1);

            loadBridge();

            //** when the window closes, remove it from anything its subscribed to
            win.addEventListener('storage', _bridge.handleEvent);
        },

        bridge: function(key, ctx) {
            //** ensure the window is registered with the proxy
            !window._ProxyId && _pxy.register(window);

            //** get the function and parent object we want to bridge
            var obj = _methods[key] = getObject(key, ctx);
            if(!obj) return;

            //** reimplement the function to invoke the event across the bridge, as well as locally
            obj.parent[obj.name] = function() {
                var args = Array.prototype.slice.call(arguments, 1);
                obj.fn.apply(obj.ctx, args);
                _bridge.invoke(key, args, true);
            }
        },

        all: function() { return { bridge: _bridge, methods: _methods } }
    }

    window['TabProxy'] = TabProxy = _pxy;
}();
