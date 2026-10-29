let servers = [];
let isChecking = false;

const elements = {
    dnsList: document.getElementById("dns-list"),
    mainButton: document.getElementById("main-button"),
    buttonText: document.getElementById("button-text"),
    buttonLoader: document.getElementById("button-loader"),
    chartPercent: document.getElementById("chart-percent"),
    donutFg: document.getElementById("donut-fg"),
    themeToggle: document.getElementById("theme-toggle"),
    themeSun: document.getElementById("theme-icon-sun"),
    themeMoon: document.getElementById("theme-icon-moon"),
    ipAddress: document.getElementById("ip-address"),
    geolocation: document.getElementById("geolocation"),
    countryFlag: document.getElementById("country-flag"),
    searchBox: document.getElementById("search-box"),
    addDnsButton: document.getElementById("add-dns-button"),
    historyButton: document.getElementById("history-button"),
    shareButton: document.getElementById("share-button"),
    sharePage: document.getElementById("share-page"),
    shareList: document.getElementById("share-list"),
    shareContentArea: document.getElementById("share-content-area"),
    downloadButton: document.getElementById("download-button"),
    shareScreenshotButton: document.getElementById("share-screenshot-button"),
    closeSharePage: document.getElementById("close-share-page"),
};

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

function getPingColor(ping) {
    if (ping === null) return "hsl(0, 0%, 50%)";
    const hue = ping <= 300 ? 120 - (ping / 300) * 60 : ping <= 600 ? 60 - ((ping - 300) / 300) * 60 : 0;
    return `hsl(${hue}, 90%, 50%)`;
}

function getGradientWidthPercentage(ping) {
    if (ping === null) return 0;
    return Math.max(5, Math.min(100, (ping / 800) * 100));
}

function getCustomServers() {
    return JSON.parse(localStorage.getItem("euDnsCustom") || "[]");
}

function saveCustomServers(customServers) {
    localStorage.setItem("euDnsCustom", JSON.stringify(customServers));
}

function loadServers() {
    const preset = typeof initialServers !== "undefined" ? JSON.parse(JSON.stringify(initialServers)) : [];
    servers = [...preset, ...getCustomServers()];
}

function subtitle(server) {
    if (server.place && server.country && server.place !== server.country) {
        return `${server.country} · ${server.place}`;
    }
    return server.country || server.place || "Eigener Eintrag";
}

function serverHaystack(server) {
    return [server.name, server.country, server.place, server.operator, server.dot, server.url]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
}

function renderList() {
    const searchTerm = elements.searchBox.value.toLowerCase().trim();
    const filtered = servers.filter((server) => serverHaystack(server).includes(searchTerm));
    elements.dnsList.innerHTML = "";

    if (filtered.length === 0) {
        elements.dnsList.innerHTML = `<p class="text-center text-gray-400 col-span-full mt-8">Kein Resolver passt zur Suche.</p>`;
        return;
    }

    filtered.forEach((server, index) => {
        const div = document.createElement("div");
        div.className = "dns-item-box flex items-center justify-between p-2.5 rounded-xl hover:!bg-[var(--hover-bg)] cursor-pointer";
        div.style.opacity = "0";
        div.style.animation = `fadeInUp 0.5s ease-out ${index * 0.03}s forwards`;
        div.addEventListener("click", () => showServerInfoModal(server));

        let statusHtml = "";
        div.style.backgroundImage = "none";

        if (server.status === "success") {
            const pingColor = getPingColor(server.ping);
            const gradientColor = pingColor.replace("hsl", "hsla").replace(")", ", 0.35)");
            const widthPercent = getGradientWidthPercentage(server.ping);
            div.style.backgroundImage = `linear-gradient(to right, ${gradientColor} ${widthPercent}%, transparent ${widthPercent}%)`;
            statusHtml = `<div class="flex items-center justify-end text-xs"><span style="color: ${pingColor};" class="text-lg mx-1.5">●</span><span class="font-semibold">${server.ping} ms</span></div>`;
        } else if (server.status === "error") {
            statusHtml = `<div class="flex items-center justify-end text-xs"><span class="text-red-400 text-lg mx-1.5">●</span><span class="text-gray-400">Fehler</span></div>`;
        } else if (server.status === "loading") {
            statusHtml = `<div class="loader !w-4 !h-4 mx-auto"></div>`;
        } else if (!server.testable) {
            statusHtml = `<div class="text-[10px] text-gray-400 leading-tight text-right">nur DoT</div>`;
        }

        const bestIcon = server.isBest ? `<i class="fa-solid fa-star text-yellow-400 text-xs"></i>` : "";
        const place = subtitle(server);
        const deleteButton = server.isCustom
            ? `<button data-server-id="${escapeHtml(server.id)}" class="delete-button p-1 text-[var(--icon-color)] hover:text-red-500 transition-colors z-10" title="Eintrag löschen"><i class="fa-solid fa-trash"></i></button>`
            : "";

        div.innerHTML = `
            <div class="flex items-start flex-grow min-w-0 gap-2 pointer-events-none">
                ${bestIcon}
                <span class="min-w-0">
                    <span class="block font-medium text-xs text-[var(--text-color)] truncate">${escapeHtml(server.name)}</span>
                    <span class="dns-sub block truncate">${escapeHtml(place)}</span>
                </span>
            </div>
            <div class="flex items-center flex-shrink-0 gap-2">
                <div class="transition-all duration-300 w-16 text-center">${statusHtml}</div>
                <button class="info-button p-1 text-[var(--icon-color)] hover:text-blue-500 transition-colors" title="Angaben"><i class="fa-solid fa-circle-info"></i></button>
                ${deleteButton}
            </div>`;
        elements.dnsList.appendChild(div);
    });

    elements.dnsList.querySelectorAll(".delete-button").forEach((button) => {
        button.addEventListener("click", (event) => {
            event.stopPropagation();
            const serverId = event.currentTarget.dataset.serverId;
            const server = servers.find((item) => item.id === serverId);
            if (!server) return;
            const content = `
                <h3 class="text-lg font-bold mb-4">Eintrag löschen</h3>
                <p class="mb-5">„${escapeHtml(server.name)}“ aus der eigenen Liste nehmen?</p>
                <div class="flex justify-end gap-3">
                    <button class="modal-cancel-button bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">Abbrechen</button>
                    <button class="modal-confirm-delete bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">Löschen</button>
                </div>`;
            const modal = createCustomModal(content);
            modal.querySelector(".modal-cancel-button").onclick = () => removeModal(modal);
            modal.querySelector(".modal-confirm-delete").onclick = () => {
                saveCustomServers(getCustomServers().filter((item) => item.id !== serverId));
                loadServers();
                renderList();
                removeModal(modal);
            };
        });
    });
}

function updateMainButton() {
    elements.mainButton.disabled = isChecking;
    elements.buttonLoader.classList.toggle("hidden", !isChecking);
    elements.buttonText.textContent = isChecking ? "Prüfung läuft…" : "Resolver prüfen";
}

function updateChart(percent) {
    elements.donutFg.style.strokeDashoffset = 100 - percent;
    elements.chartPercent.textContent = `${Math.round(percent)}%`;
}

async function fetchUserIP() {
    try {
        const response = await fetch("https://ipapi.co/json/");
        if (!response.ok) throw new Error("ip");
        const data = await response.json();
        elements.ipAddress.textContent = data.ip || "---";
        const country = data.country_code
            ? new Intl.DisplayNames(["de"], { type: "region" }).of(data.country_code)
            : "";
        elements.geolocation.textContent = [data.city, country].filter(Boolean).join(", ") || "---";
        if (data.country_code) {
            elements.countryFlag.src = `https://flagcdn.com/w20/${data.country_code.toLowerCase()}.png`;
            elements.countryFlag.alt = data.country_name || "";
            elements.countryFlag.classList.remove("hidden");
        }
    } catch {
        elements.ipAddress.textContent = "---";
        elements.geolocation.textContent = "---";
    }
}

async function measureResponse(url) {
    try {
        const warmup = new AbortController();
        setTimeout(() => warmup.abort(), 1500);
        await fetch(url, { method: "HEAD", mode: "no-cors", cache: "no-cache", signal: warmup.signal });
    } catch {
        // Der erste Versuch öffnet nur die Verbindung.
    }

    const startTime = performance.now();
    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 4000);
        await fetch(url, { method: "HEAD", mode: "no-cors", cache: "no-cache", signal: controller.signal });
        return Math.round(performance.now() - startTime);
    } catch {
        return null;
    }
}

async function checkDnsServers() {
    isChecking = true;
    servers.forEach((server) => {
        server.isBest = false;
        server.ping = null;
        server.status = server.testable === false ? "dotonly" : "loading";
    });
    renderList();
    updateMainButton();
    updateChart(0);
    elements.chartPercent.textContent = "…";

    await Promise.all(servers.map(async (server) => {
        if (server.testable === false || !server.url) return;
        const ping = await measureResponse(server.url);
        server.status = ping !== null ? "success" : "error";
        server.ping = ping;
    }));

    const successful = servers.filter((server) => server.status === "success");
    if (successful.length > 0) {
        successful.sort((a, b) => a.ping - b.ping)[0].isBest = true;
    }
    servers.sort((a, b) => rank(a) - rank(b) || ((a.ping ?? 0) - (b.ping ?? 0)));

    const testable = servers.filter((server) => server.testable !== false && server.url);
    const reached = testable.filter((server) => server.status === "success").length;
    isChecking = false;
    updateChart(testable.length > 0 ? (reached / testable.length) * 100 : 0);
    saveHistory();
    elements.shareButton.disabled = false;
    renderList();
    updateMainButton();
}

function rank(server) {
    if (server.status === "success") return 0;
    if (server.status === "dotonly" || server.testable === false) return 1;
    if (server.status === "error") return 2;
    return 3;
}

function saveHistory() {
    const history = JSON.parse(localStorage.getItem("euDnsHistory") || "[]");
    const top = servers.find((server) => server.isBest);
    history.unshift({
        date: new Date().toLocaleString("de-DE"),
        topServer: top ? top.name : "keiner erreichbar",
        ping: top ? top.ping : "–",
    });
    localStorage.setItem("euDnsHistory", JSON.stringify(history.slice(0, 5)));
}

function createCustomModal(contentHtml) {
    const modal = document.createElement("div");
    modal.className = "fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100] transition-opacity duration-300 opacity-0";
    modal.innerHTML = `<div class="bg-[var(--card-bg)] backdrop-blur-xl p-5 rounded-2xl shadow-lg w-full max-w-lg max-h-[85vh] overflow-y-auto custom-scrollbar transition-transform duration-300 scale-95">${contentHtml}</div>`;
    document.body.appendChild(modal);
    setTimeout(() => {
        modal.classList.add("opacity-100");
        modal.firstElementChild.classList.add("scale-100");
    }, 10);
    modal.addEventListener("click", (event) => {
        if (event.target === modal) removeModal(modal);
    });
    return modal;
}

function removeModal(modal) {
    if (!modal) return;
    modal.classList.remove("opacity-100");
    modal.firstElementChild.classList.remove("scale-100");
    setTimeout(() => modal.remove(), 300);
}

function showModal(contentHtml) {
    const modal = createCustomModal(`
        ${contentHtml}
        <button class="modal-close-button mt-5 bg-blue-600 text-white px-5 py-2 rounded-lg w-full text-sm hover:bg-blue-700 transition">Schließen</button>
    `);
    modal.querySelector(".modal-close-button").onclick = () => removeModal(modal);
    modal.querySelectorAll("[data-copy-target]").forEach((copyButton) => {
        copyButton.onclick = () => {
            const text = modal.querySelector(`#${copyButton.dataset.copyTarget}`).innerText.trim();
            navigator.clipboard.writeText(text).then(() => {
                const original = copyButton.textContent;
                copyButton.textContent = "Kopiert";
                setTimeout(() => {
                    copyButton.textContent = original;
                }, 1500);
            });
        };
    });
}

function infoLine(label, value) {
    if (!value) return "";
    return `<p><span class="font-semibold">${escapeHtml(label)}:</span> ${escapeHtml(value)}</p>`;
}

function copyRow(label, value, id) {
    if (!value) return "";
    return `<div class="mt-3 pt-3 border-t border-[var(--item-border-color)]">
        <p class="font-bold text-sm mb-1">${escapeHtml(label)}</p>
        <div class="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-left p-3 rounded-md font-mono text-xs select-all break-all" id="${id}" dir="ltr">${escapeHtml(value)}</div>
        <button data-copy-target="${id}" class="mt-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-1 rounded text-xs w-full sm:w-auto">Kopieren</button>
    </div>`;
}

function showServerInfoModal(server) {
    const source = server.sourceUrl
        ? `<p><span class="font-semibold">Quelle:</span> <a class="underline" href="${escapeHtml(server.sourceUrl)}" target="_blank" rel="noopener">${escapeHtml(server.sourceLabel || server.sourceUrl)}</a></p>`
        : "";
    const content = `
        <h3 class="text-base font-bold mb-3 text-center">${escapeHtml(server.name)}</h3>
        <div class="text-xs space-y-2 mb-1 leading-relaxed">
            ${infoLine("Land", server.country)}
            ${infoLine("Standort", server.place)}
            ${infoLine("Betreiber", server.operator)}
            ${infoLine("Rechtsraum", server.jurisdiction)}
            ${infoLine("Protokolle", server.protocols)}
            ${infoLine("Filter", server.filter)}
            ${infoLine("Protokollierung", server.logging)}
            ${infoLine("DNSSEC", server.dnssec)}
            ${infoLine("Hinweis", server.note)}
            ${source}
        </div>
        ${copyRow("DNS over HTTPS", server.url, `url-${server.id}`)}
        ${copyRow("DNS over TLS", server.dot, `dot-${server.id}`)}
        ${copyRow("IPv4", server.ipv4, `ipv4-${server.id}`)}
        ${copyRow("IPv6", server.ipv6, `ipv6-${server.id}`)}
    `;
    showModal(content);
}

elements.mainButton.addEventListener("click", checkDnsServers);
elements.searchBox.addEventListener("input", renderList);

elements.themeToggle.addEventListener("click", () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("euDnsTheme", isDark ? "dark" : "light");
    elements.themeSun.classList.toggle("hidden", isDark);
    elements.themeMoon.classList.toggle("hidden", !isDark);
});

elements.addDnsButton.addEventListener("click", () => {
    const content = `
        <h3 class="text-lg font-bold mb-4">Eigenen DoH-Endpunkt</h3>
        <form id="add-dns-form" class="space-y-4">
            <div><label class="block text-sm font-medium mb-1" for="c-name">Anzeigename</label><input type="text" id="c-name" class="w-full bg-gray-100 dark:bg-gray-800 p-2 rounded-lg text-sm"></div>
            <div><label class="block text-sm font-medium mb-1" for="c-url">DoH-Adresse</label><input type="url" id="c-url" placeholder="https://example.org/dns-query" class="w-full bg-gray-100 dark:bg-gray-800 p-2 rounded-lg text-sm text-left" dir="ltr"></div>
            <div class="pt-2 flex justify-end gap-3">
                 <button type="button" class="c-cancel bg-gray-500 text-white px-4 py-2 rounded-lg">Abbrechen</button>
                 <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-lg">Speichern</button>
            </div>
        </form>`;
    const modal = createCustomModal(content);
    modal.querySelector(".c-cancel").onclick = () => removeModal(modal);
    modal.querySelector("form").onsubmit = (event) => {
        event.preventDefault();
        const name = document.getElementById("c-name").value.trim();
        const url = document.getElementById("c-url").value.trim();
        if (!name || !url) {
            alert("Name und Adresse werden beide gebraucht.");
            return;
        }
        const customs = getCustomServers();
        customs.push({
            id: `custom-${Date.now()}`,
            name,
            url,
            country: "",
            place: "",
            operator: "Selbst eingetragen",
            jurisdiction: "",
            protocols: "DoH",
            filter: "Nicht geprüft",
            logging: "Nicht geprüft",
            dnssec: "Nicht geprüft",
            note: "Dieser Eintrag steht nur in diesem Browser.",
            sourceLabel: "",
            sourceUrl: "",
            dot: "",
            ipv4: "",
            ipv6: "",
            testable: true,
            isCustom: true,
        });
        saveCustomServers(customs);
        loadServers();
        renderList();
        removeModal(modal);
    };
});

elements.historyButton.addEventListener("click", () => {
    const history = JSON.parse(localStorage.getItem("euDnsHistory") || "[]");
    let html = `<h3 class="text-lg font-bold mb-4">Verlauf</h3>`;
    if (history.length === 0) {
        html += `<p class="text-sm">Noch keine Prüfung in diesem Browser.</p>`;
    } else {
        html += `<ul class="space-y-2 text-sm">`;
        history.forEach((item) => {
            html += `<li class="p-2 bg-black/10 rounded-lg flex justify-between gap-3"><span>${escapeHtml(item.date)}</span><span class="font-bold text-right">${escapeHtml(item.topServer)} (${escapeHtml(item.ping)} ms)</span></li>`;
        });
        html += `</ul>`;
    }
    showModal(html);
});

elements.shareButton.addEventListener("click", () => {
    elements.shareList.innerHTML = "";
    servers.forEach((server) => {
        const color = server.status === "success" ? getPingColor(server.ping) : "#9ca3af";
        const text = server.status === "success" ? `${server.ping} ms` : server.testable === false ? "nur DoT" : "–";
        elements.shareList.insertAdjacentHTML("beforeend", `<div class="dns-item-box flex flex-col items-center p-2 rounded-lg"><span class="truncate w-full text-center font-medium">${escapeHtml(server.name)}</span><span class="dns-sub truncate w-full text-center">${escapeHtml(server.country || "")}</span><span style="color:${color}" class="font-bold">${escapeHtml(text)}</span></div>`);
    });
    elements.sharePage.classList.remove("hidden");
    setTimeout(() => elements.sharePage.classList.remove("opacity-0"), 10);
});

elements.closeSharePage.addEventListener("click", () => {
    elements.sharePage.classList.add("opacity-0");
    setTimeout(() => elements.sharePage.classList.add("hidden"), 300);
});

function paintShare(callback) {
    html2canvas(elements.shareContentArea, {
        backgroundColor: document.documentElement.classList.contains("dark") ? "#0D1117" : "#F9FAFB",
        scale: 2,
    }).then(callback);
}

elements.downloadButton.addEventListener("click", () => {
    paintShare((canvas) => {
        const link = document.createElement("a");
        link.download = "dns-tester-europa.png";
        link.href = canvas.toDataURL();
        link.click();
    });
});

elements.shareScreenshotButton.addEventListener("click", () => {
    paintShare((canvas) => {
        canvas.toBlob((blob) => {
            const file = new File([blob], "dns-tester-europa.png", { type: "image/png" });
            if (navigator.canShare?.({ files: [file] })) {
                navigator.share({ files: [file], title: "DNS-Tester Europa" });
            } else {
                alert("Teilen ist in diesem Browser nicht verfügbar. Die Datei lässt sich speichern.");
            }
        });
    });
});

(function init() {
    const theme = localStorage.getItem("euDnsTheme") || "dark";
    document.documentElement.classList.toggle("dark", theme === "dark");
    elements.themeSun.classList.toggle("hidden", theme === "dark");
    elements.themeMoon.classList.toggle("hidden", theme !== "dark");
    loadServers();
    renderList();
    fetchUserIP();
})();
