namespace Bookly.Models
{
    public class VendedorCardViewModel
    {
        public string DNI            { get; set; }
        public string NombreComp     { get; set; }
        public int?   Ano            { get; set; }
        public string Especialidad   { get; set; }
        public string Curso          { get; set; }
        public string AboutMe        { get; set; }
        public string FotoPerfil     { get; set; }
        public string Pill           { get; set; } = "Contacto";

        public int      VentasCerradas      { get; set; }
        public int      ResenaCount         { get; set; }
        public double?  PromedioAtencion    { get; set; }
        public double?  PromedioEntrega     { get; set; }

        public int      PublicacionesActivas { get; set; }
        public List<PublicacionesCompletas> Publicaciones { get; set; } = new();
    }
}
