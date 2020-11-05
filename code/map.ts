import { DadosGeograficos } from "./geografia"
import { ContextoGeral } from "./contextoGeral";
import { GetMedicao } from "./estacao"

declare let L;

const contexto = new ContextoGeral(true, false);
if (contexto.mapaPronto) {
    const dadosGeograficos = new DadosGeograficos(0.2);

    const mapaUtil = new L.LatLngBounds(new L.LatLng(dadosGeograficos.latMin, dadosGeograficos.lonMin, 0), new L.LatLng(dadosGeograficos.latMax, dadosGeograficos.lonMax, 0));
    const mapa = L.map('corpo', {
        center: mapaUtil.getCenter(),
        zoom: 13,
        minZoom: 13,
        maxZoom: 18,
        maxBounds: mapaUtil,
        maxBoundsViscosity: 1,
        zoomControl: false
    });
    mapa.on('locationfound', x => {
        if (mapaUtil.contains(x.latlng))
            mapa.setView(x.latlng, 15);
    })
    mapa.locate({ watch: true })

    let lastPopup
    mapa.on('click', e => {
        if (e.originalEvent.srcElement.classList.contains('icon')) return
        lastPopup = L.popup()
            .setLatLng(e.latlng)
            .setContent(`Precipitação estimada:<br>${contexto.CalcularChuva(e.latlng.lat, e.latlng.lng).toFixed(2) ?? 'Sem dados'} mm`)
            .openOn(mapa)
    }
    );
    mapa.on('mouseout', () => lastPopup?.remove());

    //Adicionar base  normal
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        minZoom: 0,
        maxZoom: 18,
        detectRetina: true
    }).addTo(mapa);

    /* Só um mapa padrão já está bom
    // Adicionar base simplificada
    const fonteSimplificada = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: 'abcd',
        minZoom: 0,
        maxZoom: 18,
        ext: 'png',
        detectRetina: true
    })

    const ctrFonte = L.control({ position: 'topleft' });
    ctrFonte.onAdd = function () {
        const container = document.createElement("div");
        const ligar = '\uE790'
        const desligar = '\uF570'
        container.onclick = (ev) => {
            if ((ev.srcElement as any).innerHTML == desligar) {
                mapa.removeLayer(fonteDetalhada)
                mapa.addLayer(fonteSimplificada)
                container.innerHTML = ligar
                container.title = 'Usar mapa detalhado'
            } else {
                mapa.removeLayer(fonteSimplificada)
                mapa.addLayer(fonteDetalhada)
                container.innerHTML = desligar
                container.title = 'Usar mapa simplificado'
            }
        }
        container.className = 'leaflet-control-layers leaflet-control icon';
        container.innerHTML = desligar;
        container.title = 'Usar mapa simplificado'
        return container;
    };*/

    const ctrConfig = L.control({ position: 'topleft' });
    ctrConfig.onAdd = function () {
        const container = document.createElement("div");
        container.title = 'Configurações'
        container.onclick = () => {
            document.body.classList.remove('fade-in')
            document.body.classList.add('fade-out')
            setTimeout(() => location.href = 'mapSettings.html', 2000)
        }
        container.className = 'leaflet-control-layers leaflet-control icon';
        container.innerHTML = '\uE713';
        return container;
    };

    const ctrGrafico = L.control({ position: 'topleft' })
    ctrGrafico.onAdd = function () {
        const container = document.createElement('div')
        container.title = 'Gráficos'
        container.onclick = () => {
            document.body.classList.remove('fade-in')
            document.body.classList.add('fade-out')
            setTimeout(() => location.href = 'graphSettings.html', 2000)
        }
        container.className = 'leaflet-control-layers leaflet-control icon';
        container.innerHTML = '\uE9D2';
        return container
    }

    const ctrAtualizar = L.control({ position: 'topleft' })
    ctrAtualizar.onAdd = function () {
        const container = document.createElement('div')
        container.title = 'Atualizar'
        container.onclick = () => {
            document.body.classList.remove('fade-in')
            document.body.classList.add('fade-out')
            setTimeout(() => location.href = '.?diretoMapa', 2000)
        }
        container.className = 'leaflet-control-layers leaflet-control icon';
        container.innerHTML = '\uE72C';
        return container
    }

    ctrAtualizar.addTo(mapa)
    ctrConfig.addTo(mapa)
    ctrGrafico.addTo(mapa)
    //ctrFonte.addTo(mapa)

    const imagem = contexto.imagemChuvas;

    // Atualizar malha de dados
    L.imageOverlay(imagem, mapaUtil).addTo(mapa);

    // Atualizar marcadores
    const marcadores = L.layerGroup()
    for (const pluv of contexto.estacoes.filter(v => v.codibge === 2507507)) {
        console.log(pluv);
        const infoCompleta = `
        <h2>${pluv.nomeestacao}</h1>
        Fonte: <span>${pluv.siglaRede}</span><br>
        ${pluv.ultimovalor ? `Última medição:<br>${pluv.ultimovalor?.toFixed(2)} mm (${pluv.datahoraUltimovalor ?? 'Desconhecido'})<br>` : pluv.ultimaConexao ? `Última conexão:<br>${new Date(pluv.ultimaConexao).toLocaleString()}<br>` : ''}
        Precipitação acumulada:<br>${GetMedicao(pluv, contexto.escalaTempo).toFixed(2)} mm (${contexto.escalaTempo === 1 ? 'Última hora' : `Últimas ${contexto.escalaTempo} horas`})
        <br>`;
        const content = document.createElement('div')
        content.innerHTML = infoCompleta
        const botao = document.createElement('a')
        botao.href = '#'
        botao.innerText = 'Ver informações detalhadas'
        botao.onclick = () => {
            document.body.classList.remove('fade-in')
            document.body.classList.add('fade-out')
            setTimeout(() => location.href = `.?idEstacao=${pluv.idestacao}`, 2000)
        }
        content.appendChild(botao)
        //<a href=".?idEstacao=${pluv.idestacao}">Ver informações detalhadas</a>
        const caixa = L.popup()
        caixa.setContent(content)
        marcadores.addLayer(L.marker([pluv._latitude, pluv._longitude]).bindPopup(caixa));
    }
    marcadores.addTo(mapa)

    /* Quase ninguém vai querer tirar os marcadores
    const ctrMarcadores = L.control({ position: 'topleft' });
    ctrMarcadores.onAdd = function () {
        const container = document.createElement("div");
        const ligar = '\uE707'
        const desligar = '\uE77A'
        container.onclick = (ev) => {
            if ((ev.srcElement as any).innerHTML == desligar) {
                marcadores.remove()
                container.innerHTML = ligar
                container.title = 'Mostrar as estações'
            } else {
                marcadores.addTo(mapa)
                container.innerHTML = desligar
                container.title = 'Não mostrar as estações'
            }
        }
        container.className = 'leaflet-control-layers leaflet-control icon';
        container.innerHTML = desligar;
        container.title = 'Não mostrar as estações'
        return container;
    };
    ctrMarcadores.addTo(mapa)*/

    // Atualizar barra de cores
    const nivelMinimo = contexto.cores.valorMinimo;
    const nivelMaximo = contexto.cores.valorMaximo;
    function GetNivel(index: number): string {
        const posicao = index / (contexto.cores.cores.length - 1)
        const classe = posicao > 0.75 ? "info nivel invertido" : "info nivel normal"
        const nivel = nivelMinimo + posicao * (nivelMaximo - nivelMinimo)
        return `<div class="${classe}" style="left: ${100 * posicao}%">${nivel.toFixed(1)}<br>mm</div>`
    }
    function GetCor(cor: number[]): string {
        return `rgb(${cor[0]},${cor[1]},${cor[2]})`;
    }
    const barra = L.control({ position: 'topright' });
    barra.onAdd = function () {
        const container = document.createElement("div");
        container.className = 'info container';
        const cores = contexto.cores.cores
        container.innerHTML =
            `<div class="info barra" style="background-image: linear-gradient(to right, ${cores.map(v => GetCor(v)).join(',')})"></div>
    ${Array.from({ length: cores.length }).map((v, i) => GetNivel(i)).join('\n')}`;
        return container;
    };
    barra.addTo(mapa);
    
    setTimeout(() => document.body.classList.add('fade-in'), 1000)
} else {
    location.replace('.?diretoMapa')
}