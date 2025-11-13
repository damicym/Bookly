namespace Bookly.Models;
public class PublicacionesCompletas
{
    public int id { get; set; }
    public int idLibro { get; set; }
    public string nombre { get; set; }
    public string materia { get; set; }
    public string ano { get; set; }
    public string editorial { get; set; }
    public string estadoLibro { get; set; }
    public double precio { get; set; }
    public string descripcion { get; set; }
    public string idVendedor { get; set; }
    public DateTime fecha { get; set; }
    public int status { get; set; }
}