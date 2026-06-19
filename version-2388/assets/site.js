(() => {
    const normalize = (value) => String(value || "").trim().toLowerCase();

    const menuButton = document.querySelector("[data-menu-toggle]");
    const mobileNav = document.querySelector("[data-mobile-nav]");

    if (menuButton && mobileNav) {
        menuButton.addEventListener("click", () => {
            const opened = mobileNav.classList.toggle("is-open");
            document.body.classList.toggle("menu-open", opened);
            menuButton.setAttribute("aria-expanded", opened ? "true" : "false");
        });
    }

    document.querySelectorAll("[data-hero-slider]").forEach((slider) => {
        const slides = Array.from(slider.querySelectorAll("[data-hero-slide]"));
        const dots = Array.from(slider.querySelectorAll("[data-hero-dot]"));
        let current = 0;
        let timer = null;

        const show = (index) => {
            if (!slides.length) {
                return;
            }

            current = (index + slides.length) % slides.length;

            slides.forEach((slide, slideIndex) => {
                slide.classList.toggle("is-active", slideIndex === current);
                slide.setAttribute("aria-hidden", slideIndex === current ? "false" : "true");
            });

            dots.forEach((dot, dotIndex) => {
                dot.classList.toggle("active", dotIndex === current);
            });
        };

        const start = () => {
            timer = window.setInterval(() => show(current + 1), 5200);
        };

        const reset = () => {
            if (timer) {
                window.clearInterval(timer);
            }
            start();
        };

        dots.forEach((dot) => {
            dot.addEventListener("click", () => {
                show(Number(dot.dataset.heroDot || 0));
                reset();
            });
        });

        show(0);
        start();
    });

    document.querySelectorAll("[data-filter-form]").forEach((form) => {
        const scope = form.closest("main") || document;
        const searchInput = form.querySelector("[data-search-input]");
        const selects = Array.from(form.querySelectorAll("[data-filter-field]"));
        const items = Array.from(scope.querySelectorAll("[data-search-item]"));
        const emptyState = scope.querySelector("[data-empty-state]");

        const apply = () => {
            const keyword = normalize(searchInput ? searchInput.value : "");
            const filters = selects.map((select) => ({
                field: select.dataset.filterField,
                value: normalize(select.value)
            }));

            let visibleCount = 0;

            items.forEach((item) => {
                const haystack = normalize(item.dataset.search || "");
                const keywordMatch = !keyword || haystack.includes(keyword);
                const filterMatch = filters.every((filter) => {
                    if (!filter.value) {
                        return true;
                    }

                    const itemValue = normalize(item.dataset[filter.field] || "");
                    return itemValue.includes(filter.value);
                });
                const visible = keywordMatch && filterMatch;

                item.style.display = visible ? "" : "none";
                if (visible) {
                    visibleCount += 1;
                }
            });

            if (emptyState) {
                emptyState.classList.toggle("is-visible", visibleCount === 0);
            }
        };

        form.addEventListener("input", apply);
        form.addEventListener("change", apply);
        apply();
    });

    document.querySelectorAll("[data-player]").forEach((player) => {
        const video = player.querySelector("video");
        const startButton = player.querySelector("[data-player-start]");
        const errorBox = player.querySelector("[data-player-error]");

        if (!video || !startButton) {
            return;
        }

        const source = video.getAttribute("data-hls");
        let attached = false;
        let hlsInstance = null;

        const showError = () => {
            player.classList.remove("is-loading");
            player.classList.add("has-error");
            if (errorBox) {
                errorBox.style.display = "block";
            }
        };

        const attachSource = () => new Promise((resolve) => {
            if (attached) {
                resolve();
                return;
            }

            if (!source) {
                showError();
                resolve();
                return;
            }

            attached = true;
            player.classList.add("is-loading");

            if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 90
                });

                hlsInstance.loadSource(source);
                hlsInstance.attachMedia(video);

                hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, () => {
                    player.classList.remove("is-loading");
                    player.classList.add("is-ready");
                    resolve();
                });

                hlsInstance.on(window.Hls.Events.ERROR, (event, data) => {
                    if (!data || !data.fatal) {
                        return;
                    }

                    if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                        hlsInstance.startLoad();
                    } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                        hlsInstance.recoverMediaError();
                    } else {
                        showError();
                    }
                });
            } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = source;
                video.addEventListener("loadedmetadata", () => {
                    player.classList.remove("is-loading");
                    player.classList.add("is-ready");
                    resolve();
                }, { once: true });
            } else {
                video.src = source;
                player.classList.remove("is-loading");
                player.classList.add("is-ready");
                resolve();
            }
        });

        const playVideo = () => {
            player.classList.remove("has-error");

            attachSource().then(() => {
                const playPromise = video.play();

                if (playPromise && typeof playPromise.catch === "function") {
                    playPromise.catch(() => {
                        player.classList.remove("is-playing");
                    });
                }
            });
        };

        startButton.addEventListener("click", playVideo);

        video.addEventListener("click", () => {
            if (video.paused) {
                playVideo();
            } else {
                video.pause();
            }
        });

        video.addEventListener("play", () => {
            player.classList.add("is-playing");
        });

        video.addEventListener("pause", () => {
            player.classList.remove("is-playing");
        });

        window.addEventListener("beforeunload", () => {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    });
})();
