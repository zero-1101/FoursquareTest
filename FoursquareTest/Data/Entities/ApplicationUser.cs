using Microsoft.AspNetCore.Identity;

namespace FoursquareTest.Data.Entities
{
    public class ApplicationUser : IdentityUser
    {
        public ICollection<Bookmark> Bookmarks { get; set; } = new List<Bookmark>();
    }
}
