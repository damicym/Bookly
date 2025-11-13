namespace Bookly.Helpers
{
    public static class HtmlHelpers
    {
        public static string PasarAñoATexto(int ano)
        {
            return ano switch
            {
                1 => "7mo",
                2 => "1ero",
                3 => "2ndo",
                4 => "3ero",
                5 => "4to",
                6 => "5to",
                _ => "Desconocido"
            };
        }
        public static string ToUpperPrimeraLetra(string texto)
        {
            if (string.IsNullOrWhiteSpace(texto))
                    return texto;


            var palabras = texto.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            for (int i = 0; i < palabras.Length; i++)
            {
                string palabra = palabras[i];
                palabras[i] = char.ToUpper(palabra[0]) + palabra.Substring(1).ToLower();
            }


            return string.Join(' ', palabras);
        }
    }
}