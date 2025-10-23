namespace Bookly.Models;
public class Intercambio
{
    public int id { get; set; }
    public int idPublicacion { get; set; }
    public decimal precioFinal { get; set; }
    public string idComprador { get; set; }
    public DateTime fechaRealizacion { get; set; }
}