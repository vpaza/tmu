const colors = {
    "PANC": "#FF0000",
    "PAMR": "#330000",
    "PALH": "#330000",
    "PAED": "#330000",
    "PAFA": "#0000FF",
    "PAFB": "#000033",
    "PAEI": "#000033",
    "PANN": "#000033",
}

const map = L.map('map', {
    worldCopyJump: true,
});
const polyStyle = {
    "color": "#fff",
    "weight": 0.6,
    "opacity": 1,
};
const polyStyleTRACON = {
    "color": "skyblue",
    "weight": 0.6,
    "opacity": 1,
};

const geomap = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
    subdomains: 'abcd',
    maxZoom: 19
}).addTo(map);

const nexrad = L.tileLayer('https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png?ts={ts}', {
    tileSize: 256,
    opacity: 0.5,
    ts: function () { return Date.now(); }
}).addTo(map);

map.attributionControl.setPrefix('<a href="https://leafletjs.com" title="A JavaScript library for interactive maps">Leaflet</a>');
const boundaryLayer = new L.LayerGroup();
boundaryLayer.addTo(map);
const planeLayer = new L.LayerGroup();
planeLayer.addTo(map);

const planes = {};

const geoJsons = {
    "High": "geojson/High.geojson",
    "North": "geojson/North.geojson",
    "South": "geojson/South.geojson",
    "Arctic": "geojson/Arctic.geojson",
    "Pacific": "geojson/Pacific.geojson",
    "TRACON": "geojson/TRACON.geojson",
}

const areas = {
    "all": {
        "boundingBox": [
            [50.133333, -171.000001], [72.000001, -129.970833],
        ],
        "geoJsons": [
            geoJsons["High"],
            geoJsons["North"],
            geoJsons["South"],
            geoJsons["Arctic"],
            geoJsons["Pacific"],
        ],
    },
    "domestic": {
        "boundingBox": [
            [50.133333, -171.000001], [72.000001, -129.970833]
        ],
        "geoJsons": [
            geoJsons["High"],
            geoJsons["North"],
            geoJsons["South"],
        ],
    },
    "arctic": {
        "boundingBox": [
            [90, -176], [72, -141],
        ],
        "geoJsons": [
            geoJsons["Arctic"],
        ],
    },
    "pacific": {
        "boundingBox": [
            [63, -150], [43, -210]
        ],
        "geoJsons": [
            geoJsons["High"],
            geoJsons["Pacific"],
        ],
    },
}

const getBoundaries = async () => {
    const files = areas[window.location.hash.substring(1) || "all"].geoJsons;

    files.forEach((file) => {
        loadGeoJSON(file, polyStyle);
    });
    loadGeoJSON(geoJsons["TRACON"], polyStyleTRACON);
};

const updatePlanes = async () => {
    const response = await fetch("https://data.vatsim.net/v3/vatsim-data.json");
    const {pilots} = await response.json();
    // Only process planes in our area
    pilots.filter((plane) => {
        if (plane.latitude > 43 && plane.latitude <= 90 &&
            wrapCoords(plane.latitude, plane.longitude)[1] >= -210 &&
            wrapCoords(plane.latitude, plane.longitude)[1] <= -128) {
            return true;
        }
    }).forEach((plane) => {
        if (plane.callsign in planes) {
            planes[plane.callsign].setLatLng(wrapCoords(plane.latitude, plane.longitude));
            planes[plane.callsign].setIcon(planeIcon(getRotate(plane.heading), plane.flight_plan.arrival, plane.flight_plan.departure));
        } else {
            planes[plane.callsign] = L.marker(wrapCoords(plane.latitude, plane.longitude), {
                icon: planeIcon(getRotate(plane.heading), plane.flight_plan.arrival, plane.flight_plan.departure),
            });
            planes[plane.callsign].bindPopup(`<b>${plane.callsign}</b><br>${plane.flight_plan != null ? plane.flight_plan.departure || "??" : "??"}-${plane.flight_plan != null ? plane.flight_plan.arrival || "??" : "??"}</b>`);
            planes[plane.callsign].on("mouseover", function (e) {
                this.openPopup();
            });
            planes[plane.callsign].on("mouseout", function (e) {
                this.closePopup();
            });
            planes[plane.callsign].addTo(planeLayer);
        }
    });
}

const loadGeoJSON = async (file, style) => {
    const response = await fetch(file);
    const data = await response.json();
    return L.geoJSON(geoJsonWrapCoords(data), {
        style: style,
    }).addTo(boundaryLayer);
}

const getRotate = (heading) => {
    const offset = 45;
    const rotate = heading - offset;
    if (rotate > 360) {
        return rotate - 360;
    }
    return rotate;
};

const planeIcon = (heading, arrival, departure) => {
    const color = getColor(arrival, departure);
    const filter = getFilter(color);
    return L.divIcon({
        html: `<img src="/img/plane.png" style="filter: ${filter} drop-shadow(-2px 2px 1px rgb(0, 0, 0.75)); width: 20px;" class="rotate${heading} ${color}">`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
    });
}

const getColor = (arrival, departure) => {
    if (arrival == null || departure == null) {
        return "#ffffff";
    }

    // If arrival is not a PA, PF, or PO
    if (!arrival.match(/^(PA|PF|PO)/) && departure.match(/^(PA|PF|PO)/)) {
        return "#aebbff";
    }

    // If arrival and departure is not a PA, PF, or PO, return white as overflight
    if (departure == null || (!departure.match(/^(PA|PF|PO)/) && !arrival.match(/^(PA|PF|PO)/))) {
        // white
        return "#FFFFFF";
    }

    // A11 complex are shades of gold
    if (["PANC", "PAMR", "PALH", "PAED", "PAFR"].includes(arrival)) {
        // PANC is bright gold
        if (arrival == "PANC" || arrival == "PALH") {
            return "#FFD700";
        }

        // PAMR is wheat?
        if (arrival == "PAMR") {
            return "#ffc355";
        }

        // Other A11 are dark gold
        return "#715600";
    }

    // FAI complex is blue
    if (["PAFA", "PAEI", "PAFB", "PANN"].includes(arrival)) {
        // FAI is bright blue
        if (arrival == "PAFA") {
            return "#0000FF";
        }

        if (arrival == "PANN") {
            return "#5858ff";
        }

        // Other FAI are medium blue
        return "#0000A0";
    }

    // BET is orange
    if (arrival == "PABE") {
        return "#e55100";
    }

    // AKN is purple
    if (arrival == "PAKN") {
        return "#ff00ff";
    }

    // JNU is yellow
    if (arrival == "PAJN") {
        return "#045d00";
    }

    // ADQ is teal
    if (arrival == "PADQ") {
        return "#00fcff";
    }

    // ENA is red
    if (arrival == "PAEN") {
        return "#ba0000";
    }

    // Otherwise
    return "#008080";
}

getBoundaries();
map.fitBounds(areas[window.location.hash.substring(1) || "all"].boundingBox);
updatePlanes();
setInterval(updatePlanes, 15000);

const geoJsonWrapCoords = (data) => {
    data.features.forEach((feature) => {
        feature.geometry.coordinates.forEach((coordinate) => {
            // If longitude is greater than 0, we need to subtract 360 to wrap to the west side of the anti-meridian
            if (coordinate[0] > 0) {
                coordinate[0] = coordinate[0] - 360;
            }
        });
    });
    return data;
}

const wrapCoords = (lat, lon) => {
    if (lon > 0) {
        lon = lon - 360;
    }
    return [lat, lon];
}