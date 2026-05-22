class Utils {
  static cleanCNPJ(cnpj: string): string {
    return cnpj.replace(/\D/g, "");
  }
}

export default Utils;
