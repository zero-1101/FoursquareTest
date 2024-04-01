using FoursquareTest.Data.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace FoursquareTest.Data
{
    public class ApplicationDbContext : IdentityDbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Bookmark> Bookmarks { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            this.SeedUsers(builder);
        }

        private void SeedUsers(ModelBuilder builder)
        {
            string userId = "18b083a9-0144-4759-9dca-f27adc432390";
            string userName = "josefm1@test.com";
            string userNameNormalized = userName.ToUpper();
            string userPassword = "Temporal01!";
            bool userEmailConfirmed = true;

            ApplicationUser newUser = new ApplicationUser()
            {
                Id = userId,
                UserName = userName,
                NormalizedUserName = userNameNormalized,
                Email = userName,
                NormalizedEmail = userNameNormalized,
                LockoutEnabled = false,
                EmailConfirmed = userEmailConfirmed
            };

            PasswordHasher<ApplicationUser> passwordHasher = new PasswordHasher<ApplicationUser>();
            newUser.PasswordHash = passwordHasher.HashPassword(newUser, userPassword);

            builder.Entity<ApplicationUser>().HasData(newUser);
        }
    }
}
