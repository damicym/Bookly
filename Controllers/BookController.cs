using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Bookly.Models;

namespace Bookly.Controllers;

public class BookController : Controller
{
    public ActionResult Index() 
    {
        return View();
    }
    public ActionResult Details(int id) 
    {
        return View();
    }
    public ActionResult Create() 
    {
        return View();
    }
    [HttpPost]
    public ActionResult Create(Libro libro) 
    {
        return View();
    }
    public ActionResult Edit(int id)
    {
        return View();
    }
    [HttpPost]
    public ActionResult Edit(Libro libro) 
    {
        return View();
    }

    public ActionResult Delete(int id) 
    {
        return View();
    }
    [HttpPost]
    public ActionResult DeleteConfirmed(int id) 
    {
        return View();
    }

    public ActionResult Search(string query)
    {
        return View();
    }
}