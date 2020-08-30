export enum PaletasCores {
    suave,
    agressivo
}

export interface ICor {
    readonly cor : number[]
}

export class NivelColorido implements ICor {
    constructor (readonly nivelMinimo: number, readonly cor: number[]) {}
}

export class NiveisPerigo {
    readonly niveisMarcados: NivelColorido[];
    readonly niveisSuavizados: NivelColorido[];
    
    private constructor(valorMinimo: number, valorMaximo: number, readonly isDinamico: boolean, niveis: ICor[]) {
        function GetArray(comprimento: number) {
            return Array.from(
                {length: comprimento}, (x,i) =>
                i === 0 ? valorMinimo : 
                i === comprimento - 1 ? valorMaximo : 
                valorMinimo + i * (valorMaximo - valorMinimo) / (comprimento - 1));
        }
        this.niveisMarcados = isDinamico ? GetArray(niveis.length).map((v,i) => new NivelColorido(v, niveis[i].cor)) : niveis as NivelColorido[];
        this.niveisSuavizados = GetArray(17).map(v => new NivelColorido(v, this.InterpolarCor(this.niveisMarcados, v)));
    }

    GetCor(valor:number) : number[] {
        return this.InterpolarCor(this.niveisMarcados, valor);
    }

    private InterpolarCor(niveis: NivelColorido[], valor:number) : number[] {
        const indexMaximo = niveis.findIndex((v, index) => v.nivelMinimo >= valor && index > 0);
        if (indexMaximo === -1) return niveis[niveis.length - 1].cor;
        const corMinima = niveis[indexMaximo - 1].cor, corMaxima = niveis[indexMaximo].cor;
        const minimo = niveis[indexMaximo - 1].nivelMinimo, maximo = niveis[indexMaximo].nivelMinimo;
        return corMinima.map((v, i) => v + (valor - minimo) / (maximo - minimo) * (corMaxima[i] - v));
    }

    static GerarNiveis(valores: number[], paleta: PaletasCores) {
        const valorMinimo = valores.reduce((o, n) => o === undefined ? n : n < o ? n : o);
        const valorMaximo = valores.reduce((o, n) => n > o ? n : o, 0);
        const cores = paleta === PaletasCores.suave
            ? [[255, 255, 204, 0], [161, 218, 180, 127], [65, 182, 196, 127], [34, 94, 168, 127]]
            : [[0, 255, 0, 0], [255, 255, 0, 127], [255, 102, 0, 127], [255, 0, 0, 127]];
        return new NiveisPerigo(valorMinimo, valorMaximo, true, cores.map(v => {return {cor: v}}));
    }
}