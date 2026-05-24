// --- ฟังก์ชันควบคุมเมนูบนมือถือ (Hamburger) ---
function toggleMobileMenu() {

    const sidebar =
        document.getElementById(
            "main-sidebar"
        );

    const overlay =
        document.getElementById(
            "mobile-overlay"
        );

    // =========================
    // OPEN
    // =========================

    if (
        !sidebar.classList.contains(
            "mobile-open"
        )
    ) {

        sidebar.classList.add(
            "mobile-open"
        );

        overlay?.classList.add(
            "active"
        );

        document.body.style.overflow =
            "hidden";
    }

    // =========================
    // CLOSE
    // =========================

    else {

        sidebar.classList.remove(
            "mobile-open"
        );

        overlay?.classList.remove(
            "active"
        );

        document.body.style.overflow =
            "";
    }
}

// --- ฟังก์ชันเปิด Google Maps ---
function openGoogleMaps(lat, lng) {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, "_blank");
}

// --- ระบบควบคุมขนาดความกว้างเมนูด้านซ้าย (Resizer) ---
const resizer = document.getElementById("resizer");
const sidebar = document.getElementById("main-sidebar");

resizer.addEventListener("mousedown", (e) => {
    document.body.classList.add("resizing");
    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResize);
});

function resize(e) {
    let newWidth = e.clientX;
    if (newWidth >= 280 && newWidth <= 600) {
        sidebar.style.width = newWidth + "px";
        if (map) map.invalidateSize();
    }
}
function stopResize() {
    document.body.classList.remove("resizing");
    document.removeEventListener("mousemove", resize);
    document.removeEventListener("mouseup", stopResize);
}

// --- ตั้งค่าระบบแผนที่ ---
const map = L.map(
    "map",
    {
        zoomControl: false
    }
).setView(
    [14.41, 101.7],
    window.innerWidth < 768
        ? 11
        : 13
);

const streetLayer = L.tileLayer(
    "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    { maxZoom: 20 },
);
const satelliteLayer = L.tileLayer(
    "https://mt1.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}",
    { maxZoom: 20 },
);

satelliteLayer.addTo(map);
let currentLayerType = "satellite";

L.control.zoom({ position: "bottomright" }).addTo(map);

// ================= ระบบ ซ่อน/แสดง ชื่อสถานที่บนแผนที่ =================
let isBaseLabelsHidden = false;

window.toggleMapLabels = function () {
    isBaseLabelsHidden = !isBaseLabelsHidden;

    const btn = document.getElementById("btn-toggle-labels");

    // =========================
    // panel ด้านใน
    // =========================

    const panelContent = document.getElementById("delivery-panel-content");

    // =========================
    // ซ่อน
    // =========================

    if (isBaseLabelsHidden) {
        // ซ่อน panel
        if (panelContent) {
            panelContent.style.display = "none";
        }

        // ซ่อน label บ้าน
        document.querySelectorAll(".toggleable-label-text").forEach((el) => {
            el.style.display = "none";
        });

        // เปลี่ยน icon
        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-eye text-[14px]"></i>';
        }
    }

    // =========================
    // แสดง
    // =========================
    else {
        // แสดง panel
        if (panelContent) {
            panelContent.style.display = "block";
        }

        // แสดง label บ้าน
        document.querySelectorAll(".toggleable-label-text").forEach((el) => {
            el.style.display = "block";
        });

        // เปลี่ยน icon
        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-eye-slash text-[14px]"></i>';
        }
    }
};

// ================= ระบบ GPS ติดตามตำแหน่ง (Live Tracking) =================
let watchId = null;
let gpsMarker = null;
let gpsCircle = null;
let isTracking = false;

window.toggleGPSTracking = function () {
    const btn = document.getElementById("btn-track-location");

    // =========================
    // STOP TRACKING
    // =========================

    if (isTracking) {
        navigator.geolocation.clearWatch(watchId);

        if (gpsMarker) map.removeLayer(gpsMarker);

        if (gpsCircle) map.removeLayer(gpsCircle);

        gpsMarker = null;
        gpsCircle = null;

        isTracking = false;

        if (btn) {
            btn.classList.replace("text-emerald-400", "text-blue-400");

            btn.classList.remove("bg-slate-700");
        }

        return;
    }

    // =========================
    // GPS SUPPORT
    // =========================

    if (!navigator.geolocation) {
        Swal.fire("ไม่รองรับ", "เบราว์เซอร์ไม่รองรับ GPS", "warning");

        return;
    }

    // =========================
    // BUTTON ACTIVE
    // =========================

    if (btn) {
        btn.classList.replace("text-blue-400", "text-emerald-400");

        btn.classList.add("bg-slate-700");
    }

    // =========================
    // START WATCH GPS
    // =========================

    watchId = navigator.geolocation.watchPosition(
        // =========================
        // SUCCESS
        // =========================

        (position) => {
            const lat = position.coords.latitude;

            const lng = position.coords.longitude;

            const accuracy = position.coords.accuracy;

            // =========================
            // FIRST CREATE
            // =========================

            if (!gpsMarker) {
                const icon = L.divIcon({
                    className: "gps-user-dot",

                    iconSize: [16, 16],

                    iconAnchor: [8, 8],

                    html: "",
                });

                gpsMarker = L.marker([lat, lng], {
                    icon,
                    zIndexOffset: 9999,
                }).addTo(map);

                gpsCircle = L.circle([lat, lng], {
                    radius: accuracy,

                    color: "#00ffff",

                    fillColor: "#00ffff",

                    fillOpacity: 0.12,

                    weight: 1,
                }).addTo(map);

                // =========================
                // AUTO FOLLOW FIRST
                // =========================

                map.flyTo([lat, lng], 18, {
                    animate: true,
                    duration: 1.2,
                });
            }

            // =========================
            // UPDATE GPS
            // =========================
            else {
                // =========================
                // OLD POSITION
                // =========================

                const oldLatLng = gpsMarker.getLatLng();

                // =========================
                // SMOOTH POSITION
                // =========================

                const smoothLat = oldLatLng.lat + (lat - oldLatLng.lat) * 0.35;

                const smoothLng = oldLatLng.lng + (lng - oldLatLng.lng) * 0.35;

                // =========================
                // MOVE MARKER
                // =========================

                gpsMarker.setLatLng([smoothLat, smoothLng]);

                gpsCircle.setLatLng([smoothLat, smoothLng]);

                gpsCircle.setRadius(accuracy);

                updateCurrentHouseCard();

                // =========================
                // AUTO FOLLOW CAMERA
                // =========================

                map.panTo([smoothLat, smoothLng], {
                    animate: true,
                    duration: 0.45,
                });
            }
        },

        // =========================
        // ERROR
        // =========================

        (error) => {
            console.error("GPS Error:", error);

            Swal.fire({
                icon: "error",

                title: "ข้อผิดพลาด GPS",

                text: "ไม่สามารถเข้าถึงตำแหน่งได้ครับ",

                background: "#0f172a",

                color: "#fff",
            });

            window.toggleGPSTracking();
        },

        // =========================
        // OPTIONS
        // =========================

        {
            enableHighAccuracy: true,

            maximumAge: 1000,

            timeout: 10000,
        },
    );

    // =========================
    // ACTIVE
    // =========================

    isTracking = true;
};

const CustomMapControls = L.Control.extend({
    options: { position: "bottomright" },
    onAdd: function (map) {
        const container = L.DomUtil.create(
            "div",
            "leaflet-bar leaflet-control flex flex-col gap-0.5 mb-2",
        );
        container.style.border = "none";
        container.style.boxShadow = "none";
        container.style.backgroundColor = "transparent";

        container.innerHTML = `

<div class="
bg-[#111827]/90
backdrop-blur-xl
border
border-white/10
rounded-2xl
overflow-hidden
shadow-2xl
flex
flex-col
p-1
gap-1
">

    <a
        href="#"
        onclick="window.toggleMapLabels(); return false;"
        id="btn-toggle-labels"
        title="ซ่อนชื่อ"

        class="
        w-11
h-11
md:w-10
md:h-10
        flex
        items-center
        justify-center
        text-emerald-400
        hover:text-white
        hover:bg-slate-700
        transition-all
        rounded-xl
        "
    >
        <i class="fa-solid fa-eye-slash"></i>
    </a>

    <a
        href="#"
        onclick="window.toggleGPSTracking(); return false;"
        id="btn-track-location"
        title="GPS"

        class="
        w-11
h-11
md:w-10
md:h-10
        flex
        items-center
        justify-center
        text-blue-400
        hover:text-white
        hover:bg-slate-700
        transition-all
        rounded-xl
        "
    >
        <i class="fa-solid fa-location-crosshairs"></i>
    </a>

    <a
        href="#"
        onclick="openGoogleMaps(map.getCenter().lat, map.getCenter().lng); return false;"
        title="Google Maps"

        class="
        w-11
h-11
md:w-10
md:h-10
        flex
        items-center
        justify-center
        text-amber-400
        hover:text-white
        hover:bg-slate-700
        transition-all
        rounded-xl
        "
    >
        <i class="fa-solid fa-map-location-dot text-[10px]"></i>

</div>
`;
        return container;
    },
});
map.addControl(new CustomMapControls());

function toggleMapLayer() {
    const thumbImg = document.getElementById("layer-thumb-img");
    if (currentLayerType === "satellite") {
        map.removeLayer(satelliteLayer);
        streetLayer.addTo(map);
        currentLayerType = "street";
        thumbImg.src = "https://mt1.google.com/vt/lyrs=s&x=3&y=1&z=3";
    } else {
        map.removeLayer(streetLayer);
        satelliteLayer.addTo(map);
        currentLayerType = "satellite";
        thumbImg.src = "https://mt1.google.com/vt/lyrs=m&x=3&y=1&z=3";
    }
}

let allHouses = [];
let markersLayer = L.markerClusterGroup();
let villageLabelLayer = L.layerGroup();
let queueLayer = L.layerGroup();
map.addLayer(markersLayer);

let deliveryQueue = []; // เก็บรายการบ้านจาก KML ที่ถูกเพิ่มลงคิว
let currentQueueIndex = 0;

// ฟังก์ชันโหลดและดึงข้อมูลจาก KML (สมมติว่าใช้ร่วมกับระบบเดิมที่คุณมี)
function loadKMLToQueue(kmlData) {
    // โค้ดส่วนนี้ขึ้นอยู่กับว่าคุณใช้ Library อะไรอ่าน KML (เช่น toGeoJSON)
    // นี่คือตัวอย่างการดึงข้อมูลคร่าวๆ
    // deliveryQueue = extractedDataFromKML;

    currentQueueIndex = 0;
    updateDeliveryCard();
    renderTopLeftQueue();
}
let routingControl = null;
let searchTimer = null;

const villageColors = {
    "ม.10": "#ef4444",
    "ม.16": "#3b82f6",
    "ม.22": "#22c55e",
    "ม.12": "#f59e0b",
    "ม.5": "#8b5cf6",
    "ม.21": "#10b981",
    "ม.2": "#0e7490",
    "ม.19": "#f97316",
    "ม.1": "#ec4899",
    "ม.7": "#06b6d4",
    "ม.8": "#14b8a6",
    "ม.ทั่วไป": "#6b7280",
};
const villagePriority = {
    "ม.10": 1,
    "ม.16": 2,
    "ม.22": 3,
    "ม.12": 4,
    "ม.5": 5,
    "ม.21": 6,
    "ม.2": 7,
    "ม.19": 8,
    "ม.1": 9,
    "ม.7": 10,
    "ม.8": 11,
    "ม.ทั่วไป": 99,
};

function fitMapToBounds() {
    if (allHouses.length > 0) {
        const bounds = L.latLngBounds(allHouses.map((h) => [h.lat, h.lng]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
}

function loadKMLFile() {
    fetch("houses.kml?t=" + new Date().getTime())
        .then((res) => res.text())
        .then((str) => {
            const kml = new DOMParser().parseFromString(str, "text/xml");
            const placemarks = kml.getElementsByTagName("Placemark");
            allHouses = [];

            for (let p of placemarks) {
                const name =
                    p.getElementsByTagName("name")[0]?.textContent || "Unknown";
                const coords = p
                    .getElementsByTagName("coordinates")[0]
                    ?.textContent.trim()
                    .split(",");

                if (coords) {
                    const lat = parseFloat(coords[1]);
                    const lng = parseFloat(coords[0]);

                    if (lat >= 14 && lat <= 15 && lng >= 101 && lng <= 102) {
                        let village = "ม.ทั่วไป";
                        const match = name.match(/ม\.\d+/i);
                        if (match) village = match[0].toLowerCase();
                        allHouses.push({ id: name, lat: lat, lng: lng, village: village });
                    }
                }
            }

            plotMarkers();
            updateVillageStats();
            fitMapToBounds();

            const statusEl = document.getElementById("file-status");
            statusEl.className =
                "mx-3 mt-3 p-2 rounded text-[13px] font-bold text-center bg-[#042f22]/70 text-emerald-400 border border-emerald-400 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,255,153,0.3)] transition-all shrink-0";
            statusEl.innerHTML = `<i class="fa-solid fa-square-check"></i> โหลดพิกัดสำเร็จ ${allHouses.length} หลัง`;
        })
        .catch((err) => {
            console.error("Error loading KML:", err);
            const statusEl = document.getElementById("file-status");
            statusEl.className =
                "mx-3 mt-3 p-2 rounded text-[13px] font-bold text-center bg-red-950/80 text-red-400 border border-red-500 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all shrink-0";
            statusEl.innerHTML = `❌ เกิดข้อผิดพลาดในการโหลดไฟล์ KML`;
        });
}

function plotMarkers(houses = null, isLabelMode = false) {
    markersLayer.clearLayers();
    villageLabelLayer.clearLayers();
    const data = houses || allHouses;

    if (isLabelMode) {
        map.removeLayer(markersLayer);
        map.addLayer(villageLabelLayer);
        data.forEach((h) => {
            const vColor = villageColors[h.village] || "#6b7280";
            const htmlContent = `
                        <div style="display: flex; flex-direction: column; align-items: center; transition: all 0.25s ease;" class="hover:scale-110">
                            <div class="toggleable-label-text" style="background: #0b0f19; border: 2px solid ${vColor}; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 800; color: #fff; box-shadow: 0 0 10px ${vColor}; white-space: nowrap;">${h.id}</div>
                            <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 8px solid ${vColor};"></div>
                        </div>`;
            const icon = L.divIcon({
                html: htmlContent,
                className: "",
                iconSize: [40, 30],
                iconAnchor: [20, 30],
            });
            const marker = L.marker([h.lat, h.lng], { icon: icon });
            marker.on("click", () => addToQueue(h.id));
            villageLabelLayer.addLayer(marker);
        });
    } else {
        map.removeLayer(villageLabelLayer);
        map.addLayer(markersLayer);
        data.forEach((h) => {
            const marker = L.marker(
                [h.lat, h.lng],

                {
                    icon: L.divIcon({
                        className: "normal-house-marker",

                        html: `

                <div class="normal-pin"></div>

            `,

                        iconSize: [30, 30],

                        iconAnchor: [15, 30],
                    }),
                },
            ).bindPopup(`
                        <div class="cyber-popup">

    <button class="popup-close"
        onclick="map.closePopup()">

        ✕
    </button>

    <div class="popup-title">

        ${h.id}

    </div>

    <div class="popup-village">

        ${h.village}

    </div>

    <div class="popup-actions">

        <button
            onclick="openGoogleMaps(${h.lat}, ${h.lng})"

            class="popup-btn map-btn"
        >

            🗺️ ดูแมพ

        </button>

        <button
            onclick="addToQueue('${h.id}', this)"

            class="
bg-emerald-500
hover:bg-emerald-400
text-white
text-[10px]
font-bold
px-3
h-7
rounded-lg
transition-all
"
        >

            ✚ เพิ่มคิว

        </button>

    </div>

</div>
                    `);
            markersLayer.addLayer(marker);
        });
    }
}

// ===================== ROAD-DISTANCE ROUTE OPTIMIZER (OSRM) =====================

// ดึง distance matrix จาก OSRM จริง (ระยะทางตามถนน)
async function fetchOSRMDistanceMatrix(houses) {
    const coords = houses.map((h) => `${h.lng},${h.lat}`).join(";");
    const url = `https://router.project-osrm.org/table/v1/driving/${coords}?annotations=distance`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.code === "Ok") {
            console.log("OSRM Matrix:", JSON.stringify(data.distances));
            console.log(
                "Houses order:",
                houses.map((h) => h.id),
            );
            return data.distances;
        }
    } catch (e) {
        console.warn("OSRM matrix failed, fallback to Haversine:", e);
    }
    return null;
}

// Nearest Neighbor ใช้ matrix ที่ได้จาก OSRM
function buildRouteFromMatrix(matrix, houses) {
    const n = houses.length;

    function nnRoute(startIdx) {
        const visited = new Array(n).fill(false);
        const route = [startIdx];
        visited[startIdx] = true;
        let current = startIdx;
        for (let step = 1; step < n; step++) {
            let nearestIdx = -1,
                minDist = Infinity;
            for (let j = 0; j < n; j++) {
                if (!visited[j] && matrix[current][j] < minDist) {
                    minDist = matrix[current][j];
                    nearestIdx = j;
                }
            }
            visited[nearestIdx] = true;
            route.push(nearestIdx);
            current = nearestIdx;
        }
        return route;
    }

    function routeDist(route) {
        let total = 0;
        for (let i = 0; i < route.length - 1; i++) {
            total += matrix[route[i]][route[i + 1]];
        }
        return total;
    }

    // หา route ที่ดีที่สุดจากทุก start
    // Score = ระยะรวม + penalty ถ้าจุดสุดท้ายอยู่ใกล้จุดแรกมาก (แปลว่าย้อนกลับ)
    let bestRoute = null,
        bestScore = Infinity;
    for (let i = 0; i < n; i++) {
        const r = nnRoute(i);
        const dist = routeDist(r);
        // penalty: ถ้าจุดสุดท้ายใกล้จุดเริ่มมาก = route วนกลับ = ไม่ดี
        const lastToFirst = matrix[r[n - 1]][r[0]];
        const penalty = lastToFirst < dist * 0.3 ? dist * 0.5 : 0;
        const score = dist + penalty;
        if (score < bestScore) {
            bestScore = score;
            bestRoute = r;
        }
    }

    return bestRoute.map((i) => houses[i]);
}

function buildRouteFromMatrixWithDepot(matrix, houses) {
    // matrix มี depot ที่ index 0, บ้านอยู่ที่ index 1..n
    const n = houses.length;

    // หาบ้านที่ใกล้ depot มากที่สุด → เป็นจุดแรก
    let firstIdx = 0;
    let minDistFromDepot = Infinity;
    for (let j = 1; j <= n; j++) {
        if (matrix[0][j] < minDistFromDepot) {
            minDistFromDepot = matrix[0][j];
            firstIdx = j - 1; // index ใน houses array (ลบ 1 เพราะ depot อยู่ที่ 0)
        }
    }

    // Nearest Neighbor จากจุดแรกที่ได้
    // ใช้ submatrix ของบ้านเท่านั้น (index 1..n ใน matrix)
    const visited = new Array(n).fill(false);
    const route = [firstIdx];
    visited[firstIdx] = true;
    let current = firstIdx;

    for (let step = 1; step < n; step++) {
        let nearestIdx = -1,
            minDist = Infinity;
        for (let j = 0; j < n; j++) {
            if (!visited[j]) {
                // matrix index ของบ้านคือ j+1 (เพราะ depot อยู่ที่ 0)
                const dist = matrix[current + 1][j + 1];
                if (dist < minDist) {
                    minDist = dist;
                    nearestIdx = j;
                }
            }
        }
        visited[nearestIdx] = true;
        route.push(nearestIdx);
        current = nearestIdx;
    }

    return route.map((i) => houses[i]);
}

// Haversine fallback (กรณี OSRM ล้ม)
function calcDistance(a, b) {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);
    const aVal =
        sinDLat * sinDLat +
        Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        sinDLng *
        sinDLng;
    return R * 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
}

function optimizeRouteNearestNeighbor(houses) {
    if (houses.length <= 2) return [...houses];

    function buildRoute(startIdx, list) {
        const unvisited = [...list];
        const route = [];
        let current = unvisited.splice(startIdx, 1)[0];
        route.push(current);
        while (unvisited.length > 0) {
            let nearestIdx = 0;
            let minDist = calcDistance(current, unvisited[0]);
            for (let i = 1; i < unvisited.length; i++) {
                const d = calcDistance(current, unvisited[i]);
                if (d < minDist) {
                    minDist = d;
                    nearestIdx = i;
                }
            }
            current = unvisited.splice(nearestIdx, 1)[0];
            route.push(current);
        }
        return route;
    }

    function totalDist(route) {
        let total = 0;
        for (let i = 0; i < route.length - 1; i++) {
            total += calcDistance(route[i], route[i + 1]);
        }
        return total;
    }

    let bestRoute = null,
        bestDist = Infinity;
    for (let i = 0; i < houses.length; i++) {
        const route = buildRoute(i, houses);
        const dist = totalDist(route);
        if (dist < bestDist) {
            bestDist = dist;
            bestRoute = route;
        }
    }

    return bestRoute;
}

function detectRoadBranch(house, junctionLat, junctionLng) {
    const latDiff = house.lat - junctionLat;
    const lngDiff = house.lng - junctionLng;

    // =========================
    // แนวถนน
    // =========================

    // ขึ้น
    if (Math.abs(latDiff) > Math.abs(lngDiff)) {
        return latDiff > 0 ? "north" : "south";
    }

    // ซ้ายขวา
    return lngDiff > 0 ? "east" : "west";
}

async function optimizeRouteForward(houses) {
    if (houses.length <= 1) return houses;

    // =========================
    // เริ่มจากจุดล่างสุด
    // =========================
    let startIndex = 0;

    for (let i = 1; i < houses.length; i++) {
        if (houses[i].lat < houses[startIndex].lat) {
            startIndex = i;
        }
    }

    const route = [];

    const unvisited = [...houses];

    let current = unvisited.splice(startIndex, 1)[0];

    route.push(current);

    // =========================
    // ไล่ตามถนนจริง
    // =========================
    while (unvisited.length > 0) {
        let bestIndex = -1;

        let bestScore = Infinity;

        for (let i = 0; i < unvisited.length; i++) {
            const next = unvisited[i];

            try {
                // -------------------------
                // OSRM route
                // -------------------------
                const url =
                    `https://router.project-osrm.org/route/v1/driving/` +
                    `${current.lng},${current.lat};` +
                    `${next.lng},${next.lat}` +
                    `?overview=false`;

                const res = await fetch(url);

                const data = await res.json();

                if (data.code !== "Ok") continue;

                const roadDistance = data.routes[0].distance;

                let intersectionPenalty = 0;

                try {
                    const steps = data.routes[0].legs[0].steps || [];

                    // จำนวนการเลี้ยว
                    let turnCount = 0;

                    // จำนวน intersection
                    let intersectionCount = 0;

                    for (const step of steps) {
                        // --------------------
                        // เช็ค maneuver
                        // --------------------
                        const type = step.maneuver?.type || "";

                        const modifier = step.maneuver?.modifier || "";

                        // --------------------
                        // ถ้าเป็นการเลี้ยว
                        // --------------------
                        if (modifier.includes("left") || modifier.includes("right")) {
                            turnCount++;
                        }

                        // --------------------
                        // เช็ค intersection
                        // --------------------
                        if (step.intersections) {
                            for (const inter of step.intersections) {
                                const roads = inter.bearings?.length || 0;

                                // 3 แยกขึ้นไป
                                if (roads >= 3) {
                                    intersectionCount++;
                                }
                            }
                        }
                    }

                    // --------------------
                    // ค่าปรับ
                    // --------------------

                    // เลี้ยวเยอะ = penalty
                    intersectionPenalty += turnCount * 120;

                    // 3แยก 4แยก 5แยก = penalty
                    intersectionPenalty += intersectionCount * 250;
                } catch (e) {
                    console.log("intersection check failed", e);
                }

                // -------------------------
                // คำนวณทิศทาง
                // -------------------------
                const latDiff = next.lat - current.lat;

                const lngDiff = next.lng - current.lng;

                // -------------------------
                // ห้ามย้อนกลับแรง ๆ
                // -------------------------
                const backwardPenalty =
                    latDiff < -0.0003 || lngDiff < -0.0003 ? 999999 : 0;

                // -------------------------
                // score สุดท้าย
                // -------------------------
                const score = roadDistance + backwardPenalty + intersectionPenalty;

                if (score < bestScore) {
                    bestScore = score;

                    bestIndex = i;
                }
            } catch (e) {
                console.log(e);
            }
        }

        // fallback
        if (bestIndex === -1) {
            bestIndex = 0;
        }

        current = unvisited.splice(bestIndex, 1)[0];

        route.push(current);
    }

    return route;
}

// addToQueue — async ใช้ OSRM จริง
// addToQueue — FIXED VERSION
async function addToQueue(houseId, btnElement = null) {
    const house = allHouses.find((h) => h.id === houseId);

    // =========================
    // เช็คบ้านซ้ำ
    // =========================

    // =========================
    // เช็คบ้านซ้ำ
    // =========================

    if (!house) {
        if (map) map.closePopup();

        return;
    }

    const isDuplicate = deliveryQueue.some((q) => q.id === houseId);

    if (isDuplicate) {
        // =========================
        // Premium Duplicate UI
        // =========================

        const toast = document.createElement("div");

        toast.innerHTML = `
        <div style="
            display:flex;
            align-items:center;
            gap:14px;
        ">

            <div style="
                width:58px;
                height:58px;
                border-radius:18px;
                background:linear-gradient(
                    135deg,
                    #ff3b3b,
                    #ff7a00
                );
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:28px;
                box-shadow:
                    0 0 20px rgba(255,80,80,0.6);
                flex-shrink:0;
            ">
                ⚠️
            </div>

            <div>

                <div style="
                    font-size:20px;
                    font-weight:800;
                    margin-bottom:6px;
                    color:white;
                    letter-spacing:0.5px;
                ">
                    บ้านซ้ำ
                </div>

                <div style="
                    font-size:15px;
                    color:rgba(255,255,255,0.75);
                    line-height:1.4;
                ">
                    คุณได้เพิ่มบ้านนี้ไปแล้ว
                </div>

            </div>

        </div>
    `;

        toast.style.position = "fixed";

        toast.style.top = "50%";

        toast.style.left = "50%";

        toast.style.transform = "translate(-50%, -50%) scale(0.85)";

        toast.style.minWidth = "320px";

        toast.style.maxWidth = "90vw";

        toast.style.padding = "22px";

        toast.style.borderRadius = "28px";

        toast.style.background = "rgba(15,15,20,0.82)";

        toast.style.backdropFilter = "blur(18px)";

        toast.style.webkitBackdropFilter = "blur(18px)";

        toast.style.border = "1px solid rgba(255,255,255,0.08)";

        toast.style.boxShadow = `
        0 0 0 1px rgba(255,255,255,0.03),
        0 20px 60px rgba(0,0,0,0.45),
        0 0 40px rgba(0,255,200,0.08)
    `;

        toast.style.zIndex = "999999";

        toast.style.opacity = "0";

        toast.style.transition = "all 0.28s cubic-bezier(.2,.9,.2,1)";

        document.body.appendChild(toast);

        // Animate In
        requestAnimationFrame(() => {
            toast.style.opacity = "1";

            toast.style.transform = "translate(-50%, -50%) scale(1)";
        });

        // Animate Out
        setTimeout(() => {
            toast.style.opacity = "0";

            toast.style.transform = "translate(-50%, -50%) scale(0.92)";

            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 2400);

        if (map) map.closePopup();

        return;
    }

    // เพิ่มบ้านเข้าคิว
    deliveryQueue.push(house);

    // =========================
    // เรียงใหม่เมื่อมีมากกว่า 1 จุด
    // =========================
    if (deliveryQueue.length >= 2) {
        const villageOrder = {
            "ม.10": 1,
            "ม.16": 2,
            "ม.22": 3,
            "ม.12": 4,
            "ม.5": 5,
            "ม.21": 6,
            "ม.2": 7,
            "ม.19": 8,
            "ม.1": 9,
            "ม.7": 10,
            "ม.8": 11,
        };

        // =========================
        // แยกกลุ่มตามหมู่
        // =========================

        const grouped = {};

        deliveryQueue.forEach((h) => {
            if (!grouped[h.village]) {
                grouped[h.village] = [];
            }

            grouped[h.village].push(h);
        });

        let finalRoute = [];

        // =========================
        // เรียงตามลำดับหมู่
        // =========================
        const sortedVillages = Object.keys(grouped).sort(
            (a, b) => (villageOrder[a] || 999) - (villageOrder[b] || 999),
        );

        // =========================
        // Optimize ภายในแต่ละหมู่
        // =========================
        for (const village of sortedVillages) {
            const housesInVillage = grouped[village];

            // =========================
            // แยกสายถนน
            // =========================

            const branches = {};

            // ใช้จุดแรกเป็น junction ชั่วคราว
            const junctionLat = housesInVillage[0].lat;

            const junctionLng = housesInVillage[0].lng;

            // =========================
            // เรียงตามบ้านแรกที่เพิ่ม
            // =========================

            const startHouse = deliveryQueue[0];

            housesInVillage.sort((a, b) => {
                return calcDistance(startHouse, a) - calcDistance(startHouse, b);
            });
            housesInVillage.forEach((h) => {
                const branch = detectRoadBranch(h, junctionLat, junctionLng);

                if (!branches[branch]) {
                    branches[branch] = [];
                }

                branches[branch].push(h);
            });

            // เรียงตามถนนจริง
            let villageRoute = [];

            // =========================
            // เรียง branch
            // =========================

            const branchPriority = ["south", "east", "west", "north"];

            branchPriority.forEach((branch) => {
                if (!branches[branch]) return;

                // เรียงใน branch
                const sorted = branches[branch].sort((a, b) => {
                    return (
                        calcDistance(housesInVillage[0], a) -
                        calcDistance(housesInVillage[0], b)
                    );
                });

                villageRoute = villageRoute.concat(sorted);
            });
            // =========================
            // ไม่ optimize ทันที
            // เอาไว้ค่อย optimize ทีหลัง
            // =========================

            villageRoute = [...villageRoute];

            finalRoute = finalRoute.concat(villageRoute);
        }

        deliveryQueue = finalRoute;
    }

    // =========================
    // อัปเดต UI
    // =========================
    updateQueueUI(true);
    updateCurrentHouseCard();
    renderTopLeftQueue();

    // =========================
    // refresh queue ลื่น ๆ
    // =========================

    clearTimeout(window.queueRefreshTimer);

    window.queueRefreshTimer = setTimeout(() => {
        refreshQueueMap();
    }, 300);

    if (map) map.closePopup();

    // =========================
    // ซ่อนแถวที่เพิ่มแล้ว
    // =========================
    if (btnElement) {
        const row = btnElement.closest(".flex.justify-between.items-center");

        if (row) {
            row.style.transition = "all 0.3s ease-out";

            row.style.opacity = "0";

            row.style.transform = "translateX(20px)";

            setTimeout(() => {
                row.style.display = "none";
            }, 300);
        }
    }
}

function jumpToQueueIndex(index) {
    currentQueueIndex = index;

    updateDeliveryCard();
    renderTopLeftQueue();

    const house = deliveryQueue[index];

    if (!house) return;

    map.flyTo([house.lat, house.lng], 19, {
        duration: 1.2,
    });

    renderTopLeftQueue();
}

function clearQueue() {
    // =========================
    // Premium Confirm Modal
    // =========================

    const overlay = document.createElement("div");

    overlay.style.position = "fixed";

    overlay.style.top = "0";

    overlay.style.left = "0";

    overlay.style.width = "100%";

    overlay.style.height = "100%";

    overlay.style.background = "rgba(0,0,0,0.55)";

    overlay.style.backdropFilter = "blur(8px)";

    overlay.style.zIndex = "999999";

    overlay.style.display = "flex";

    overlay.style.alignItems = "center";

    overlay.style.justifyContent = "center";

    overlay.style.opacity = "0";

    overlay.style.transition = "0.25s ease";

    const modal = document.createElement("div");

    modal.style.width = "380px";

    modal.style.maxWidth = "92vw";

    modal.style.padding = "28px";

    modal.style.borderRadius = "28px";

    modal.style.background = "rgba(15,15,20,0.92)";

    modal.style.border = "1px solid rgba(255,255,255,0.08)";

    modal.style.boxShadow = `
        0 20px 60px rgba(0,0,0,0.45),
        0 0 40px rgba(0,255,200,0.08)
    `;

    modal.style.color = "white";

    modal.style.fontFamily = "sans-serif";

    modal.style.transform = "scale(0.9)";

    modal.style.transition = "0.25s ease";

    modal.innerHTML = `
        <div style="
            display:flex;
            align-items:center;
            gap:14px;
            margin-bottom:18px;
        ">

            <div style="
                width:56px;
                height:56px;
                border-radius:18px;
                background:linear-gradient(
                    135deg,
                    #ff3b3b,
                    #ff7a00
                );
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:26px;
                box-shadow:
                    0 0 20px rgba(255,100,100,0.5);
            ">
                ⚠️
            </div>

            <div>

                <div style="
                    font-size:22px;
                    font-weight:800;
                    margin-bottom:4px;
                ">
                    ยืนยันการล้าง
                </div>

                <div style="
                    font-size:14px;
                    color:rgba(255,255,255,0.7);
                ">
                    ล้างรายการพัสดุทั้งหมดใช่หรือไม่?
                </div>

            </div>

        </div>

        <div style="
            display:flex;
            gap:12px;
            margin-top:24px;
        ">

            <button id="cancelBtn" style="
                flex:1;
                height:48px;
                border:none;
                border-radius:16px;
                background:rgba(255,255,255,0.06);
                color:white;
                font-weight:700;
                cursor:pointer;
                transition:0.2s;
            ">
                ยกเลิก
            </button>

            <button id="confirmBtn" style="
                flex:1;
                height:48px;
                border:none;
                border-radius:16px;
                background:linear-gradient(
                    135deg,
                    #00c896,
                    #00e0ff
                );
                color:#001b1b;
                font-weight:800;
                cursor:pointer;
                box-shadow:
                    0 0 20px rgba(0,255,200,0.35);
                transition:0.2s;
            ">
                ตกลง
            </button>

        </div>
    `;

    overlay.appendChild(modal);

    document.body.appendChild(overlay);

    // Animate In
    requestAnimationFrame(() => {
        overlay.style.opacity = "1";

        modal.style.transform = "scale(1)";
    });

    // Cancel
    modal.querySelector("#cancelBtn").onclick = () => {
        overlay.style.opacity = "0";

        modal.style.transform = "scale(0.9)";

        setTimeout(() => {
            overlay.remove();
        }, 250);
    };

    // Confirm
    modal.querySelector("#confirmBtn").onclick = () => {
        overlay.remove();

        deliveryQueue = [];

        refreshQueueMap();

        plotMarkers();

        updateQueueUI(true);
        updateCurrentHouseCard();
        renderTopLeftQueue();
    };
}

function reverseQueueDirection() {
    if (deliveryQueue.length <= 1) return;
    deliveryQueue.reverse();
    updateQueueUI(true);
    updateCurrentHouseCard();
    renderTopLeftQueue();
    refreshQueueMap();
}

function getHouseNumberValue(id) {
    let houseNumberPart = id.split(/ม\./i)[0].trim();
    const match = houseNumberPart.match(/^\d+/);
    return match ? parseInt(match[0]) : 0;
}

function updateQueueUI(refreshList = true) {
    if (refreshList) {
        const ul = document.getElementById("queue-list");

        ul.innerHTML = "";

        // =========================
        // ไม่มีคิว
        // =========================

        if (deliveryQueue.length === 0) {
            ul.innerHTML = `
                <li class="
                    text-slate-500
                    text-center
                    py-6
                    text-[11px]
                ">
                    ยังไม่มีรายการคิว
                </li>
            `;
        }

        // =========================
        // render queue
        // =========================

        deliveryQueue.forEach((h, i) => {
            const li = document.createElement("li");

            // =========================
            // สำคัญ !!!
            // เพิ่ม queue-house-item
            // =========================

            li.className =
    "rounded-xl flex items-center justify-between cursor-grab active:cursor-grabbing queue-item-neon group";

            li.setAttribute("data-id", h.id);

            li.innerHTML = `

<div
    onclick="map.setView([${h.lat}, ${h.lng}], 18)"
    class="
        flex
        items-center
        gap-2
        flex-1
        min-w-0
        cursor-pointer
    "
>

    <span class="
        bg-amber-500
        text-black
        text-[10px]
        font-bold
        w-5
        h-5
        rounded-full
        flex
        items-center
        justify-center
        shrink-0
    ">
        ${i + 1}
    </span>

    <div class="
        text-white
        text-[11px]
        font-medium
        truncate
        leading-normal
    ">
        ${h.id}
    </div>

</div>

<div class="
    flex
    items-center
    gap-1
    shrink-0
">

    <button
        onclick="openGoogleMaps(${h.lat}, ${h.lng})"
        class="
            text-blue-400
            hover:text-blue-300
            w-7
            h-7
            flex
            items-center
            justify-center
            rounded-lg
            transition-all
        "
    >
        <i class="fa-solid fa-map-location-dot text-[11px]"></i>
    </button>

    <button
        class="
            delete-btn
            text-slate-500
            hover:text-red-400
            w-7
            h-7
            flex
            items-center
            justify-center
            rounded-lg
            transition-all
        "
        data-id="${h.id}"
    >
        <i class="fa-solid fa-xmark text-[11px]"></i>
    </button>

</div>

`;

            ul.appendChild(li);
        });

        // =========================
        // delete queue
        // =========================

        document.querySelectorAll("#queue-list .delete-btn").forEach((btn) => {
            btn.addEventListener("click", function (e) {
                e.stopPropagation();

                const li = this.closest("li");

                li.style.transform = "translateX(50px)";

                li.style.opacity = "0";

                setTimeout(() => {
                    removeFromQueue(this.getAttribute("data-id"));
                }, 200);
            });
        });
    }

    // =========================
    // redraw
    // =========================

    plotMarkers();

    drawPath();
}

Sortable.create(document.getElementById("queue-list"), {
    animation: 200,
    ghostClass: "sortable-ghost",
    onEnd: function () {
        const newOrder = [];
        document.querySelectorAll("#queue-list li").forEach((el) => {
            const id = el.getAttribute("data-id");
            const house = allHouses.find((h) => h.id === id);
            if (house) newOrder.push(house);
        });
        deliveryQueue = newOrder;
        updateQueueUI(true);
        updateCurrentHouseCard();
        refreshQueueMap();
    },
});

function refreshQueueMap() {
    // ไม่มีคิว
    if (deliveryQueue.length === 0) {
        const hideStyle = document.getElementById("hide-unselected-css");

        if (hideStyle) hideStyle.remove();

        if (typeof window.queueMarkerLayer !== "undefined") {
            window.queueMarkerLayer.clearLayers();
        }

        return;
    }

    // ซ่อนเฉพาะ marker บ้าน
    if (!document.getElementById("hide-unselected-css")) {
        const style = document.createElement("style");

        style.id = "hide-unselected-css";

        style.innerHTML = `

            /* ซ่อน marker บ้าน */
            .leaflet-marker-icon:not(.is-queue-marker) {

                opacity: 0 !important;

                pointer-events: none !important;
            }

            /* ซ่อนเงา */
            .leaflet-shadow-pane {

                display: none !important;
            }

        `;

        document.head.appendChild(style);
    }

    // สร้าง layer
    if (typeof window.queueMarkerLayer === "undefined") {
        window.queueMarkerLayer = L.layerGroup().addTo(map);
    }

    // ล้าง marker เก่า
    window.queueMarkerLayer.clearLayers();

    // สร้าง marker คิว
    deliveryQueue.forEach((h, index) => {
        const queueIcon = L.divIcon({
            className: "is-queue-marker",

            html: `

<div class="pin-wrapper" style="
    position:relative;
    width:48px;
    height:48px;
    display:flex;
    align-items:center;
    justify-content:center;
">

    <!-- LABEL -->
    <div class="pin-label ${index === currentQueueIndex ? "current" : h.isCompleted ? "done" : "next"
                }">

        ${h.id}

    </div>

    <!-- PULSE -->
    <div class="pin-pulse ${index === currentQueueIndex ? "current" : h.isCompleted ? "done" : "next"
                }"></div>

    <!-- PIN -->
    <div class="delivery-pin ${index === currentQueueIndex ? "current" : h.isCompleted ? "done" : "next"
                }"></div>

</div>

`,

            iconSize: [40, 40],

            iconAnchor: [24, 36],
        });

        const marker = L.marker(
            [h.lat, h.lng],

            {
                icon: queueIcon,
            },
        );

        marker.addTo(window.queueMarkerLayer);
    });
}

async function drawPath() {
    if (window.routingControl) {
        map.removeControl(window.routingControl);
        window.routingControl = null;
    }
    if (window.straightLines) {
        window.straightLines.forEach((l) => map.removeLayer(l));
        window.straightLines = [];
    }

    if (deliveryQueue.length < 2) return;

    window.straightLines = [];

    // รอทีละ segment ตามลำดับ (await ทีละอัน)
    for (let i = 0; i < deliveryQueue.length - 1; i++) {
        const from = deliveryQueue[i];
        const to = deliveryQueue[i + 1];
        const dist = calcDistance(from, to);
        checkAndDrawSegment(from, to, dist);
    }
}

async function checkAndDrawSegment(from, to, straightDist) {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.code === "Ok") {
            const roadDist = data.routes[0].distance / 1000; // km
            const coords = data.routes[0].geometry.coordinates.map((c) => [
                c[1],
                c[0],
            ]);

            // ถ้าอ้อมเกิน 3.5 เท่าของเส้นตรง = เส้นประ
            // ถ้าถนนอ้อมเกินเส้นตรงมากกว่า 800 เมตร = เส้นประ
            const detour = (roadDist - straightDist) * 1000; // แปลงเป็นเมตร
            console.log(
                `${from.id} → ${to.id} | เส้นตรง: ${(straightDist * 1000).toFixed(0)}m | ถนนจริง: ${(roadDist * 1000).toFixed(0)}m | อ้อม: ${detour.toFixed(0)}m`,
            );
            const isDashed = detour > 2000;
            console.log(
                `isDashed: ${isDashed}, detour: ${detour.toFixed(0)}m → วาด${isDashed ? "เส้นประ" : "เส้นทึบ"}`,
            );

            if (isDashed) {
                // เส้นตัดปะ — วาดเส้นตรงระหว่าง 2 จุด
                const dashed = L.polyline(
                    [
                        [from.lat, from.lng],
                        [to.lat, to.lng],
                    ],
                    {
                        color: "#00ff99",
                        weight: 3,
                        opacity: 0.8,
                        dashArray: "10, 10",
                    },
                ).addTo(map);
                window.straightLines.push(dashed);
            } else {
                // เส้นทึบ — วาดตามถนนจริง
                const solid = L.polyline(coords, {
                    color: "#005533",
                    weight: 12,
                    opacity: 0.4,
                }).addTo(map);
                const solid2 = L.polyline(coords, {
                    color: "#00ff99",
                    weight: 5,
                    opacity: 0.9,
                }).addTo(map);
                window.straightLines.push(solid, solid2);
            }
        }
    } catch (e) {
        // fallback เส้นประ
        const dashed = L.polyline(
            [
                [from.lat, from.lng],
                [to.lat, to.lng],
            ],
            {
                color: "#00ff99",
                weight: 3,
                opacity: 0.8,
                dashArray: "10, 10",
            },
        ).addTo(map);
        window.straightLines.push(dashed);
    }
}

function filterByVillage() {
    const selectedVillage = document.getElementById("village-filter").value;
    const quickResults = document.getElementById("quick-results-columns");
    if (selectedVillage === "all") {
        plotMarkers(allHouses);
        quickResults.innerHTML = "";
        return;
    }
    const filtered = allHouses.filter(
        (h) => h.village === selectedVillage.toLowerCase(),
    );
    plotMarkers(filtered);
    if (filtered.length > 0) {
        let html = `<div class="text-[11px] font-bold text-emerald-400 mb-2 mt-2 italic px-1 transition-all">พบทั้งหมด ${filtered.length} หลัง</div>`;
        html += filtered
            .filter((h) => {
                // =========================
                // ซ่อนบ้านที่อยู่ในคิวแล้ว
                // =========================

                return !deliveryQueue.some((q) => q.id === h.id);
            })
            .map(
                (h) => `
                    <div class="flex justify-between items-center bg-slate-900/60 p-2 rounded border border-slate-800 mb-1 hover:border-emerald-500/50 hover:bg-slate-800 transition-all hover:translate-x-1">
                        <span class="font-bold text-[12px] text-white">${h.id}</span>

                        <div class="flex gap-1">

                            <button
                                onclick="openGoogleMaps(${h.lat}, ${h.lng})"
                                class="bg-blue-600 hover:bg-blue-500 text-white font-bold px-2 py-1 rounded text-[9px] cursor-pointer"
                                title="ดูใน Google Maps"
                            >
                                <i class="fa-solid fa-map-location-dot"></i>
                            </button>

                            <button
                                onclick="addToQueue('${h.id}', this)"
                                class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded text-[9px] cursor-pointer"
                            >
                                เพิ่ม
                            </button>

                        </div>

                    </div>
                `,
            )
            .join("");
        quickResults.innerHTML = html;
    } else {
        quickResults.innerHTML =
            '<div class="text-center py-2 mt-2 text-slate-500">ไม่พบข้อมูล</div>';
    }
}

function debounceSearch() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(searchHouse, 250);
}

function searchHouse() {
    const query = document
        .getElementById("search-number-input")
        .value.trim()
        .toLowerCase();
    const quickResults = document.getElementById("quick-results-columns");

    if (!query) {
        quickResults.innerHTML = "";
        plotMarkers();
        return;
    }

    const filtered = allHouses.filter((h) => h.id.toLowerCase().includes(query));
    plotMarkers(filtered);
    const groups = {};

    filtered.forEach((h) => {
        let match = h.id.split(/ม\./i)[0].trim().match(/^\d+/);
        const groupKey = match ? match[0] : "อื่นๆ";
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(h);
    });

    const sortedKeys = Object.keys(groups).sort((a, b) =>
        isNaN(a) ? 1 : parseInt(a) - parseInt(b),
    );
    let html = "";

    sortedKeys.forEach((key) => {
        html += `<div class="text-[9px] font-bold text-blue-400 mt-2 mb-1 px-1 border-b border-slate-800 pb-1 italic">กลุ่มเลขบ้านตัวหน้า ${key}</div>`;

        groups[key].sort((a, b) => {
            const pA = villagePriority[a.village] || 99;
            const pB = villagePriority[b.village] || 99;
            if (pA !== pB) return pA - pB;
            return getHouseNumberValue(a.id) - getHouseNumberValue(b.id);
        });

        html += groups[key]
            .map(
                (h) => `
                    <div class="flex justify-between items-center bg-slate-900/60 p-2 rounded border border-slate-800 mb-1 hover:border-blue-500/50 hover:bg-slate-800 transition-all hover:translate-x-1">
                        <div class="flex flex-col">
                            <span class="font-bold text-[12px] text-white">${h.id}</span>
                            <span class="text-[9px] text-slate-400">${h.village.toUpperCase()}</span>
                        </div>
                        <div class="flex gap-1">
                            <button onclick="openGoogleMaps(${h.lat}, ${h.lng})" class="bg-blue-600 hover:bg-blue-500 text-white font-bold px-2 py-1 rounded text-[9px]"><i class="fa-solid fa-map-location-dot"></i></button>
                            <button onclick="map.setView([${h.lat}, ${h.lng}], 19)" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2 py-1 rounded text-[9px]">เล็ง</button>
                            <button onclick="addToQueue('${h.id}', this)" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2 py-1 rounded text-[9px]">เพิ่ม</button>
                        </div>
                    </div>
                `,
            )
            .join("");
    });
    quickResults.innerHTML =
        html ||
        '<div class="text-center py-4 text-slate-500">ไม่พบข้อมูลพิกัดบ้าน</div>';
}

function updateVillageStats() {
    const villages = [
        { name: "ม.10 บุเจ้าคุณ", code: "ม.10" },
        { name: "ม.16 คลองปลากั้ง", code: "ม.16" },
        { name: "ม.22 ทรัพย์ทวีคูณ", code: "ม.22" },
        { name: "ม.12 สันกำแพง", code: "ม.12" },
        { name: "ม.5 คลองสะท้อน", code: "ม.5" },
        { name: ".21 วังไผ่ทอง", code: "ม.21" },
        { name: "ม.2 ท่าวังไทร", code: "ม.2" },
        { name: "ม.19 วังศิลา", code: "ม.19" },
        { name: "ม.1 บ้านวังหมี", code: "ม.1" },
        { name: "ม.7 บุเนิน", code: "ม.7" },
        { name: "ม.8 ท่าน้ำซับ", code: "ม.8" },
    ];

    const statsContainer = document.getElementById("village-stats-list");

    statsContainer.innerHTML = "";

    villages.forEach((v, index) => {
        const villageHouses = allHouses.filter(
            (h) => h.village === v.code.toLowerCase(),
        );

        const count = villageHouses.length;

        const item = document.createElement("div");

        // =========================
        // ACTIVE VILLAGE
        // =========================

        const isActive = window.selectedVillageCode === v.code;

        item.className = `

            flex
            justify-between
            items-center

            py-2
            px-2

            rounded

            border-b
            border-white/5

            cursor-pointer

            transition-all
            duration-300

            hover:translate-x-1

            group

            ${isActive
                ? `

                    bg-cyan-500/15

                    border
                    border-cyan-400/50

                    shadow-[0_0_18px_rgba(0,255,255,0.35)]

                    scale-[1.01]

                `
                : `

                    bg-transparent

                    hover:bg-white/10

                `
            }

        `;

        item.innerHTML = `

            <span class="
                text-slate-300
                text-[12px]
                font-medium
                group-hover:text-white
                transition-colors
            ">
                ${index + 1}.) ${v.name}
            </span>

            <span class="
                bg-[#00f0ff]/20
                text-[#00f0ff]

                border
                border-[#00f0ff]/40

                text-[9px]
                font-bold

                px-2
                py-0.5

                rounded-full

                shadow-[0_0_8px_rgba(0,240,255,0.2)]

                group-hover:scale-110
            ">
                ${count}
            </span>

        `;

        item.onclick = () => {
            // =========================
            // SAVE ACTIVE
            // =========================

            window.selectedVillageCode = v.code;

            const filtered = allHouses.filter(
                (h) => h.village === v.code.toLowerCase(),
            );

            plotMarkers(filtered, true);

            // =========================
            // REFRESH HIGHLIGHT
            // =========================

            updateVillageStats();

            if (filtered.length > 0)
                map.fitBounds(
                    L.latLngBounds(filtered.map((h) => [h.lat, h.lng])),

                    {
                        padding: [20, 20],
                        maxZoom: 18,
                    },
                );
        };

        statsContainer.appendChild(item);
    });

    // =========================
    // RESET BUTTON
    // =========================

    const resetBtn = document.createElement("div");

    resetBtn.className =
        "mt-2 w-full bg-[#111827] border border-blue-500/40 text-blue-400 hover:bg-blue-950/50 py-1.5 rounded-md text-[11px] font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm";

    resetBtn.innerHTML =
        '<i class="fa-solid fa-arrows-rotate"></i> แสดงบ้านทั้งหมด';

    resetBtn.onclick = () => {
        // =========================
        // CLEAR ACTIVE
        // =========================

        window.selectedVillageCode = null;

        plotMarkers(null, false);

        updateVillageStats();

        map.setView([14.41, 101.7], 13);
    };

    statsContainer.appendChild(resetBtn);
}

function toggleVillageStats() {
    const wrapper = document.getElementById("stats-grid-wrapper");
    const icon = document.getElementById("toggle-icon");
    if (wrapper.classList.contains("grid-collapsed")) {
        wrapper.classList.remove("grid-collapsed");
        icon.style.transform = "rotate(0deg)";
    } else {
        wrapper.classList.add("grid-collapsed");
        icon.style.transform = "rotate(180deg)";
    }
}

// ================= ฟังก์ชันเริ่มจัดส่งพร้อม Loading =================
function validateAndStartDelivery() {
    if (!deliveryQueue || deliveryQueue.length === 0) {
        // =========================
        // Premium Warning Modal
        // =========================

        const overlay = document.createElement("div");

        overlay.style.position = "fixed";

        overlay.style.top = "0";

        overlay.style.left = "0";

        overlay.style.width = "100%";

        overlay.style.height = "100%";

        overlay.style.background = "rgba(0,0,0,0.55)";

        overlay.style.backdropFilter = "blur(8px)";

        overlay.style.zIndex = "999999";

        overlay.style.display = "flex";

        overlay.style.alignItems = "center";

        overlay.style.justifyContent = "center";

        overlay.style.opacity = "0";

        overlay.style.transition = "0.25s ease";

        const modal = document.createElement("div");

        modal.style.width = "380px";

        modal.style.maxWidth = "92vw";

        modal.style.padding = "28px";

        modal.style.borderRadius = "28px";

        modal.style.background = "rgba(15,15,20,0.92)";

        modal.style.border = "1px solid rgba(255,255,255,0.08)";

        modal.style.boxShadow = `
        0 20px 60px rgba(0,0,0,0.45),
        0 0 40px rgba(0,255,200,0.08)
    `;

        modal.style.color = "white";

        modal.style.fontFamily = "sans-serif";

        modal.style.transform = "scale(0.9)";

        modal.style.transition = "0.25s ease";

        modal.innerHTML = `
        <div style="
            display:flex;
            align-items:center;
            gap:14px;
            margin-bottom:18px;
        ">

            <div style="
                width:56px;
                height:56px;
                border-radius:18px;
                background:linear-gradient(
                    135deg,
                    #ffb347,
                    #ffcc33
                );
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:26px;
                box-shadow:
                    0 0 20px rgba(255,180,80,0.5);
            ">
                ⚠️
            </div>

            <div>

                <div style="
                    font-size:22px;
                    font-weight:800;
                    margin-bottom:4px;
                ">
                    ยังไม่ได้เลือกคิวจัดส่ง
                </div>

                <div style="
                    font-size:14px;
                    color:rgba(255,255,255,0.7);
                ">
                    กรุณาเพิ่มบ้านเข้าคิวก่อนครับ
                </div>

            </div>

        </div>

        <div style="
            display:flex;
            margin-top:24px;
        ">

            <button id="okBtn" style="
                width:100%;
                height:48px;
                border:none;
                border-radius:16px;
                background:linear-gradient(
                    135deg,
                    #00c896,
                    #00e0ff
                );
                color:#001b1b;
                font-weight:800;
                cursor:pointer;
                box-shadow:
                    0 0 20px rgba(0,255,200,0.35);
                transition:0.2s;
            ">
                เข้าใจแล้ว
            </button>

        </div>
    `;

        overlay.appendChild(modal);

        document.body.appendChild(overlay);

        // Animate In
        requestAnimationFrame(() => {
            overlay.style.opacity = "1";

            modal.style.transform = "scale(1)";
        });

        // Close
        modal.querySelector("#okBtn").onclick = () => {
            overlay.style.opacity = "0";

            modal.style.transform = "scale(0.9)";

            setTimeout(() => {
                overlay.remove();
            }, 250);
        };

        return;
    }

    const loader = document.getElementById("delivery-loader-overlay");
    const bar = document.getElementById("delivery-loader-bar");

    if (loader && bar) {
        loader.classList.remove("opacity-0", "pointer-events-none");
        loader.classList.add("opacity-100");

        bar.style.width = "0%";
        setTimeout(() => {
            bar.style.width = "100%";
        }, 100);

        setTimeout(() => {
            loader.classList.remove("opacity-100");
            loader.classList.add("opacity-0", "pointer-events-none");
            startDeliveryMode();
        }, 2500);
    } else {
        startDeliveryMode();
    }
}

function startDeliveryMode() {
    const sidebar = document.getElementById("main-sidebar");

    const overlay = document.getElementById("mobile-overlay");

    // Mobile Sidebar Hide
    if (sidebar && window.innerWidth < 768) {
        sidebar.classList.add("-translate-x-full");

        if (overlay) overlay.classList.remove("active");
    }

    // =========================
    // Hide UI
    // =========================

    [
        "main-sidebar",
        "resizer",
        "village-stats-panel",
        "btn-mobile-menu",
        "layer-toggle-btn",
    ].forEach((id) => {
        const el = document.getElementById(id);

        if (el) el.classList.add("delivery-hidden");
    });

    // =========================
    // Show Exit Button
    // =========================

    const exitBtn = document.getElementById("exit-full-mode");

    if (exitBtn) exitBtn.style.setProperty("display", "flex", "important");

    // =========================
    // Show Delivery Card
    // =========================

    updateDeliveryCard();
    renderTopLeftQueue();

    document.getElementById("top-left-queue-panel").classList.remove("hidden");

    updateDeliveryCard();
    renderTopLeftQueue();

    // =========================
    // Show Queue Panel
    // =========================

    // =========================
    // Show Queue Panel
    // =========================

    const queuePanel = document.getElementById("top-left-queue-panel");

    if (queuePanel) {
        queuePanel.classList.remove("hidden");
    }

    // =========================
    // Refresh Map
    // =========================

    setTimeout(() => {
        if (map) map.invalidateSize();
    }, 300);
}

// 1. ค้นหาฟังก์ชันที่ใช้โหลดไฟล์ KML (ชื่ออาจเป็น handleFileSelect หรือ handleKML)
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const kmlText = e.target.result;

            // ... (โค้ดเดิมของคุณที่ใช้ดึงข้อมูลจาก KML ใส่ deliveryQueue) ...

            // เมื่อโหลดเสร็จแล้ว ให้เพิ่ม 2 บรรทัดนี้ไว้ท้ายสุดของ reader.onload
            currentQueueIndex = 0; // บังคับให้เริ่มที่จุดที่ 1
            renderTopLeftQueue(); // สั่งให้แสดงรายชื่อที่มุมบนซ้ายทันที
        };
        reader.readAsText(file);
    }
}

function exitDeliveryMode() {
    // =========================
    // Premium Exit Modal
    // =========================

    const overlay = document.createElement("div");

    overlay.style.position = "fixed";

    overlay.style.top = "0";

    overlay.style.left = "0";

    overlay.style.width = "100%";

    overlay.style.height = "100%";

    overlay.style.background = "rgba(0,0,0,0.68)";

    overlay.style.backdropFilter = "blur(10px)";

    overlay.style.zIndex = "999999";

    overlay.style.display = "flex";

    overlay.style.alignItems = "center";

    overlay.style.justifyContent = "center";

    overlay.style.opacity = "0";

    overlay.style.transition = "0.28s ease";

    const modal = document.createElement("div");

    modal.style.width = "390px";

    modal.style.maxWidth = "92vw";

    modal.style.padding = "26px";

    modal.style.borderRadius = "30px";

    modal.style.background = "linear-gradient(180deg,#050816,#09101f)";

    modal.style.border = "1px solid rgba(255,255,255,0.08)";

    modal.style.boxShadow = `
        0 20px 70px rgba(0,0,0,0.55),
        0 0 40px rgba(0,255,200,0.08)
    `;

    modal.style.color = "white";

    modal.style.fontFamily = "sans-serif";

    modal.style.transform = "scale(0.9)";

    modal.style.transition = "0.28s ease";

    modal.innerHTML = `
        <div style="
            position:relative;
            overflow:hidden;
            border-radius:24px;
        ">

            <!-- Soft Glow -->
            <div style="
                position:absolute;
                width:180px;
                height:180px;
                background:rgba(255,80,80,0.12);
                filter:blur(70px);
                top:-80px;
                right:-60px;
                border-radius:50%;
                pointer-events:none;
            "></div>

            <!-- Top Line -->
            <div style="
                width:100%;
                height:2px;
                border-radius:999px;
                background:linear-gradient(
                    90deg,
                    transparent,
                    rgba(255,80,80,0.8),
                    transparent
                );
                margin-bottom:24px;
                opacity:0.8;
            "></div>

            <!-- Icon -->
            <div style="
                width:82px;
                height:82px;
                margin:0 auto;
                border-radius:26px;
                background:linear-gradient(
                    135deg,
                    #ff4d4d,
                    #ff7a00
                );
                display:flex;
                align-items:center;
                justify-content:center;
                box-shadow:
                    0 0 35px rgba(255,100,100,0.35);
                position:relative;
            ">

                <div style="
                    position:absolute;
                    inset:-8px;
                    border-radius:32px;
                    border:2px solid rgba(255,100,100,0.14);
                "></div>

                <div style="
                    font-size:34px;
                    font-weight:900;
                    color:#1b0b00;
                ">
                    ✕
                </div>

            </div>

            <!-- Title -->
            <div style="
                margin-top:20px;
                text-align:center;
                font-size:30px;
                font-weight:900;
                color:white;
                letter-spacing:0.4px;
            ">
                ออกจากโหมดส่ง
            </div>

            <!-- Description -->
            <div style="
                margin-top:10px;
                text-align:center;
                font-size:15px;
                line-height:1.7;
                color:rgba(255,255,255,0.68);
            ">
                ระบบกำลังพาท่านกลับ
                <br>
                สู่หน้าหลัก
            </div>

            <!-- Loader -->
            <div style="
                margin-top:24px;
            ">

                <div style="
                    width:100%;
                    height:10px;
                    background:rgba(255,255,255,0.06);
                    border-radius:999px;
                    overflow:hidden;
                    position:relative;
                ">

                    <div id="premiumBar" style="
                        width:0%;
                        height:100%;
                        border-radius:999px;
                        background:linear-gradient(
                            90deg,
                            #ff4d4d,
                            #ff7a00
                        );
                        box-shadow:
                            0 0 20px rgba(255,120,80,0.45);
                        transition:2s ease;
                    "></div>

                </div>

            </div>

        </div>
    `;

    overlay.appendChild(modal);

    document.body.appendChild(overlay);

    // Animate In
    requestAnimationFrame(() => {
        overlay.style.opacity = "1";

        modal.style.transform = "scale(1)";
    });

    // Loader Animate
    const premiumBar = modal.querySelector("#premiumBar");

    setTimeout(() => {
        premiumBar.style.width = "100%";
    }, 100);

    // =========================
    // Exit จริง
    // =========================

    setTimeout(() => {
        [
            "main-sidebar",
            "resizer",
            "village-stats-panel",
            "btn-mobile-menu",
            "layer-toggle-btn",
        ].forEach((id) => {
            const el = document.getElementById(id);

            if (el) el.classList.remove("delivery-hidden");
        });

        const exitBtn = document.getElementById("exit-full-mode");

        if (exitBtn) exitBtn.style.setProperty("display", "none", "important");

        document.getElementById("delivery-status-card").classList.add("hidden");

        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 300);

        // Close popup
        overlay.style.opacity = "0";

        modal.style.transform = "scale(0.94)";

        setTimeout(() => {
            overlay.remove();
        }, 280);
    }, 2200);
}

// ================= อัปเดตข้อมูลเป้าหมายบนแผง =================
// ฟังก์ชันอัปเดตหน้าจอ Card
function updateDeliveryCard() {
    const card = document.getElementById("delivery-status-card");

    // ถ้าไม่มีข้อมูลในคิว ให้ซ่อน Card
    if (!deliveryQueue || deliveryQueue.length === 0) {
        card.classList.add("hidden");
        return;
    }

    card.classList.remove("hidden");

    // ดึงข้อมูลลำดับปัจจุบันมาโชว์
    const target = deliveryQueue[currentQueueIndex];

    // --- จุดที่แก้ไข: การดึงชื่อและเลขที่บ้าน ---
    // ลองดึงจาก id หรือ name หรือ featureName (ตามมาตรฐาน KML)
    const houseNo =
        target.id || target.name || target.featureName || "ไม่พบเลขที่";
    const village = target.village || target.description || "ไม่พบหมู่บ้าน";

    // อัปเดตข้อมูลลง UI
    document.getElementById("target-house").innerText = houseNo;
    document.getElementById("target-village").innerText = village;

    // อัปเดตตัวเลขคิว (เช่น 1/11)
    const queueNum = document.getElementById("queue-number");
    if (queueNum) {
        queueNum.innerText = `${currentQueueIndex + 1}/${deliveryQueue.length}`;
    }

    // สั่งแผนที่ให้เคลื่อนไป (ใช้ชื่อตัวแปรแผนที่ตามใน index.html ของคุณ)
    if (map && target.lat && target.lng) {
        map.flyTo([target.lat, target.lng], 18, {
            animate: true,
            duration: 1.5,
        });
    }
}

// ฟังก์ชันเลื่อนไปอันถัดไป
function completeCurrentDelivery() {
    // =========================
    // ไม่มีคิว
    // =========================

    if (deliveryQueue.length === 0) return;

    // =========================
    // บ้านปัจจุบัน
    // =========================

    const currentHouse = deliveryQueue[currentQueueIndex];

    // =========================
    // เปลี่ยนสถานะ
    // =========================

    currentHouse.isCompleted = true;

    // =========================
    // ANIMATE MARKER
    // =========================

    const currentMarker = document.querySelector(".delivery-pin.current");

    if (currentMarker) {
        currentMarker.animate(
            [
                {
                    transform: "scale(1)",

                    opacity: 1,
                },

                {
                    transform: "scale(1.25)",

                    opacity: 0.55,
                },

                {
                    transform: "scale(0)",

                    opacity: 0,
                },
            ],

            {
                duration: 320,

                easing: "cubic-bezier(0.22,1,0.36,1)",
            },
        );
    }

    // =========================
    // refresh map ก่อน
    // =========================

    refreshQueueMap();

    // =========================
    // รอ animation
    // =========================

    setTimeout(() => {
        // =========================
        // ลบออกจาก queue
        // =========================

        deliveryQueue.splice(currentQueueIndex, 1);

        // =========================
        // กัน index หลุด
        // =========================

        if (currentQueueIndex >= deliveryQueue.length) {
            currentQueueIndex = deliveryQueue.length - 1;
        }

        if (currentQueueIndex < 0) {
            currentQueueIndex = 0;
        }

        // =========================
        // UPDATE UI ก่อน
        // =========================

        updateQueueUI(true);
        updateCurrentHouseCard();

        renderTopLeftQueue();

        updateDeliveryCard();

        // =========================
        // redraw map ทีหลัง
        // =========================

        requestAnimationFrame(() => {
            refreshQueueMap();

            drawPath();
        });
    }, 350);
}

// ฟังก์ชันเลื่อนกลับไปอันก่อนหน้า
function prevQueue() {
    if (currentQueueIndex > 0) {
        currentQueueIndex--;
        updateDeliveryCard();
        renderTopLeftQueue();
    }
}

// เมื่อกดส่งสำเร็จ
// ================= เมื่อกดปุ่ม "จัดส่งสำเร็จแล้ว" =================

// ================= ระบบปรับขนาด Card (Size Control) =================
let currentCardScale = 1.0;

function changeCardSize(step) {
    currentCardScale += step;

    // จำกัดขนาดไม่ให้เล็กเกินไป (60%) หรือใหญ่เกินไป (130%)
    if (currentCardScale < 0.6) currentCardScale = 0.6;
    if (currentCardScale > 1.3) currentCardScale = 1.3;

    // อัปเดตขนาด
    const innerCard = document.getElementById("delivery-card-inner");
    if (innerCard) {
        // ปัดเศษทศนิยมเพื่อความแม่นยำ
        currentCardScale = Math.round(currentCardScale * 10) / 10;
        innerCard.style.transform = `scale(${currentCardScale})`;
    }
}

// ================= เมื่อกดปุ่ม "จัดส่งสำเร็จแล้ว" =================
// ค้นหาฟังก์ชัน completeCurrentDelivery เดิมแล้วแทนที่ด้วยอันนี้
function completeCurrentDelivery() {
    if (deliveryQueue.length > 0 && currentQueueIndex < deliveryQueue.length) {
        // =========================
        // Mark ว่าส่งแล้ว
        // =========================

        deliveryQueue[currentQueueIndex].isCompleted = true;

        // =========================
        // Toast ส่งสำเร็จ
        // =========================

        const toast = document.createElement("div");

        toast.innerHTML = `
            <div style="
                display:flex;
                align-items:center;
                gap:14px;
            ">

                <div style="
                    width:52px;
                    height:52px;
                    border-radius:16px;
                    background:linear-gradient(
                        135deg,
                        #00d2a0,
                        #00e0ff
                    );
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    font-size:28px;
                    color:#03211d;
                    font-weight:900;
                    box-shadow:
                        0 0 24px rgba(0,255,200,0.45);
                    flex-shrink:0;
                ">
                    ✓
                </div>

                <div>

                    <div style="
                        font-size:18px;
                        font-weight:900;
                        color:white;
                        margin-bottom:4px;
                    ">
                        ส่งสำเร็จ
                    </div>

                    <div style="
                        font-size:14px;
                        color:rgba(255,255,255,0.72);
                    ">
                        จุดที่ ${currentQueueIndex + 1}
                    </div>

                </div>

            </div>
        `;

        toast.style.position = "fixed";

        toast.style.top = "20px";

        toast.style.right = "20px";

        toast.style.zIndex = "999999";

        toast.style.background = "rgba(15,15,20,0.92)";

        toast.style.backdropFilter = "blur(14px)";

        toast.style.padding = "18px 22px";

        toast.style.borderRadius = "22px";

        toast.style.border = "1px solid rgba(255,255,255,0.08)";

        toast.style.boxShadow = `
            0 15px 40px rgba(0,0,0,0.45),
            0 0 30px rgba(0,255,200,0.12)
        `;

        toast.style.opacity = "0";

        toast.style.transform = "translateY(-20px)";

        toast.style.transition = "0.3s ease";

        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.opacity = "1";

            toast.style.transform = "translateY(0)";
        });

        setTimeout(() => {
            toast.style.opacity = "0";

            toast.style.transform = "translateY(-10px)";

            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 1500);

        // =========================
        // หาจุดถัดไป
        // =========================

        let nextIdx = -1;

        for (let i = currentQueueIndex + 1; i < deliveryQueue.length; i++) {
            if (!deliveryQueue[i].isCompleted) {
                nextIdx = i;

                break;
            }
        }

        // =========================
        // ไปจุดถัดไป
        // =========================

        if (nextIdx !== -1) {
            currentQueueIndex = nextIdx;

            updateDeliveryCard();
            renderTopLeftQueue();
        } else {
            let backIdx = deliveryQueue.findIndex((item) => !item.isCompleted);

            if (backIdx !== -1) {
                currentQueueIndex = backIdx;

                updateDeliveryCard();
                renderTopLeftQueue();
            } else {
                // =========================
                // ซ่อน card
                // =========================

                document.getElementById("delivery-status-card").classList.add("hidden");

                // =========================
                // Premium Success Modal
                // =========================

                const overlay = document.createElement("div");

                overlay.style.position = "fixed";

                overlay.style.top = "0";

                overlay.style.left = "0";

                overlay.style.width = "100%";

                overlay.style.height = "100%";

                overlay.style.background = "rgba(0,0,0,0.68)";

                overlay.style.backdropFilter = "blur(10px)";

                overlay.style.zIndex = "999999";

                overlay.style.display = "flex";

                overlay.style.alignItems = "center";

                overlay.style.justifyContent = "center";

                overlay.style.opacity = "0";

                overlay.style.transition = "0.3s ease";

                const modal = document.createElement("div");

                modal.style.width = "380px";

                modal.style.maxWidth = "92vw";

                modal.style.padding = "26px";

                modal.style.borderRadius = "32px";

                modal.style.background = "linear-gradient(180deg,#050816,#0a1020)";

                modal.style.border = "1px solid rgba(255,255,255,0.08)";

                modal.style.boxShadow = `
                    0 20px 70px rgba(0,0,0,0.55),
                    0 0 50px rgba(0,255,200,0.08)
                `;

                modal.style.color = "white";

                modal.style.fontFamily = "sans-serif";

                modal.style.transform = "scale(0.9)";

                modal.style.transition = "0.3s ease";

                modal.innerHTML = `
    <div style="
        position:relative;
        overflow:hidden;
        border-radius:24px;
        text-align:center;
    ">

        <!-- Glow -->
        <div style="
            position:absolute;
            width:180px;
            height:180px;
            background:rgba(0,255,200,0.12);
            filter:blur(70px);
            top:-80px;
            right:-60px;
            border-radius:50%;
            pointer-events:none;
        "></div>

        <!-- Top Line -->
        <div style="
            width:100%;
            height:2px;
            border-radius:999px;
            background:linear-gradient(
                90deg,
                transparent,
                rgba(0,255,220,0.8),
                transparent
            );
            margin-bottom:26px;
            opacity:0.8;
        "></div>

        <!-- Icon -->
        <div style="
            width:88px;
            height:88px;
            margin:0 auto;
            border-radius:28px;
            background:linear-gradient(
                135deg,
                #00d2a0,
                #00e0ff
            );
            display:flex;
            align-items:center;
            justify-content:center;
            box-shadow:
                0 0 35px rgba(0,255,200,0.35);
            position:relative;
        ">

            <div style="
                position:absolute;
                inset:-8px;
                border-radius:34px;
                border:2px solid rgba(0,255,220,0.14);
            "></div>

            <div style="
                font-size:40px;
                font-weight:900;
                color:#041b1b;
            ">
                ✓
            </div>

        </div>

        <!-- Title -->
        <div style="
            margin-top:22px;
            font-size:30px;
            font-weight:900;
            color:white;
            letter-spacing:0.4px;
        ">
            สำเร็จ!
        </div>

        <!-- Desc -->
        <div style="
            margin-top:10px;
            font-size:15px;
            line-height:1.7;
            color:rgba(255,255,255,0.68);
        ">
            ส่งครบทุกจุดแล้ว
            <br>
            ระบบกำลังกลับสู่หน้าหลัก
        </div>

        <!-- Loader -->
        <div style="
            margin-top:28px;
        ">

            <div style="
                width:100%;
                height:10px;
                background:rgba(255,255,255,0.06);
                border-radius:999px;
                overflow:hidden;
                position:relative;
            ">

                <div id="successBar" style="
                    width:0%;
                    height:100%;
                    border-radius:999px;
                    background:linear-gradient(
                        90deg,
                        #00d2a0,
                        #00e0ff
                    );
                    box-shadow:
                        0 0 20px rgba(0,255,200,0.45);
                    transition:2s ease;
                "></div>

            </div>

        </div>

    </div>
`;

                overlay.appendChild(modal);

                document.body.appendChild(overlay);

                requestAnimationFrame(() => {
                    overlay.style.opacity = "1";

                    modal.style.transform = "scale(1)";
                });
                // Loader
                const successBar = modal.querySelector("#successBar");

                setTimeout(() => {
                    successBar.style.width = "100%";
                }, 100);

                // Auto Close
                setTimeout(() => {
                    overlay.style.opacity = "0";

                    modal.style.transform = "scale(0.94)";

                    setTimeout(() => {
                        overlay.remove();

                        // กลับหน้าหลัก
                        // =====================
                        // กลับหน้าหลัก
                        // =====================

                        [
                            "main-sidebar",
                            "resizer",
                            "village-stats-panel",
                            "btn-mobile-menu",
                            "layer-toggle-btn",
                        ].forEach((id) => {
                            const el = document.getElementById(id);

                            if (el) el.classList.remove("delivery-hidden");
                        });

                        const exitBtn = document.getElementById("exit-full-mode");

                        if (exitBtn)
                            exitBtn.style.setProperty("display", "none", "important");

                        document
                            .getElementById("delivery-status-card")
                            .classList.add("hidden");

                        document
                            .getElementById("top-left-queue-panel")
                            .classList.add("hidden");

                        // =========================
                        // Hide Queue Panel
                        // =========================

                        const queuePanel = document.getElementById("top-left-queue-panel");

                        if (queuePanel) {
                            queuePanel.classList.add("hidden");
                        }

                        setTimeout(() => {
                            if (map) map.invalidateSize();
                        }, 300);
                    }, 280);
                }, 2200);
            }
        }

        // =========================
        // อัปเดตรายการ
        // =========================

        renderTopLeftQueue();

        // =========================
        // Vibrate
        // =========================

        if (navigator.vibrate) navigator.vibrate(100);
    }
}

function renderTopLeftQueue() {
    const panel = document.getElementById("top-left-queue-panel");

    const container = document.getElementById("queue-items-container");

    const total = document.getElementById("queue-total-count");

    // =========================
    // Check Panel
    // =========================

    if (!panel || !container) {
        console.log("หา panel ไม่เจอ");

        return;
    }

    // =========================
    // ยังไม่เข้าโหมดส่ง
    // =========================

    const isDeliveryMode = !document
        .getElementById("delivery-status-card")
        .classList.contains("hidden");

    if (!isDeliveryMode) {
        panel.classList.add("hidden");

        return;
    }

    // =========================
    // ไม่มีคิว
    // =========================

    if (!deliveryQueue || deliveryQueue.length === 0) {
        panel.classList.add("hidden");

        return;
    }

    // =========================
    // Show Panel
    // =========================

    panel.classList.remove("hidden");

    total.innerText = `${deliveryQueue.length} จุด`;

    container.innerHTML = "";

    // =========================
    // Render Queue
    // =========================

    for (let i = 0; i < deliveryQueue.length; i++) {
        const house = deliveryQueue[i];

        const active = i === currentQueueIndex;

        const item = document.createElement("div");

        item.className = `
    queue-house-item

    p-2
    rounded-xl
`;

        item.onclick = () => {
            jumpToQueueIndex(i);
        };

        item.innerHTML = `

            <div class="flex items-center gap-3">

                <div class="
                    w-7 h-7 rounded-full
                    flex items-center justify-center
                    font-bold text-[13px]

                    ${active
                ? `
                            bg-emerald-400
                            text-black
                        `
                : `
                            bg-slate-700
                            text-white
                        `
            }
                ">
                    ${i + 1}
                </div>

                <div>

                    <div class="
                        font-bold text-[13px]

                        ${active ? "text-emerald-300" : "text-white"}
                    ">
                        ${house.id || house.name || "ไม่ทราบเลข"}
                    </div>

                    <div class="
                        text-[9px]
                        text-slate-400
                    ">
                        ${house.village || ""}
                    </div>

                </div>

            </div>
        `;

        container.appendChild(item);
    }
}

// =========================
// Jump To Queue
// =========================

function jumpToQueueIndex(index) {
    currentQueueIndex = index;

    updateDeliveryCard();

    const house = deliveryQueue[index];

    if (!house) return;

    map.flyTo([house.lat, house.lng], 19, {
        duration: 1.2,
    });

    renderTopLeftQueue();
}

// =========================
// Queue Panel Drag System
// =========================

// =========================
// ENABLE AUTO GPS
// =========================

const ENABLE_AUTO_GPS = false;

document.addEventListener("DOMContentLoaded", () => {
    const queueWrapper = document.getElementById("top-left-queue-wrapper");

    const dragHandle = document.getElementById("queue-drag-handle");

    const queuePanel = document.getElementById("top-left-queue-panel");

    const miniBtn = document.getElementById("queue-mini-btn");

    const hideBtn = document.getElementById("queue-hide-btn");

    // =========================
    // ซ่อนตั้งแต่เปิดเว็บ
    // =========================

    if (queuePanel) {
        queuePanel.classList.add("hidden");
    }

    if (miniBtn) {
        miniBtn.classList.add("hidden");
    }

    // =========================
    // AUTO START GPS
    // =========================

    if (ENABLE_AUTO_GPS) {
        setTimeout(() => {
            if (typeof toggleGPSTracking === "function") {
                toggleGPSTracking();
            }
        }, 1200);
    }

    // =========================
    // Drag
    // =========================

    if (queueWrapper && dragHandle) {
        let isDragging = false;

        let offsetX = 0;
        let offsetY = 0;

        dragHandle.addEventListener("mousedown", (e) => {
            isDragging = true;

            offsetX = e.clientX - queueWrapper.offsetLeft;

            offsetY = e.clientY - queueWrapper.offsetTop;

            queueWrapper.style.transition = "none";
        });

        document.addEventListener("mousemove", (e) => {
            if (!isDragging) return;

            queueWrapper.style.left = `${e.clientX - offsetX}px`;

            queueWrapper.style.top = `${e.clientY - offsetY}px`;
        });

        document.addEventListener("mouseup", () => {
            isDragging = false;

            queueWrapper.style.transition = "0.2s ease";
        });
    }

    // =========================
    // Hide / Show
    // =========================

    if (queuePanel && miniBtn && hideBtn) {
        hideBtn.onclick = () => {
            queuePanel.classList.add("hidden");

            miniBtn.classList.remove("hidden");
        };

        miniBtn.onclick = () => {
            queuePanel.classList.remove("hidden");

            miniBtn.classList.add("hidden");
        };
    }
});

// =========================
// Queue Panel Drag System
// =========================

const queueWrapper = document.getElementById("top-left-queue-wrapper");

const dragHandle = document.getElementById("queue-drag-handle");

if (queueWrapper && dragHandle) {
    let isDragging = false;

    let offsetX = 0;
    let offsetY = 0;

    dragHandle.addEventListener("mousedown", (e) => {
        isDragging = true;

        offsetX = e.clientX - queueWrapper.offsetLeft;

        offsetY = e.clientY - queueWrapper.offsetTop;

        queueWrapper.style.transition = "none";
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;

        queueWrapper.style.left = `${e.clientX - offsetX}px`;

        queueWrapper.style.top = `${e.clientY - offsetY}px`;
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;

        queueWrapper.style.transition = "0.2s ease";
    });
}

// =========================
// Hide / Show Queue Panel
// =========================

const queuePanel = document.getElementById("top-left-queue-panel");

const miniBtn = document.getElementById("queue-mini-btn");

const hideBtn = document.getElementById("queue-hide-btn");

if (queuePanel && miniBtn && hideBtn) {
    hideBtn.onclick = () => {
        queuePanel.classList.add("hidden");

        miniBtn.classList.remove("hidden");
    };

    miniBtn.onclick = () => {
        queuePanel.classList.remove("hidden");

        miniBtn.classList.add("hidden");
    };
}

function jumpToQueueIndex(index) {
    currentQueueIndex = index;

    updateDeliveryCard();
    renderTopLeftQueue();

    const house = deliveryQueue[index];

    if (!house) return;

    map.flyTo([house.lat, house.lng], 19, {
        duration: 1.2,
    });

    renderTopLeftQueue();
}

let villageMiniMode = true;

function toggleVillageStats() {
    const panel = document.getElementById("village-stats-panel");

    const floatBtn = document.getElementById("village-floating-btn");

    // =========================
    // OPEN PANEL
    // =========================

    if (villageMiniMode) {
        panel.style.display = "block";

        floatBtn.style.display = "none";

        requestAnimationFrame(() => {
            panel.classList.remove("village-panel-hide");
        });

        villageMiniMode = false;
    }

    // =========================
    // CLOSE PANEL
    // =========================
    else {
        panel.classList.add("village-panel-hide");

        setTimeout(() => {
            panel.style.display = "none";

            floatBtn.style.display = "flex";
        }, 180);

        villageMiniMode = true;
    }
}

// =========================
// SEARCH QUEUE
// =========================

document.getElementById("queue-search")?.addEventListener("input", function () {
    const keyword = this.value.toLowerCase().trim();

    const items = document.querySelectorAll(".queue-house-item");

    items.forEach((item) => {
        const text = item.innerText.toLowerCase();

        item.style.display = text.includes(keyword) ? "flex" : "none";
    });
});

// =========================
// CURRENT HOUSE CARD
// =========================

function updateCurrentHouseCard() {

    const nameEl =
        document.getElementById(
            "current-house-name"
        );

    const distanceEl =
        document.getElementById(
            "current-house-distance"
        );

    if (
        !nameEl ||
        !distanceEl
    ) return;

    // =========================
    // ไม่มีคิว
    // =========================

    if (
        deliveryQueue.length === 0
    ) {

        nameEl.innerText =
            "-";

        distanceEl.innerText =
            "ไม่มีรายการ";

        return;
    }

    // =========================
    // บ้านปัจจุบัน
    // =========================

    const currentHouse =
        deliveryQueue[
            currentQueueIndex
        ];

    if (!currentHouse) return;

    // =========================
    // ชื่อบ้าน
    // =========================

    nameEl.innerText =
        currentHouse.id;

    // =========================
    // GPS Distance
    // =========================

    if (gpsMarker) {

        const gps =
            gpsMarker.getLatLng();

        const distance =
            map.distance(
                [gps.lat, gps.lng],
                [
                    currentHouse.lat,
                    currentHouse.lng
                ]
            );

        // KM
        if (distance >= 1000) {

            distanceEl.innerText =

                `เหลือ ${(distance / 1000).toFixed(1)} กม.`;

        }

        // METER
        else {

            distanceEl.innerText =

                `เหลือ ${Math.round(distance)} เมตร`;
        }

    } else {

        distanceEl.innerText =
            "กำลังค้นหา GPS...";
    }
}

loadKMLFile();
