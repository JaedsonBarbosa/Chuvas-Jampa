export enum PaletasCores {
    suave,
    agressivo
}

export class GerenciadorCores {
    readonly valorMinimo: number
    readonly valorMaximo: number
    readonly cores: number[][]
    
    constructor(valores: number[], paleta: PaletasCores) {
        this.valorMinimo = valores.reduce((o, n) => o === undefined ? n : n < o ? n : o);
        this.valorMaximo = valores.reduce((o, n) => n > o ? n : o, 0);
        this.cores = paleta === PaletasCores.suave
            ? [[255, 255, 204, 0], [161, 218, 180, 127], [65, 182, 196, 127], [34, 94, 168, 127]]
            : [[0, 255, 0, 0], [255, 255, 0, 127], [255, 102, 0, 127], [255, 0, 0, 127]];
    }
}