// ==UserScript==
// @name         Tuna browser script for Deezer
// @version      1.0.0
// @description  Get song information from Deezer
// @downloadURL  https://raw.githubusercontent.com/sikelio/tuna-individual-script/main/deezer.js
// @updateURL    https://raw.githubusercontent.com/sikelio/tuna-individual-script/main/deezer.js
// @author       Sik'
// @match        *://www.deezer.com/*
// @grant        unsafeWindow
// @license      GPLv2
// ==/UserScript==

/**
 * Fork of univrsal project
 */
(function() {
    'use strict';

    const port = 1608;
    const refresh_rate_ms = 500;
    const cooldown_ms = 10000;
    var failure_count = 0;
    var cooldown = 0;

    function post(data){
        var url = `http://localhost:${port}/`;
        var xhr = new XMLHttpRequest();
        xhr.open('POST', url);

        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Access-Control-Allow-Headers', '*');
        xhr.setRequestHeader('Access-Control-Allow-Origin', '*');

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status !== 200) {
                    failure_count++;
                }
            }
        };

        xhr.send(JSON.stringify({
            data,hostname:window.location.hostname,
            date:Date.now()
        }));
    }

    function query(target, fun, alt = null) {
        var element = document.querySelector(target);
        if (element !== null) {
            return fun(element);
        }
        return alt;
    }

    function timestamp_to_ms(ts) {
        var splits = ts.split(':');

        if (splits.length == 2) {
            return splits[0] * 60 * 1000 + splits[1] * 1000;
        } else if (splits.length == 3) {
            return splits[0] * 60 * 60 * 1000 + splits[1] * 60 * 1000 + splits[0] * 1000;
        }

        return 0;
    }

    function StartFunction() {
        setInterval(() => {
            if (failure_count > 3) {
                console.log('Failed to connect multiple times, waiting a few seconds');
                cooldown = cooldown_ms;
                failure_count = 0;
            }

            if (cooldown > 0) {
                cooldown -= refresh_rate_ms;
                return;
            }
            
            let status = query('.player-controls', e => {
                let buttons = e.getElementsByTagName('button');

                if (buttons && buttons.length > 1) {
                    if (buttons[1].getAttribute('aria-label') === 'Pause') {
                        return "playing";
                    } else {
                        return "stopped";
                    }
                }

                return "unknown";
            });

            let cover = query('button.queuelist.is-available', e => {
                let img = e.getElementsByTagName('img');

                if (img.length > 0) {
                    let src = img[0].src;
                    return src.replace('28x28', '512x512');
                }

                return null;
            });

            let title = query('.marquee-content', e => {
                let links = e.getElementsByClassName('track-link');

                if (links.length > 0) {
                    return links[0].textContent;
                }

                return null;
            });

            let artists = query('.marquee-content', e => {
                let links = e.getElementsByClassName('track-link');
                let artists = [];

                if (links.length > 1) {
                    for (var i = 1; i < links.length; i++) {
                        artists.push(links[i].textContent);
                    }

                    return artists;
                }

                return null;
            });

            let duration = query('.slider-counter-max', e => timestamp_to_ms(e.textContent));
            let progress = query('.slider-counter-current', e => timestamp_to_ms(e.textContent));

            if (title !== null) {
                post({ cover, title, artists, status, progress, duration });
            }
        }, refresh_rate_ms);
    }

    StartFunction();
})();