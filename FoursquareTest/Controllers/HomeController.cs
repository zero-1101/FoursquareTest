using FoursquareTest.Data;
using FoursquareTest.Data.Entities;
using FoursquareTest.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;

namespace FoursquareTest.Controllers
{
    [Authorize]
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ApplicationDbContext _applicationDbContext;

        public HomeController(ILogger<HomeController> logger, 
            UserManager<ApplicationUser> userManager,
            ApplicationDbContext applicationDbContext)
        {
            _logger = logger;
            this._userManager = userManager;
            this._applicationDbContext = applicationDbContext;
        }

        public IActionResult Index()
        {
            return View();
        }

        [HttpGet]
        public IActionResult GetUsers()
        {
            var result = _applicationDbContext.Users.ToList();
            return Json(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetBookmarksByUser()
        {
            var user = await _userManager.GetUserAsync(User);

            if (user == null) { return Forbid(); }

            var result = await _applicationDbContext.Bookmarks.Where(b => b.ApplicationUserId == user.Id).ToListAsync();
            return Json(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateBookmark(CreateBookmark createBookmark)
        {
            try
            {
                var user = await _userManager.GetUserAsync(User);

                if (user == null) { return Forbid(); }

                Bookmark newBookmark = new Bookmark
                {
                    latitude = createBookmark.latitude,
                    longitude = createBookmark.longitude,
                    name = createBookmark.name,
                    formatted_address = createBookmark.formatted_address,
                    fsqId = createBookmark.fsqId,
                    ApplicationUserId = user.Id
                };

                var result = await _applicationDbContext.Bookmarks.AddAsync(newBookmark);
                await _applicationDbContext.SaveChangesAsync();

                BookmarkDetail bookmarkDetail = new BookmarkDetail
                (
                    Id: result.Entity.Id,
                    latitude: result.Entity.latitude,
                    longitude: result.Entity.longitude,
                    name: result.Entity.name,
                    formatted_address: result.Entity.formatted_address,
                    fsqId: result.Entity.fsqId
                );

                return Json(new { isSuccess = true, message = "Ok", result = bookmarkDetail });
            }
            catch (Exception)
            {
                return Json(new { isSuccess = false, message = "Error", result = (object?) null });
            }
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
