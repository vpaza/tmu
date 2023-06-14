const colors={PANC:"#FF0000",PAMR:"#330000",PALH:"#330000",PAED:"#330000",PAFA:"#0000FF",PAFB:"#000033",PAEI:"#000033",PANN:"#000033"},map=L.map("map",{worldCopyJump:!0}),polyStyle={color:"#fff",weight:.6,opacity:1},polyStyleTRACON={color:"skyblue",weight:.6,opacity:1},geomap=L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",{attribution:'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',subdomains:"abcd",maxZoom:19}).addTo(map),nexrad=L.tileLayer("https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png?ts={ts}",{tileSize:256,opacity:.5,ts:function(){return Date.now()}}).addTo(map),boundaryLayer=(map.attributionControl.setPrefix('<a href="https://leafletjs.com" title="A JavaScript library for interactive maps">Leaflet</a>'),new L.LayerGroup),planeLayer=(boundaryLayer.addTo(map),new L.LayerGroup),planes=(planeLayer.addTo(map),{}),geoJsons={High:"geojson/High.geojson",North:"geojson/North.geojson",South:"geojson/South.geojson",Arctic:"geojson/Arctic.geojson",Pacific:"geojson/Pacific.geojson",TRACON:"geojson/TRACON.geojson"},areas={all:{boundingBox:[[50.133333,-171.000001],[72.000001,-129.970833]],geoJsons:[geoJsons.High,geoJsons.North,geoJsons.South,geoJsons.Arctic,geoJsons.Pacific]},domestic:{boundingBox:[[50.133333,-171.000001],[72.000001,-129.970833]],geoJsons:[geoJsons.High,geoJsons.North,geoJsons.South]},arctic:{boundingBox:[[90,-176],[72,-141]],geoJsons:[geoJsons.Arctic]},pacific:{boundingBox:[[63,-150],[43,-210]],geoJsons:[geoJsons.High,geoJsons.Pacific]}},getBoundaries=async()=>{areas[window.location.hash.substring(1)||"all"].geoJsons.forEach(o=>{loadGeoJSON(o,polyStyle)}),loadGeoJSON(geoJsons.TRACON,polyStyleTRACON)},updatePlanes=async()=>{var o=(await(await fetch("https://data.vatsim.net/v3/vatsim-data.json")).json())["pilots"];const e=o.filter(o=>{if(43<o.latitude&&o.latitude<=90&&-210<=wrapCoords(o.latitude,o.longitude)[1]&&wrapCoords(o.latitude,o.longitude)[1]<=-128)return!0});e.forEach(o=>{o.callsign in planes?(planes[o.callsign].setLatLng(wrapCoords(o.latitude,o.longitude)),planes[o.callsign].setIcon(planeIcon(getRotate(o.heading),o.flight_plan.arrival,o.flight_plan.departure))):(planes[o.callsign]=L.marker(wrapCoords(o.latitude,o.longitude),{icon:planeIcon(getRotate(o.heading),o.flight_plan.arrival,o.flight_plan.departure)}),planes[o.callsign].bindPopup(`<b>${o.callsign}</b><br>${null!=o.flight_plan&&o.flight_plan.departure||"??"}-${null!=o.flight_plan&&o.flight_plan.arrival||"??"}</b>`),planes[o.callsign].on("mouseover",function(o){this.openPopup()}),planes[o.callsign].on("mouseout",function(o){this.closePopup()}),planes[o.callsign].addTo(planeLayer))}),Object.keys(planes).forEach(a=>{e.some(o=>o.callsign===a)||(map.removeLayer(planes[a]),delete planes[a])})},loadGeoJSON=async(o,a)=>{o=await(await fetch(o)).json();return L.geoJSON(geoJsonWrapCoords(o),{style:a}).addTo(boundaryLayer)},getRotate=o=>{o-=45;return 360<o?o-360:o},planeIcon=(o,a,e)=>{a=getColor(a,e),e=getFilter(a);return L.divIcon({html:`<img src="/img/plane.png" style="filter: ${e} drop-shadow(-2px 2px 1px rgb(0, 0, 0.75)); width: 20px;" class="rotate${o} ${a}">`,iconSize:[20,20],iconAnchor:[10,10]})},getColor=(o,a)=>null==o||null==a?"#ffffff":!o.match(/^(PA|PF|PO)/)&&a.match(/^(PA|PF|PO)/)?"#aebbff":null==a||!a.match(/^(PA|PF|PO)/)&&!o.match(/^(PA|PF|PO)/)?"#FFFFFF":["PANC","PAMR","PALH","PAED","PAFR"].includes(o)?"PANC"==o||"PALH"==o?"#FFD700":"PAMR"==o?"#ffc355":"#715600":["PAFA","PAEI","PAFB","PANN"].includes(o)?"PAFA"==o?"#0000FF":"PANN"==o?"#5858ff":"#0000A0":"PABE"==o?"#e55100":"PAKN"==o?"#ff00ff":"PAJN"==o?"#045d00":"PADQ"==o?"#00fcff":"PAEN"==o?"#ba0000":"#008080",geoJsonWrapCoords=(getBoundaries(),map.fitBounds(areas[window.location.hash.substring(1)||"all"].boundingBox),updatePlanes(),setInterval(updatePlanes,15e3),o=>(o.features.forEach(o=>{o.geometry.coordinates.forEach(o=>{0<o[0]&&(o[0]=o[0]-360)})}),o)),wrapCoords=(o,a)=>(0<a&&(a-=360),[o,a]);