import { DadosGeograficos } from "./geografia"
import { ContextoGeral } from "./contextoGeral";

declare let L;

const dadosGeograficos = new DadosGeograficos(0.2);
const contexto = new ContextoGeral();

const mapaUtil = new L.LatLngBounds(new L.LatLng(dadosGeograficos.latMin, dadosGeograficos.lonMin, 0), new L.LatLng(dadosGeograficos.latMax, dadosGeograficos.lonMax, 0));
const mapa = L.map('corpo', {
    center: mapaUtil.getCenter(),
    zoom: 14,
    minZoom: 13,
    maxZoom: 18,
    maxBounds: mapaUtil,
    maxBoundsViscosity: 0.5,
    zoomControl: false
});
mapa.on('locationfound', x => {
    if (mapaUtil.contains(x.latlng))
        mapa.setView(x.latlng, 15);
})
mapa.locate({ watch: true })

let lastPopup
mapa.on('click', e =>
    lastPopup = L.popup()
        .setLatLng(e.latlng)
        .setContent(`Precipitação estimada:<br>${contexto.CalcularChuva(e.latlng.lat, e.latlng.lng).toFixed(2) ?? 'Sem dados'} mm`)
        .openOn(mapa)
);
mapa.on('mouseout', () => lastPopup?.remove());
const controleLayers = L.control.layers(undefined, undefined, {
    position: 'topleft'
}).addTo(mapa);

//Adicionar base  normal
controleLayers.addBaseLayer(L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.{ext}', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 18,
    ext: 'png'
}).addTo(mapa), "Normal");

// Adicionar base simplificada
controleLayers.addBaseLayer(L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 20,
    ext: 'png',
    detectRetina: true
}), "Simplificado");

const ultAtt = document.getElementById('ultimaAtualizacao');
ultAtt.innerHTML = new Date(contexto.ultimaAtualizacao).toLocaleString();
const imagem = contexto.imagemChuvas;

// Atualizar malha de dados
L.imageOverlay(imagem, mapaUtil).addTo(mapa);

// Atualizar marcadores
// const marcadores = L.layerGroup().addTo(mapa);
// controleLayers.addOverlay(marcadores, "Pluviômetros");
// const marksAdicionados = marcadores.getLayers();
// for (const pluv of contexto.estacoes.filter(v => v.isJampa)) {
//     const atual = marksAdicionados.find(mark => {
//         const local = mark.getLatLng();
//         return local.lat === pluv.latitude && local.lng === pluv.longitude;
//     });
//     if (atual === undefined) {
//         const caixa = L.popup().setContent(pluv.GetInfoCompleta(contexto.escalaTempo))
//         marcadores.addLayer(L.marker([pluv.latitude, pluv.longitude]).bindPopup(caixa));
//     } else atual.setPopupContent(pluv.GetInfoCompleta(contexto.escalaTempo));
// }

// Atualizar barra de cores
const nivelMinimo = contexto.cores.valorMinimo;
const nivelMaximo = contexto.cores.valorMaximo;
function GetNivel(index:number) : string {
    const posicao = index / (contexto.cores.cores.length - 1)
    const classe = posicao > 0.75 ? "info nivel invertido" : "info nivel normal"
    const nivel = nivelMinimo + posicao * (nivelMaximo - nivelMinimo)
    return `<div class="${classe}" style="left: ${100 * posicao}%">${nivel.toFixed(1)}<br>mm</div>`
}
function GetCor(cor:number[]) : string {
    return `rgb(${cor[0]},${cor[1]},${cor[2]})`;
}
const barra = L.control({ position: 'topright' });
barra.onAdd = function () {
    const container = document.createElement("div");
    container.className = 'info container';
    const cores = contexto.cores.cores
    container.innerHTML =
    `<div class="info barra" style="background-image: linear-gradient(to right, ${cores.map(v => GetCor(v)).join(',')})"></div>
    ${Array.from({length: cores.length}).map((v,i) => GetNivel(i)).join('\n')}`;
    return container;
};
barra.addTo(mapa);
