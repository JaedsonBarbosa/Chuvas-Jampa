export class EstacaoEssencial {
    readonly latitude: number;
    readonly longitude: number;
    readonly nome: string;
    readonly id: string;
    readonly isJampa: boolean;

    constructor(public readonly estacao: IEstacaoDetalhada) {
        this.latitude = estacao._latitude;
        this.longitude = estacao._longitude;
        this.nome = estacao.nomeestacao;
        this.id = estacao.idestacao;
        this.isJampa = estacao.codibge === 2507507;
    }

    GetMedicao(horas: number): number {
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

export interface IEstacaoDetalhada {
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