import { IEstacaoDetalhada, GetMedicao } from "./estacao"
import { GerenciadorCores } from "./cores"

export class ContextoGeral
{
    private _idEstacaoPronta: string
    get idEstacaoPronta() { return this._idEstacaoPronta }
    set idEstacaoPronta(value) {
        this._idEstacaoPronta = value
        sessionStorage.setItem('idEstacaoPronta', value)
    }

    private _valores: number[]
    get valores() { return this._valores }
    set valores(value) {
        this._valores = value
        sessionStorage.setItem('valores', JSON.stringify(value))
    }

    private _legendas: number[]
    get legendas() { return this._legendas }
    set legendas(value) {
        this._legendas = value
        sessionStorage.setItem('legendas', JSON.stringify(value))
    }

    private _mapaPronto: boolean
    get mapaPronto() { return this._mapaPronto }
    set mapaPronto(value) {
        this._mapaPronto = value
        sessionStorage.setItem('mapaPronto', value ? ' ' : '')
    }

    private _imagemChuvas: string
    get imagemChuvas() { return this._imagemChuvas }
    set imagemChuvas(value) {
        this._imagemChuvas = value
        sessionStorage.setItem('imagemChuvas', value)
    }

    private _estacoes: IEstacaoDetalhada[]
    get estacoes() { return this._estacoes }
    set estacoes(value) {
        this._estacoes = value
        sessionStorage.setItem('estacoes', JSON.stringify(value))
    }

    private _cores: GerenciadorCores
    get cores() { return this._cores }
    set cores(value) {
        this._cores = value
        sessionStorage.setItem('cores', JSON.stringify(value))
    }

    private _escalaTempo: number
    get escalaTempo () { return this._escalaTempo }

    private _paletaCor: number
    get paletaCor () { return this._paletaCor }

    constructor(loadMapProps: boolean, loadGraphProps: boolean) {
        if (loadGraphProps) {
            this._idEstacaoPronta = sessionStorage.getItem('idEstacaoPronta')
            this._valores = JSON.parse(sessionStorage.getItem('valores'))
            this._legendas = JSON.parse(sessionStorage.getItem('legendas'))
        }
        if (loadMapProps) {
            this._mapaPronto = !!sessionStorage.getItem('mapaPronto')
            this._imagemChuvas = sessionStorage.getItem('imagemChuvas')
            this._estacoes = JSON.parse(sessionStorage.getItem('estacoes'))
            this._cores = JSON.parse(sessionStorage.getItem('cores'))
        }

        const _escalaTempo = Number(localStorage.getItem('escalaTempo') ?? 1)
        this._escalaTempo = _escalaTempo === 1 || _escalaTempo === 3 || _escalaTempo === 12 || _escalaTempo === 24 ? _escalaTempo : _escalaTempo
        this._paletaCor = Number(localStorage.getItem('paletaCor') ?? 0)
    }

    CalcularChuva(lat: number, lon: number): number {
        function Haversine(lat1: number, lon1: number) {
            function radians(graus: number): number { return graus * (Math.PI / 180); }
            return 6372.8 * 2 * Math.asin(Math.sqrt(Math.sin(radians(lat - lat1) / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat)) * Math.sin(radians(lon - lon1) / 2) ** 2));
        }
        const pesos = this._estacoes.map(atual => 1 / Haversine(atual._latitude, atual._longitude) ** 2);
        return this._estacoes.reduce<number>((anterior, atual, i) => GetMedicao(atual, this._escalaTempo) * pesos[i] + anterior, 0) / pesos.reduce<number>((anterior, atual) => atual + anterior, 0);
    }
}