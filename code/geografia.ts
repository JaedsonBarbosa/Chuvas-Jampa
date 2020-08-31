export class DadosGeograficos {
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