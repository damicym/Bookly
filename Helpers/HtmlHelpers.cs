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
    }
}
