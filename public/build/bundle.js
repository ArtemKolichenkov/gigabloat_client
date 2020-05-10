
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_svg_attributes(node, attributes) {
        for (const key in attributes) {
            attr(node, key, attributes[key]);
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function claim_element(nodes, name, attributes, svg) {
        for (let i = 0; i < nodes.length; i += 1) {
            const node = nodes[i];
            if (node.nodeName === name) {
                let j = 0;
                while (j < node.attributes.length) {
                    const attribute = node.attributes[j];
                    if (attributes[attribute.name]) {
                        j++;
                    }
                    else {
                        node.removeAttribute(attribute.name);
                    }
                }
                return nodes.splice(i, 1)[0];
            }
        }
        return svg ? svg_element(name) : element(name);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.21.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function slide(node, { delay = 0, duration = 400, easing = cubicOut }) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => `overflow: hidden;` +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }

    /* src/Components/Heading.svelte generated by Svelte v3.21.0 */

    const file = "src/Components/Heading.svelte";

    function create_fragment(ctx) {
    	let h1;
    	let t;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t = text(/*title*/ ctx[0]);
    			attr_dev(h1, "class", "svelte-1702bsg");
    			add_location(h1, file, 12, 0, 157);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*title*/ 1) set_data_dev(t, /*title*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { title } = $$props;
    	const writable_props = ["title"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Heading> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Heading", $$slots, []);

    	$$self.$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    	};

    	$$self.$capture_state = () => ({ title });

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title];
    }

    class Heading extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { title: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Heading",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*title*/ ctx[0] === undefined && !("title" in props)) {
    			console.warn("<Heading> was created without expected prop 'title'");
    		}
    	}

    	get title() {
    		throw new Error("<Heading>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Heading>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Components/Card.svelte generated by Svelte v3.21.0 */
    const file$1 = "src/Components/Card.svelte";

    // (47:2) {#if expanded}
    function create_if_block(ctx) {
    	let div;
    	let div_transition;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "content svelte-1xy8nrp");
    			add_location(div, file$1, 47, 4, 976);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[3], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null));
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);

    			if (local) {
    				add_render_callback(() => {
    					if (!div_transition) div_transition = create_bidirectional_transition(div, slide, { duration: 200 }, true);
    					div_transition.run(1);
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);

    			if (local) {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, slide, { duration: 200 }, false);
    				div_transition.run(0);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(47:2) {#if expanded}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let button;
    	let t1_value = (/*expanded*/ ctx[1] ? "-" : "▼") + "";
    	let t1;
    	let t2;
    	let current;
    	let dispose;

    	const heading = new Heading({
    			props: { title: /*title*/ ctx[0] },
    			$$inline: true
    		});

    	let if_block = /*expanded*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(heading.$$.fragment);
    			t0 = space();
    			button = element("button");
    			t1 = text(t1_value);
    			t2 = space();
    			if (if_block) if_block.c();
    			attr_dev(button, "class", "svelte-1xy8nrp");
    			add_location(button, file$1, 44, 4, 882);
    			attr_dev(div0, "class", "card-heading svelte-1xy8nrp");
    			add_location(div0, file$1, 42, 2, 827);
    			attr_dev(div1, "class", "card-container svelte-1xy8nrp");
    			add_location(div1, file$1, 41, 0, 796);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(heading, div0, null);
    			append_dev(div0, t0);
    			append_dev(div0, button);
    			append_dev(button, t1);
    			append_dev(div1, t2);
    			if (if_block) if_block.m(div1, null);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(button, "click", /*collapseCard*/ ctx[2], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			const heading_changes = {};
    			if (dirty & /*title*/ 1) heading_changes.title = /*title*/ ctx[0];
    			heading.$set(heading_changes);
    			if ((!current || dirty & /*expanded*/ 2) && t1_value !== (t1_value = (/*expanded*/ ctx[1] ? "-" : "▼") + "")) set_data_dev(t1, t1_value);

    			if (/*expanded*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*expanded*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(heading.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(heading.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(heading);
    			if (if_block) if_block.d();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { title } = $$props;
    	let expanded = true;

    	const collapseCard = () => {
    		$$invalidate(1, expanded = !expanded);
    	};

    	const writable_props = ["title"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Card", $$slots, ['default']);

    	$$self.$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		slide,
    		title,
    		Heading,
    		expanded,
    		collapseCard
    	});

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("expanded" in $$props) $$invalidate(1, expanded = $$props.expanded);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, expanded, collapseCard, $$scope, $$slots];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { title: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*title*/ ctx[0] === undefined && !("title" in props)) {
    			console.warn("<Card> was created without expected prop 'title'");
    		}
    	}

    	get title() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Views/Scan/Summary.svelte generated by Svelte v3.21.0 */
    const file$2 = "src/Views/Scan/Summary.svelte";

    // (5:0) <Card title="Summary">
    function create_default_slot(ctx) {
    	let p0;
    	let t1;
    	let p1;
    	let t3;
    	let p2;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "Target: ~/Media/Images";
    			t1 = space();
    			p1 = element("p");
    			p1.textContent = "Initiated: 05 January 2020 19:32";
    			t3 = space();
    			p2 = element("p");
    			p2.textContent = "Finished: 05 January 2020 20:44";
    			add_location(p0, file$2, 5, 2, 96);
    			add_location(p1, file$2, 6, 2, 128);
    			add_location(p2, file$2, 7, 2, 170);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p2, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(5:0) <Card title=\\\"Summary\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let current;

    	const card = new Card({
    			props: {
    				title: "Summary",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(card.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const card_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				card_changes.$$scope = { dirty, ctx };
    			}

    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Summary> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Summary", $$slots, []);
    	$$self.$capture_state = () => ({ Card });
    	return [];
    }

    class Summary extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Summary",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/Views/Scan/Overview.svelte generated by Svelte v3.21.0 */
    const file$3 = "src/Views/Scan/Overview.svelte";

    // (5:0) <Card title="Overview">
    function create_default_slot$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Pie Chart goes here";
    			add_location(p, file$3, 5, 2, 97);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(5:0) <Card title=\\\"Overview\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let current;

    	const card = new Card({
    			props: {
    				title: "Overview",
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(card.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const card_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				card_changes.$$scope = { dirty, ctx };
    			}

    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Overview> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Overview", $$slots, []);
    	$$self.$capture_state = () => ({ Card });
    	return [];
    }

    class Overview extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Overview",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/Views/Scan/FileTypes.svelte generated by Svelte v3.21.0 */
    const file$4 = "src/Views/Scan/FileTypes.svelte";

    // (5:0) <Card title="File types">
    function create_default_slot$2(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "File type table goes here";
    			add_location(p, file$4, 5, 2, 99);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(5:0) <Card title=\\\"File types\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let current;

    	const card = new Card({
    			props: {
    				title: "File types",
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(card.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const card_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				card_changes.$$scope = { dirty, ctx };
    			}

    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FileTypes> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("FileTypes", $$slots, []);
    	$$self.$capture_state = () => ({ Card });
    	return [];
    }

    class FileTypes extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FileTypes",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/Views/Scan/Folders.svelte generated by Svelte v3.21.0 */
    const file$5 = "src/Views/Scan/Folders.svelte";

    // (5:0) <Card title="Folders">
    function create_default_slot$3(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Folder table goes here";
    			add_location(p, file$5, 5, 2, 96);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(5:0) <Card title=\\\"Folders\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let current;

    	const card = new Card({
    			props: {
    				title: "Folders",
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(card.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const card_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				card_changes.$$scope = { dirty, ctx };
    			}

    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Folders> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Folders", $$slots, []);
    	$$self.$capture_state = () => ({ Card });
    	return [];
    }

    class Folders extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Folders",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/Views/Scan/Scan.svelte generated by Svelte v3.21.0 */

    function create_fragment$6(ctx) {
    	let t0;
    	let t1;
    	let t2;
    	let current;
    	const summary = new Summary({ $$inline: true });
    	const overview = new Overview({ $$inline: true });
    	const filetypes = new FileTypes({ $$inline: true });
    	const folders = new Folders({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(summary.$$.fragment);
    			t0 = space();
    			create_component(overview.$$.fragment);
    			t1 = space();
    			create_component(filetypes.$$.fragment);
    			t2 = space();
    			create_component(folders.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(summary, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(overview, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(filetypes, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(folders, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(summary.$$.fragment, local);
    			transition_in(overview.$$.fragment, local);
    			transition_in(filetypes.$$.fragment, local);
    			transition_in(folders.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(summary.$$.fragment, local);
    			transition_out(overview.$$.fragment, local);
    			transition_out(filetypes.$$.fragment, local);
    			transition_out(folders.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(summary, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(overview, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(filetypes, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(folders, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Scan> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Scan", $$slots, []);
    	$$self.$capture_state = () => ({ Summary, Overview, FileTypes, Folders });
    	return [];
    }

    class Scan extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Scan",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/Components/Button.svelte generated by Svelte v3.21.0 */

    const file$6 = "src/Components/Button.svelte";

    function create_fragment$7(ctx) {
    	let button;
    	let t;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(/*text*/ ctx[0]);
    			button.disabled = /*disabled*/ ctx[2];
    			attr_dev(button, "class", "svelte-1a1l7yj");
    			add_location(button, file$6, 14, 0, 200);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);
    			if (remount) dispose();

    			dispose = listen_dev(
    				button,
    				"click",
    				function () {
    					if (is_function(/*onclick*/ ctx[1])) /*onclick*/ ctx[1].apply(this, arguments);
    				},
    				false,
    				false,
    				false
    			);
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			if (dirty & /*text*/ 1) set_data_dev(t, /*text*/ ctx[0]);

    			if (dirty & /*disabled*/ 4) {
    				prop_dev(button, "disabled", /*disabled*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { text } = $$props;
    	let { onclick } = $$props;
    	let { disabled = false } = $$props;
    	const writable_props = ["text", "onclick", "disabled"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Button", $$slots, []);

    	$$self.$set = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("onclick" in $$props) $$invalidate(1, onclick = $$props.onclick);
    		if ("disabled" in $$props) $$invalidate(2, disabled = $$props.disabled);
    	};

    	$$self.$capture_state = () => ({ text, onclick, disabled });

    	$$self.$inject_state = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("onclick" in $$props) $$invalidate(1, onclick = $$props.onclick);
    		if ("disabled" in $$props) $$invalidate(2, disabled = $$props.disabled);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [text, onclick, disabled];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { text: 0, onclick: 1, disabled: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*text*/ ctx[0] === undefined && !("text" in props)) {
    			console.warn("<Button> was created without expected prop 'text'");
    		}

    		if (/*onclick*/ ctx[1] === undefined && !("onclick" in props)) {
    			console.warn("<Button> was created without expected prop 'onclick'");
    		}
    	}

    	get text() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onclick() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onclick(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Components/Tree/Content.svelte generated by Svelte v3.21.0 */
    const file$7 = "src/Components/Tree/Content.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (23:2) {#each files as file}
    function create_each_block_1(ctx) {
    	let li;
    	let t0_value = /*file*/ ctx[6].filename + "";
    	let t0;
    	let t1;
    	let t2_value = /*file*/ ctx[6].hrSize + "";
    	let t2;
    	let t3;
    	let t4_value = /*file*/ ctx[6].category + "";
    	let t4;
    	let t5;

    	const block = {
    		c: function create() {
    			li = element("li");
    			t0 = text(t0_value);
    			t1 = text(" (");
    			t2 = text(t2_value);
    			t3 = space();
    			t4 = text(t4_value);
    			t5 = text(")");
    			add_location(li, file$7, 23, 4, 328);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t0);
    			append_dev(li, t1);
    			append_dev(li, t2);
    			append_dev(li, t3);
    			append_dev(li, t4);
    			append_dev(li, t5);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*files*/ 1 && t0_value !== (t0_value = /*file*/ ctx[6].filename + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*files*/ 1 && t2_value !== (t2_value = /*file*/ ctx[6].hrSize + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*files*/ 1 && t4_value !== (t4_value = /*file*/ ctx[6].category + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(23:2) {#each files as file}",
    		ctx
    	});

    	return block;
    }

    // (26:2) {#if directories}
    function create_if_block$1(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*directories*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*directories*/ 2) {
    				each_value = /*directories*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(26:2) {#if directories}",
    		ctx
    	});

    	return block;
    }

    // (27:4) {#each directories as dir}
    function create_each_block(ctx) {
    	let current;

    	const directory = new Directory({
    			props: {
    				dir: /*dir*/ ctx[3],
    				files: /*dir*/ ctx[3].files,
    				directories: /*dir*/ ctx[3].subdirectories
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(directory.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(directory, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const directory_changes = {};
    			if (dirty & /*directories*/ 2) directory_changes.dir = /*dir*/ ctx[3];
    			if (dirty & /*directories*/ 2) directory_changes.files = /*dir*/ ctx[3].files;
    			if (dirty & /*directories*/ 2) directory_changes.directories = /*dir*/ ctx[3].subdirectories;
    			directory.$set(directory_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(directory.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(directory.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(directory, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(27:4) {#each directories as dir}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let ul;
    	let t;
    	let current;
    	let each_value_1 = /*files*/ ctx[0];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let if_block = /*directories*/ ctx[1] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(ul, "class", "nested svelte-1cnbjte");
    			toggle_class(ul, "active", /*open*/ ctx[2]);
    			add_location(ul, file$7, 21, 0, 260);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(ul, t);
    			if (if_block) if_block.m(ul, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*files*/ 1) {
    				each_value_1 = /*files*/ ctx[0];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (/*directories*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*directories*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(ul, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*open*/ 4) {
    				toggle_class(ul, "active", /*open*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { files } = $$props;
    	let { directories } = $$props;
    	let { open } = $$props;
    	const writable_props = ["files", "directories", "open"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Content> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Content", $$slots, []);

    	$$self.$set = $$props => {
    		if ("files" in $$props) $$invalidate(0, files = $$props.files);
    		if ("directories" in $$props) $$invalidate(1, directories = $$props.directories);
    		if ("open" in $$props) $$invalidate(2, open = $$props.open);
    	};

    	$$self.$capture_state = () => ({ Directory, files, directories, open });

    	$$self.$inject_state = $$props => {
    		if ("files" in $$props) $$invalidate(0, files = $$props.files);
    		if ("directories" in $$props) $$invalidate(1, directories = $$props.directories);
    		if ("open" in $$props) $$invalidate(2, open = $$props.open);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [files, directories, open];
    }

    class Content extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { files: 0, directories: 1, open: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Content",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*files*/ ctx[0] === undefined && !("files" in props)) {
    			console.warn("<Content> was created without expected prop 'files'");
    		}

    		if (/*directories*/ ctx[1] === undefined && !("directories" in props)) {
    			console.warn("<Content> was created without expected prop 'directories'");
    		}

    		if (/*open*/ ctx[2] === undefined && !("open" in props)) {
    			console.warn("<Content> was created without expected prop 'open'");
    		}
    	}

    	get files() {
    		throw new Error("<Content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set files(value) {
    		throw new Error("<Content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get directories() {
    		throw new Error("<Content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set directories(value) {
    		throw new Error("<Content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get open() {
    		throw new Error("<Content>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set open(value) {
    		throw new Error("<Content>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Components/Tree/Directory.svelte generated by Svelte v3.21.0 */
    const file$8 = "src/Components/Tree/Directory.svelte";

    function create_fragment$9(ctx) {
    	let li;
    	let span;
    	let t0_value = /*dir*/ ctx[0].name + "";
    	let t0;
    	let t1;
    	let t2_value = /*dir*/ ctx[0].hrSize + "";
    	let t2;
    	let t3;
    	let t4;
    	let current;
    	let dispose;

    	const content = new Content({
    			props: {
    				files: /*files*/ ctx[1],
    				directories: /*directories*/ ctx[2],
    				open: /*open*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			li = element("li");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = text(" (");
    			t2 = text(t2_value);
    			t3 = text(")");
    			t4 = space();
    			create_component(content.$$.fragment);
    			attr_dev(span, "class", "caret svelte-1jiw9cq");
    			toggle_class(span, "caret-down", /*open*/ ctx[3]);
    			add_location(span, file$8, 31, 2, 453);
    			add_location(li, file$8, 30, 0, 446);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, li, anchor);
    			append_dev(li, span);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(span, t2);
    			append_dev(span, t3);
    			append_dev(li, t4);
    			mount_component(content, li, null);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(span, "click", /*collapse*/ ctx[4], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*dir*/ 1) && t0_value !== (t0_value = /*dir*/ ctx[0].name + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty & /*dir*/ 1) && t2_value !== (t2_value = /*dir*/ ctx[0].hrSize + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*open*/ 8) {
    				toggle_class(span, "caret-down", /*open*/ ctx[3]);
    			}

    			const content_changes = {};
    			if (dirty & /*files*/ 2) content_changes.files = /*files*/ ctx[1];
    			if (dirty & /*directories*/ 4) content_changes.directories = /*directories*/ ctx[2];
    			if (dirty & /*open*/ 8) content_changes.open = /*open*/ ctx[3];
    			content.$set(content_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(content.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(content.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_component(content);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { dir } = $$props;
    	let { files } = $$props;
    	let { directories } = $$props;
    	let open = true;

    	const collapse = () => {
    		$$invalidate(3, open = !open);
    	};

    	const writable_props = ["dir", "files", "directories"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Directory> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Directory", $$slots, []);

    	$$self.$set = $$props => {
    		if ("dir" in $$props) $$invalidate(0, dir = $$props.dir);
    		if ("files" in $$props) $$invalidate(1, files = $$props.files);
    		if ("directories" in $$props) $$invalidate(2, directories = $$props.directories);
    	};

    	$$self.$capture_state = () => ({
    		Content,
    		dir,
    		files,
    		directories,
    		open,
    		collapse
    	});

    	$$self.$inject_state = $$props => {
    		if ("dir" in $$props) $$invalidate(0, dir = $$props.dir);
    		if ("files" in $$props) $$invalidate(1, files = $$props.files);
    		if ("directories" in $$props) $$invalidate(2, directories = $$props.directories);
    		if ("open" in $$props) $$invalidate(3, open = $$props.open);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [dir, files, directories, open, collapse];
    }

    class Directory extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { dir: 0, files: 1, directories: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Directory",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*dir*/ ctx[0] === undefined && !("dir" in props)) {
    			console.warn("<Directory> was created without expected prop 'dir'");
    		}

    		if (/*files*/ ctx[1] === undefined && !("files" in props)) {
    			console.warn("<Directory> was created without expected prop 'files'");
    		}

    		if (/*directories*/ ctx[2] === undefined && !("directories" in props)) {
    			console.warn("<Directory> was created without expected prop 'directories'");
    		}
    	}

    	get dir() {
    		throw new Error("<Directory>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dir(value) {
    		throw new Error("<Directory>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get files() {
    		throw new Error("<Directory>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set files(value) {
    		throw new Error("<Directory>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get directories() {
    		throw new Error("<Directory>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set directories(value) {
    		throw new Error("<Directory>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Components/Tree/Tree.svelte generated by Svelte v3.21.0 */
    const file$9 = "src/Components/Tree/Tree.svelte";

    function create_fragment$a(ctx) {
    	let ul;
    	let current;

    	const directory = new Directory({
    			props: {
    				dir: /*rootDir*/ ctx[0],
    				files: /*rootDir*/ ctx[0].files,
    				directories: /*rootDir*/ ctx[0].subdirectories
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			create_component(directory.$$.fragment);
    			attr_dev(ul, "id", "root");
    			attr_dev(ul, "class", "svelte-yn4u08");
    			add_location(ul, file$9, 45, 0, 756);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			mount_component(directory, ul, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const directory_changes = {};
    			if (dirty & /*rootDir*/ 1) directory_changes.dir = /*rootDir*/ ctx[0];
    			if (dirty & /*rootDir*/ 1) directory_changes.files = /*rootDir*/ ctx[0].files;
    			if (dirty & /*rootDir*/ 1) directory_changes.directories = /*rootDir*/ ctx[0].subdirectories;
    			directory.$set(directory_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(directory.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(directory.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			destroy_component(directory);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	const subsub = [
    		{
    			name: "Super",
    			files: ["RaspberryBomb", "LolKek"]
    		},
    		{
    			name: "Duper",
    			files: ["Bacon", "FrenchToast"]
    		}
    	];

    	const subdirectories = [
    		{
    			name: "Specials",
    			files: ["Peach", "Unicorn"],
    			subdirectories: subsub
    		},
    		{
    			name: "Vegan",
    			files: ["BananaVegan", "StrawberryVegan"]
    		}
    	];

    	let { rootDir = {
    		name: "Milkshakes",
    		files: ["Banana", "Chocolate"],
    		subdirectories
    	} } = $$props;

    	const writable_props = ["rootDir"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tree> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Tree", $$slots, []);

    	$$self.$set = $$props => {
    		if ("rootDir" in $$props) $$invalidate(0, rootDir = $$props.rootDir);
    	};

    	$$self.$capture_state = () => ({
    		Directory,
    		subsub,
    		subdirectories,
    		rootDir
    	});

    	$$self.$inject_state = $$props => {
    		if ("rootDir" in $$props) $$invalidate(0, rootDir = $$props.rootDir);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [rootDir];
    }

    class Tree extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { rootDir: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tree",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get rootDir() {
    		throw new Error("<Tree>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rootDir(value) {
    		throw new Error("<Tree>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const summary = writable("Nothing yet");
    const rootData = writable(null);

    var grpc = require('grpc');

    var gigabloat_proto = require('gigabloat_proto');

    var gigabloatService = grpc.loadPackageDefinition(gigabloat_proto.gigabloatDefinition).gigabloat;
    console.log(gigabloatService);
    var client = new gigabloatService.Gigabloat('localhost:50051',
        grpc.credentials.createInsecure());

    // SETUP OVER


    // REQUEST

    const scanDirectory = async (dirpath) => {
        function scanResultCallback(error, scanResult) {
            if (error) {
                summary.set(error);
                return;
            }
            summary.set(scanResult.summary);
        }

        const payload = {
            path: dirpath,
        };
        console.log('scan');
        client.scanTarget(payload, scanResultCallback);
    };

    const getRoot = async (dirpath) => {
        function rootResultCallback(error, rootResult) {
            if (error) {
                rootData.set(error);
                return;
            }
            rootData.set(rootResult);
        }

        const payload = {
            path: dirpath,
        };
        client.getRoot(payload, rootResultCallback);
    };

    /* src/Views/Filter/Filter.svelte generated by Svelte v3.21.0 */

    const { console: console_1 } = globals;
    const file$a = "src/Views/Filter/Filter.svelte";

    // (64:6) {#if $rootData}
    function create_if_block$2(ctx) {
    	let current;

    	const tree = new Tree({
    			props: { rootDir: /*$rootData*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tree.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tree, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tree_changes = {};
    			if (dirty & /*$rootData*/ 2) tree_changes.rootDir = /*$rootData*/ ctx[1];
    			tree.$set(tree_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tree.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tree.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tree, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(64:6) {#if $rootData}",
    		ctx
    	});

    	return block;
    }

    // (48:0) <Card title="Debugger | Scan">
    function create_default_slot$4(ctx) {
    	let div2;
    	let div0;
    	let t0;
    	let h4;
    	let t1;
    	let t2_value = (/*target*/ ctx[0] || "Not chosen") + "";
    	let t2;
    	let t3;
    	let t4;
    	let pre;
    	let t5_value = JSON.stringify(/*$summary*/ ctx[2], null, 2) + "";
    	let t5;
    	let t6;
    	let div1;
    	let t7;
    	let current;

    	const button0 = new Button({
    			props: {
    				onclick: /*chooseTarget*/ ctx[5],
    				text: "Choose directory"
    			},
    			$$inline: true
    		});

    	const button1 = new Button({
    			props: {
    				onclick: /*getStats*/ ctx[3],
    				text: "Get basic stats",
    				disabled: /*target*/ ctx[0] === undefined
    			},
    			$$inline: true
    		});

    	const button2 = new Button({
    			props: {
    				onclick: /*getRootTree*/ ctx[4],
    				text: "Get root tree",
    				disabled: /*target*/ ctx[0] === undefined
    			},
    			$$inline: true
    		});

    	let if_block = /*$rootData*/ ctx[1] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			create_component(button0.$$.fragment);
    			t0 = space();
    			h4 = element("h4");
    			t1 = text("Target: ");
    			t2 = text(t2_value);
    			t3 = space();
    			create_component(button1.$$.fragment);
    			t4 = space();
    			pre = element("pre");
    			t5 = text(t5_value);
    			t6 = space();
    			div1 = element("div");
    			create_component(button2.$$.fragment);
    			t7 = space();
    			if (if_block) if_block.c();
    			add_location(h4, file$a, 51, 6, 1207);
    			attr_dev(pre, "class", "svelte-evluh8");
    			add_location(pre, file$a, 56, 6, 1372);
    			attr_dev(div0, "class", "card_column svelte-evluh8");
    			add_location(div0, file$a, 49, 4, 1109);
    			attr_dev(div1, "class", "card_column svelte-evluh8");
    			add_location(div1, file$a, 58, 4, 1434);
    			attr_dev(div2, "class", "card_columns svelte-evluh8");
    			add_location(div2, file$a, 48, 2, 1078);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			mount_component(button0, div0, null);
    			append_dev(div0, t0);
    			append_dev(div0, h4);
    			append_dev(h4, t1);
    			append_dev(h4, t2);
    			append_dev(div0, t3);
    			mount_component(button1, div0, null);
    			append_dev(div0, t4);
    			append_dev(div0, pre);
    			append_dev(pre, t5);
    			append_dev(div2, t6);
    			append_dev(div2, div1);
    			mount_component(button2, div1, null);
    			append_dev(div1, t7);
    			if (if_block) if_block.m(div1, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*target*/ 1) && t2_value !== (t2_value = (/*target*/ ctx[0] || "Not chosen") + "")) set_data_dev(t2, t2_value);
    			const button1_changes = {};
    			if (dirty & /*target*/ 1) button1_changes.disabled = /*target*/ ctx[0] === undefined;
    			button1.$set(button1_changes);
    			if ((!current || dirty & /*$summary*/ 4) && t5_value !== (t5_value = JSON.stringify(/*$summary*/ ctx[2], null, 2) + "")) set_data_dev(t5, t5_value);
    			const button2_changes = {};
    			if (dirty & /*target*/ 1) button2_changes.disabled = /*target*/ ctx[0] === undefined;
    			button2.$set(button2_changes);

    			if (/*$rootData*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$rootData*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(button2.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(button0);
    			destroy_component(button1);
    			destroy_component(button2);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(48:0) <Card title=\\\"Debugger | Scan\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let current;

    	const card = new Card({
    			props: {
    				title: "Debugger | Scan",
    				$$slots: { default: [create_default_slot$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(card.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const card_changes = {};

    			if (dirty & /*$$scope, $rootData, target, $summary*/ 263) {
    				card_changes.$$scope = { dirty, ctx };
    			}

    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let $rootData;
    	let $summary;
    	validate_store(rootData, "rootData");
    	component_subscribe($$self, rootData, $$value => $$invalidate(1, $rootData = $$value));
    	validate_store(summary, "summary");
    	component_subscribe($$self, summary, $$value => $$invalidate(2, $summary = $$value));
    	const { dialog } = require("electron").remote;
    	let target = "/Users/artem/Pictures/CVPhotos";
    	let rootSubdirs = $rootData ? $rootData.subdirectories : [];

    	const getStats = () => {
    		console.log("getstats");
    		scanDirectory(target);
    	};

    	const getRootTree = () => {
    		getRoot(target);
    	};

    	const chooseTarget = async () => {
    		$$invalidate(0, target = dialog.showOpenDialogSync({
    			properties: ["openDirectory", "showHiddenFiles"]
    		}));
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Filter> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Filter", $$slots, []);

    	$$self.$capture_state = () => ({
    		dialog,
    		Card,
    		Button,
    		Tree,
    		scanDirectory,
    		getRoot,
    		summary,
    		rootData,
    		target,
    		rootSubdirs,
    		getStats,
    		getRootTree,
    		chooseTarget,
    		$rootData,
    		$summary
    	});

    	$$self.$inject_state = $$props => {
    		if ("target" in $$props) $$invalidate(0, target = $$props.target);
    		if ("rootSubdirs" in $$props) rootSubdirs = $$props.rootSubdirs;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [target, $rootData, $summary, getStats, getRootTree, chooseTarget];
    }

    class Filter extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Filter",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src/Views/Settings/Settings.svelte generated by Svelte v3.21.0 */

    const file$b = "src/Views/Settings/Settings.svelte";

    function create_fragment$c(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "I am settings";
    			add_location(div, file$b, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Settings> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Settings", $$slots, []);
    	return [];
    }

    class Settings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Settings",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src/Views/PageNotFound/PageNotFound.svelte generated by Svelte v3.21.0 */

    const file$c = "src/Views/PageNotFound/PageNotFound.svelte";

    function create_fragment$d(ctx) {
    	let div1;
    	let div0;
    	let p0;
    	let t1;
    	let p1;
    	let t3;
    	let p2;
    	let t5;
    	let p3;
    	let t7;
    	let a;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "Something went wrong. UI routing issue.";
    			t1 = space();
    			p1 = element("p");
    			p1.textContent = "You are not supposed to see this page.";
    			t3 = space();
    			p2 = element("p");
    			p2.textContent = "No worries though, it is probably due to file modified outside of Gigabloat.\n      This message does not mean that something happened to your files.";
    			t5 = space();
    			p3 = element("p");
    			p3.textContent = "If you want to help developers to take a look and possibly fix this issue\n      file a bug report on github";
    			t7 = space();
    			a = element("a");
    			a.textContent = "Go back";
    			add_location(p0, file$c, 16, 4, 256);
    			add_location(p1, file$c, 17, 4, 307);
    			add_location(p2, file$c, 18, 4, 357);
    			add_location(p3, file$c, 22, 4, 529);
    			attr_dev(a, "href", "#scan");
    			add_location(a, file$c, 26, 4, 660);
    			attr_dev(div0, "class", "explanation svelte-9seqxp");
    			add_location(div0, file$c, 15, 2, 226);
    			attr_dev(div1, "class", "no-page-found svelte-9seqxp");
    			add_location(div1, file$c, 14, 0, 196);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, p0);
    			append_dev(div0, t1);
    			append_dev(div0, p1);
    			append_dev(div0, t3);
    			append_dev(div0, p2);
    			append_dev(div0, t5);
    			append_dev(div0, p3);
    			append_dev(div0, t7);
    			append_dev(div0, a);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PageNotFound> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("PageNotFound", $$slots, []);
    	return [];
    }

    class PageNotFound extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PageNotFound",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    const routes = {
      'scan': Scan,
      'filter': Filter,
      'settings': Settings,
    };


    // --- START HASH ROUTER
    const getHash = () => {
      const name = window.location.hash.replace(/^#\/?|\/$/g, "").split("/")[0];
      const component = routes[name];
      return {
        "name": window.location.hash.replace(/^#\/?|\/$/g, "").split("/")[0],
        "component": component || PageNotFound,
      }
    };
    const initialRoute = {
      "name": "filter",
      "component": Filter,
    };
    const hashRouter = readable(initialRoute, set => {
      window.onhashchange = () => set(getHash());
    });
    // --- END HASH ROUTER

    /* src/Sidebar/Icons/piechart.svg generated by Svelte v3.21.0 */

    function create_fragment$e(ctx) {
    	let svg;
    	let path0;
    	let path1;

    	let svg_levels = [
    		{ xmlns: "http://www.w3.org/2000/svg" },
    		{ width: "24" },
    		{ height: "24" },
    		{ viewBox: "0 0 24 24" },
    		{ fill: "none" },
    		{ stroke: "currentColor" },
    		{ "stroke-width": "2" },
    		{ "stroke-linecap": "round" },
    		{ "stroke-linejoin": "round" },
    		{ class: "feather feather-pie-chart" },
    		/*$$props*/ ctx[0]
    	];

    	let svg_data = {};

    	for (let i = 0; i < svg_levels.length; i += 1) {
    		svg_data = assign(svg_data, svg_levels[i]);
    	}

    	return {
    		c() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			this.h();
    		},
    		l(nodes) {
    			svg = claim_element(
    				nodes,
    				"svg",
    				{
    					xmlns: true,
    					width: true,
    					height: true,
    					viewBox: true,
    					fill: true,
    					stroke: true,
    					"stroke-width": true,
    					"stroke-linecap": true,
    					"stroke-linejoin": true,
    					class: true
    				},
    				1
    			);

    			var svg_nodes = children(svg);
    			path0 = claim_element(svg_nodes, "path", { d: true }, 1);
    			children(path0).forEach(detach);
    			path1 = claim_element(svg_nodes, "path", { d: true }, 1);
    			children(path1).forEach(detach);
    			svg_nodes.forEach(detach);
    			this.h();
    		},
    		h() {
    			attr(path0, "d", "M21.21 15.89A10 10 0 1 1 8 2.83");
    			attr(path1, "d", "M22 12A10 10 0 0 0 12 2v10z");
    			set_svg_attributes(svg, svg_data);
    		},
    		m(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, path0);
    			append(svg, path1);
    		},
    		p(ctx, [dirty]) {
    			set_svg_attributes(svg, get_spread_update(svg_levels, [
    				{ xmlns: "http://www.w3.org/2000/svg" },
    				{ width: "24" },
    				{ height: "24" },
    				{ viewBox: "0 0 24 24" },
    				{ fill: "none" },
    				{ stroke: "currentColor" },
    				{ "stroke-width": "2" },
    				{ "stroke-linecap": "round" },
    				{ "stroke-linejoin": "round" },
    				{ class: "feather feather-pie-chart" },
    				dirty & /*$$props*/ 1 && /*$$props*/ ctx[0]
    			]));
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(svg);
    		}
    	};
    }

    function instance$e($$self, $$props, $$invalidate) {
    	$$self.$set = $$new_props => {
    		$$invalidate(0, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    	};

    	$$props = exclude_internal_props($$props);
    	return [$$props];
    }

    class piechart extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});
    	}
    }

    /* src/Sidebar/Icons/filter.svg generated by Svelte v3.21.0 */

    function create_fragment$f(ctx) {
    	let svg;
    	let polygon;

    	let svg_levels = [
    		{ xmlns: "http://www.w3.org/2000/svg" },
    		{ width: "24" },
    		{ height: "24" },
    		{ viewBox: "0 0 24 24" },
    		{ fill: "none" },
    		{ stroke: "currentColor" },
    		{ "stroke-width": "2" },
    		{ "stroke-linecap": "round" },
    		{ "stroke-linejoin": "round" },
    		{ class: "feather feather-filter" },
    		/*$$props*/ ctx[0]
    	];

    	let svg_data = {};

    	for (let i = 0; i < svg_levels.length; i += 1) {
    		svg_data = assign(svg_data, svg_levels[i]);
    	}

    	return {
    		c() {
    			svg = svg_element("svg");
    			polygon = svg_element("polygon");
    			this.h();
    		},
    		l(nodes) {
    			svg = claim_element(
    				nodes,
    				"svg",
    				{
    					xmlns: true,
    					width: true,
    					height: true,
    					viewBox: true,
    					fill: true,
    					stroke: true,
    					"stroke-width": true,
    					"stroke-linecap": true,
    					"stroke-linejoin": true,
    					class: true
    				},
    				1
    			);

    			var svg_nodes = children(svg);
    			polygon = claim_element(svg_nodes, "polygon", { points: true }, 1);
    			children(polygon).forEach(detach);
    			svg_nodes.forEach(detach);
    			this.h();
    		},
    		h() {
    			attr(polygon, "points", "22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3");
    			set_svg_attributes(svg, svg_data);
    		},
    		m(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, polygon);
    		},
    		p(ctx, [dirty]) {
    			set_svg_attributes(svg, get_spread_update(svg_levels, [
    				{ xmlns: "http://www.w3.org/2000/svg" },
    				{ width: "24" },
    				{ height: "24" },
    				{ viewBox: "0 0 24 24" },
    				{ fill: "none" },
    				{ stroke: "currentColor" },
    				{ "stroke-width": "2" },
    				{ "stroke-linecap": "round" },
    				{ "stroke-linejoin": "round" },
    				{ class: "feather feather-filter" },
    				dirty & /*$$props*/ 1 && /*$$props*/ ctx[0]
    			]));
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(svg);
    		}
    	};
    }

    function instance$f($$self, $$props, $$invalidate) {
    	$$self.$set = $$new_props => {
    		$$invalidate(0, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    	};

    	$$props = exclude_internal_props($$props);
    	return [$$props];
    }

    class filter extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});
    	}
    }

    /* src/Sidebar/Icons/copy.svg generated by Svelte v3.21.0 */

    function create_fragment$g(ctx) {
    	let svg;
    	let rect;
    	let path;

    	let svg_levels = [
    		{ xmlns: "http://www.w3.org/2000/svg" },
    		{ width: "24" },
    		{ height: "24" },
    		{ viewBox: "0 0 24 24" },
    		{ fill: "none" },
    		{ stroke: "currentColor" },
    		{ "stroke-width": "2" },
    		{ "stroke-linecap": "round" },
    		{ "stroke-linejoin": "round" },
    		{ class: "feather feather-copy" },
    		/*$$props*/ ctx[0]
    	];

    	let svg_data = {};

    	for (let i = 0; i < svg_levels.length; i += 1) {
    		svg_data = assign(svg_data, svg_levels[i]);
    	}

    	return {
    		c() {
    			svg = svg_element("svg");
    			rect = svg_element("rect");
    			path = svg_element("path");
    			this.h();
    		},
    		l(nodes) {
    			svg = claim_element(
    				nodes,
    				"svg",
    				{
    					xmlns: true,
    					width: true,
    					height: true,
    					viewBox: true,
    					fill: true,
    					stroke: true,
    					"stroke-width": true,
    					"stroke-linecap": true,
    					"stroke-linejoin": true,
    					class: true
    				},
    				1
    			);

    			var svg_nodes = children(svg);

    			rect = claim_element(
    				svg_nodes,
    				"rect",
    				{
    					x: true,
    					y: true,
    					width: true,
    					height: true,
    					rx: true,
    					ry: true
    				},
    				1
    			);

    			children(rect).forEach(detach);
    			path = claim_element(svg_nodes, "path", { d: true }, 1);
    			children(path).forEach(detach);
    			svg_nodes.forEach(detach);
    			this.h();
    		},
    		h() {
    			attr(rect, "x", "9");
    			attr(rect, "y", "9");
    			attr(rect, "width", "13");
    			attr(rect, "height", "13");
    			attr(rect, "rx", "2");
    			attr(rect, "ry", "2");
    			attr(path, "d", "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1");
    			set_svg_attributes(svg, svg_data);
    		},
    		m(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, rect);
    			append(svg, path);
    		},
    		p(ctx, [dirty]) {
    			set_svg_attributes(svg, get_spread_update(svg_levels, [
    				{ xmlns: "http://www.w3.org/2000/svg" },
    				{ width: "24" },
    				{ height: "24" },
    				{ viewBox: "0 0 24 24" },
    				{ fill: "none" },
    				{ stroke: "currentColor" },
    				{ "stroke-width": "2" },
    				{ "stroke-linecap": "round" },
    				{ "stroke-linejoin": "round" },
    				{ class: "feather feather-copy" },
    				dirty & /*$$props*/ 1 && /*$$props*/ ctx[0]
    			]));
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(svg);
    		}
    	};
    }

    function instance$g($$self, $$props, $$invalidate) {
    	$$self.$set = $$new_props => {
    		$$invalidate(0, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    	};

    	$$props = exclude_internal_props($$props);
    	return [$$props];
    }

    class copy extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {});
    	}
    }

    /* src/Sidebar/Icons/layers.svg generated by Svelte v3.21.0 */

    function create_fragment$h(ctx) {
    	let svg;
    	let polygon;
    	let polyline0;
    	let polyline1;

    	let svg_levels = [
    		{ xmlns: "http://www.w3.org/2000/svg" },
    		{ width: "24" },
    		{ height: "24" },
    		{ viewBox: "0 0 24 24" },
    		{ fill: "none" },
    		{ stroke: "currentColor" },
    		{ "stroke-width": "2" },
    		{ "stroke-linecap": "round" },
    		{ "stroke-linejoin": "round" },
    		{ class: "feather feather-layers" },
    		/*$$props*/ ctx[0]
    	];

    	let svg_data = {};

    	for (let i = 0; i < svg_levels.length; i += 1) {
    		svg_data = assign(svg_data, svg_levels[i]);
    	}

    	return {
    		c() {
    			svg = svg_element("svg");
    			polygon = svg_element("polygon");
    			polyline0 = svg_element("polyline");
    			polyline1 = svg_element("polyline");
    			this.h();
    		},
    		l(nodes) {
    			svg = claim_element(
    				nodes,
    				"svg",
    				{
    					xmlns: true,
    					width: true,
    					height: true,
    					viewBox: true,
    					fill: true,
    					stroke: true,
    					"stroke-width": true,
    					"stroke-linecap": true,
    					"stroke-linejoin": true,
    					class: true
    				},
    				1
    			);

    			var svg_nodes = children(svg);
    			polygon = claim_element(svg_nodes, "polygon", { points: true }, 1);
    			children(polygon).forEach(detach);
    			polyline0 = claim_element(svg_nodes, "polyline", { points: true }, 1);
    			children(polyline0).forEach(detach);
    			polyline1 = claim_element(svg_nodes, "polyline", { points: true }, 1);
    			children(polyline1).forEach(detach);
    			svg_nodes.forEach(detach);
    			this.h();
    		},
    		h() {
    			attr(polygon, "points", "12 2 2 7 12 12 22 7 12 2");
    			attr(polyline0, "points", "2 17 12 22 22 17");
    			attr(polyline1, "points", "2 12 12 17 22 12");
    			set_svg_attributes(svg, svg_data);
    		},
    		m(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, polygon);
    			append(svg, polyline0);
    			append(svg, polyline1);
    		},
    		p(ctx, [dirty]) {
    			set_svg_attributes(svg, get_spread_update(svg_levels, [
    				{ xmlns: "http://www.w3.org/2000/svg" },
    				{ width: "24" },
    				{ height: "24" },
    				{ viewBox: "0 0 24 24" },
    				{ fill: "none" },
    				{ stroke: "currentColor" },
    				{ "stroke-width": "2" },
    				{ "stroke-linecap": "round" },
    				{ "stroke-linejoin": "round" },
    				{ class: "feather feather-layers" },
    				dirty & /*$$props*/ 1 && /*$$props*/ ctx[0]
    			]));
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(svg);
    		}
    	};
    }

    function instance$h($$self, $$props, $$invalidate) {
    	$$self.$set = $$new_props => {
    		$$invalidate(0, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    	};

    	$$props = exclude_internal_props($$props);
    	return [$$props];
    }

    class layers extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {});
    	}
    }

    /* src/Sidebar/Icons/settings.svg generated by Svelte v3.21.0 */

    function create_fragment$i(ctx) {
    	let svg;
    	let circle;
    	let path;

    	let svg_levels = [
    		{ xmlns: "http://www.w3.org/2000/svg" },
    		{ width: "24" },
    		{ height: "24" },
    		{ viewBox: "0 0 24 24" },
    		{ fill: "none" },
    		{ stroke: "currentColor" },
    		{ "stroke-width": "2" },
    		{ "stroke-linecap": "round" },
    		{ "stroke-linejoin": "round" },
    		{ class: "feather feather-settings" },
    		/*$$props*/ ctx[0]
    	];

    	let svg_data = {};

    	for (let i = 0; i < svg_levels.length; i += 1) {
    		svg_data = assign(svg_data, svg_levels[i]);
    	}

    	return {
    		c() {
    			svg = svg_element("svg");
    			circle = svg_element("circle");
    			path = svg_element("path");
    			this.h();
    		},
    		l(nodes) {
    			svg = claim_element(
    				nodes,
    				"svg",
    				{
    					xmlns: true,
    					width: true,
    					height: true,
    					viewBox: true,
    					fill: true,
    					stroke: true,
    					"stroke-width": true,
    					"stroke-linecap": true,
    					"stroke-linejoin": true,
    					class: true
    				},
    				1
    			);

    			var svg_nodes = children(svg);
    			circle = claim_element(svg_nodes, "circle", { cx: true, cy: true, r: true }, 1);
    			children(circle).forEach(detach);
    			path = claim_element(svg_nodes, "path", { d: true }, 1);
    			children(path).forEach(detach);
    			svg_nodes.forEach(detach);
    			this.h();
    		},
    		h() {
    			attr(circle, "cx", "12");
    			attr(circle, "cy", "12");
    			attr(circle, "r", "3");
    			attr(path, "d", "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z");
    			set_svg_attributes(svg, svg_data);
    		},
    		m(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, circle);
    			append(svg, path);
    		},
    		p(ctx, [dirty]) {
    			set_svg_attributes(svg, get_spread_update(svg_levels, [
    				{ xmlns: "http://www.w3.org/2000/svg" },
    				{ width: "24" },
    				{ height: "24" },
    				{ viewBox: "0 0 24 24" },
    				{ fill: "none" },
    				{ stroke: "currentColor" },
    				{ "stroke-width": "2" },
    				{ "stroke-linecap": "round" },
    				{ "stroke-linejoin": "round" },
    				{ class: "feather feather-settings" },
    				dirty & /*$$props*/ 1 && /*$$props*/ ctx[0]
    			]));
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(svg);
    		}
    	};
    }

    function instance$i($$self, $$props, $$invalidate) {
    	$$self.$set = $$new_props => {
    		$$invalidate(0, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    	};

    	$$props = exclude_internal_props($$props);
    	return [$$props];
    }

    class settings extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, {});
    	}
    }

    /* src/Sidebar/MenuItem.svelte generated by Svelte v3.21.0 */
    const file$d = "src/Sidebar/MenuItem.svelte";

    // (88:4) {#if active}
    function create_if_block$3(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = " ";
    			attr_dev(div, "class", "active-indicator svelte-3kl0bt");
    			add_location(div, file$d, 88, 6, 1770);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(88:4) {#if active}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$j(ctx) {
    	let a;
    	let li;
    	let div;
    	let icon_1;
    	let t0;
    	let t1;
    	let t2;
    	let if_block = /*active*/ ctx[2] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			a = element("a");
    			li = element("li");
    			div = element("div");
    			icon_1 = element("icon");
    			t0 = space();
    			t1 = text(/*title*/ ctx[0]);
    			t2 = space();
    			if (if_block) if_block.c();
    			attr_dev(icon_1, "width", "20");
    			add_location(icon_1, file$d, 84, 6, 1702);
    			attr_dev(div, "class", "main svelte-3kl0bt");
    			toggle_class(div, "active", /*active*/ ctx[2]);
    			toggle_class(div, "hoverable", !/*active*/ ctx[2]);
    			add_location(div, file$d, 81, 4, 1508);
    			attr_dev(li, "class", "svelte-3kl0bt");
    			add_location(li, file$d, 80, 2, 1499);
    			attr_dev(a, "href", /*href*/ ctx[1]);
    			attr_dev(a, "class", "svelte-3kl0bt");
    			add_location(a, file$d, 79, 0, 1486);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, li);
    			append_dev(li, div);
    			append_dev(div, icon_1);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(li, t2);
    			if (if_block) if_block.m(li, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*title*/ 1) set_data_dev(t1, /*title*/ ctx[0]);

    			if (dirty & /*active*/ 4) {
    				toggle_class(div, "active", /*active*/ ctx[2]);
    			}

    			if (dirty & /*active*/ 4) {
    				toggle_class(div, "hoverable", !/*active*/ ctx[2]);
    			}

    			if (/*active*/ ctx[2]) {
    				if (if_block) ; else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(li, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*href*/ 2) {
    				attr_dev(a, "href", /*href*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let { title } = $$props;
    	let { href } = $$props;
    	let { active = false } = $$props;

    	const getIcon = title => {
    		switch (title) {
    			case "Scan":
    				return piechart;
    			case "Filter":
    				return filter;
    			case "Find similar":
    				return copy;
    			case "Cleanup":
    				return layers;
    			case "Settings":
    				return settings;
    		}
    	};

    	const icon = getIcon(title);
    	const writable_props = ["title", "href", "active"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MenuItem> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("MenuItem", $$slots, []);

    	$$self.$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("href" in $$props) $$invalidate(1, href = $$props.href);
    		if ("active" in $$props) $$invalidate(2, active = $$props.active);
    	};

    	$$self.$capture_state = () => ({
    		title,
    		href,
    		active,
    		piechart,
    		filter,
    		copy,
    		layers,
    		settings,
    		getIcon,
    		icon
    	});

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("href" in $$props) $$invalidate(1, href = $$props.href);
    		if ("active" in $$props) $$invalidate(2, active = $$props.active);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, href, active];
    }

    class MenuItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, { title: 0, href: 1, active: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MenuItem",
    			options,
    			id: create_fragment$j.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*title*/ ctx[0] === undefined && !("title" in props)) {
    			console.warn("<MenuItem> was created without expected prop 'title'");
    		}

    		if (/*href*/ ctx[1] === undefined && !("href" in props)) {
    			console.warn("<MenuItem> was created without expected prop 'href'");
    		}
    	}

    	get title() {
    		throw new Error("<MenuItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<MenuItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error("<MenuItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<MenuItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get active() {
    		throw new Error("<MenuItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<MenuItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Sidebar/Menu.svelte generated by Svelte v3.21.0 */
    const file$e = "src/Sidebar/Menu.svelte";

    function create_fragment$k(ctx) {
    	let nav;
    	let ul;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let current;

    	const menuitem0 = new MenuItem({
    			props: {
    				title: "Scan",
    				href: "#scan",
    				active: /*currentRouteName*/ ctx[0] === "scan"
    			},
    			$$inline: true
    		});

    	const menuitem1 = new MenuItem({
    			props: {
    				title: "Filter",
    				href: "#filter",
    				active: /*currentRouteName*/ ctx[0] === "filter"
    			},
    			$$inline: true
    		});

    	const menuitem2 = new MenuItem({
    			props: {
    				title: "Find similar",
    				href: "#findsimilar",
    				active: /*currentRouteName*/ ctx[0] === "findsimilar"
    			},
    			$$inline: true
    		});

    	const menuitem3 = new MenuItem({
    			props: {
    				title: "Cleanup",
    				href: "#cleanup",
    				active: /*currentRouteName*/ ctx[0] === "cleanup"
    			},
    			$$inline: true
    		});

    	const menuitem4 = new MenuItem({
    			props: {
    				title: "Settings",
    				href: "#settings",
    				active: /*currentRouteName*/ ctx[0] === "settings"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			ul = element("ul");
    			create_component(menuitem0.$$.fragment);
    			t0 = space();
    			create_component(menuitem1.$$.fragment);
    			t1 = space();
    			create_component(menuitem2.$$.fragment);
    			t2 = space();
    			create_component(menuitem3.$$.fragment);
    			t3 = space();
    			create_component(menuitem4.$$.fragment);
    			attr_dev(ul, "class", "svelte-1ogikqo");
    			add_location(ul, file$e, 13, 2, 175);
    			add_location(nav, file$e, 12, 0, 167);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, ul);
    			mount_component(menuitem0, ul, null);
    			append_dev(ul, t0);
    			mount_component(menuitem1, ul, null);
    			append_dev(ul, t1);
    			mount_component(menuitem2, ul, null);
    			append_dev(ul, t2);
    			mount_component(menuitem3, ul, null);
    			append_dev(ul, t3);
    			mount_component(menuitem4, ul, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const menuitem0_changes = {};
    			if (dirty & /*currentRouteName*/ 1) menuitem0_changes.active = /*currentRouteName*/ ctx[0] === "scan";
    			menuitem0.$set(menuitem0_changes);
    			const menuitem1_changes = {};
    			if (dirty & /*currentRouteName*/ 1) menuitem1_changes.active = /*currentRouteName*/ ctx[0] === "filter";
    			menuitem1.$set(menuitem1_changes);
    			const menuitem2_changes = {};
    			if (dirty & /*currentRouteName*/ 1) menuitem2_changes.active = /*currentRouteName*/ ctx[0] === "findsimilar";
    			menuitem2.$set(menuitem2_changes);
    			const menuitem3_changes = {};
    			if (dirty & /*currentRouteName*/ 1) menuitem3_changes.active = /*currentRouteName*/ ctx[0] === "cleanup";
    			menuitem3.$set(menuitem3_changes);
    			const menuitem4_changes = {};
    			if (dirty & /*currentRouteName*/ 1) menuitem4_changes.active = /*currentRouteName*/ ctx[0] === "settings";
    			menuitem4.$set(menuitem4_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(menuitem0.$$.fragment, local);
    			transition_in(menuitem1.$$.fragment, local);
    			transition_in(menuitem2.$$.fragment, local);
    			transition_in(menuitem3.$$.fragment, local);
    			transition_in(menuitem4.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(menuitem0.$$.fragment, local);
    			transition_out(menuitem1.$$.fragment, local);
    			transition_out(menuitem2.$$.fragment, local);
    			transition_out(menuitem3.$$.fragment, local);
    			transition_out(menuitem4.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			destroy_component(menuitem0);
    			destroy_component(menuitem1);
    			destroy_component(menuitem2);
    			destroy_component(menuitem3);
    			destroy_component(menuitem4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$k($$self, $$props, $$invalidate) {
    	let { currentRouteName } = $$props;
    	const writable_props = ["currentRouteName"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Menu> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Menu", $$slots, []);

    	$$self.$set = $$props => {
    		if ("currentRouteName" in $$props) $$invalidate(0, currentRouteName = $$props.currentRouteName);
    	};

    	$$self.$capture_state = () => ({ currentRouteName, MenuItem });

    	$$self.$inject_state = $$props => {
    		if ("currentRouteName" in $$props) $$invalidate(0, currentRouteName = $$props.currentRouteName);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [currentRouteName];
    }

    class Menu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, { currentRouteName: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Menu",
    			options,
    			id: create_fragment$k.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*currentRouteName*/ ctx[0] === undefined && !("currentRouteName" in props)) {
    			console.warn("<Menu> was created without expected prop 'currentRouteName'");
    		}
    	}

    	get currentRouteName() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set currentRouteName(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Sidebar/Sidebar.svelte generated by Svelte v3.21.0 */
    const file$f = "src/Sidebar/Sidebar.svelte";

    function create_fragment$l(ctx) {
    	let aside;
    	let h1;
    	let t1;
    	let current;

    	const menu = new Menu({
    			props: {
    				currentRouteName: /*currentRouteName*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			aside = element("aside");
    			h1 = element("h1");
    			h1.textContent = "File sorter";
    			t1 = space();
    			create_component(menu.$$.fragment);
    			attr_dev(h1, "class", "svelte-69k9fo");
    			add_location(h1, file$f, 21, 2, 338);
    			attr_dev(aside, "class", "svelte-69k9fo");
    			add_location(aside, file$f, 20, 0, 328);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, aside, anchor);
    			append_dev(aside, h1);
    			append_dev(aside, t1);
    			mount_component(menu, aside, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const menu_changes = {};
    			if (dirty & /*currentRouteName*/ 1) menu_changes.currentRouteName = /*currentRouteName*/ ctx[0];
    			menu.$set(menu_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(menu.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(menu.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(aside);
    			destroy_component(menu);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$l($$self, $$props, $$invalidate) {
    	let { currentRouteName } = $$props;
    	const writable_props = ["currentRouteName"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Sidebar> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Sidebar", $$slots, []);

    	$$self.$set = $$props => {
    		if ("currentRouteName" in $$props) $$invalidate(0, currentRouteName = $$props.currentRouteName);
    	};

    	$$self.$capture_state = () => ({ currentRouteName, Menu });

    	$$self.$inject_state = $$props => {
    		if ("currentRouteName" in $$props) $$invalidate(0, currentRouteName = $$props.currentRouteName);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [currentRouteName];
    }

    class Sidebar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$l, create_fragment$l, safe_not_equal, { currentRouteName: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sidebar",
    			options,
    			id: create_fragment$l.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*currentRouteName*/ ctx[0] === undefined && !("currentRouteName" in props)) {
    			console.warn("<Sidebar> was created without expected prop 'currentRouteName'");
    		}
    	}

    	get currentRouteName() {
    		throw new Error("<Sidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set currentRouteName(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/DefaultLayout.svelte generated by Svelte v3.21.0 */
    const file$g = "src/DefaultLayout.svelte";

    function create_fragment$m(ctx) {
    	let t;
    	let div;
    	let current;

    	const sidebar = new Sidebar({
    			props: {
    				currentRouteName: /*$hashRouter*/ ctx[0].name
    			},
    			$$inline: true
    		});

    	var switch_value = /*$hashRouter*/ ctx[0].component;

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			create_component(sidebar.$$.fragment);
    			t = space();
    			div = element("div");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			attr_dev(div, "class", "main-area svelte-weatwc");
    			add_location(div, file$g, 16, 0, 395);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(sidebar, target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const sidebar_changes = {};
    			if (dirty & /*$hashRouter*/ 1) sidebar_changes.currentRouteName = /*$hashRouter*/ ctx[0].name;
    			sidebar.$set(sidebar_changes);

    			if (switch_value !== (switch_value = /*$hashRouter*/ ctx[0].component)) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, div, null);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sidebar.$$.fragment, local);
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sidebar.$$.fragment, local);
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(sidebar, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    			if (switch_instance) destroy_component(switch_instance);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$m.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$m($$self, $$props, $$invalidate) {
    	let $hashRouter;
    	validate_store(hashRouter, "hashRouter");
    	component_subscribe($$self, hashRouter, $$value => $$invalidate(0, $hashRouter = $$value));
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DefaultLayout> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("DefaultLayout", $$slots, []);

    	$$self.$capture_state = () => ({
    		hashRouter,
    		Sidebar,
    		Scan,
    		Settings,
    		$hashRouter
    	});

    	return [$hashRouter];
    }

    class DefaultLayout extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$m, create_fragment$m, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DefaultLayout",
    			options,
    			id: create_fragment$m.name
    		});
    	}
    }

    const themes = [
        {
            name: 'light',
            colors: {
                text: '#282230',
                background100: "#f1f1f1",
            },
        },
        {
            name: 'dark',
            colors: {
                text: '#ffffff', // Correct
                headingText: '#FFE4E1', // Correct
                background100: "#24282D",
                background200: "#2F353D",
                background300: "#4C5562",
                accentPrimary: "#FEAB7F", // Correct
            },
        },
    ];

    const fonts = {
        normal: '16px',
        heading: '24px',
    };

    /* src/Contexts/ThemeContext.svelte generated by Svelte v3.21.0 */

    const { Object: Object_1 } = globals;

    function create_fragment$n(ctx) {
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 64) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[6], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[6], dirty, null));
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$n.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$n($$self, $$props, $$invalidate) {
    	let { themes: themes$1 = [...themes] } = $$props;
    	let _current = themes$1[1].name;
    	const getCurrentTheme = name => themes$1.find(t => t.name === name);
    	const Theme = writable(getCurrentTheme(_current));

    	setContext("theme", {
    		theme: Theme,
    		toggle: () => {
    			const newThemeIndex = _current === "light" ? 1 : 0;
    			_current = themes$1[newThemeIndex].name;
    			Theme.update(t => ({ ...t, ...getCurrentTheme(_current) }));
    			setRootColors(getCurrentTheme(_current));
    		}
    	});

    	onMount(() => {
    		setRootColors(getCurrentTheme(_current));
    		setFonts();
    	});

    	const setRootColors = theme => {
    		for (let [prop, color] of Object.entries(theme.colors)) {
    			let varString = `--theme-${prop}`;
    			document.documentElement.style.setProperty(varString, color);
    		}

    		document.documentElement.style.setProperty("--theme-name", theme.name);
    	};

    	const setFonts = () => {
    		for (let [prop, font] of Object.entries(fonts)) {
    			let varString = `--font-${prop}`;
    			document.documentElement.style.setProperty(varString, font);
    		}
    	};

    	const writable_props = ["themes"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ThemeContext> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ThemeContext", $$slots, ['default']);

    	$$self.$set = $$props => {
    		if ("themes" in $$props) $$invalidate(0, themes$1 = $$props.themes);
    		if ("$$scope" in $$props) $$invalidate(6, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		setContext,
    		onMount,
    		writable,
    		_themes: themes,
    		fonts,
    		themes: themes$1,
    		_current,
    		getCurrentTheme,
    		Theme,
    		setRootColors,
    		setFonts
    	});

    	$$self.$inject_state = $$props => {
    		if ("themes" in $$props) $$invalidate(0, themes$1 = $$props.themes);
    		if ("_current" in $$props) _current = $$props._current;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		themes$1,
    		_current,
    		getCurrentTheme,
    		Theme,
    		setRootColors,
    		setFonts,
    		$$scope,
    		$$slots
    	];
    }

    class ThemeContext extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$n, create_fragment$n, safe_not_equal, { themes: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ThemeContext",
    			options,
    			id: create_fragment$n.name
    		});
    	}

    	get themes() {
    		throw new Error("<ThemeContext>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set themes(value) {
    		throw new Error("<ThemeContext>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.21.0 */

    // (10:0) <ThemeContext>
    function create_default_slot$5(ctx) {
    	let current;
    	const defaultlayout = new DefaultLayout({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(defaultlayout.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(defaultlayout, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(defaultlayout.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(defaultlayout.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(defaultlayout, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$5.name,
    		type: "slot",
    		source: "(10:0) <ThemeContext>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$o(ctx) {
    	let current;

    	const themecontext = new ThemeContext({
    			props: {
    				$$slots: { default: [create_default_slot$5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(themecontext.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(themecontext, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const themecontext_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				themecontext_changes.$$scope = { dirty, ctx };
    			}

    			themecontext.$set(themecontext_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(themecontext.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(themecontext.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(themecontext, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$o.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$o($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	$$self.$capture_state = () => ({ DefaultLayout, ThemeContext });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$o, create_fragment$o, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$o.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
