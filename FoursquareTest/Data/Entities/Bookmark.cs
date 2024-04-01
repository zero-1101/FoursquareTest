using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FoursquareTest.Data.Entities
{
    public class Bookmark
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public double latitude { get; set; }
        
        [Required]
        public double longitude { get; set; }

        [Required]
        public string name { get; set; } = null!;

        [Required] 
        public string formatted_address { get; set; } = null!;

        [Required]
        [MaxLength(450)]
        public string fsqId { get; set; } = null!;

        [Required]
        [MaxLength(450)]
        [ForeignKey(nameof(Entities.ApplicationUser))]
        public string ApplicationUserId { get; set; } = null!;
        public ApplicationUser ApplicationUser { get; set; } = null!;

    }
}
