// ==UserScript==
// @name         Tuna browser script for Monstercat player
// @version      1.0.0
// @description  Get song information from Monstercat player
// @downloadURL  https://raw.githubusercontent.com/sikelio/tuna-individual-script/main/monstercat.js
// @updateURL    https://raw.githubusercontent.com/sikelio/tuna-individual-script/main/monstercat.js
// @author       Sik'
// @match        *://player.monstercat.app/*
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

            let status = query('.buttons', e => {
                let buttons = e.getElementsByTagName('button');


                if (buttons && buttons.length > 1) {
                    if (buttons[2].lastChild.classList.contains('fa-pause')) {
                        return "playing";
                    } else {
                        return "stopped";
                    }
                }

                return "unknown";
            });

            let cover = query('.album-art', e => {
                let imgSelect = e.attributes[1].textContent.split(/\s+/);
                if (imgSelect.length > 1) {
                    let imgUrl = imgSelect[1].replace('width=256', 'width=512');
                    let imgUrl2 = imgUrl.split("url\(\"");
                    let img = imgUrl2[1].split("\"\);");

                    return img[0];
                }

                return null;
            });

            let title = query('.release-link', e => {
                let links = e.innerHTML.split(/<span class=\"text-muted ml-2\">/);

                if (links[0] !== "") {
                    return links[0];
                }

                return null;
            });

            let artists = query('.active-song .artists-list', e => {
                let links = e.getElementsByTagName('a');
                let artists = [];

                if (links.length >= 1) {
                    for (var i = 0; i < links.length; i++) {
                        artists.push(links[i].textContent);
                    }

                    return artists;
                }

                return null;
            });

            let duration = query('.active-song-time', e => timestamp_to_ms(e.textContent.split(/\s+/)[2]));
            let progress = query('.active-song-time', e => timestamp_to_ms(e.textContent.split(/\s+/)[0]));

            if (title !== null) {
                post({ title, artists, status, progress, duration });
            }
        }, refresh_rate_ms);
    }

    StartFunction();
})();