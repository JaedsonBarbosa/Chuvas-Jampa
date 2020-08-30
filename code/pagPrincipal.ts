import { NiveisPerigo } from "./niveis";
import { Configuracoes } from "./configuracoes";

declare var L;

document.addEventListener("DOMContentLoaded", () => {
    const visualizacao = new Visualizacao();
    try {
        visualizacao.CarregarEstacoes();
        setInterval(() => visualizacao.CarregarEstacoes(), 60000);
    } catch (erro) {
        alert(`Erro: ${erro}. Feche esta janela e tente novamente mais tarde.`);
    }
});

class Visualizacao {
    private canvas: HTMLCanvasElement;
    private contexto: CanvasRenderingContext2D;
    private imageData: ImageData;
    private pontos: number[][];

    private estacoes : EstacaoEssencial[] = undefined;
    private ultimaAtualizacao : Date;

    readonly mapa : any;
    readonly controleLayers : any;
    readonly mapaUtil;
    private malhaPrecipitacao:any = undefined;
    private marcadores:any = undefined;
    private containerBarraCores:HTMLDivElement;
    private lastPopup: any;

    constructor () {
        const dadosGeograficos = new DadosGeograficos(0.2);
        this.canvas = document.createElement("canvas");
        this.canvas.width = dadosGeograficos.largura;
        this.canvas.height = dadosGeograficos.altura;
        this.contexto = this.canvas.getContext("2d");
        this.imageData = this.contexto.createImageData(dadosGeograficos.largura, dadosGeograficos.altura);
        this.pontos = [];
        for (let lat = dadosGeograficos.latMax; lat >= dadosGeograficos.latMin; lat -= dadosGeograficos.passo)
            for (let lon = dadosGeograficos.lonMin; lon <= dadosGeograficos.lonMax; lon += dadosGeograficos.passo)
                this.pontos.push([lat, lon]);

        this.mapaUtil = new L.LatLngBounds(new L.LatLng(dadosGeograficos.latMin, dadosGeograficos.lonMin, 0), new L.LatLng(dadosGeograficos.latMax, dadosGeograficos.lonMax, 0));
        this.mapa = L.map('corpo', {
            center: this.mapaUtil.getCenter(),
            zoom: 14,
            minZoom: 13,
            maxZoom: 18,
            maxBounds: this.mapaUtil,
            maxBoundsViscosity: 0.5,
            zoomControl: false
        });
        this.mapa.on('locationfound', x => {
            if (this.mapaUtil.contains(x.latlng))
                this.mapa.setView(x.latlng, 15);
        })
        this.mapa.locate({ watch: true })
        this.mapa.on('click', e =>
            this.lastPopup = L.popup()
                .setLatLng(e.latlng)
                .setContent(`Precipitação estimada:<br>${this.CalcularChuva(e.latlng.lat, e.latlng.lng).toFixed(2) ?? 'Sem dados'} mm`)
                .openOn(this.mapa)
        );
        this.mapa.on('mouseout', () => this.lastPopup?.remove());
        this.controleLayers = L.control.layers(undefined, undefined, {
            position: 'topleft'
        }).addTo(this.mapa);

        //Adicionar base  normal
        this.controleLayers.addBaseLayer(L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.{ext}', {
            attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            subdomains: 'abcd',
            minZoom: 0,
            maxZoom: 18,
            ext: 'png'
        }).addTo(this.mapa), "Normal");

        // Adicionar base simplificada
        this.controleLayers.addBaseLayer(L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
            attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            subdomains: 'abcd',
            minZoom: 0,
            maxZoom: 20,
            ext: 'png',
            detectRetina: true
        }), "Simplificado");
    }

    async CarregarEstacoes() {
        const resp = await fetch("https://us-central1-chuvasjampa.cloudfunctions.net/obterRegistros");
        if (resp.status !== 200) return;
        const corpo = await resp.json();
        const registros =  corpo as IRespostaRegistros;
        this.ultimaAtualizacao = new Date(registros.data);
        this.estacoes = registros.estacoes.map(x => new EstacaoEssencial(x));
        const ultAtt = document.getElementById('ultimaAtualizacao');
        ultAtt.innerHTML = this.ultimaAtualizacao.toLocaleString();
        this.AtualizarMapa();
    }

    private AtualizarMapa() {
        const precipitacoes = this.pontos.map(v => this.CalcularChuva(v[0], v[1]));
        const niveis = NiveisPerigo.GerarNiveis(precipitacoes, Configuracoes.paletaCor);
        precipitacoes.forEach((ponto, iPonto) => niveis.GetCor(ponto).forEach((cor, iCor) => this.imageData.data[iPonto * 4 + iCor] = cor));
        this.contexto.putImageData(this.imageData, 0, 0);
        const imagem = this.canvas.toDataURL("image/png");

        // Atualizar malha de dados
        if (this.malhaPrecipitacao === undefined)
            this.malhaPrecipitacao = L.imageOverlay(imagem, this.mapaUtil).addTo(this.mapa);
        else this.malhaPrecipitacao.setUrl(imagem);

        // Atualizar marcadores
        if (this.marcadores === undefined) {
            this.marcadores = L.layerGroup().addTo(this.mapa);
            this.controleLayers.addOverlay(this.marcadores, "Pluviômetros");
        }
        const marksAdicionados = this.marcadores.getLayers();
        for (const pluv of this.estacoes.filter(v => v.isJampa)) {
            const atual = marksAdicionados.find(mark => {
                const local = mark.getLatLng();
                return local.lat === pluv.latitude && local.lng === pluv.longitude;
            });
            if (atual === undefined) {
                const caixa = L.popup().setContent(pluv.GetInfoCompleta(Configuracoes.escalaTempo))
                this.marcadores.addLayer(L.marker([pluv.latitude, pluv.longitude]).bindPopup(caixa));
            } else atual.setPopupContent(pluv.GetInfoCompleta(Configuracoes.escalaTempo));
        }

        // Atualizar barra de cores
        const nivelMinimo = niveis.niveisSuavizados[0].nivelMinimo;
        const nivelMaximo = niveis.niveisSuavizados[niveis.niveisSuavizados.length - 1].nivelMinimo;
        function GetNivel(v:number) : string {
            const posicao = (v - nivelMinimo) * 100 / (nivelMaximo - nivelMinimo);
            const classe = posicao > 75 ? "info nivel invertido" : "info nivel normal"
            return `<div class="${classe}" style="left: ${posicao}%">${v.toFixed(1)}<br>mm</div>`;
        }
        function GetCor(cor:number[]) : string {
            return `rgb(${cor[0]},${cor[1]},${cor[2]})`;
        }
        if (this.containerBarraCores === undefined) {
            const barra = L.control({ position: 'topright' });
            barra.onAdd = function () {
                const container = document.createElement("div");
                container.className = 'info container';
                container.innerHTML =
                `<div class="info barra" style="background-image: linear-gradient(to right, ${niveis.niveisSuavizados.map(v => GetCor(v.cor)).join(',')})"></div>
                ${niveis.niveisMarcados.filter(v => v.nivelMinimo <= nivelMaximo).map(v => GetNivel(v.nivelMinimo)).join('\n')}`;
                return container;
            };
            barra.addTo(this.mapa);
            this.containerBarraCores = barra.getContainer();
        } else {
            this.containerBarraCores.innerHTML =
            `<div class="info barra" style="background-image: linear-gradient(to right, ${niveis.niveisSuavizados.map(v => GetCor(v.cor)).join(',')})"></div>
            ${niveis.niveisMarcados.filter(v => v.nivelMinimo <= nivelMaximo).map((v,i) => GetNivel(v.nivelMinimo)).join('\n')}`;
        }
    }
    
    private CalcularChuva(lat: number, lon: number): number {
        function Haversine(lat1: number, lon1: number) {
            function radians(graus: number): number { return graus * (Math.PI / 180); }
            return 6372.8 * 2 * Math.asin(Math.sqrt(Math.sin(radians(lat - lat1) / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat)) * Math.sin(radians(lon - lon1) / 2) ** 2));
        }
        const pesos = this.estacoes.map(atual => 1 / Haversine(atual.latitude, atual.longitude) ** 2);
        return this.estacoes.reduce<number>((anterior, atual, i) => atual.GetMedicao(Configuracoes.escalaTempo) * pesos[i] + anterior, 0) / pesos.reduce<number>((anterior, atual) => atual + anterior, 0);
    }
}

class EstacaoEssencial {
    readonly latitude: number;
    readonly longitude: number;
    readonly nome: string;
    readonly id: string;
    readonly isJampa: boolean;

    constructor(private readonly estacao: IEstacaoDetalhada) {
        this.latitude = estacao._latitude;
        this.longitude = estacao._longitude;
        this.nome = estacao.nomeestacao;
        this.id = estacao.idestacao;
        this.isJampa = estacao.codibge === 2507507;
    }

    GetMedicao(horas: number): number {
        function assertUnreachable(x: never): never { throw new Error("Medição não reconhecida."); }
        function ProcessarMedicao(valor: string) { return valor == '-' ? 0 : Number(valor); }
        switch (horas) {
            case 1: return ProcessarMedicao(this.estacao.acc1hr);
            case 3: return ProcessarMedicao(this.estacao.acc3hr);
            case 12: return ProcessarMedicao(this.estacao.acc12hr);
            case 24: return ProcessarMedicao(this.estacao.acc24hr);
            default: throw new Error("Quantidade de horas inesperada");
        }
    }
    
    GetInfoCompleta(horas: number): string {
        return `
        <h2>${this.nome}</h1>
        Fonte: <span>${this.estacao.siglaRede}</span><br>
        ${this.estacao.ultimovalor === undefined ? '' : `Última medição:<br>${this.estacao.ultimovalor?.toFixed(2)} mm (${this.estacao.datahoraUltimovalor ?? 'Desconhecido'})<br>`}
        Precipitação acumulada:<br>${this.GetMedicao(horas).toFixed(2)} mm (${horas === 1 ? 'Última hora' : `Últimas ${horas} horas`})
        <br><a href="detalhes">Ver informações detalhadas</a>`; //target="_blank"
    }
}

interface IRespostaRegistros {
    readonly estacoes: IEstacaoDetalhada[];
    readonly data: number;
}

interface IEstacaoDetalhada {
    idestacao: string;
    codibge: number;
    nomeestacao: string;
    ultimovalor?: number;
    datahoraUltimovalor: string;
    acc1hr: any;
    acc3hr: any;
    acc12hr: any;
    acc24hr: any;
    _latitude: number;
    _longitude: number;
    siglaRede: string;
}

export class DadosGeograficos {
    coordenadasJampa : number[][];
    latMin : number;
    latMax : number;
    lonMin : number;
    lonMax : number;
    passo : number;
    altura : number;
    largura : number;

    constructor(multiplicadorArea: number) {
        const coordsMin = [-7.2477433, -34.9740106];
        const coordsMax = [-7.0559654, -34.7930182];
        const sobraLat = (coordsMax[0] - coordsMin[0]) * multiplicadorArea;
        const sobraLon = (coordsMax[1] - coordsMin[1]) * multiplicadorArea;
        this.latMax = coordsMax[0] + sobraLat;
        this.latMin = coordsMin[0] - sobraLat;
        this.lonMax = coordsMax[1] + sobraLon;
        this.lonMin = coordsMin[1] - sobraLon;
        this.passo = 0.001;
        this.largura = Math.floor((this.lonMax - this.lonMin) / this.passo) + 1;
        this.altura = Math.floor((this.latMax - this.latMin) / this.passo) + 1;
    }
}
