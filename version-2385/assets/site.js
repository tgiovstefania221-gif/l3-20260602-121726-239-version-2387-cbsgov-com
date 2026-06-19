(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function setupNavigation() {
        var nav = document.querySelector(".site-nav");
        var toggle = document.querySelector(".nav-toggle");
        if (!nav || !toggle) {
            return;
        }
        toggle.addEventListener("click", function () {
            var open = nav.classList.toggle("is-open");
            toggle.setAttribute("aria-expanded", open ? "true" : "false");
        });
    }

    function setupImages() {
        document.querySelectorAll(".cover-img").forEach(function (image) {
            image.addEventListener("error", function () {
                image.remove();
            }, { once: true });
        });
    }

    function compareCards(mode) {
        return function (a, b) {
            if (mode === "score") {
                return Number(b.dataset.score || 0) - Number(a.dataset.score || 0);
            }
            if (mode === "views") {
                return Number(b.dataset.views || 0) - Number(a.dataset.views || 0);
            }
            if (mode === "year") {
                return Number(b.dataset.year || 0) - Number(a.dataset.year || 0);
            }
            if (mode === "title") {
                return (a.dataset.title || "").localeCompare(b.dataset.title || "", "zh-Hans-CN");
            }
            return 0;
        };
    }

    function setupFilters() {
        document.querySelectorAll(".js-card-list").forEach(function (list) {
            var scope = list.closest("section") || document;
            var searchInput = scope.querySelector(".js-search-input");
            var typeFilter = scope.querySelector(".js-type-filter");
            var sortSelect = scope.querySelector(".js-sort-select");
            var emptyState = scope.querySelector(".empty-state");
            var cards = Array.prototype.slice.call(list.querySelectorAll("[data-card]"));
            var queryInput = scope.querySelector(".js-query-input");

            if (queryInput) {
                var params = new URLSearchParams(window.location.search);
                var query = params.get("q") || "";
                queryInput.value = query;
            }

            function apply() {
                var keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
                var typeValue = typeFilter ? typeFilter.value : "";
                var visible = 0;

                cards.forEach(function (card) {
                    var text = card.dataset.search || "";
                    var type = card.dataset.type || "";
                    var matchesKeyword = keyword === "" || text.indexOf(keyword) !== -1;
                    var matchesType = typeValue === "" || type === typeValue;
                    var show = matchesKeyword && matchesType;
                    card.classList.toggle("is-hidden", !show);
                    if (show) {
                        visible += 1;
                    }
                });

                if (sortSelect && sortSelect.value !== "default") {
                    cards.slice().sort(compareCards(sortSelect.value)).forEach(function (card) {
                        list.appendChild(card);
                    });
                }

                if (emptyState) {
                    emptyState.hidden = visible !== 0;
                }
            }

            if (searchInput) {
                searchInput.addEventListener("input", apply);
            }
            if (typeFilter) {
                typeFilter.addEventListener("change", apply);
            }
            if (sortSelect) {
                sortSelect.addEventListener("change", apply);
            }
            apply();
        });
    }

    function attachHls(video, url, onReady, onError) {
        if (window.Hls && window.Hls.isSupported()) {
            var hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
            hls.loadSource(url);
            hls.attachMedia(video);
            hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
                onReady();
            });
            hls.on(window.Hls.Events.ERROR, function (eventName, data) {
                if (data && data.fatal) {
                    onError();
                }
            });
            video._hlsPlayer = hls;
            return;
        }

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = url;
            video.addEventListener("loadedmetadata", onReady, { once: true });
            video.addEventListener("error", onError, { once: true });
            return;
        }

        video.src = url;
        video.addEventListener("loadedmetadata", onReady, { once: true });
        video.addEventListener("error", onError, { once: true });
    }

    function setupPlayers() {
        document.querySelectorAll("[data-player]").forEach(function (shell) {
            var video = shell.querySelector("video");
            var button = shell.querySelector(".play-layer");
            var message = shell.querySelector(".player-message");
            if (!video || !button) {
                return;
            }

            var url = video.getAttribute("data-video-url") || "";
            var initialized = false;
            var loading = false;

            function setMessage(text) {
                if (message) {
                    message.textContent = text || "";
                }
            }

            function ensurePlayer(callback) {
                if (initialized) {
                    callback();
                    return;
                }
                if (loading) {
                    return;
                }
                loading = true;
                setMessage("正在载入视频...");
                attachHls(video, url, function () {
                    initialized = true;
                    loading = false;
                    setMessage("");
                    callback();
                }, function () {
                    loading = false;
                    setMessage("视频加载失败，请稍后重试");
                });
            }

            function playVideo() {
                ensurePlayer(function () {
                    var playPromise = video.play();
                    if (playPromise && typeof playPromise.then === "function") {
                        playPromise.then(function () {
                            shell.classList.add("is-playing");
                        }).catch(function () {
                            setMessage("点击视频区域继续播放");
                        });
                    } else {
                        shell.classList.add("is-playing");
                    }
                });
            }

            button.addEventListener("click", playVideo);
            video.addEventListener("click", function () {
                if (!initialized) {
                    playVideo();
                    return;
                }
                if (video.paused) {
                    playVideo();
                } else {
                    video.pause();
                    shell.classList.remove("is-playing");
                }
            });
            video.addEventListener("play", function () {
                shell.classList.add("is-playing");
            });
            video.addEventListener("pause", function () {
                shell.classList.remove("is-playing");
            });
        });
    }

    ready(function () {
        setupImages();
        setupNavigation();
        setupFilters();
        setupPlayers();
    });
}());
