export class Configuracoes {
    static get escalaTempo () {
        var retorno = Number(localStorage.getItem('escalaTempo') ?? 1);
        return retorno === 1 || retorno === 3 || retorno === 12 || retorno === 24 ? retorno : retorno;
    }
    static get paletaCor () {return Number(localStorage.getItem('paletaCor') ?? 0)}
}