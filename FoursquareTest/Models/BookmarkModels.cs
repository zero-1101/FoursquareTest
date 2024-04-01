using FoursquareTest.Data.Entities;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace FoursquareTest.Models
{
    public record CreateBookmark(
        [Required] double latitude,
        [Required] double longitude,
        [Required] string name,
        [Required] string formatted_address,
        [Required][MaxLength(450)] string fsqId
        );

    public record BookmarkDetail(
        [Required] int Id,
        [Required] double latitude,
        [Required] double longitude,
        [Required] string name,
        [Required] string formatted_address,
        [Required][MaxLength(450)] string fsqId
        );
}
