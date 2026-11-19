import type { Coordinates, MapPlace } from "../../../domain/location/entities";
import { isValidCoordinates } from "../../../domain/location/entities";

/** HTML is rendered locally; external libraries and tiles require a network connection. */
export function geoapifyMapHtml(
  key: string,
  position: Coordinates | null,
  places: MapPlace[],
  selected: MapPlace | null,
  showRoute: boolean,
): string {
  const safe = (value: unknown) =>
    JSON.stringify(value).replace(/</g, "\\u003c");
  const points = places
    .filter((p) => isValidCoordinates(p.coordinates))
    .map((p) => ({ id: p.shopId, name: p.name, coordinates: p.coordinates }));
  const center = isValidCoordinates(selected?.coordinates)
    ? selected.coordinates
    : isValidCoordinates(position)
    ? position
    : { latitude: -18.8792, longitude: 47.5079 };
  return `<!doctype html><html lang="fr"><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"><style>html,body,#map{height:100%;margin:0} #status{position:absolute;z-index:1000;top:115px;left:54px;right:12px;background:white;border-radius:12px;padding:12px;font:600 13px sans-serif;box-shadow:0 2px 12px #0002;display:none} #directions{position:absolute;z-index:1000;bottom:220px;left:12px;right:12px;background:white;border-radius:12px;padding:12px;font:13px sans-serif;box-shadow:0 2px 12px #0002;display:none;max-height:25%;overflow:auto} #directions summary{font-weight:bold;cursor:pointer} #directions li{padding:4px 0;line-height:1.4} .leaflet-top{top:110px} .leaflet-bottom.leaflet-right{bottom:210px} .leaflet-control-attribution{font-size:10px}</style></head><body><div id="map"></div><div id="status" role="status"></div><details id="directions"><summary>Voir les étapes du trajet</summary><ol id="steps"></ol></details><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>
  const key=${safe(key)}, center=${safe(center)}, position=${safe(
    position,
  )}, points=${safe(points)}, selected=${safe(
    selected?.coordinates ?? null,
  )}, showRoute=${safe(showRoute)};
  const status=document.getElementById('status'); function message(s){status.textContent=s;status.style.display='block'}
  try { const map=L.map('map').setView([center.latitude,center.longitude],13);
  L.tileLayer('https://maps.geoapify.com/v1/tile/osm-carto/{z}/{x}/{y}.png?apiKey='+encodeURIComponent(key),{maxZoom:20,attribution:'© <a href="https://www.geoapify.com/">Geoapify</a> | © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).on('tileerror',()=>message('La carte est indisponible. Vérifiez la connexion et la configuration Geoapify.')).addTo(map);
  if(position) L.circleMarker([position.latitude,position.longitude],{radius:8,color:'#fff',weight:3,fillColor:'#1877e8',fillOpacity:1}).addTo(map).bindPopup('Votre position');
  points.forEach(p=>{const marker=L.circleMarker([p.coordinates.latitude,p.coordinates.longitude],{radius:9,color:'#fff',weight:2,fillColor:'#ff6600',fillOpacity:1}).addTo(map);const label=document.createElement('span');label.textContent=p.name;marker.bindPopup(label);marker.on('click',()=>{const msg=JSON.stringify({type:'select',id:p.id});if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(msg);else window.parent.postMessage(msg,'*')})});
  if(showRoute && position && selected){message('Calcul de l’itinéraire…');const params=new URLSearchParams({waypoints:position.latitude+','+position.longitude+'|'+selected.latitude+','+selected.longitude,mode:'drive',lang:'fr',apiKey:key});fetch('https://api.geoapify.com/v1/routing?'+params).then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{const route=data.features?.[0];if(!route?.geometry)throw Error();L.geoJSON(route,{style:{color:'#fff',weight:11,opacity:0.9}}).addTo(map);const layer=L.geoJSON(route,{style:{color:'#df202c',weight:7,opacity:1}}).addTo(map);map.fitBounds(layer.getBounds(),{paddingTopLeft:[35,145],paddingBottomRight:[35,235]});const props=route.properties;message('Itinéraire en voiture · '+(props.distance/1000).toFixed(1)+' km · environ '+Math.ceil(props.time/60)+' min');const steps=(props.legs||[]).flatMap(leg=>leg.steps||[]).map(step=>step.instruction?.text).filter(text=>typeof text==='string'&&text.length>0);if(steps.length){const list=document.getElementById('steps');steps.forEach(text=>{const item=document.createElement('li');item.textContent=text;list.appendChild(item)});document.getElementById('directions').style.display='block'}}).catch(()=>message('Itinéraire indisponible. Vérifiez votre connexion et réessayez.'))}
  } catch(e) {message('La carte ne peut pas être affichée. Vérifiez votre connexion.');}
  </script></body></html>`;
}
